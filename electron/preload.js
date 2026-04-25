const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateDocument: ({ formData, templateFile, filenamePrefix }) =>
    ipcRenderer.invoke('generate-document', { formData, templateFile, filenamePrefix }),
  generatePreview: ({ formData, templateFile }) =>
    ipcRenderer.invoke('generate-preview', { formData, templateFile }),
  getVersion: () => ipcRenderer.invoke('get-version'),
  setTitle: (title) => ipcRenderer.invoke('set-title', title),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
});
