import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { app, BrowserWindow, ipcMain, protocol, session, dialog, Menu } from 'electron';
import { execa } from 'execa';
import pkg from 'electron-updater';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import sharp from 'sharp';
import musicMetadata from 'music-metadata';
import iconv from 'iconv-lite';

const { autoUpdater } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let logStream;
if (!app.isPackaged) {
  logStream = fs.createWriteStream(join(__dirname, 'output.log'), { flags: 'a' });
  logStream.write('Application started on ' + new Date().toISOString() + '\n');  // Initializing log entry
}

let mainWindow;

// Define audio and image file extensions
const audioExtensions = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'aiff', 'wma', 'amr', 'opus', 'alac', 'pcm', 'mid', 'midi', 'aif', 'caf'];
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heif', 'heic', 'ico', 'svg', 'raw', 'cr2', 'nef', 'orf', 'arw', 'raf', 'dng', 'pef', 'sr2'];

// Custom protocol registration
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

app.whenReady().then(() => {
  createWindow();

  // Content security policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:3000; style-src 'self' 'unsafe-inline' http://localhost:3000; connect-src 'self' http://localhost:3000; img-src 'self' data: blob:; font-src 'self';"
        ]
      }
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      devTools: true  // Ensure this is set to true
    },
    show: false // This ensures the window doesn't show until it's ready
  });

  // window item -------
  // Create a menu template
  const template = [
    {
      label: '!!!!!File',
      submenu: [
        {
          label: '@@@@@@@@@@@@@@@Random Test Item',
          click: () => {
            console.log('Random Test Item clicked');
            mainWindow.webContents.send('menu-action', 'random-test-item');
          },
        },
        { role: 'quit' }, // Standard quit action
      ],
    },
    {
      label: '!!!!!Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: '!!!!!!Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          },
        },
      ],
    },
  ];

  // Build and set the menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu); // Sets the application-wide menu

  
  // window item -------

  mainWindow.loadURL(app.isPackaged ? './build/index.html' : 'http://localhost:3000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupAutoUpdater() {
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });
}

// IPC event to run an FFmpeg command
ipcMain.on('run-ffmpeg-command', async (event, ffmpegArgs) => {
  try {
    var cmdArgsList = ffmpegArgs.cmdArgs;
    var duration = parseInt(ffmpegArgs.outputDuration, 10);
    var renderId = ffmpegArgs.renderId;
    console.log('Received FFmpeg command:', cmdArgsList);
    console.log('duration:', duration);

    const ffmpegPath = getFfmpegPath();
    console.log('Using FFmpeg path:', ffmpegPath);
    if (!app.isPackaged) {
      logStream.write(`FFmpeg command: ${ffmpegPath} ${cmdArgsList.join(' ')}\n`);
    }
    
    const process = execa(ffmpegPath, cmdArgsList);
    const rl = readline.createInterface({ input: process.stderr });

    let progress = 0;
    const outputBuffer = [];

    rl.on('line', (line) => {
      if (!app.isPackaged) {
        logStream.write('FFmpeg output: ' + line + '\n'); 
      }
      
      outputBuffer.push(line);
      if (outputBuffer.length > 10) {
        outputBuffer.shift(); // Keep only the last 10 lines
      }

      const match = line.match(/time=([\d:.]+)/);
      if (match) {
        const elapsed = match[1].split(':').reduce((acc, time) => (60 * acc) + +time, 0);
        progress = duration ? Math.min((elapsed / duration) * 100, 100) : 0;
        progress = Math.round(progress); 
        console.log('progress=',progress)
        event.reply('ffmpeg-progress', { 
          renderId: renderId,
          pid: process.pid, 
          progress 
        });
      }
    });

    const result = await process;
    console.log('FFmpeg command completed successfully');
    event.reply('ffmpeg-output', { stdout: result.stdout, progress: 100 });
  } catch (error) {
    console.error('FFmpeg command failed:', error.message);
    if (!app.isPackaged) {
      logStream.write('error.message: ' + error.message + '\n'); 
    }
    const errorOutput = error.stderr ? error.stderr.split('\n').slice(-10).join('\n') : 'No error details';
    event.reply('ffmpeg-error', { message: error.message, lastOutput: errorOutput });
  }
});

// Function to determine FFmpeg path
function getFfmpegPath() {
  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  if (app.isPackaged) {
    // Production path
    return join(process.resourcesPath, 'ffmpeg', process.platform, exeName);
  } else {
    // Development path
    const platformFolder = process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'win32-x64' : 'linux-x64';
    return join(__dirname, 'ffmpeg', platformFolder, 'lib', exeName);
  }
}

ipcMain.on('get-audio-metadata', async (event, filePath) => {
  try {
    console.log('Getting metadata for file:', filePath);

    console.log('Raw filePath:', filePath);
    console.log('Encoded filePath:', encodeURI(filePath));
    console.log('Decoded filePath:', decodeURI(encodeURI(filePath)));


    const metadata = await musicMetadata.parseFile(filePath);
    event.sender.send('audio-metadata-response', {
      filepath: filePath,
      filename: path.basename(filePath), // Use `filename`
      duration: metadata.format.duration,
    });
  } catch (error) {
    console.log('Failed to get metadata for file:', filePath);
    event.sender.send('audio-metadata-response', {
      filepath: filePath,
      filename: path.basename(filePath), // Use `filename`
      error: 'Failed to get metadata',
    });
  }
});

ipcMain.on('open-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    event.reply('selected-folder', result.filePaths[0]);
  }
});

ipcMain.on('open-file-dialog', async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const fileInfoArray = await Promise.all(
        result.filePaths.map(async (filePath) => {
          // Force path to UTF-8 encoding
          const normalizedPath = path.normalize(filePath);
          const utf8Path = Buffer.from(normalizedPath, 'utf8').toString('utf8');

          //console.log('Normalized Path = ', normalizedPath);
          //console.log('UTF-8 Path = ', utf8Path);

          const ext = path.extname(utf8Path).toLowerCase().substring(1); // Extract extension without the dot
          let fileType = 'other'; // Default file type
          let dimensions = null;

          if (audioExtensions.includes(ext)) {
            fileType = 'audio';
          } else if (imageExtensions.includes(ext)) {
            fileType = 'image';
            try {
              const metadata = await sharp(utf8Path).metadata();
              dimensions = `${metadata.width}x${metadata.height}`;
            } catch (error) {
              console.error('Error reading image dimensions:', error);
            }
          }

          //console.log('Setting filePath = ', utf8Path); // Log the final sanitized path
          return {
            filename: path.basename(utf8Path), // Use UTF-8 filename
            filepath: utf8Path, // Use UTF-8 file path
            filetype: fileType,
            dimensions, // Include dimensions if available
          };
        })
      );

      event.sender.send('selected-file-paths', fileInfoArray);
    }
  } catch (error) {
    console.error('Error opening file dialog:', error);
  }
});

// Existing IPC events
ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('close-window', function () {
  if (mainWindow) {
    mainWindow.close();
    app.quit();
  }
});

ipcMain.on('minimize-window', function () {
  if (mainWindow && mainWindow.minimizable) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', function () {
  if (mainWindow && mainWindow.maximizable) {
    mainWindow.maximize();
  }
});

ipcMain.on('unmaximize-window', function () {
  if (mainWindow) {
    mainWindow.unmaximize();
  }
});

ipcMain.on('get-path-separator', (event) => {
  const separator = path.sep; // Get OS-specific path separator
  event.reply('path-separator-response', separator); // Send back the separator
});