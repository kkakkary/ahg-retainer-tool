const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateDocument: ({ formData, templateFile, filenamePrefix, isBusinessName }) =>
    ipcRenderer.invoke('generate-document', { formData, templateFile, filenamePrefix, isBusinessName }),
  generatePreview: ({ formData, templateFile }) =>
    ipcRenderer.invoke('generate-preview', { formData, templateFile }),
  getVersion: () => ipcRenderer.invoke('get-version'),
  setTitle: (title) => ipcRenderer.invoke('set-title', title),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
});
