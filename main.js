// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'build' });
const { autoUpdater } = require('electron-updater');
const express = require('express');
const http = require('http');
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let server;
let apiServerPort = 3001;

function isDev() {
  return !app.isPackaged;
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    backgroundColor: '#FFF',
    webPreferences: {
      // Set a Content Security Policy for the renderer process
      contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self';",
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  // Load the URL depending on the environment (development vs production)
  if (isDev()) {
    mainWindow.loadURL('http://localhost:3000/');
  } else {
    loadURL(mainWindow);
  }

  // Open DevTools for development mode (optional)
  if (isDev()) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is ready to be shown
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Only check for updates in production
    if (!isDev()) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  stopServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// App version update functions
ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

if (!isDev()) {
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });
}

// App window controls functions

// Minimize window event
ipcMain.on('minimize-window', function () {
  if (mainWindow && mainWindow.minimizable) {
    mainWindow.minimize();
  }
});

// Maximize window event
ipcMain.on('maximize-window', function () {
  if (mainWindow && mainWindow.maximizable) {
    mainWindow.maximize();
  }
});

// Unmaximize window event
ipcMain.on('unmaximize-window', function () {
  if (mainWindow) {
    mainWindow.unmaximize();
  }
});

// Toggle maximize/unmaximize event
ipcMain.on('max-unmax-window', function () {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// Close window event
ipcMain.on('close-window', function () {
  if (mainWindow) {
    mainWindow.close();
    app.quit(); // Ensure the app quits completely
  }
});

// Server start and stop functions
function startServer(port) {
  const expressApp = express();
  expressApp.get('/', (req, res) => {
    res.send('API is running');
  });

  server = http.createServer(expressApp);
  server.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

function stopServer() {
  if (server) {
    server.close(() => {
      console.log('API server stopped.');
    });
  }
}
