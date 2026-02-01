import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron'

import path from 'path'

// The built directory structure
//
// ├─┬─ dist
// │ └── index.html
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
// 

// const gpuSwitches = [
//   '--enable-gpu-rasterization',
//   '--enable-accelerated-2d-canvas',
//   '--enable-webgl',
//   '--enable-webgl2',
//   '--enable-webgpu',
//   '--enable-accelerated-video-decode',
//   '--enable-accelerated-video-encode',
//   '--enable-accelerated-mjpeg-decode',
//   '--enable-native-gpu-memory-buffers',
//   '--enable-oop-rasterization',
//   '--enable-zero-copy',
//   '--ignore-gpu-blacklist',
//   '--use-gl=desktop',
//   '--disable-software-rasterizer',
//   '--disable-gpu-driver-bug-workarounds',
//   '--disable-features=VizDisplayCompositor',
//   '--enable-features=VaapiVideoDecoder,CanvasOopRasterization,Vulkan,UseSkiaRenderer',
//   '--force_high_performance_gpu'  // 对于双显卡笔记本
// ]

// gpuSwitches.forEach(gpuSwitch => {
//   app.commandLine.appendSwitch(gpuSwitch.replace('--', ''))
// });

// console.log(app.getGPUFeatureStatus()) // DEBUG

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')
let win
let tray = null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createTray() {
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAC0SURBVHgB7ddBCsMgFADQ9f9f2s220O5SAs6iF0jI7yMEppj6Jz8/5/x4XU9lWbYxM/d+X9f1jIiJMeZ4r7V2Q0QvOeeHiN6y73vvF9UwjJdSmkR0y1prF9U0zYuIXnLOv1E153xFRC8559+oFhG95Jx/o1pE9JJz/o1qEdFLzvk3qkVELznn36gWEb3knH+jWkT0knP+jWoR0UvO+TeqRUQvOeffqBYRveScf6N6A/wF82pvn+1lAAAAAElFTkSuQmCC')
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => win?.isVisible() ? win?.hide() : win?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setToolTip('BitNP Desktop Pet')
  tray.setContextMenu(contextMenu)
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const windowWidth = 600;
  const windowHeight = 800;

  win = new BrowserWindow({
    width: windowWidth, // Initial size
    height: windowHeight,

    x: width - windowWidth,
    y: height - windowHeight,

    type: 'toolbar', // Helps with always on top behavior on some OS
    frame: false, // Frameless
    // frame: true, // DEBUG
    transparent: true, // Transparent
    // transparent: false, // DEBUG
    alwaysOnTop: true, // Always on top
    hasShadow: false, // Remove shadow
    resizable: false, // Prevent resizing by user (optional)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false, // Prevent throttling when hidden
      webgl: true,
      // nodeIntegration: true,      // 允许在渲染进程中使用 Node.js API
      // contextIsolation: false,   // 禁用上下文隔离
      // TODO: are these configs necessary?
      // webSecurity: false,        // 禁用 web 安全策略（开发时）
      // enableRemoteModule: true,  // 启用 remote 模块
      // sandbox: false,            // 禁用沙箱
    },
  })

  
  // 持续监听鼠标位置
  const mouseCheckInterval = setInterval(() => {
    const cursor = screen.getCursorScreenPoint()
    const winBounds = win.getBounds()
    
    // 计算鼠标相对于窗口的位置
    const relX = cursor.x - winBounds.x
    const relY = cursor.y - winBounds.y
    
    win.webContents.send('update-focus', {
      windowX: winBounds.x,
      windowY: winBounds.y,
      cursorX: cursor.x,
      cursorY: cursor.y
    })

    if (relX >= 0 && relX <= winBounds.width && 
        relY >= 0 && relY <= winBounds.height) {
      // const requestId = ++lastRequestId
      win.webContents.send('check-mouse-position', {
        // id: requestId,
        x: relX,
        y: relY
      })
    }
  }, 33) // ~30fps
  
  win.on('closed', () => clearInterval(mouseCheckInterval))

  // Do not start in click-through mode. Renderer will toggle based on pixel hit-test.

  // IPC handler for mouse events
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.setIgnoreMouseEvents(ignore, options)

  })

  let dragOffset = null
  ipcMain.on('drag-start', (event, screenX, screenY) => {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (!w) return
    const b = w.getBounds()
    dragOffset = { x: screenX - b.x, y: screenY - b.y }
  })
  ipcMain.on('drag-move', (event, screenX, screenY) => {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (!w || !dragOffset) return
    w.setPosition(Math.round(screenX - dragOffset.x), Math.round(screenY - dragOffset.y))
  })
  ipcMain.on('drag-end', (event) => {
    dragOffset = null
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
  
  // Hide from taskbar (optional, typical for desktop pets)
  win.setSkipTaskbar(true) 
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})
