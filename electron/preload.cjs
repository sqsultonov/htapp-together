const { contextBridge, ipcRenderer } = require('electron');

// Expose database and storage API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Check if running in Electron
  isElectron: true,
  
  // Database operations
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
    get: (sql, params) => ipcRenderer.invoke('db:get', { sql, params }),
    insert: (table, data) => ipcRenderer.invoke('db:insert', { table, data }),
    update: (table, data, where) => ipcRenderer.invoke('db:update', { table, data, where }),
    delete: (table, where) => ipcRenderer.invoke('db:delete', { table, where })
  },
  
  // File storage operations
  storage: {
    saveFile: (bucket, fileName, base64Data, contentType) => 
      ipcRenderer.invoke('storage:saveFile', { bucket, fileName, base64Data, contentType }),
    readFile: (bucket, fileName) => 
      ipcRenderer.invoke('storage:readFile', { bucket, fileName }),
    getFileUrl: (bucket, fileName) => 
      ipcRenderer.invoke('storage:getFileUrl', { bucket, fileName }),
    deleteFile: (bucket, fileName) => 
      ipcRenderer.invoke('storage:deleteFile', { bucket, fileName }),
    listFiles: (bucket) => 
      ipcRenderer.invoke('storage:listFiles', { bucket }),
    getInfo: () => 
      ipcRenderer.invoke('storage:getInfo')
  }
});

console.log('Preload script loaded - Electron API exposed (DB + Storage)');
