/* Retrato em pixels: Canvas 2D + CSS + JavaScript puro (sem WebGL, sem bibliotecas).
   - Entrada: células do centro para fora em 6 passos visíveis (~600 ms), ordem com semente fixa.
   - Luz segue o ponteiro com atraso (6% da distância por quadro) e clareia o lado do rosto voltado para ele (±15%).
   - Inclinação de até 6° com perspectiva CSS (variáveis --rx/--ry no palco).
   - Ao rolar para fora da abertura, o contraste desbota.
   - Toque: sem perseguir o dedo; a luz balança devagar com a rolagem.
   - Reduzir movimento: um quadro estático, luz de frente, sem inclinação e sem entrada.
   - Desempenho: até 30 quadros/s; para fora da tela, com a aba oculta e quando a luz para; densidade ≤ 1,75. */
import { prepara, pinta, type Campo } from './retrato-core'
import { retratoDados } from './retrato-dados'
import type { Retrato } from './content'

const QUADRO_MS = 1000 / 30
const ATRASO = 0.06
const INCLINA_MAX = 6
const PASSOS = 6, ENTRADA_MS = 600
const DPR_MAX = 1.75
const CELULA = 3

const decod = (b64: string) => { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a }

export function iniciaRetrato(palco: HTMLElement, canvas: HTMLCanvasElement, hero: HTMLElement, cfg: Retrato): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('sem canvas 2d')
  const reduz = matchMedia('(prefers-reduced-motion: reduce)')
  const toque = matchMedia('(hover: none), (pointer: coarse)')
  const celular = matchMedia('(max-width: 639px)')
  const css = getComputedStyle(document.documentElement)
  const hex = (n: string) => { const h = css.getPropertyValue(n).trim().replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) }
  const ink = hex('--ink')

  let campo: Campo, bits: Uint8Array, img: ImageData
  const off = document.createElement('canvas'), octx = off.getContext('2d')!

  // Grade: ~160 colunas no computador, ~110 no celular
  function montaGrade() {
    const g = celular.matches ? retratoDados.g110 : retratoDados.g160
    campo = prepara(decod(g.lum), g.cols, g.rows, cfg.ajuste, cfg.mascara)
    bits = new Uint8Array(g.cols * g.rows)
    off.width = g.cols; off.height = g.rows
    img = octx.createImageData(g.cols, g.rows)
    palco.style.setProperty('--cols', String(g.cols))
    palco.style.setProperty('--rows', String(g.rows))
    dimensiona()
  }
  function dimensiona() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
    const w = canvas.clientWidth || campo.cols * CELULA
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round((w * campo.rows / campo.cols) * dpr)
  }

  // Estado
  let lx = 0, ly = 0, alvoX = 0, alvoY = 0 // luz atual e alvo (-1..1)
  let contraste = 1, alvoContraste = 1
  let inicio = -1, revela = 1, entrando = false
  let visivel = true, abaVisivel = !document.hidden
  let raf = 0, ultimo = 0, sujo = false

  function desenha() {
    pinta(campo, bits, lx, ly, contraste, revela)
    const d = img.data
    for (let i = 0, n = bits.length; i < n; i++) {
      // Tinta opaca; papel transparente (o fundo da página, que já é o papel, aparece)
      const o = i * 4
      d[o] = ink[0]; d[o + 1] = ink[1]; d[o + 2] = ink[2]; d[o + 3] = bits[i] ? 255 : 0
    }
    octx.putImageData(img, 0, 0)
    ctx!.clearRect(0, 0, canvas.width, canvas.height)
    ctx!.imageSmoothingEnabled = false
    ctx!.drawImage(off, 0, 0, canvas.width, canvas.height)
    palco.dataset.pronto = ''
  }

  const estatico = () => reduz.matches

  function quadro(t: number) {
    raf = 0
    if (!visivel || !abaVisivel) return
    if (t - ultimo < QUADRO_MS) { raf = requestAnimationFrame(quadro); return }
    ultimo = t
    let mudou = sujo
    sujo = false
    if (entrando) {
      const passo = Math.min(PASSOS, Math.floor((t - inicio) / (ENTRADA_MS / PASSOS)) + 1)
      const nova = passo / PASSOS
      if (nova !== revela) { revela = nova; mudou = true }
      if (passo >= PASSOS) entrando = false
    }
    if (!estatico()) {
      const dx = (alvoX - lx) * ATRASO, dy = (alvoY - ly) * ATRASO, dc = (alvoContraste - contraste) * 0.2
      if (Math.abs(alvoX - lx) > 0.01 || Math.abs(alvoY - ly) > 0.01) { lx += dx; ly += dy; mudou = true } else if (lx !== alvoX || ly !== alvoY) { lx = alvoX; ly = alvoY; mudou = true }
      if (Math.abs(alvoContraste - contraste) > 0.003) { contraste += dc; mudou = true } else if (contraste !== alvoContraste) { contraste = alvoContraste; mudou = true }
      // Inclinação: só com ponteiro fino; o retrato "olha" para o ponteiro
      const inclina = toque.matches ? 0 : INCLINA_MAX
      palco.style.setProperty('--ry', `${(lx * inclina).toFixed(2)}deg`)
      palco.style.setProperty('--rx', `${(-ly * inclina).toFixed(2)}deg`)
    }
    if (mudou) desenha()
    // Continua só enquanto algo se move; parado, não redesenha
    const movendo = entrando || Math.abs(alvoX - lx) > 0 || Math.abs(alvoY - ly) > 0 || contraste !== alvoContraste
    if (movendo) raf = requestAnimationFrame(quadro)
  }
  const acorda = () => { if (!raf && visivel && abaVisivel) raf = requestAnimationFrame(quadro) }

  // Ponteiro (mouse/caneta): a luz vem do lado do ponteiro
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || toque.matches || estatico()) return
    const r = palco.getBoundingClientRect()
    alvoX = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)))
    alvoY = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 0.9)))
    acorda()
  }
  // Ponteiro saiu da janela (relatedTarget nulo): a luz volta para a frente
  const onLeave = (e: PointerEvent) => { if (e.relatedTarget || estatico()) return; alvoX = 0; alvoY = 0; acorda() }

  // Rolagem: contraste desbota quando a abertura sai; no toque, a luz balança devagar
  const onScroll = () => {
    if (estatico()) return
    const r = hero.getBoundingClientRect()
    const saida = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)))
    alvoContraste = 1 - 0.45 * saida
    if (toque.matches) { alvoX = 0.6 * Math.sin(window.scrollY / 260); alvoY = -0.25 }
    acorda()
  }

  const io = new IntersectionObserver(([e]) => { const antes = visivel; visivel = e.isIntersecting; if (visivel && !antes) { sujo = true; acorda() } })
  io.observe(hero)
  const onVis = () => { abaVisivel = !document.hidden; if (abaVisivel) acorda() }
  const onResize = () => { dimensiona(); sujo = true; acorda() }
  const onBreak = () => { montaGrade(); sujo = true; acorda() }
  const onReduz = () => {
    if (estatico()) { entrando = false; revela = 1; lx = ly = alvoX = alvoY = 0; contraste = alvoContraste = 1; palco.style.setProperty('--rx', '0deg'); palco.style.setProperty('--ry', '0deg') }
    sujo = true; acorda()
  }

  montaGrade()
  if (estatico()) { revela = 1; desenha() } else { entrando = true; revela = 0; inicio = performance.now(); onScroll(); if (toque.matches) { lx = alvoX; ly = alvoY } acorda() }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerout', onLeave)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVis)
  celular.addEventListener('change', onBreak)
  reduz.addEventListener('change', onReduz)
  return () => {
    cancelAnimationFrame(raf); io.disconnect()
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerout', onLeave)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVis)
    celular.removeEventListener('change', onBreak)
    reduz.removeEventListener('change', onReduz)
  }
}
