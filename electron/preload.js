import { contextBridge, ipcRenderer } from 'electron'

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
})
