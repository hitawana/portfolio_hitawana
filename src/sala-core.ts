/* Sala de aula em pixels: a frente da sala, em paisagem (2:1). Sem foto: a cena é gerada.
   É o fundo da composição de Agora: as duas fotos reais ficam "presas" no quadro branco, por cima dela
   (cobrindo no máximo ~60% do quadro; os rabiscos aparecem em volta). A TV fica acima das fotos.
   Sem DOM: o mesmo código roda no navegador (sala.ts) e no build (sala-build.cjs, que gera o PNG sem JavaScript).
   Só duas tintas, como o retrato da abertura: tinta e papel, com o mesmo pontilhado Bayer 8×8.
   Tons claros demais viram papel liso: nada de pontos soltos. As bordas se desfazem afinando o pontilhado.
   Sem pessoas e sem texto legível. Ruído por hash com semente fixa: a cena é igual em toda visita.
   Saída por célula: 1 = tinta, 0 = papel (transparente: o papel da página aparece). */
import { BAYER8 } from './retrato-core'

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }

function hash(x: number, y: number, s = 1907) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export interface Quadro {
  revela?: number // 0..1: entrada em passos (1 = tudo à vista)
  escrita?: number // 0..1: quanto do quadro branco já foi escrito (1 = tudo)
  slide?: number // qual slide a TV mostra (0, 1, 2…)
  vista?: { x0: number; w: number } // recorte horizontal da cena (frações); no celular: só TV, alto do quadro e mesa
}

