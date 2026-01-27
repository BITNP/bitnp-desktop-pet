<template>
  <div class="pet-container" style="width: 128px; height: 128px">
    <canvas
      ref="canvasRef"
      @pointermove="handlePointerMove"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
      style="width: 100%; height: 100%; cursor: move; -webkit-app-region: no-drag"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import './App.css'

const canvasRef = ref(null)
const dragging = ref(false)
const lastInteractive = ref(false)

onMounted(() => {
  const canvas = canvasRef.value
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
})

const updateInteractive = (e) => {
  if (dragging.value) return
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
  const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const alpha = ctx.getImageData(x, y, 1, 1).data[3]
  const interactive = alpha > 0
  if (interactive !== lastInteractive.value) {
    lastInteractive.value = interactive
    if (interactive) {
      window.ipcRenderer?.send('set-ignore-mouse-events', false)
    } else {
      window.ipcRenderer?.send('set-ignore-mouse-events', true, { forward: true })
    }
  }
}

const handlePointerMove = (e) => {
  if (dragging.value) {
    window.ipcRenderer?.send('drag-move', e.screenX, e.screenY)
    return
  }
  updateInteractive(e)
}

const handlePointerDown = (e) => {
  updateInteractive(e)
  if (lastInteractive.value) {
    const target = e.target
    target.setPointerCapture(e.pointerId)
    window.ipcRenderer?.send('drag-start', e.screenX, e.screenY)
    dragging.value = true
    window.ipcRenderer?.send('set-ignore-mouse-events', false)
  }
}

const handlePointerUp = () => {
  window.ipcRenderer?.send('drag-end')
  dragging.value = false
  window.ipcRenderer?.send('set-ignore-mouse-events', true, { forward: true })
}

const handlePointerEnter = (e) => {
  updateInteractive(e)
}

const handlePointerLeave = () => {
  window.ipcRenderer?.send('set-ignore-mouse-events', true, { forward: true })
}
</script>
