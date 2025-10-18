import { setStatus, renderTopK, fmt } from '../ui.js'
import { loadTMAudioModel } from '../modelLoader.js'

const CLASSES = ['francés (Oui)','inglés (Yes)','español (Sí)']

export function initAudio() {
  const canvas = document.getElementById('aud-canvas')
  const st = document.getElementById('aud-status')
  const demoBadge = document.getElementById('aud-demo')
  const btnStart = document.getElementById('aud-start')
  const btnStop = document.getElementById('aud-stop')
  const top1 = document.getElementById('aud-top1')
  const top1p = document.getElementById('aud-top1prob')
  const top3 = document.getElementById('aud-top3')
  const lat = document.getElementById('aud-latency')

  let model = null, labels = CLASSES, demo = false
  let stopFn = null, listening = false

  async function load() {
    setStatus(st, 'loading')
    try {
      const loaded = await loadTMAudioModel('/public/models/oui-yes-si')
      model = loaded.model
      labels = (loaded.labels && loaded.labels.length) ? loaded.labels : CLASSES
      setStatus(st, 'ready'); demo = false; demoBadge.classList.add('hidden')
    } catch {
      setStatus(st, 'demo'); demo = true; demoBadge.classList.remove('hidden')
    }
  }

  function drawWave(waveform) {
    if (!waveform) return
    const ctx = canvas.getContext('2d')
    canvas.width = 640; canvas.height = 160
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.beginPath()
    const slice = canvas.width / waveform.length
    for (let i=0;i<waveform.length;i++) {
      const x = i * slice
      const y = (0.5 - waveform[i]/2) * canvas.height
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    }
    ctx.lineWidth = 2; ctx.strokeStyle = getComputedStyle(canvas).color; ctx.stroke()
  }
  function drawOsc(byteTime) {
    const ctx = canvas.getContext('2d')
    canvas.width = 640; canvas.height = 160
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.beginPath()
    const slice = canvas.width / byteTime.length
    for (let i=0;i<byteTime.length;i++) {
      const x = i * slice
      const y = (byteTime[i]/255) * canvas.height
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    }
    ctx.lineWidth = 2; ctx.strokeStyle = getComputedStyle(canvas).color; ctx.stroke()
  }

  async function start() {
    if (listening) return
    top1.textContent = '—'; top1p.textContent = ''; top3.innerHTML = ''; lat.textContent = '—'
    if (!demo && model?.listen) {
      try {
        setStatus(st, 'loading')
        const t0 = performance.now()
        await model.listen(result => {
          const arr = Array.from(result.scores || [])
          const mapped = arr.map((p,i)=>({label: labels[i] ?? `Clase ${i+1}`, prob: p})).sort((a,b)=>b.prob-a.prob)
          top1.textContent = mapped[0]?.label ?? '—'
          top1p.textContent = fmt(mapped[0]?.prob ?? 0)
          renderTopK(top3, mapped.slice(0,3))
          lat.textContent = Math.round(performance.now() - t0)
          drawWave(result.waveform)
        }, { overlapFactor: 0.5, includeWaveform: true })
        setStatus(st, 'ready'); listening = true
        stopFn = () => model.stopListening && model.stopListening()
      } catch(e) { console.error(e); setStatus(st, 'error') }
    } else {
      // Demo with mic analyser
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        setStatus(st, 'ready'); listening = true
        const audioCtx = new (window.AudioContext||window.webkitAudioContext)()
        const src = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024
        src.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        let active = true
        const t0 = performance.now()
        function loop() {
          if (!active) return
          analyser.getByteTimeDomainData(data)
          drawOsc(data)
          const t = Date.now()/1000
          const probs = [ (Math.sin(t)+1)/3, (Math.sin(t+2)+1)/3, (Math.sin(t+4)+1)/3 ]
          const sum = probs.reduce((a,b)=>a+b,0)
          const norm = probs.map(p=>p/sum)
          const labels3 = labels.map((l,i)=>({label:l, prob:norm[i%3]})).sort((a,b)=>b.prob-a.prob)
          top1.textContent = labels3[0].label; top1p.textContent = fmt(labels3[0].prob)
          renderTopK(top3, labels3.slice(0,3))
          lat.textContent = Math.round(performance.now()-t0)
          requestAnimationFrame(loop)
        }
        loop()
        stopFn = () => {
          active = false
          for (const tr of stream.getTracks()) tr.stop()
          audioCtx.close()
          listening = false
        }
      } catch { setStatus(st, 'denied') }
    }
  }
  function stop() {
    if (stopFn) stopFn()
    listening = false
  }

  document.querySelectorAll('.aud-clip').forEach(btn => {
    btn.addEventListener('click', async () => {
      try { await new Audio(btn.dataset.clip).play() } catch(e) {}
    })
  })

  btnStart.addEventListener('click', start)
  btnStop.addEventListener('click', stop)

  load()
  return () => stop()
}
