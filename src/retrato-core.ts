/* Núcleo do retrato em pixels: tom, máscara, relevo e pontilhado Bayer 8×8.
   Sem DOM: o mesmo código roda no navegador (retrato.ts) e no build (retrato-build.cjs, que gera o PNG sem JavaScript). */

export interface Ajuste {
  pBaixo: number // percentil que vira preto no contraste automático (0–1)
  pAlto: number // percentil que vira branco
  gama: number // curva de tom (<1 clareia meios-tons, >1 escurece)
  local: number // contraste local: mantém olhos, óculos, nariz e boca legíveis
  sombra: number // tom mínimo (0 = tinta cheia)
  luz: number // tom máximo dentro do rosto (<1: luz nunca vira papel liso)
}
// Esmaecimento em frações do quadro: inteiro dentro da elipse (rx, ry); vira papel na elipse maior (rxFim, ryFim).
// Entre as duas, a passagem é gradual, sem contorno visível.
// `borda`: faixa (fração do quadro) junto às quatro bordas em que tudo termina em papel: nenhum ponto encosta na borda.
// `cantos`: raio dos cantos arredondados dessa faixa (fração do quadro): os cantos somem mais cedo, sem desenho de retângulo.
export interface Mascara { cx: number; cy: number; rx: number; ry: number; rxFim: number; ryFim: number; borda?: number; cantos?: number }

export interface Campo {
  cols: number; rows: number
  base: Float32Array // tom final sem luz (0 = tinta, 1 = papel)
  m: Float32Array // máscara elíptica (1 = rosto, 0 = papel)
  rel: Float32Array // relevo estimado pelo brilho, x e y intercalados (-1..1)
  lado: Float32Array // posição em relação ao centro do rosto, x e y intercalados (-1..1)
  ordem: Float32Array // ordem de entrada 0..1: do centro para fora, com semente fixa
}

// Matriz de Bayer 8×8 (limiares 0..63)
export const BAYER8 = (() => {
  const m = new Uint8Array(64)
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    let v = 0, xc = x ^ y, yc = y
    for (let bit = 0; bit < 3; bit++) {
      v = (v << 2) | (((xc >> bit) & 1) << 1) | ((yc >> bit) & 1)
    }
    m[y * 8 + x] = v
  }
  return m
})()

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }

// Sorteio com semente fixa (mulberry32): a entrada é igual em toda visita
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Desfoque de caixa separável (raio r), usado só para estimar relevo e contraste local
function blur(src: Float32Array, cols: number, rows: number, r: number) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length)
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let s = 0, n = 0
    for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < cols) { s += src[y * cols + xx]; n++ } }
    tmp[y * cols + x] = s / n
  }
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let s = 0, n = 0
    for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < rows) { s += tmp[yy * cols + x]; n++ } }
    out[y * cols + x] = s / n
  }
  return out
}

const percentil = (vals: number[], p: number) => {
  const s = vals.slice().sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]
}

