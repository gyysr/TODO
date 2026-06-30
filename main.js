// main.js - Electron 主进程文件
const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    title: '记事本',
    icon: path.join(__dirname, 'icon.png'), // 可选图标
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // 创建菜单栏
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-file');
          }
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('open-file');
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-file');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          role: 'quit',
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: '格式',
      submenu: [
        {
          label: '字体',
          click: () => {
            mainWindow.webContents.send('change-font');
          }
        },
        {
          label: '颜色',
          click: () => {
            mainWindow.webContents.send('change-color');
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 监听渲染进程的消息 - 文件操作 IPC 处理
ipcMain.handle('save-file-dialog', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: '文本文件', extensions: ['txt'] },
      { name: 'Markdown文件', extensions: ['md'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (result.canceled) return { canceled: true };
  try {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { canceled: false, filePath: result.filePath };
  } catch (error) {
    return { canceled: false, error: error.message };
  }
});

ipcMain.handle('save-file-direct', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '文本文件', extensions: ['txt', 'md'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf8');
    return { canceled: false, filePath: result.filePaths[0], content };
  } catch (error) {
    return { canceled: true, error: error.message };
  }
});