const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        const validSendChannels = [
            'app_version', 
            'minimize-window', 
            'maximize-window', 
            'unmaximize-window', 
            'close-window',
            'run-ffmpeg-command',
            'get-audio-metadata',  // Request audio metadata
            'open-file-dialog'     // Open file dialog
        ];
        if (validSendChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validReceiveChannels = [
            'app_version',
            'ffmpeg-output', 
            'ffmpeg-error',
            'audio-metadata-response', // Receive audio metadata
            'selected-file-paths'      // Receive selected file paths
        ];
        if (validReceiveChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
