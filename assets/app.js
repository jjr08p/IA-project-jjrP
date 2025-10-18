import { setActiveMode, toggleAbout, toggleTheme } from './ui.js'
import { initImages } from './panels/images.js'
import { initAudio } from './panels/audio.js'
import { initPoses } from './panels/poses.js'

let cleanup = null
function mount(mode) {
  if (cleanup) { try { cleanup() } catch {} cleanup = null }
  setActiveMode(mode)
  if (mode === 'images') cleanup = initImages()
  else if (mode === 'audio') cleanup = initAudio()
  else cleanup = initPoses()
}

document.getElementById('aboutBtn').addEventListener('click', toggleAbout)
document.getElementById('themeBtn').addEventListener('click', toggleTheme)

document.getElementById('modeNav').addEventListener('click', (e)=>{
  const btn = e.target.closest('.mode-btn'); if (!btn) return
  mount(btn.dataset.mode)
})

window.addEventListener('keydown', (e)=>{
  if (e.target.closest('input,textarea')) return
  if (e.key === '1') mount('images')
  if (e.key === '2') mount('audio')
  if (e.key === '3') mount('poses')
  if (e.key.toLowerCase() === 'd') toggleTheme()
  if (e.key === '?') document.getElementById('aboutBtn').click()
})

// start default
mount('images')
