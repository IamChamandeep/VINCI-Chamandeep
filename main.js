const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Vinci Auto-Editor Pro",
    backgroundColor: '#020205',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  Menu.setApplicationMenu(null);

  // Load the local index.html
  win.loadFile(path.join(__dirname, 'index.html'));

  // To help with rendering performance
  const { powerSaveBlocker } = require('electron');
  powerSaveBlocker.start('prevent-app-suspension');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});