/* Cursor de lápis.
   Comportamento portado do cursor-abelha do Nettie's Bees:
   - ponto que segue o mouse na hora;
   - lápis que segue com atraso (interpolação por quadro) e gira na direção do movimento;
   - pousa ao lado de links e botões; se afasta de campos de texto;
   - rastro que some em 1s; troca de cor sobre fundo escuro; "descansa" após 5s parado.
   Só liga com mouse (pointer: fine) e com "reduzir movimento" desligado.
   Sem JavaScript, a classe .pencil-on nunca entra e o cursor nativo continua. */

const INTERACTIVE = 'a,button,summary,select,label[for],[data-cursor]'
const TEXT = 'input:not([type=submit],[type=button],[type=checkbox],[type=radio],[type=range]),textarea'
const STORE = 'hitawana-pencil'

type Mode = 'fly' | 'perch' | 'text'

export function canUsePencil() {
  return matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function readPencilPref(): boolean {
  try {
    const v = localStorage.getItem(STORE)
    return v === null ? true : v === '1'
  } catch {
    return true
  }
}

export function savePencilPref(on: boolean) {
  try {
    localStorage.setItem(STORE, on ? '1' : '0')
  } catch {
    /* sem armazenamento */
  }
}

export function startPencil(): () => void {
  const root = document.documentElement

  const canvas = document.createElement('canvas')
  canvas.id = 'pencil-trail'
  canvas.setAttribute('aria-hidden', 'true')
  const dot = document.createElement('div')
  dot.id = 'pencil-dot'
  dot.setAttribute('aria-hidden', 'true')
  dot.innerHTML = '<span class="pt"></span><span class="ring"></span><span class="lbl"></span>'
  const pencil = document.createElement('div')
  pencil.id = 'pencil-cursor'
  pencil.setAttribute('aria-hidden', 'true')
  pencil.innerHTML =
    '<svg viewBox="0 0 30 30"><path class="body" d="M15 1.5L11 10v16.5a1.5 1.5 0 0 0 1.5 1.5h5a1.5 1.5 0 0 0 1.5-1.5V10z"/>' +
    '<path class="lead" d="M15 1.5l-1.7 3.7h3.4z"/><path class="detail" d="M11 10h8M11 23h8M15 10v13"/></svg>'
  document.body.append(canvas, dot, pencil)

  const ctx = canvas.getContext('2d')!
  const lbl = dot.querySelector('.lbl') as HTMLElement
  const css = getComputedStyle(root)
  const ink = css.getPropertyValue('--ink').trim()
  const paper = css.getPropertyValue('--on-inverse').trim()

  let W = 0, H = 0
  const resize = () => {
    const r = Math.min(devicePixelRatio || 1, 2)
    W = innerWidth
    H = innerHeight
    canvas.width = W * r
    canvas.height = H * r
    ctx.setTransform(r, 0, 0, r, 0, 0)
  }
  resize()

  // Estado (mesmos nomes de papel da referência)
  let px = -200, py = -200 // ponteiro
  let cx = -200, cy = -200 // lápis
  let angle = 0
  let mode: Mode = 'fly'
  let lastMove = performance.now()
  let lastCheck = 0
  let resting = false
  let trailColor = ink
  let trail: { x: number; y: number; t: number }[] = []
  let lastTrailX = -1, lastTrailY = -1
  let raf = 0

  // Leitura de contraste: texto claro embaixo = fundo escuro
  const lum = new Map<string, boolean>()
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  const isLight = (color: string) => {
    if (!lum.has(color)) {
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = color
      probe.fillRect(0, 0, 1, 1)
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
      lum.set(color, r * 0.299 + g * 0.587 + b * 0.114 > 150)
    }
    return lum.get(color)!
  }
  const onDarkAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)
    return !!el && isLight(getComputedStyle(el).color)
  }

  const shortest = (from: number, to: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from))

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    px = e.clientX
    py = e.clientY
    lastMove = e.timeStamp
  }
  const onOver = (e: PointerEvent) => {
    const t = e.target as Element
    if (t.closest(TEXT)) mode = 'text'
    else {
      const hit = t.closest(INTERACTIVE) as HTMLElement | null
      mode = hit ? 'perch' : 'fly'
      const text = hit?.dataset.cursor ?? ''
      lbl.textContent = text
      dot.classList.toggle('label', !!text)
    }
    dot.classList.toggle('hover', mode === 'perch')
    dot.classList.toggle('text', mode === 'text')
    pencil.classList.toggle('perched', mode === 'perch')
  }
  const onDown = () => dot.classList.add('press')
  const onUp = () => dot.classList.remove('press')
  const onLeave = () => { dot.style.opacity = '0'; pencil.style.opacity = '0' }
  const onEnter = () => { dot.style.opacity = ''; pencil.style.opacity = '' }

  function frame(t: number) {
    if (t - lastCheck > 120) {
      lastCheck = t
      const dark = onDarkAt(px, py)
      dot.classList.toggle('on-dark', dark)
      pencil.classList.toggle('on-dark', onDarkAt(cx, cy))
      trailColor = dark ? paper : ink
    }

    dot.style.transform = `translate(${px}px,${py}px)`

    const rest = t - lastMove > 5000 && mode !== 'text'
    if (rest !== resting) { resting = rest; pencil.classList.toggle('rest', rest) }

    const hasLabel = dot.classList.contains('label')
    // [alvo x, alvo y, fração por quadro] — valores da referência
    const [tx, ty, k] =
      mode === 'perch' ? [px + (hasLabel ? 30 : 24), py - (hasLabel ? 34 : 28), 0.2]
      : mode === 'text' ? [px + 46, py - 40, 0.08]
      : [px + 18, py + 16, 0.13]

    const ox = cx, oy = cy
    cx += (tx - cx) * k
    cy += (ty - cy) * k
    const dx = cx - ox, dy = cy - oy
    const speed = Math.hypot(dx, dy)

    if (resting) angle += (shortest(angle, 0.3) - angle) * 0.06
    else if (mode === 'perch') angle += (shortest(angle, 0) - angle) * 0.15
    else if (speed > 0.5) angle += (shortest(angle, Math.atan2(dx, -dy)) - angle) * 0.2

    const s = Math.sin(angle), c = Math.cos(angle)
    const wobble = mode === 'fly' && !resting ? Math.sin(t / 70) * Math.min(speed, 5) * 0.35 : 0
    const gx = cx + c * wobble, gy = cy + s * wobble
    pencil.style.transform = `translate(${gx - 15}px,${gy - 15}px) rotate(${angle}rad)`

    // Rastro de grafite: sai da ponta do lápis
    if (mode === 'fly' && speed > 1.5 && Math.hypot(cx - lastTrailX, cy - lastTrailY) > 9) {
      trail.push({ x: gx + s * 13.5, y: gy - c * 13.5, t })
      lastTrailX = cx
      lastTrailY = cy
    }
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = trailColor
    trail = trail.filter((p) => t - p.t < 1000)
    for (const p of trail) {
      const life = 1 - (t - p.t) / 1000
      ctx.globalAlpha = life * 0.7
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1 + life * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    raf = requestAnimationFrame(frame)
  }

  addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerover', onOver)
  addEventListener('pointerdown', onDown)
  addEventListener('pointerup', onUp)
  addEventListener('resize', resize)
  root.addEventListener('mouseleave', onLeave)
  root.addEventListener('mouseenter', onEnter)

  root.classList.add('pencil-on')
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerover', onOver)
    removeEventListener('pointerdown', onDown)
    removeEventListener('pointerup', onUp)
    removeEventListener('resize', resize)
    root.removeEventListener('mouseleave', onLeave)
    root.removeEventListener('mouseenter', onEnter)
    root.classList.remove('pencil-on')
    canvas.remove()
    dot.remove()
    pencil.remove()
  }
}
