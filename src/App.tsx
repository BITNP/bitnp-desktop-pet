import { useEffect, useRef } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = 128
    canvas.width = size
    canvas.height = size
    ctx.clearRect(0, 0, size, size)
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,0,0,0.9)'
    ctx.fill()
  }, [])

  const draggingRef = useRef<boolean>(false)
  const lastInteractiveRef = useRef<boolean>(false)

  const updateInteractive = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const alpha = ctx.getImageData(x, y, 1, 1).data[3]
    const interactive = alpha > 0
    if (interactive !== lastInteractiveRef.current) {
      lastInteractiveRef.current = interactive
      if (interactive) {
        window.ipcRenderer?.send('set-ignore-mouse-events', false)
      } else {
        window.ipcRenderer?.send('set-ignore-mouse-events', true, { forward: true })
      }
    }
  }

  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (draggingRef.current) {
      window.ipcRenderer?.send('drag-move', e.screenX, e.screenY)
      return
    }
    updateInteractive(e)
  }

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    updateInteractive(e)
    if (lastInteractiveRef.current) {
      (e.target as Element).setPointerCapture(e.pointerId)
      window.ipcRenderer?.send('drag-start', e.screenX, e.screenY)
      draggingRef.current = true
      window.ipcRenderer?.send('set-ignore-mouse-events', false)
    }
  }

  const handlePointerUp: React.PointerEventHandler<HTMLCanvasElement> = () => {
    window.ipcRenderer?.send('drag-end')
    draggingRef.current = false
    window.ipcRenderer?.send('set-ignore-mouse-events', true, { forward: true })
  }
  const handlePointerEnter: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    updateInteractive(e)
  }
  const handlePointerLeave: React.PointerEventHandler<HTMLCanvasElement> = () => {
    window.ipcRenderer?.send('set-ignore-mouse-events', true, { forward: true })
  }

  return (
    <div className="pet-container" style={{ width: 128, height: 128 }}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        style={{ width: '100%', height: '100%', cursor: 'move', WebkitAppRegion: 'no-drag' }}
      />
    </div>
  )
}

export default App
