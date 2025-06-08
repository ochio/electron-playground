// main.js
const { app, ipcMain, BrowserWindow, WebContentsView, screen } = require('electron');
const path = require('node:path');

let leftView, rightView;

// BrowserWindow 作成後にショートカットを登録
function registerShortcuts() {
  // CommandOrControl+L で Renderer へイベント送信
  globalShortcut.register('CommandOrControl+L', () => {
    // フォーカスが別ビューにあっても必ず飛ばす
    win.webContents.send('focus-url-input');
  });
}


function createSplitWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  leftView  = new WebContentsView({ webPreferences: { nodeIntegration:false, contextIsolation:true, 
    preload: path.join(__dirname, 'preload.js'),
   } });
  rightView = new WebContentsView({ webPreferences: { nodeIntegration:false, contextIsolation:true,
    preload: path.join(__dirname, 'preload.js'),
   } });
  win.contentView.addChildView(leftView);
  win.contentView.addChildView(rightView);

  const half = Math.floor(workArea.width / 2);
  leftView.setBounds({  x: 0,     y: 200, width: half, height: workArea.height });
  rightView.setBounds({ x: half,  y: 200, width: half, height: workArea.height });

  leftView.setAutoResize({ width: true, height: true });
  rightView.setAutoResize({ width: true, height: true });

  registerShortcuts();
}

ipcMain.handle('load-url', (_evt, rawUrl) => {
  // プレフィクス補完（例: example.com → https://example.com）
  const url =
    /^(https?|file):\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const translatedUrl = `https://translate.google.com/translate?hl=ja&sl=auto&tl=ja&u=${url}`

  leftView?.webContents.loadURL(translatedUrl);
  rightView?.webContents.loadURL(url);
});

ipcMain.on('scroll-sync', (evt, pos) => {
  // 送信元の webContents.id で左右を判定
  const from = evt.sender.id;
  if (!leftView || !rightView) return;

  const target =
    from === leftView.webContents.id ? rightView : leftView;

  // 転送
  target.webContents.send('apply-scroll', pos);
});

app.whenReady().then(createSplitWindow);
