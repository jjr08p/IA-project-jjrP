import { setStatus, renderTopK, fmt } from '../ui.js'
import { getCamera, stopStream } from '../media.js'
import { loadTMImageModel } from '../modelLoader.js'

const CLASSES = ['fútbol','baloncesto','tenis']

export function initImages() {
  const video = document.getElementById('img-video')
  const canvas = document.getElementById('img-canvas')
  const st = document.getElementById('img-status')
  const demoBadge = document.getElementById('img-demo')
  const btnFreeze = document.getElementById('img-freeze')
  const inpUpload = document.getElementById('img-upload')
  const fps = document.getElementById('img-fps')
  const fpsVal = document.getElementById('img-fps-val')
  const top1 = document.getElementById('img-top1')
  const top1p = document.getElementById('img-top1prob')
  const top3 = document.getElementById('img-top3')
  const lat = document.getElementById('img-latency')

  let frozen = false, demo = false, labels = CLASSES, model = null, stream = null
  let last = 0

  async function load() {
    setStatus(st, 'loading')
    try {
      const loaded = await loadTMImageModel('/public/models/sports')
      model = loaded.model
      labels = (loaded.labels && loaded.labels.length) ? loaded.labels : CLASSES
      setStatus(st, 'ready')
      demo = false
      demoBadge.classList.add('hidden')
    } catch {
      demo = true
      demoBadge.classList.remove('hidden')
      setStatus(st, 'demo')
    }
  }

  async function startCam() {
    const res = await getCamera({ video: { width: 640, height: 480 }, audio:false })
    if (res.error) { setStatus(st, 'denied'); return }
    stream = res.stream
    video.srcObject = stream
    await video.play()
    if (st.textContent === 'Cargando…') setStatus(st, 'ready')
    loop()
  }

  function drawVideo(ctx) {
    const draw = () => {
      if (video.videoWidth) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      requestAnimationFrame(draw)
    }
    draw()
  }

  function loop() {
    const ctx = canvas.getContext('2d')
    drawVideo(ctx)
    const frameInterval = 1000 / Math.max(1, Number(fps.value || 30))
    async function infer(ts) {
      if (ts - last < frameInterval) return requestAnimationFrame(infer)
      last = ts
      const t0 = performance.now()
      if (!frozen) {
        if (!demo && model) {
          const res = await model.predict(canvas)
          const mapped = res.map(r=>({label:r.className, prob:r.probability})).sort((a,b)=>b.prob-a.prob)
          top1.textContent = mapped[0]?.label ?? '—'
          top1p.textContent = fmt(mapped[0]?.prob ?? 0)
          renderTopK(top3, mapped.slice(0,3))
        } else {
          const t = Date.now()/1000
          const probs = [ (Math.sin(t)+1)/4+0.25, (Math.sin(t+2)+1)/4+0.25, (Math.sin(t+4)+1)/4+0.25 ]
          const sum = probs.reduce((a,b)=>a+b,0)
          const norm = probs.map(p=>p/sum)
          const arr = labels.map((l,i)=>({label:l, prob:norm[i]})).sort((a,b)=>b.prob-a.prob)
          top1.textContent = arr[0].label
          top1p.textContent = fmt(arr[0].prob)
          renderTopK(top3, arr.slice(0,3))
        }
      }
      lat.textContent = Math.round(performance.now() - t0)
      requestAnimationFrame(infer)
    }
    requestAnimationFrame(infer)
  }

  btnFreeze.addEventListener('click', () => {
    frozen = !frozen
    btnFreeze.textContent = frozen ? 'Reanudar' : 'Congelar fotograma'
  })
  inpUpload.addEventListener('change', (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const img = new Image()
    img.onload = async () => {
      const ctx = canvas.getContext('2d')
      canvas.width = img.width; canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      frozen = true; btnFreeze.textContent = 'Reanudar'
      if (!demo && model) {
        const res = await model.predict(canvas)
        const mapped = res.map(r=>({label:r.className, prob:r.probability})).sort((a,b)=>b.prob-a.prob)
        top1.textContent = mapped[0]?.label ?? '—'
        top1p.textContent = fmt(mapped[0]?.prob ?? 0)
        renderTopK(top3, mapped.slice(0,3))
      }
    }
    img.src = URL.createObjectURL(file)
  })
  fps.addEventListener('input', () => { fpsVal.textContent = fps.value })

  // lifecycle
  load(); startCam();

  // cleanup when leaving panel
  return () => stopStream(stream)
}
