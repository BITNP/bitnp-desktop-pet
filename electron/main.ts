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
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
let tray: Tray | null = null

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

  win = new BrowserWindow({
    width: 200, // Initial size
    height: 200,
    type: 'toolbar', // Helps with always on top behavior on some OS
    frame: false, // Frameless
    transparent: true, // Transparent
    alwaysOnTop: true, // Always on top
    hasShadow: false, // Remove shadow
    resizable: false, // Prevent resizing by user (optional)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false, // Prevent throttling when hidden
    },
  })

  // Do not start in click-through mode. Renderer will toggle based on pixel hit-test.

  // IPC handler for mouse events
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.setIgnoreMouseEvents(ignore, options)
  })
  let dragOffset: { x: number; y: number } | null = null
  ipcMain.on('drag-start', (event, screenX: number, screenY: number) => {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (!w) return
    const b = w.getBounds()
    dragOffset = { x: screenX - b.x, y: screenY - b.y }
  })
  ipcMain.on('drag-move', (event, screenX: number, screenY: number) => {
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
