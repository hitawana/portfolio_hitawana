/* Sala de aula em pixels: Canvas 2D + TypeScript puro (sem WebGL, sem bibliotecas).
   - Células de 4 px; tinta e papel, com o mesmo pontilhado Bayer do retrato da abertura.
   - Robustez: o quadro estático completo é desenhado na hora, no carregamento. O movimento só acrescenta.
   - Um momento só: na primeira vez que a cena entra na tela, ela aparece em 6 passos e, em seguida,
     o quadro branco se escreve uma vez (da esquerda para a direita, de cima para baixo).
     Depois, o slide da TV troca devagar, a cada poucos segundos.
   - Até 24 quadros por segundo; pausa fora da tela e com a aba oculta.
   - Reduzir movimento: a cena pronta, estática.
   O desenho em si fica em sala-core.ts (o build usa o mesmo código para gerar o PNG sem JavaScript). */
import { pintaSala } from './sala-core'

const CELULA = 4
const QUADRO_MS = 1000 / 24
const PASSOS = 6, ENTRADA_MS = 600, ESCRITA_MS = 1800, SLIDE_MS = 5000
const DPR_MAX = 1.75

export function iniciaSala(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('sem canvas 2d')
  const caixa = canvas.parentElement as HTMLElement
  const reduz = matchMedia('(prefers-reduced-motion: reduce)')
  const css = getComputedStyle(document.documentElement)
  const h = css.getPropertyValue('--ink').trim().replace('#', '')
  const ink = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))

  let cols = 0, rows = 0, cells = new Uint8Array(0), img: ImageData | null = null
  const off = document.createElement('canvas'), octx = off.getContext('2d')!
  let visivel = false, abaVisivel = !document.hidden, jaEntrou = false
  let fase: 'parada' | 'entrada' | 'escrita' = 'parada', inicio = 0
  let revela = 1, escrita = 1, slide = 0, raf = 0, ultimo = 0, timer = 0

  function dimensiona() {
    const r = caixa.getBoundingClientRect()
    const c = Math.max(20, Math.floor(r.width / CELULA)), l = Math.max(25, Math.floor(r.height / CELULA))
    if (c === cols && l === rows) return false
    cols = c; rows = l
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
    canvas.style.width = `${cols * CELULA}px`; canvas.style.height = `${rows * CELULA}px`
    canvas.width = Math.round(cols * CELULA * dpr); canvas.height = Math.round(rows * CELULA * dpr)
    cells = new Uint8Array(cols * rows)
    off.width = cols; off.height = rows
    img = octx.createImageData(cols, rows)
    return true
  }

  function desenha() {
    if (!img) return
    const vista = cols / rows < 1.6 ? { x0: 0, w: 0.66 } : undefined // faixa do celular: TV, alto do quadro e mesa
    pintaSala(cells, cols, rows, { revela, escrita, slide, vista })
    const d = img.data
    for (let i = 0; i < cells.length; i++) {
      const o = i * 4
      if (cells[i]) { d[o] = ink[0]; d[o + 1] = ink[1]; d[o + 2] = ink[2]; d[o + 3] = 255 } else d[o + 3] = 0
    }
    octx.putImageData(img, 0, 0)
    ctx!.clearRect(0, 0, canvas.width, canvas.height)
    ctx!.imageSmoothingEnabled = false
    ctx!.drawImage(off, 0, 0, canvas.width, canvas.height)
    caixa.dataset.pronto = ''
  }

  const estatico = () => reduz.matches
  const ativo = () => visivel && abaVisivel && !estatico()

  // Slides: trocam devagar, só enquanto a cena está na tela (um redesenho por troca)
  function agendaSlide() {
    clearTimeout(timer)
    if (!ativo() || fase !== 'parada' || !jaEntrou) return
    timer = window.setTimeout(() => { slide++; desenha(); agendaSlide() }, SLIDE_MS)
  }

  function quadro(now: number) {
    raf = 0
    if (!ativo() || fase === 'parada') return
    if (now - ultimo >= QUADRO_MS) {
      ultimo = now
      const dt = now - inicio
      if (fase === 'entrada') {
        const passo = Math.min(PASSOS, Math.floor(dt / (ENTRADA_MS / PASSOS)) + 1)
        revela = passo / PASSOS; escrita = 0
        if (passo >= PASSOS) { fase = 'escrita'; inicio = now }
      } else {
        escrita = Math.min(1, dt / ESCRITA_MS)
        if (escrita >= 1) fase = 'parada'
      }
      desenha()
      if (fase === 'parada') { agendaSlide(); return }
    }
    raf = requestAnimationFrame(quadro)
  }
  const acorda = () => { if (!raf && ativo() && fase !== 'parada') raf = requestAnimationFrame(quadro); agendaSlide() }

  const io = new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting
    if (visivel && !jaEntrou) {
      jaEntrou = true
      if (!estatico()) { fase = 'entrada'; inicio = performance.now(); revela = 0; escrita = 0 }
    }
    if (!visivel) clearTimeout(timer)
    acorda()
  })
  const onVis = () => { abaVisivel = !document.hidden; if (!abaVisivel) clearTimeout(timer); acorda() }
  const ro = new ResizeObserver(() => { if (dimensiona()) desenha() })
  const onReduz = () => {
    if (estatico()) { fase = 'parada'; revela = 1; escrita = 1; cancelAnimationFrame(raf); raf = 0; clearTimeout(timer); desenha() } else acorda()
  }

  // Quadro estático completo já no carregamento: a cena nunca aparece vazia
  dimensiona(); desenha()
  io.observe(caixa); ro.observe(caixa)
  document.addEventListener('visibilitychange', onVis)
  reduz.addEventListener('change', onReduz)
  return () => {
    cancelAnimationFrame(raf); clearTimeout(timer); io.disconnect(); ro.disconnect()
    document.removeEventListener('visibilitychange', onVis)
    reduz.removeEventListener('change', onReduz)
  }
}
