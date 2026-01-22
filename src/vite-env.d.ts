/// <reference types="vite/client" />

interface Window {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void
    on: (channel: string, func: (...args: any[]) => void) => void
    off: (channel: string, func: (...args: any[]) => void) => void
  }
}
