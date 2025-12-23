
const { app, BrowserWindow, Menu, globalShortcut, powerSaveBlocker, ipcMain, session } = require('electron');
const path = require('path');

// Balanced GPU Settings - Prevents driver crashes while maintaining hardware acceleration
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('force-high-performance-gpu');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-video-decode');

// Power Management
let suspensionBlockId;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Vinci Auto-Editor Pro",
    backgroundColor: '#020205',
    show: false, // Don't show until ready to prevent white/black flash
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      webSecurity: false
    }
  });

  Menu.setApplicationMenu(null);

  // Handle Silent Downloads: Intercept download events to skip the 'Save As' dialog
  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Get the filename set in the anchor tag's 'download' attribute
    const fileName = item.getFilename();
    const savePath = path.join(app.getPath('downloads'), fileName);
    
    // Set the path and skip the prompt
    item.setSavePath(savePath);
    
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully saved to:', savePath);
      } else {
        console.error('Download failed:', state);
      }
    });
  });

  // Load the local index.html
  win.loadFile(path.join(__dirname, 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Handle potential load errors
  win.webContents.on('did-fail-load', () => {
    console.error('Failed to load app. Retrying...');
    win.loadFile(path.join(__dirname, 'index.html'));
  });

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    win.webContents.openDevTools();
  });

  suspensionBlockId = powerSaveBlocker.start('prevent-app-suspension');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (suspensionBlockId !== undefined) powerSaveBlocker.stop(suspensionBlockId);
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('spawn-new-instance', () => {
  createWindow();
});
