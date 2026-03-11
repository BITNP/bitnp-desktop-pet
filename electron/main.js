import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, protocol } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import serve from 'electron-serve'
import { spawn } from 'child_process';
import fetchBackendData from './fetchBackendData';

// 更可靠的方式获取路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 路径配置
const isPackaged = app.isPackaged
const DIST_PATH = isPackaged 
  ? path.join(process.resourcesPath, 'dist')  // 打包后路径
  : path.join(__dirname, '../dist')           // 开发路径

console.log('应用信息:')
console.log('isPackaged:', isPackaged)
console.log('DIST_PATH:', DIST_PATH)
console.log('__dirname:', __dirname)
console.log('resourcesPath:', process.resourcesPath)

const loadURL = serve({ 
  directory: DIST_PATH,  // 指向 dist 目录，不是根目录
  scheme: 'app',
  isCorsEnabled: true
})

function getExePath() {
  if (app.isPackaged) {
    // 生产环境：资源在 asar 外面
    return path.join(process.resourcesPath, 'system-monitor', 'multimeter-engine.exe');
  } else {
    // 开发环境
    // 从 main.js 位置向上回到项目根目录，然后到 system-monitor
    return path.join(__dirname, '..', 'system-monitor', 'multimeter-engine.exe');
  }
}



const exePath = getExePath();
const port = 10987;
const powershellCommand = `Start-Process -FilePath "${exePath}" -ArgumentList '--port ${port}' -Verb RunAs`;
const monitorBackend = spawn('powershell.exe', ['-Command', powershellCommand], {
  windowsHide: true
});

monitorBackend.stdout.on('data', (data) => {
  console.log(`输出: ${data}`);
});

monitorBackend.stderr.on('data', (data) => {
  console.error(`错误: ${data}`);
});

monitorBackend.on('close', (code) => {
  console.log(`子进程退出，退出码: ${code}`);
});

function stopExe() {
  if (monitorBackend && !monitorBackend.killed) {
    console.log('正在终止子进程...');
    monitorBackend.kill('SIGTERM');  // 发送终止信号
    
    // 3秒后强制终止
    setTimeout(() => {
      if (monitorBackend && !monitorBackend.killed) {
        monitorBackend.kill('SIGKILL');
      }
    }, 3000);
  }
}

app.on('before-quit', () => {
  console.log('应用即将退出，终止子进程');
  stopExe();
});


let win = null
let tray = null

function createTray() {
  try {
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YURL...')
    tray = new Tray(icon)
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: '显示/隐藏', 
        click: () => {
          if (win) {
            win.isVisible() ? win.hide() : win.show()
          }
        }
      },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() }
    ])
    
    tray.setToolTip('BITNP Desktop Pet')
    tray.setContextMenu(contextMenu)
    
    // 托盘图标点击事件
    tray.on('click', () => {
      if (win) {
        win.isVisible() ? win.hide() : win.show()
      }
    })
    
  } catch (error) {
    console.error('创建托盘失败:', error)
  }
}

function createWindow() {
  try {
    console.log('开始创建窗口...')
    
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    
    const windowWidth = 720 * 2 / 2
    const windowHeight = 1280 / 2
    // const windowWidth = 600
    // const windowHeight = 800

    win = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: Math.round(screenWidth - windowWidth),  // 右边留20px边距
      y: Math.round(screenHeight - windowHeight), // 下边留20px边距
      type: 'toolbar',
      // frame: true, // DEBUG
      // transparent: false, // DEBUG
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      hasShadow: false,
      resizable: false,
      show: false, // 先不显示，等加载完成
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        backgroundThrottling: false,
        webgl: true,
        contextIsolation: true,
        nodeIntegration: false,
        zoomFactor: 1.0 // 缩放比
      }
    })

    // 禁止用户缩放
    win.webContents.setVisualZoomLevelLimits(1, 1)
    // win.webContents.setLayoutZoomLevelLimits(1, 1)

    // 窗口事件监听
    win.on('closed', () => {
      console.log('窗口已关闭')
      win = null
    })

    win.on('ready-to-show', () => {
      console.log('窗口准备就绪，显示窗口')
      win.show()
      win.focus()
    })

    win.webContents.on('zoom-changed', (event, zoomDirection) => {
      // 阻止所有缩放事件
      event.preventDefault()
      // 立即重置为100%缩放
      win.webContents.setZoomFactor(1.0)
      win.webContents.setZoomLevel(0)
    })

    win.webContents.on('did-finish-load', () => {
      console.log('页面加载完成')
    })

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('页面加载失败:', errorCode, errorDescription)
    })

    // 鼠标位置监听
    let mouseCheckInterval = null
    win.on('focus', () => {
      console.log('窗口获得焦点，启动鼠标监听')
      
      mouseCheckInterval = setInterval(() => {
        if (!win || win.isDestroyed()) {
          clearInterval(mouseCheckInterval)
          return
        }
        
        try {
          const cursor = screen.getCursorScreenPoint()
          const winBounds = win.getBounds()
          
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
            win.webContents.send('check-mouse-position', {
              x: relX,
              y: relY
            })
          }
        } catch (error) {
          console.error('鼠标监听错误:', error)
        }
      }, 33)
    })

    win.on('blur', () => {
      console.log('窗口失去焦点')
    })

    // IPC 处理
    setupIPC()

    // 加载页面 - 修复加载逻辑
    if (isPackaged) {
      console.log('生产环境，使用 electron-serve 加载')
      
      // 使用 electron-serve
      loadURL(win).then(() => {
        console.log('electron-serve 加载成功')
      }).catch(error => {
        console.error('electron-serve 加载失败:', error)
        
        // 回退方案：尝试直接加载文件
        const indexPath = path.join(DIST_PATH, 'index.html')
        console.log('尝试回退方案，加载:', indexPath)
        
        const fs = require('fs')
        if (fs.existsSync(indexPath)) {
          console.log('index.html 存在，直接加载')
          win.loadFile(indexPath).catch(e => {
            console.error('直接加载也失败:', e)
            loadFallbackPage()
          })
        } else {
          console.error('index.html 不存在')
          loadFallbackPage()
        }
      })
    } else {
      // 开发环境：从开发服务器加载
      const devServerUrl = process.env.VITE_DEV_SERVER_URL
      console.log('开发环境URL:', devServerUrl)
      
      if (devServerUrl) {
        win.loadURL(devServerUrl).catch(error => {
          console.error('加载开发服务器失败:', error)
          loadFallbackPage()
        })
        // win.webContents.openDevTools() // 开发工具
      } else {
        console.error('开发服务器URL未定义')
        loadFallbackPage()
      }
    }

    console.log('窗口创建完成')

  } catch (error) {
    console.error('创建窗口失败:', error)
  }
}

