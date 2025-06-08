const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadUrl:  (url) => ipcRenderer.invoke('load-url', url),
  onFocusUrlInput: (fn) => ipcRenderer.on('focus-url-input', fn),
});

let internalScroll = false;          // 自動スクロールによるループ防止
let throttled     = false;           // 送信し過ぎ防止（約30 fps）

// スクロール発生時：自分→Main へ送信
window.addEventListener('scroll', () => {
  if (internalScroll) return;

  if (!throttled) {
    throttled = true;
    setTimeout(() => (throttled = false), 33);    // 30fps 程度
    ipcRenderer.send('scroll-sync', {
      x: window.scrollX,
      y: window.scrollY,
    });
  }
});

// Main → 自分への同期指示
ipcRenderer.on('apply-scroll', (_e, { x, y }) => {
  internalScroll = true;
  window.scrollTo(x, y);
  // 次のイベントループで解除（Firefox 互換）
  setTimeout(() => (internalScroll = false), 0);
});