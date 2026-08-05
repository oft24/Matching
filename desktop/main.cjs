const { app, BrowserWindow, Menu, Notification, Tray, ipcMain, nativeImage, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const APP_ID = 'com.matching.desktop';
const SESSION_PARTITION = 'persist:matching-desktop';
const smokeTest = process.argv.includes('--smoke-test');
const devUrlIndex = process.argv.indexOf('--dev-url');
const devUrl = devUrlIndex >= 0 ? process.argv[devUrlIndex + 1] : null;

let mainWindow = null;
let tray = null;
let quitting = false;

app.setAppUserModelId(APP_ID);
app.setName('Matching');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function appAsset(...segments) {
  return path.join(app.getAppPath(), ...segments);
}

function createBrandIcon(size = 32) {
  try {
    const png = nativeImage.createFromPath(appAsset('desktop', 'assets', 'icon.png'));
    if (!png.isEmpty()) return png.resize({ width: size, height: size });
    const svg = fs.readFileSync(appAsset('frontend', 'dist', 'favicon.svg'));
    const image = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${svg.toString('base64')}`);
    return image.isEmpty() ? image : image.resize({ width: size, height: size });
  } catch {
    return nativeImage.createEmpty();
  }
}

function isTrustedNavigation(targetUrl) {
  if (targetUrl.startsWith('file://')) return true;
  if (devUrl && targetUrl.startsWith(devUrl)) return true;
  return false;
}

function showMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  if (smokeTest) return;
  const icon = createBrandIcon(20);
  if (icon.isEmpty()) return;
  tray = new Tray(icon);
  tray.setToolTip('Matching');
  tray.on('double-click', showMainWindow);
  const rebuildMenu = () => {
    const startsWithWindows = app.getLoginItemSettings().openAtLogin;
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Abrir Matching', click: showMainWindow },
      {
        label: 'Abrir al iniciar Windows',
        type: 'checkbox',
        checked: startsWithWindows,
        click: (item) => {
          app.setLoginItemSettings({ openAtLogin: item.checked, path: process.execPath });
          rebuildMenu();
        },
      },
      { type: 'separator' },
      { label: 'Salir', click: () => { quitting = true; app.quit(); } },
    ]));
  };
  rebuildMenu();
}

function configureSession() {
  const desktopSession = session.fromPartition(SESSION_PARTITION);
  const allowedPermissions = new Set(['media', 'notifications', 'fullscreen']);
  desktopSession.setPermissionCheckHandler((_webContents, permission) => allowedPermissions.has(permission));
  desktopSession.setPermissionRequestHandler((_webContents, permission, callback) => callback(allowedPermissions.has(permission)));
}

function createWindow() {
  const icon = createBrandIcon(64);
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    show: false,
    backgroundColor: '#080d18',
    title: 'Matching',
    icon: icon.isEmpty() ? undefined : icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      partition: SESSION_PARTITION,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isTrustedNavigation(url)) return;
    event.preventDefault();
    void shell.openExternal(url);
  });
  mainWindow.webContents.on('render-process-gone', () => {
    if (!quitting && mainWindow) mainWindow.reload();
  });
  mainWindow.on('close', (event) => {
    if (quitting || smokeTest || !tray) return;
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on('closed', () => { mainWindow = null; });

  if (devUrl) {
    void mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(appAsset('frontend', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (!smokeTest) mainWindow.show();
  });

  if (smokeTest) {
    const timeout = setTimeout(() => {
      console.error('DESKTOP_SMOKE_TIMEOUT');
      app.exit(1);
    }, 20000);
    mainWindow.webContents.once('did-finish-load', async () => {
      clearTimeout(timeout);
      const result = await mainWindow.webContents.executeJavaScript(`({ title: document.title, root: Boolean(document.querySelector('#root')?.children.length), desktop: document.documentElement.dataset.desktop })`);
      console.log(`DESKTOP_SMOKE_OK ${JSON.stringify(result)}`);
      app.exit(result.root && result.desktop === 'true' ? 0 : 1);
    });
    mainWindow.webContents.once('did-fail-load', (_event, code, description) => {
      clearTimeout(timeout);
      console.error(`DESKTOP_SMOKE_LOAD_FAILED ${code} ${description}`);
      app.exit(1);
    });
  }
}

ipcMain.handle('desktop:notify', (_event, { title, body }) => {
  if (!Notification.isSupported()) return false;
  new Notification({ title: String(title).slice(0, 80), body: String(body).slice(0, 240), icon: createBrandIcon(64) }).show();
  return true;
});

app.on('second-instance', () => showMainWindow());
app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && (!tray || smokeTest)) app.quit();
});
app.on('activate', () => {
  if (mainWindow) showMainWindow();
  else createWindow();
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  configureSession();
  createTray();
  createWindow();
});