// 回退页面（加载失败时显示）
function loadFallbackPage() {
  if (!win || win.isDestroyed()) return
  
  const fallbackHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>BITNP Desktop Pet - 加载失败</title>
        <style>
            body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
            }
            .container {
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }
            h1 { margin: 0 0 20px 0; }
            pre { 
                background: rgba(0,0,0,0.2); 
                padding: 10px; 
                border-radius: 5px;
                text-align: left;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 应用运行中</h1>
            <p>但前端页面加载失败，这是回退页面。</p>
            <p>请检查控制台输出以获取详细错误信息。</p>
            <pre>窗口创建时间: ${new Date().toISOString()}</pre>
        </div>
    </body>
    </html>
  `
  
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackHtml)}`)
}

function setupIPC() {
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    // return // DEBUG
    win?.setIgnoreMouseEvents(ignore, options)
  })

  let dragOffset = null
  ipcMain.on('drag-start', (event, screenX, screenY) => {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (!w) return
    const bounds = w.getBounds()
    dragOffset = { x: screenX - bounds.x, y: screenY - bounds.y }
  })
  
  ipcMain.on('drag-move', (event, screenX, screenY) => {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (!w || !dragOffset) return
    w.setPosition(
      Math.round(screenX - dragOffset.x), 
      Math.round(screenY - dragOffset.y)
    )
  })
  
  ipcMain.on('drag-end', () => {
    dragOffset = null
  })

  
ipcMain.handle('get-system-monitor-data', async () => {
  const metrics = [
    "cpu_name",
    "cpu_temperature",
    "cpu_temperature_first",
    "cpu_temperature_last",
    "cpu_tjmax_first",
    "cpu_tjmax_last",
    "cpu_power",
    "cpu_voltage_first",
    "cpu_voltage_last",
    "cpu_voltage",
    "cpu_clock_first",
    "cpu_clock_last",
    "cpu_clock_avg",
    "cpu_clock_rms",
    "cpu_clock_max",
    "cpu_usage",
    "cpu_usage_first",
    "cpu_usage_last",
    "gpu_name",
    "gpu_temperature",
    "gpu_power",
    "gpu_clock_rms",
    "gpu_mem_clock_rms",
    "gpu_usage",
    "mem_percentage",
    "mem_available",
    "mem_used",
    "bat_capacity_max",
    "bat_capacity_remain",
    "bat_capacity_designed",
    "bat_voltage",
    "bat_rate",
    "bat_state",
    "os_activated",
    "disk_temperature_first",
    "disk_temperature_last",
    "disk_disk_size"
  ]
  
  const results = {};
  for (const metric of metrics) {
    try {
      const data = await fetchBackendData(metric);

      if (typeof data.payload.value === 'string' && data.payload.value.startsWith('Failed')) {
        results[metric] = null
      } else {
        results[metric] = data.payload.value;
      }
    } catch (error) {
      results[metric] = null;
    }
  }
  
  return results;
});
}

// 应用事件
app.whenReady().then(() => {
  console.log('=== 应用准备就绪 ===')
  createWindow()
  createTray()
}).catch(error => {
  console.error('应用启动失败:', error)
})

app.on('window-all-closed', () => {
  console.log('所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  console.log('应用被激活')
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
})

console.log('主进程脚本加载完成')