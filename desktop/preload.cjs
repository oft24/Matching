const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('matchingDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
  notify: (title, body) => ipcRenderer.invoke('desktop:notify', { title, body }),
});

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.desktop = 'true';
});