/* Prepara o campo uma vez por grade: lum = brilho 0–255 por célula (linha a linha). */
export function prepara(lum: Uint8Array, cols: number, rows: number, aj: Ajuste, mk: Mascara, seed = 1907): Campo {
  const N = cols * rows
  const L = new Float32Array(N), m = new Float32Array(N), dist = new Float32Array(N)
  for (let i = 0; i < N; i++) L[i] = lum[i] / 255
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const px = (x + 0.5) / cols - mk.cx, py = (y + 0.5) / rows - mk.cy
    const dIn = Math.hypot(px / mk.rx, py / mk.ry), dOut = Math.hypot(px / mk.rxFim, py / mk.ryFim), i = y * cols + x
    dist[i] = dIn
    // Na mesma direção, a distância cresce em linha reta da elipse interna até a externa: t = 0 → 1
    const t = dIn <= 1 ? 0 : dOut >= 1 ? 1 : (dIn - 1) / (dIn / dOut - 1)
    m[i] = 1 - smooth(0, 1, t)
  }
  // Contraste automático simples (corta pBaixo/pAlto nas pontas), medido na parte visível do retrato
  const dentro: number[] = []
  for (let i = 0; i < N; i++) if (m[i] > 0.6) dentro.push(L[i])
  const lo = percentil(dentro, aj.pBaixo), hi = Math.max(lo + 0.05, percentil(dentro, aj.pAlto))
  const n = new Float32Array(N)
  for (let i = 0; i < N; i++) n[i] = clamp((L[i] - lo) / (hi - lo))
  // Borda: depois de medir o contraste (o tom do rosto não muda). Distância até um retângulo de cantos arredondados:
  // no meio de cada lado a faixa é estreita; nos cantos ela começa bem antes.
  if (mk.borda) {
    const rc = mk.cantos ?? 0
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const qx = Math.abs((x + 0.5) / cols - 0.5) - (0.5 - rc), qy = Math.abs((y + 0.5) / rows - 0.5) - (0.5 - rc)
      const dentroDaBorda = -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rc)
      m[y * cols + x] *= smooth(0, mk.borda, dentroDaBorda)
    }
  }
  // Contraste local: realça traços finos (olhos, armação, narinas, lábios)
  const largo = blur(n, cols, rows, Math.max(2, Math.round(cols / 32)))
  const base = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const t = Math.pow(clamp(n[i] + aj.local * (n[i] - largo[i])), aj.gama)
    const tom = aj.sombra + t * (aj.luz - aj.sombra)
    base[i] = 1 - m[i] * (1 - tom) // fora da máscara: papel
  }
  // Relevo: o brilho suavizado vira "altura"; o gradiente vira a normal
  const h = blur(n, cols, rows, Math.max(1, Math.round(cols / 64)))
  const rel = new Float32Array(N * 2), mags: number[] = []
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x
    const gx = h[y * cols + Math.min(cols - 1, x + 1)] - h[y * cols + Math.max(0, x - 1)]
    const gy = h[Math.min(rows - 1, y + 1) * cols + x] - h[Math.max(0, y - 1) * cols + x]
    rel[i * 2] = -gx; rel[i * 2 + 1] = -gy
    if (m[i] > 0.6) mags.push(Math.abs(gx), Math.abs(gy))
  }
  const esc = Math.max(1e-3, percentil(mags, 0.95))
  for (let i = 0; i < N * 2; i++) rel[i] = clamp(rel[i] / esc, -1, 1)
  // Lado do rosto e ordem de entrada
  const lado = new Float32Array(N * 2), ordem = new Float32Array(N), r = rng(seed)
  let dmax = 0
  for (let i = 0; i < N; i++) dmax = Math.max(dmax, dist[i])
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x
    lado[i * 2] = clamp(((x + 0.5) / cols - mk.cx) / mk.rx, -1, 1)
    lado[i * 2 + 1] = clamp(((y + 0.5) / rows - mk.cy) / mk.ry, -1, 1)
    ordem[i] = dist[i] / dmax + (r() - 0.5) * 0.16
  }
  let omin = Infinity, omax = -Infinity
  for (let i = 0; i < N; i++) { omin = Math.min(omin, ordem[i]); omax = Math.max(omax, ordem[i]) }
  for (let i = 0; i < N; i++) ordem[i] = (ordem[i] - omin) / (omax - omin)
  return { cols, rows, base, m, rel, lado, ordem }
}

export const LUZ_MAX = 0.15 // ±15%: sutil, não briga com a luz lateral da própria foto

/* Pinta a grade: out[i] = 1 para tinta, 0 para papel.
   lx, ly: direção da luz (-1..1; 0,0 = de frente). contraste: 1 = cheio, menor = desbota. revela: 0..1 (entrada). */
export function pinta(c: Campo, out: Uint8Array, lx: number, ly: number, contraste = 1, revela = 1) {
  const { cols, rows, base, m, rel, lado, ordem } = c
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x
    if (ordem[i] > revela) { out[i] = 0; continue }
    let v = base[i]
    if (m[i] > 0 && (lx || ly)) {
      const face = 0.55 * (lado[i * 2] * lx + lado[i * 2 + 1] * ly) + 0.45 * (rel[i * 2] * lx + rel[i * 2 + 1] * ly)
      v += LUZ_MAX * m[i] * clamp(face, -1, 1)
    }
    v = 1 - (1 - v) * contraste
    out[i] = v * 64 < BAYER8[(y & 7) * 8 + (x & 7)] + 0.5 ? 1 : 0
  }
}
