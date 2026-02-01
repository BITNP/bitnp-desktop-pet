import { contextBridge, ipcRenderer } from 'electron'
const url = require('url')

const requireAPI = (packageName) => {
  // it seems that "pixi-live2d-display" mistakenly uses "require('url')"
  // we fix it this way
  if (packageName === "url") return url;
}
contextBridge.exposeInMainWorld('require', requireAPI)


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

console.log("hello from preload.js!")