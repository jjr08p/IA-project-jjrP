export function setActiveMode(mode) {
  for (const p of document.querySelectorAll('.panel')) p.classList.add('hidden')
  document.getElementById(`panel-${mode}`).classList.remove('hidden')
  for (const b of document.querySelectorAll('.mode-btn')) {
    const active = b.dataset.mode === mode
    b.className = 'mode-btn px-3 py-1.5 rounded-full text-sm border ' + (active
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700')
  }
  document.body.dataset.mode = mode
}

export function toggleAbout() {
  const sec = document.getElementById('about')
  sec.classList.toggle('hidden')
}

export function toggleTheme() {
  const html = document.documentElement
  const dark = !html.classList.contains('dark')
  html.classList.toggle('dark', dark)
  const btn = document.getElementById('themeBtn')
  btn.textContent = dark ? '☀️ Claro' : '🌙 Oscuro'
}

export function setStatus(el, status) {
  const map = {
    loading: 'Cargando…',
    ready: 'OK',
    denied: 'Permisos denegados',
    error: 'Error',
    idle: 'En espera',
    demo: 'Modo demo'
  }
  el.textContent = map[status] || status
  el.className = 'text-xs px-2 py-1 rounded border ' + ({
    loading: 'bg-amber-100 text-amber-900 border-amber-300',
    ready:   'bg-emerald-100 text-emerald-900 border-emerald-300',
    denied:  'bg-rose-100 text-rose-900 border-rose-300',
    error:   'bg-rose-100 text-rose-900 border-rose-300',
    idle:    'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
  }[status] || 'bg-slate-100 text-slate-900 border-slate-300')
}

export function renderTopK(container, top3) {
  container.innerHTML = ''
  for (const {label, prob} of top3 || []) {
    const outer = document.createElement('div')
    const head = document.createElement('div')
    head.className = 'flex justify-between text-sm'
    head.innerHTML = `<span class="opacity-80">${label}</span><span class="opacity-60">${fmt(prob)}</span>`
    const bar = document.createElement('div')
    bar.className = 'h-2 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden'
    const fill = document.createElement('div')
    fill.className = 'h-full bg-slate-900 dark:bg-white'
    fill.style.width = Math.round(prob*100) + '%'
    bar.appendChild(fill)
    outer.appendChild(head)
    outer.appendChild(bar)
    container.appendChild(outer)
  }
}

export function fmt(p) {
  if (typeof p !== 'number') return ''
  return (p*100).toFixed(1) + '%'
}
