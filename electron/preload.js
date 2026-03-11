// preload.js
import { contextBridge, ipcRenderer, protocol } from 'electron';
const url = require('url');

const requireAPI = (packageName) => {
  if (packageName === "url") return url;
};

contextBridge.exposeInMainWorld('require', requireAPI);

contextBridge.exposeInMainWorld('ipcRenderer', {
  // 已有的 send/on/off
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel, func) => {
    const subscription = (_event, ...args) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  off: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  },
  
  // 添加 invoke 支持
  invoke: (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  
  // 添加 once 支持
  once: (channel, func) => {
    const subscription = (_event, ...args) => func(...args);
    ipcRenderer.once(channel, subscription);
  }
});

console.log("hello from preload.js!");