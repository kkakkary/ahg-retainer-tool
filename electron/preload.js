const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateDocument: ({ formData, templateFile, filenamePrefix }) =>
    ipcRenderer.invoke('generate-document', { formData, templateFile, filenamePrefix }),
});
