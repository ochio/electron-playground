const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadUrl:  (url) => ipcRenderer.invoke('load-url', url),
  onFocusUrlInput: (fn) => ipcRenderer.on('focus-url-input', fn),
});