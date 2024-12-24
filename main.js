import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { app, BrowserWindow, ipcMain, protocol, session, dialog } from 'electron';
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

let mainWindow;

// Define audio and image file extensions
const audioExtensions = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'aiff', 'wma', 'amr', 'opus', 'alac', 'pcm', 'mid', 'midi', 'aif', 'caf'];
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heif', 'heic', 'ico', 'svg', 'raw', 'cr2', 'nef', 'orf', 'arw', 'raf',  'dng', 'pef', 'sr2'];
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
ipcMain.on('run-ffmpeg-command', async (event, ffmpegArgs, cutDuration) => {
  try {
    console.log('Received FFmpeg command:', ffmpegArgs);
    const ffmpegPath = getFfmpegPath();
    console.log('Using FFmpeg path:', ffmpegPath);
    const process = execa(ffmpegPath, ffmpegArgs);
    const rl = readline.createInterface({ input: process.stderr });

    let progress = 0;
    const outputBuffer = [];

    rl.on('line', (line) => {
      console.log('FFmpeg output:', line);
      outputBuffer.push(line);
      if (outputBuffer.length > 10) {
        outputBuffer.shift(); // Keep only the last 10 lines
      }

      const match = line.match(/time=([\d:.]+)/);
      if (match) {
        const elapsed = match[1].split(':').reduce((acc, time) => (60 * acc) + +time, 0);
        progress = cutDuration ? Math.min((elapsed / cutDuration) * 100, 100) : 0;
        console.log('FFmpeg progress:', progress);
        event.reply('ffmpeg-progress', { pid: process.pid, progress });
      }
    });

    const result = await process;
    console.log('FFmpeg command completed successfully');
    event.reply('ffmpeg-output', { stdout: result.stdout, progress: 100 });
  } catch (error) {
    console.error('FFmpeg command failed:', error.message);
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
    const metadata = await musicMetadata.parseFile(filePath);
    event.sender.send('audio-metadata-response', {
      filepath: filePath,
      filename: path.basename(filePath), // Use `filename`
      duration: metadata.format.duration,
    });
  } catch (error) {
    event.sender.send('audio-metadata-response', {
      filepath: filePath,
      filename: path.basename(filePath), // Use `filename`
      error: 'Failed to get metadata',
    });
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
          // Normalize and decode file path to handle special characters
          const normalizedPath = path.resolve(filePath);
          console.log('normalizedPath = ', normalizedPath);

          // Decode using iconv-lite to handle special characters
          const decodedPath = iconv.decode(Buffer.from(normalizedPath, 'binary'), 'utf-8');
          console.log('decodedPath = ', decodedPath);

          const ext = path.extname(decodedPath).toLowerCase().substring(1); // Extract extension without the dot
          let fileType = 'other'; // Default file type
          let dimensions = null;

          if (audioExtensions.includes(ext)) {
            fileType = 'audio';
          } else if (imageExtensions.includes(ext)) {
            fileType = 'image';
            try {
              const metadata = await sharp(decodedPath).metadata();
              dimensions = `${metadata.width}x${metadata.height}`;
            } catch (error) {
              console.error('Error reading image dimensions:', error);
            }
          }

          console.log('setting filePath = ', decodedPath); // Log decoded path
          return {
            filename: path.basename(decodedPath), // Use `filename`
            filepath: decodedPath,
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
