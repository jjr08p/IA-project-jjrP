import { setStatus, renderTopK, fmt } from '../ui.js'
import { getCamera, stopStream } from '../media.js'
import { loadTMPoseModel } from '../modelLoader.js'

const CLASSES = ['sentado atento','mano levantada','escribiendo','usando celular','dormido','de pie explicando']

export function initPoses() {
  const video = document.getElementById('pose-video')
  const canvas = document.getElementById('pose-canvas')
  const overlay = document.getElementById('pose-overlay')
  const st = document.getElementById('pose-status')
  const demoBadge = document.getElementById('pose-demo')
  const fps = document.getElementById('pose-fps')
  const fpsVal = document.getElementById('pose-fps-val')
  const top1 = document.getElementById('pose-top1')
  const top1p = document.getElementById('pose-top1prob')
  const top3 = document.getElementById('pose-top3')
  const lat = document.getElementById('pose-latency')

  let model = null, labels = CLASSES, demo = false, stream = null
  let last = 0

  async function load() {
    setStatus(st, 'loading')
    try {
      const loaded = await loadTMPoseModel('/public/models/classroom_poses')
      model = loaded.model
      labels = (loaded.labels && loaded.labels.length) ? loaded.labels : CLASSES
      setStatus(st, 'ready'); demo = false; demoBadge.classList.add('hidden')
    } catch {
      setStatus(st, 'demo'); demo = true; demoBadge.classList.remove('hidden')
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

  function loop() {
    const ctx = canvas.getContext('2d')
    const octx = overlay.getContext('2d')
    const frameInterval = 1000 / Math.max(1, Number(fps.value||15))

    function drawVideo() {
      const fn = () => {
        if (video.videoWidth) {
          canvas.width = video.videoWidth; canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
        requestAnimationFrame(fn)
      }
      fn()
    }
    drawVideo()

    async function infer(ts) {
      if (ts - last < frameInterval) return requestAnimationFrame(infer)
      last = ts
      const t0 = performance.now()
      overlay.width = canvas.width; overlay.height = canvas.height
      octx.clearRect(0,0,overlay.width, overlay.height)

      if (!demo && model) {
        const { pose, posenetOutput } = await model.estimatePose(canvas)
        drawSkeleton(octx, pose)
        const result = await model.predict(posenetOutput)
        const mapped = result.map(r=>({label:r.className, prob:r.probability})).sort((a,b)=>b.prob-a.prob)
        top1.textContent = mapped[0]?.label ?? '—'
        top1p.textContent = fmt(mapped[0]?.prob ?? 0)
        renderTopK(top3, mapped.slice(0,3))
      } else {
        drawDemoStick(octx, overlay.width, overlay.height)
        const t = Date.now()/900
        const probs = [ (Math.sin(t)+1)/3, (Math.sin(t+2)+1)/3, (Math.sin(t+4)+1)/3 ]
        const sum = probs.reduce((a,b)=>a+b,0)
        const norm = probs.map(p=>p/sum)
        const labels3 = labels.map((l,i)=>({label:l, prob:norm[i%3]})).sort((a,b)=>b.prob-a.prob)
        top1.textContent = labels3[0].label; top1p.textContent = fmt(labels3[0].prob)
        renderTopK(top3, labels3.slice(0,3))
      }
      lat.textContent = Math.round(performance.now() - t0)
      requestAnimationFrame(infer)
    }
    requestAnimationFrame(infer)
  }

  fps.addEventListener('input', () => { fpsVal.textContent = fps.value })

  load(); startCam()
  return () => stopStream(stream)
}

function drawSkeleton(ctx, pose) {
  if (!pose?.keypoints) return
  ctx.lineWidth = 3
  ctx.strokeStyle = '#22d3ee'
  ctx.fillStyle = '#0ea5e9'
  for (const kp of pose.keypoints) {
    if (kp.score < 0.3) continue
    ctx.beginPath()
    ctx.arc(kp.x, kp.y, 4, 0, 2*Math.PI)
    ctx.fill()
  }
  const edges = [
    ['leftShoulder','rightShoulder'],
    ['leftShoulder','leftElbow'],['leftElbow','leftWrist'],
    ['rightShoulder','rightElbow'],['rightElbow','rightWrist'],
    ['leftShoulder','leftHip'],['rightShoulder','rightHip'],
    ['leftHip','rightHip'],
    ['leftHip','leftKnee'],['leftKnee','leftAnkle'],
    ['rightHip','rightKnee'],['rightKnee','rightAnkle'],
  ]
  const byName = Object.fromEntries(pose.keypoints.map(k=>[k.name,k]))
  for (const [a,b] of edges) {
    const pa = byName[a], pb = byName[b]
    if (!pa || !pb || pa.score<0.3 || pb.score<0.3) continue
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
    ctx.stroke()
  }
}

function drawDemoStick(ctx, w, h) {
  const t = Date.now()/600
  const cx = w*0.5 + Math.sin(t)*w*0.2
  const cy = h*0.45 + Math.cos(t)*h*0.1
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(cx, cy-40, 14, 0, 2*Math.PI); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy-26); ctx.lineTo(cx, cy+26); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy-10); ctx.lineTo(cx-25, cy+5); ctx.moveTo(cx, cy-10); ctx.lineTo(cx+25, cy+5); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy+26); ctx.lineTo(cx-18, cy+60); ctx.moveTo(cx, cy+26); ctx.lineTo(cx+18, cy+60); ctx.stroke()
}
