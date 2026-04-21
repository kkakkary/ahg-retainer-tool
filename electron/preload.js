const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateDocument: ({ formData, templateFile, filenamePrefix }) =>
    ipcRenderer.invoke('generate-document', { formData, templateFile, filenamePrefix }),
  generatePreview: ({ formData, templateFile }) =>
    ipcRenderer.invoke('generate-preview', { formData, templateFile }),
  getVersion: () => ipcRenderer.invoke('get-version'),
});