/* Pinta a cena. Sem parâmetros: o quadro estático completo (o que aparece no carregamento e sem movimento). */
export function pintaSala(out: Uint8Array, cols: number, rows: number, q: Quadro = {}) {
  const revela = q.revela ?? 1, escrita = q.escrita ?? 1, slide = q.slide ?? 0
  const vista = q.vista ?? { x0: 0, w: 1 }
  // a cena é desenhada numa grade virtual (proporção 2:1) e o recorte da vista vai para a saída
  const H = rows, W = Math.max(cols, Math.round(cols / vista.w))
  const ox = Math.round(vista.x0 * W)
  const tom = new Float32Array(W * H)
  const X = (f: number) => Math.round(f * (W - 1)), Y = (f: number) => Math.round(f * (H - 1))
  const set = (x: number, y: number, v: number) => { if (x >= 0 && y >= 0 && x < W && y < H) tom[y * W + x] = v }
  const get = (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? tom[y * W + x] : 1)
  const rect = (ax: number, ay: number, bx: number, by: number, v: number | ((x: number, y: number) => number)) => {
    for (let y = Math.max(0, Math.round(ay)); y <= Math.min(H - 1, Math.round(by)); y++)
      for (let x = Math.max(0, Math.round(ax)); x <= Math.min(W - 1, Math.round(bx)); x++) set(x, y, typeof v === 'number' ? v : v(x, y))
  }
  const moldura = (ax: number, ay: number, bx: number, by: number, v: number) => {
    rect(ax, ay, bx, ay, v); rect(ax, by, bx, by, v); rect(ax, ay, ax, by, v); rect(bx, ay, bx, by, v)
  }
  const escurece = (ax: number, ay: number, bx: number, by: number, k: number) => rect(ax, ay, bx, by, (x, y) => get(x, y) * (1 - k))

  // ---------- parede: luz do teto (mais clara no alto); sempre mais clara que o piso ----------
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, 1 - 0.14 * (y / (H - 1)) - 0.03 * Math.abs(x / (W - 1) - 0.5))

  // ---------- faixa de azulejos (entre o quadro e a altura das mesas) ----------
  const yAz0 = Y(0.75), yPiso = Y(0.84), lado = Math.max(3, Math.round(H / 16))
  for (let y = yAz0; y < yPiso; y++) for (let x = 0; x < W; x++) {
    const rejunte = (y - yAz0) % lado === 0 || x % lado === 0
    set(x, y, rejunte ? 0 : 1)
  }
  rect(0, yPiso, W - 1, yPiso, 0) // rodapé

  // ---------- piso: ladrilhos com linhas claras em perspectiva leve (sem riscos verticais) ----------
  const vx = (W - 1) / 2
  for (let y = yPiso + 1; y < H; y++) {
    const p = (y - yPiso) / Math.max(1, H - 1 - yPiso)
    for (let x = 0; x < W; x++) set(x, y, 0.66 - 0.12 * p)
    const prof = Math.floor(Math.pow(p, 0.7) * 3), profAnt = Math.floor(Math.pow(Math.max(0, p - 1 / Math.max(1, H - 1 - yPiso)), 0.7) * 3)
    if (prof !== profAnt) for (let x = 0; x < W; x++) set(x, y, 0.88)
    for (const k of [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]) { // só linhas inclinadas (a do centro, vertical, fica de fora)
      const xl = Math.round(vx + k * (W / 10) * (0.6 + 0.4 * p))
      set(xl, y, 0.88)
    }
  }

  // ---------- quadro branco: moldura nítida e calha dos pincéis ----------
  const qx0 = X(0.07), qx1 = X(0.93), qy0 = Y(0.19), qy1 = Y(0.71)
  rect(qx0, qy0, qx1, qy1, 1)
  moldura(qx0 - 1, qy0 - 1, qx1 + 1, qy1 + 1, 0) // moldura
  rect(X(0.36), qy1 + 2, X(0.86), qy1 + 3, 0) // calha dos pincéis
  // rabiscos: lista numerada (marca curta + traço ondulado), em três colunas; as fotos cobrem o meio
  const tracos: { x: number; y: number }[] = []
  const linha = (x0: number, y: number, len: number, seed: number) => {
    for (let i = 0; i < len; i++) tracos.push({ x: x0 + i, y: y + (Math.sin((i + seed) * 0.9) > 0.55 ? -1 : 0) })
  }
  const passoL = Math.max(4, Math.round((qy1 - qy0) / 7.5))
  for (const [col, larg, n] of [[0.09, 0.14, 6], [0.4, 0.14, 6], [0.8, 0.1, 6]] as const) {
    const cx = X(col)
    for (let k = 0; k < n; k++) {
      const y = qy0 + Math.round(passoL * (1.1 + k))
      if (y >= qy1 - 2) break
      tracos.push({ x: cx, y: y - 1 }, { x: cx, y }, { x: cx + 2, y: y - 1 }, { x: cx + 2, y: y + 1 }) // número e parêntese
      linha(cx + 4, y, Math.max(3, Math.round(W * larg * (0.6 + hash(k, cx, 71) * 0.4))), k * 7 + cx)
    }
  }
  tracos.sort((a, b) => a.y - b.y || a.x - b.x)
  const visiveis = Math.round(tracos.length * clamp(escrita))
  for (let i = 0; i < visiveis; i++) set(tracos[i].x, tracos[i].y, 0)

  // ---------- TV acima do quadro, ao centro: moldura escura e um slide simples ----------
  const tx0 = X(0.415), tx1 = X(0.585), ty0 = Y(0.02), ty1 = Y(0.165)
  rect(tx0, ty0, tx1, ty1, 0) // moldura escura
  const sx0 = tx0 + 2, sx1 = tx1 - 2, sy0 = ty0 + 2, sy1 = ty1 - 2
  rect(sx0, sy0, sx1, sy1, 1)
  const s = ((slide % 3) + 3) % 3
  rect(sx0 + 1, sy0 + 1, sx0 + 1 + (s === 2 ? Math.round((sx1 - sx0) * 0.5) : sx1 - sx0 - 2), sy0 + 2, 0) // barra de título
  const blocos = s === 0 ? 2 : s === 1 ? 3 : 1
  const bw = Math.floor((sx1 - sx0 - 2 - (blocos - 1) * 2) / blocos)
  for (let b = 0; b < blocos; b++) for (let l = 0, ly = sy0 + 5; ly <= sy1 - 1 && l < 3; l++, ly += 2) {
    const bx = sx0 + 1 + b * (bw + 2), len = Math.max(2, Math.round(bw * (0.5 + hash(b + s * 5, l, 51) * 0.5)))
    rect(bx, ly, bx + len - 1, ly, 0)
  }
  rect(Math.round((tx0 + tx1) / 2) - 1, ty1 + 1, Math.round((tx0 + tx1) / 2) + 1, ty1 + 1, 0) // suporte

  // ---------- relógio redondo, perto do canto de cima ----------
  const rcx = X(0.87), rcy = Y(0.085), rr = Math.max(2.5, H * 0.055)
  for (let y = Math.floor(rcy - rr - 1); y <= Math.ceil(rcy + rr + 1); y++) for (let x = Math.floor(rcx - rr - 1); x <= Math.ceil(rcx + rr + 1); x++) {
    const d = Math.hypot(x - rcx, y - rcy)
    if (d <= rr + 0.5) set(x, y, d >= rr - 0.7 ? 0 : 1)
  }
  rect(rcx, rcy - Math.round(rr * 0.6), rcx, rcy, 0); rect(rcx, rcy, rcx + Math.round(rr * 0.45), rcy, 0) // ponteiros

  // ---------- mesa da professora (embaixo, à esquerda): tampo, painel da frente, pernas; notebook aberto e copo ----------
  const mx0 = X(0.015), mx1 = X(0.265), myT = Y(0.73), myP = Y(0.93)
  rect(mx0 + 2, myT + 2, mx0 + 2, H - 1, 0); rect(mx1 - 2, myT + 2, mx1 - 2, H - 1, 0) // pernas
  rect(mx0 + 2, myT + 2, mx1 - 2, myP, 1) // painel da frente (claro)
  moldura(mx0 + 2, myT + 2, mx1 - 2, myP, 0)
  rect(mx0 + 3, myP - 2, mx1 - 3, myP - 1, 0.7) // sombra na base do painel
  rect(mx0 - 1, myT, mx1 + 1, myT + 1, 0) // tampo
  escurece(mx0, H - 1, mx1 + 2, H - 1, 0.4) // sombra no chão
  // notebook aberto, de frente: tela (moldura escura, tela clara) e teclado (base com teclas)
  const nx0 = X(0.085), nx1 = X(0.185), nyT = Y(0.585), nyB = myT - 3
  rect(nx0, nyT, nx1, nyB, 0)
  rect(nx0 + 1, nyT + 1, nx1 - 1, nyB - 1, 0.72) // tela acesa (meio-tom)
  rect(nx0 - 2, nyB + 1, nx1 + 2, myT - 1, 0) // teclado
  for (let x = nx0; x <= nx1; x += 2) set(x, nyB + 1, 1) // teclas
  // copo
  const cx0 = X(0.035), cw = Math.max(2, Math.round(W * 0.016)), cyT = myT - Math.max(3, Math.round(H * 0.07))
  rect(cx0, cyT, cx0 + cw, myT - 1, 1); moldura(cx0, cyT, cx0 + cw, myT - 1, 0)

  // ---------- carteira (embaixo, à direita), mais perto, por isso maior: encosto da cadeira e tampo ----------
  const ex0 = X(0.72), eyT = Y(0.85)
  rect(X(0.78), Y(0.7), X(0.94), eyT - 2, (x, y) => 0.25 - 0.1 * ((y - Y(0.7)) / Math.max(1, eyT - Y(0.7)))) // encosto
  rect(X(0.78) + 1, Y(0.7) + 1, X(0.94) - 1, Y(0.7) + 1, 0.6)
  rect(X(0.8), eyT - 2, X(0.8), eyT - 1, 0); rect(X(0.92), eyT - 2, X(0.92), eyT - 1, 0) // hastes
  escurece(ex0, eyT - 1, W - 1, eyT - 1, 0.35) // sombra do tampo
  rect(ex0, eyT, W - 1, H - 1, (x, y) => 0.95 - 0.06 * ((y - eyT) / Math.max(1, H - eyT)))
  rect(ex0, eyT, W - 1, eyT + 1, 0) // borda da frente do tampo
  rect(ex0, eyT, ex0, H - 1, 0) // quina

  // ---------- recorte da vista, bordas que se desfazem no papel, entrada em passos e pontilhado ----------
  const bx = 0.035, by = 0.05
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x
    const fx = (x + 0.5) / cols, fy = (y + 0.5) / rows
    const m = smooth(0, bx, Math.min(fx, 1 - fx)) * smooth(0, by, Math.min(fy, 1 - fy))
    const ordem = 0.7 * (y / rows) + 0.3 * hash(x, y, 3)
    if (ordem > revela) { out[i] = 0; continue }
    const v = 1 - m * (1 - clamp(get(x + ox, y)))
    // tom quase papel vira papel liso: assim não sobram pontos soltos (nem na borda)
    out[i] = v < 0.93 && v * 64 < BAYER8[(y & 7) * 8 + (x & 7)] + 0.5 ? 1 : 0
  }
  // limpeza final: tinta sem nenhuma vizinha (ponto solto) vira papel
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x
    if (!out[i]) continue
    let viz = 0
    for (let dy = -1; dy <= 1 && !viz; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const xx = x + dx, yy = y + dy
      if (xx >= 0 && yy >= 0 && xx < cols && yy < rows && out[yy * cols + xx]) { viz = 1; break }
    }
    if (!viz) out[i] = 0
  }
}
