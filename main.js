import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import { execa } from 'execa';
import pkg from 'electron-updater';
import path from 'path'; 

const { autoUpdater } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
// Custom protocol registration
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

app.whenReady().then(() => {
  createWindow();

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
      nodeIntegration: false
    },
  });


  console.log('filepath = ', path.join(__dirname, './build/index.html'))

  // Path to the index.html file
  if (!app.isPackaged) {
    // Load localhost if in development mode
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Load the index.html from the build folder in production mode
    
    //color
    //mainWindow.loadFile(path.join(__dirname, './build/index.html'))
    mainWindow.loadFile('./build/index.html')
    
    //mainWindow.loadURL('app://./index.html');

    //mainWindow.loadFile('./build/index.html');

  }




  // Open the DevTools if in development mode
  //if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  //}

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load app://./index.html');
  });

  setupAutoUpdater();
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
ipcMain.on('run-ffmpeg-command', async (event) => {
  try {
    console.log('run-ffmpeg-command()')
    const ffmpegPath = getFfmpegPath();
    const result = await execa(ffmpegPath, ['-h']);
    console.log('result = ', result)
    console.log('result.stdout = ', result.stdout)
    event.reply('ffmpeg-output', result.stdout);
  } catch (error) {
    console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n Error running FFmpeg command:', error);
    event.reply('ffmpeg-error', "error.message");
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
