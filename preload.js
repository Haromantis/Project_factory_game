const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronFS', {
    saveWorld: (name, data) => ipcRenderer.invoke('fs-save-world', name, data),
    loadWorld: (name) => ipcRenderer.invoke('fs-load-world', name),
    listWorlds: () => ipcRenderer.invoke('fs-list-worlds'),
    deleteWorld: (name) => ipcRenderer.invoke('fs-delete-world', name),
    exportAll: () => ipcRenderer.invoke('fs-export-all'),
});
