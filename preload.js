const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        // List of valid channels
        const validChannels = [
            'app_version', 
            'minimize-window', 
            'maximize-window', 
            'unmaximize-window', 
            'close-window',
            'run-ffmpeg-command',
            'ffmpeg-output',
            'ffmpeg-error'            
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = [
            'app_version',
            'ffmpeg-output', 
            'ffmpeg-error'
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
