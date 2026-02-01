import { contextBridge, ipcRenderer } from 'electron'
const url = require('url')

// 将 Node.js 的 url 模块注入到渲染进程

// 或者在全局对象上直接添加

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args)
  },
  on: (channel, func) => {
    const subscription = (_event, ...args) => func(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  off: (channel, func) => {
    ipcRenderer.removeListener(channel, func) // Note: this simple implementation might not work perfectly with the wrapper above
  },
  resolve: url.resolve
})

window.url = url