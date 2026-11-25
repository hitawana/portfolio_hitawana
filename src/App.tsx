import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from 'react'
import {
  hero, gallery, tcc, compact, agora, app, curriculo, retratos, retratoAtivo,
  stack, stackYear, stackPeriods, stackAll, teaching, contact, heroFacts, type Media, type StackRow, type StackMark,
} from './content'
import { canUsePencil, readPencilPref, savePencilPref, startPencil } from './cursor'
import { iniciaRetrato } from './retrato'
import { iniciaSala } from './sala'

/* Foto inteira, na proporção original: largura e altura reais declaradas (nada pula ao carregar).
   Carrega já (loading="eager"): as fotos ficam logo na primeira rolagem e não podem depender do lazy loading. */
function Photo({ media }: { media: Media }) {
  return (
    <img src={media.src} alt={media.alt} width={media.width} height={media.height} decoding="async" loading="eager" />
  )
}

/* Camadas internas do botão (decorativas): o corpo de dentro (no secundário, deixa 1 px de contorno de tinta) e
   os 8 pontos de tinta que saltam para fora no hover. O canto dobrado e a aba ficam nos pseudo-elementos. */
const BtnFx = () => {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const campo = ref.current, btn = campo?.parentElement
    if (!campo || !btn) return
    let feito = ''
    const gera = () => {
      const w = Math.round(btn.offsetWidth), h = Math.round(btn.offsetHeight)
      const chave = w + 'x' + h
      if (!w || !h || chave === feito) return
      feito = chave
      campo.replaceChildren(...campoDePixels(w, h, btn.classList.contains('btn--primary') ? 15 : 12, semente(btn.className + '|' + btn.textContent)))
    }
    gera()
    const ro = new ResizeObserver(gera)
    ro.observe(btn)
    return () => ro.disconnect()
  }, [])
  return (
    <>
      <span className="btn__corpo" aria-hidden="true" />
      <span className="btn__pontos" aria-hidden="true" ref={ref} />
    </>
  )
}

/* Pixels que se soltam do botão no hover, como a borda que se desfaz no retrato. Gerados uma vez por tamanho de
   botão, com semente fixa por botão (o desenho é sempre o mesmo). Cerca de 1 pixel a cada 16 px de perímetro; 70% de
   2 px e 30% de 3 px, em posições inteiras. Todos começam exatamente na borda de fora; ~45% em volta do canto dobrado
   (fim da borda de cima, os degraus e o começo da borda direita), o resto pelas quatro bordas. Cada um sai reto da
   sua borda, 2 a 14 px (a maioria 2 a 6), com até 2 px de desvio de lado. Duração 420 ms + 16 ms por px; atraso de
   14 ms por px: os de perto saem primeiro. */
function semente(texto: string) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function campoDePixels(w: number, h: number, dobra: number, seed: number) {
  let a = seed || 1
  const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  type Seg = { x0: number; y0: number; x1: number; y1: number; nx: number; ny: number; degrau?: boolean }
  // contorno do corpo, no sentido horário, com a normal para fora
  const todos: Seg[] = [{ x0: 0, y0: 0, x1: w - dobra, y1: 0, nx: 0, ny: -1 }]
  for (let k = 0; k < dobra / 3; k++) {
    const x = w - dobra + 3 * k
    todos.push({ x0: x, y0: 3 * k, x1: x, y1: 3 * k + 3, nx: 1, ny: 0, degrau: true }) // espelho do degrau
    todos.push({ x0: x, y0: 3 * k + 3, x1: x + 3, y1: 3 * k + 3, nx: 0, ny: -1, degrau: true }) // piso do degrau
  }
  todos.push({ x0: w, y0: dobra, x1: w, y1: h, nx: 1, ny: 0 }, { x0: w, y0: h, x1: 0, y1: h, nx: 0, ny: 1 }, { x0: 0, y0: h, x1: 0, y1: 0, nx: -1, ny: 0 })
  const canto: Seg[] = [
    { x0: Math.max(0, w - dobra - 24), y0: 0, x1: w - dobra, y1: 0, nx: 0, ny: -1 },
    ...todos.filter((s) => s.degrau),
    { x0: w, y0: dobra, x1: w, y1: Math.min(h, dobra + 24), nx: 1, ny: 0 },
  ]
  const comp = (s: Seg) => Math.abs(s.x1 - s.x0) + Math.abs(s.y1 - s.y0)
  const escolhe = (lista: Seg[]) => { const tot = lista.reduce((t, s) => t + comp(s), 0); let r = rnd() * tot; for (const s of lista) { r -= comp(s); if (r <= 0) return s } return lista[lista.length - 1] }
  const n = Math.round((2 * (w + h)) / 16)
  const pixels: HTMLElement[] = []
  for (let i = 0; i < n; i++) {
    const seg = escolhe(rnd() < 0.45 ? canto : todos)
    const tam = rnd() < 0.7 ? 2 : 3
    const t = rnd()
    // ponto na borda (posição inteira); nos degraus, encaixado no começo do degrau de 3 px
    let px = seg.degrau ? Math.min(seg.x0, seg.x1) : Math.round(seg.x0 + (seg.x1 - seg.x0) * t)
    let py = seg.degrau ? Math.min(seg.y0, seg.y1) : Math.round(seg.y0 + (seg.y1 - seg.y0) * t)
    if (seg.ny !== 0) px = Math.min(Math.max(px - Math.floor(tam / 2), Math.min(seg.x0, seg.x1)), Math.max(seg.x0, seg.x1) - tam)
    if (seg.nx !== 0) py = Math.min(Math.max(py - Math.floor(tam / 2), Math.min(seg.y0, seg.y1)), Math.max(seg.y0, seg.y1) - tam)
    const left = seg.nx === -1 ? px - tam : px, top = seg.ny === -1 ? py - tam : py
    // distância: a maioria curta (2–6 px), poucas longas (até 14 px)
    const d = 2 + Math.round(12 * Math.pow(rnd(), 2.6))
    const lado = seg.degrau ? 0 : Math.round((rnd() * 2 - 1) * 2)
    const dx = seg.nx * d + (seg.nx === 0 ? lado : 0), dy = seg.ny * d + (seg.ny === 0 ? lado : 0)
    const el = document.createElement('i')
    el.style.cssText = `left:${left}px;top:${top}px;width:${tam}px;height:${tam}px;--x:${dx}px;--y:${dy}px;--dur:${420 + 16 * d}ms;--del:${14 * d}ms`
    pixels.push(el)
  }
  return pixels
}

const Download = () => (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10M5.5 8.5 10 13l4.5-4.5M4 16.5h12" /></svg>
)


/* A assinatura de movimento: traço de lápis sob a ênfase. Só em dois títulos (abertura e stack).
   Desenha uma vez quando o título entra na tela; com "reduzir movimento" já aparece pronto. */
function Em({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { el.classList.add('is-in'); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <span className="em scribble-host" ref={ref}>
      {children}
      <svg className="scribble" viewBox="0 0 240 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M3 9c34-5 70-6 106-3s76 4 128-2" pathLength={1} />
      </svg>
    </span>
  )
}

/* ---------- Cabeçalho de jornal ---------- */
function Masthead() {
  return (
    <header className="wrap mast" id="masthead">
      <div className="mast__dateline">
        <span className="mast__item">Maranhão, Brasil</span>
        <span className="mast__item">Portfólio de 2026</span>
      </div>
      <h1 className="mast__name">Hitawana</h1>
      <p className="mast__line">O registro de trabalho de uma desenvolvedora.</p>
    </header>
  )
}

function Nav() {
  const [showBrand, setShowBrand] = useState(false)
  useEffect(() => {
    const mast = document.getElementById('masthead')
    if (!mast || !('IntersectionObserver' in window)) { setShowBrand(true); return }
    const io = new IntersectionObserver(([en]) => setShowBrand(!en.isIntersecting), { threshold: 0 })
    io.observe(mast)
    return () => io.disconnect()
  }, [])
  return (
    <nav className="nav" aria-label="Principal">
      <div className="wrap nav__in">
        <a className={`nav__brand${showBrand ? ' is-shown' : ''}`} href="#conteudo" tabIndex={showBrand ? 0 : -1} aria-hidden={!showBrand}>Hitawana</a>
        <ul className="nav__links">
          <li><a className="link link--quiet" href="#projetos">Projetos</a></li>
          <li><a className="link link--quiet" href={curriculo.href} download={curriculo.arquivo} aria-label={curriculo.nome}>Currículo</a></li>
          <li><a className="link link--quiet" href="#stack">Stack</a></li>
          <li><a className="link link--quiet" href="#contato">Contato</a></li>
        </ul>
      </div>
    </nav>
  )
}

/* ---------- Abertura: área 1 (texto) + área 2 (fotos) ---------- */
/* Retrato em pixels: o canvas desenha o pontilhado a partir do brilho da foto (a foto nunca aparece).
   Começa só depois que o texto da abertura já está na tela. Se o canvas falhar, mostra o PNG gerado no build. */
function Retrato({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const cfg = retratos[retratoAtivo]
  const palco = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => {
    let parar = () => {}, cancelado = false
    const comeca = () => {
      if (cancelado || !palco.current || !canvas.current || !heroRef.current) return
      try { parar = iniciaRetrato(palco.current, canvas.current, heroRef.current, cfg) } catch { setFalhou(true) }
    }
    const fontes = document.fonts ? document.fonts.ready : Promise.resolve()
    let r2 = 0
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => { Promise.race([fontes, new Promise((r) => setTimeout(r, 600))]).then(comeca) })
    })
    return () => { cancelado = true; cancelAnimationFrame(r1); cancelAnimationFrame(r2); parar() }
  }, [cfg, heroRef])

  return (
    <figure className="retrato" aria-label="Retrato de Hitawana em pixels">
      <div className="retrato__cena">
        <div className="retrato__palco" ref={palco}>
          <canvas className="retrato__canvas" ref={canvas} aria-hidden="true" />
          {falhou && <img className="retrato__png" src="imagens/web/retrato-pb.png" alt="" width={480} height={600} />}
        </div>
      </div>
    </figure>
  )
}

function Hero() {
  const ref = useRef<HTMLElement>(null)
  return (
    <section className="wrap hero" aria-labelledby="titulo-abertura" ref={ref}>
      <div className="hero__grid">
        <div className="hero__text">
          <h2 className="hero__title" id="titulo-abertura">
            Aprendi a ouvir problemas.<br className="hero__quebra" /> Hoje eu os transformo em <Em>sistema.</Em>
          </h2>
          <p className="hero__lead">{hero.lead}</p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#projetos"><BtnFx />Ver projetos</a>
            <a className="btn btn--secondary" href={curriculo.href} download={curriculo.arquivo} aria-label={curriculo.nome}><BtnFx />Baixar currículo <Download /></a>
          </div>
          <dl className="facts">
            {heroFacts.map((f) => (
              <div className="fact" key={f.value}><dt>{f.text}</dt><dd>{f.value}</dd></div>
            ))}
          </dl>
        </div>
        <div className="hero__visual">
          <Retrato heroRef={ref} />
        </div>
      </div>
    </section>
  )
}

/* ---------- Meus projetos: o TCC em destaque (mosaico) e, logo abaixo, a lista dos outros projetos ----------
   Sem fios verticais: a separação vem do espaço e do estilo de título. */

/* Destaque do TCC: um bloco só, em duas colunas.
   Esquerda: a formatura, na altura toda do bloco. Direita: em cima, defesa e CONCISTEC lado a lado com a mesma
   altura (colunas na razão 1 : 1,78, as duas inteiras); embaixo, o texto: título, subtítulo, descrição e, numa linha,
   os dois fatos e o botão à direita.
   As duas colunas terminam na mesma linha: a largura da coluna da formatura (--l, em % do bloco) é calculada para que a altura
   dela seja igual à das fotos de cima + o texto (busca binária, refeita quando a largura do bloco muda).
   A partir de 1024 (64rem) o que conta é o pé da foto da formatura (sem a legenda) alinhado com o pé do cartão.
   Abaixo de 768 (48rem): a capa do CONCISTEC na largura toda; embaixo, defesa e formatura lado a lado, mesma altura.
   Ordem do DOM = ordem cronológica (defesa, formatura, CONCISTEC). */
function useColunasIguais(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const mq = matchMedia('(min-width: 48rem)')
    const mqLargo = matchMedia('(min-width: 64rem)')
    const q = (s: string) => el.querySelector(s) as HTMLElement
    const form = q('.destaque__foto--formatura .destaque__fig')
    const formImg = q('.destaque__foto--formatura img') as HTMLImageElement
    const topo = [q('.destaque__foto--defesa .destaque__fig'), q('.destaque__foto--concistec .destaque__fig')]
    const txt = q('.destaque__texto')
    const cabeca = el.closest('section')?.querySelector('.secao__head') as HTMLElement
    // 100svh medido de verdade (a barra do navegador no celular não conta)
    const sonda = document.createElement('div')
    sonda.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none'
    document.body.appendChild(sonda)
    let feita = ''
    const ajusta = (forca = false) => {
      if (!mq.matches) { el.style.removeProperty('--l'); el.style.removeProperty('--h'); feita = ''; return }
      const W = el.clientWidth
      const chave = W + 'x' + sonda.offsetHeight + (mqLargo.matches ? 'L' : '')
      if (!forca && chave === feita) return
      feita = chave
      const bissecta = (lo: number, hi: number, f: (x: number) => number) => { for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m } return hi }

      if (!mqLargo.matches) {
        // 768–1023: só a largura da formatura; as duas colunas terminam na mesma linha
        el.style.removeProperty('--h')
        const gap = parseFloat(getComputedStyle(el).rowGap) || 0
        const pb = parseFloat(getComputedStyle(txt).paddingBottom) || 0
        const dif = (L: number) => {
          el.style.setProperty('--l', (L / W) * 100 + '%')
          const fundo = Math.max(...[...txt.querySelectorAll('.destaque__topo, .destaque__desc, .destaque__base')].map((e) => e.getBoundingClientRect().bottom))
          const texto = fundo - txt.getBoundingClientRect().top + pb
          const cima = Math.max(...topo.map((t) => t.getBoundingClientRect().height))
          return form.getBoundingClientRect().height - (cima + gap + texto)
        }
        el.style.setProperty('--l', ((bissecta(W * 0.12, W * 0.5, dif) / W) * 100).toFixed(4) + '%')
        return
      }

      /* 1024 ou mais: formatura com largura L e fotos de cima com altura h (defesa h x h, CONCISTEC 1,7778h x h).
         Os três vãos dividem igualmente o que sobra da largura. O pé do cartão alinha com o pé da foto da formatura.
         1) pela largura: vão de 48 (space-12);
         2) se o bloco não couber na altura visível (100svh − menu − área do título − 16), a formatura passa a ser
            medida pela altura e as fotos de cima encolhem (os vãos crescem), nunca abaixo de 200 px;
         3) com 200 px e ainda sem caber, a página rola. */
      const G = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-12')) || 48
      const R = 1.7778
      const razao = (Number(formImg.getAttribute('width')) || 600) / (Number(formImg.getAttribute('height')) || 1159)
      const poe = (L: number, h: number) => { el.style.setProperty('--l', L + 'px'); el.style.setProperty('--h', h + 'px') }
      const pe = () => formImg.getBoundingClientRect().bottom - txt.getBoundingClientRect().bottom // > 0: cartão acima do pé da foto
      const hLarg = (L: number) => (W - L - 3 * G) / (1 + R)
      // 1) pela largura
      const L1 = bissecta(W * 0.1, W * 0.45, (L) => { poe(L, hLarg(L)); return pe() })
      poe(L1, hLarg(L1))
      const nav = (document.querySelector('.nav') as HTMLElement)?.offsetHeight || 64
      const areaTitulo = el.getBoundingClientRect().top - cabeca.getBoundingClientRect().top
      const disponivel = sonda.offsetHeight - nav - areaTitulo - 16
      if (form.getBoundingClientRect().height <= disponivel) return
      // 2) pela altura: a formatura (foto + legenda) ocupa a altura disponível
      const legenda = form.getBoundingClientRect().height - formImg.getBoundingClientRect().height
      const L2 = (disponivel - legenda) * razao
      const MIN = 200
      poe(L2, MIN)
      if (pe() >= 0) {
        const hMax = hLarg(L2)
        const h = bissecta(MIN, hMax, (x) => { poe(L2, x); return -pe() })
        poe(L2, h)
        return
      }
      // 3) com 200 px o cartão ainda passa do pé da foto: a formatura cresce o necessário e a página rola.
      //    Se nem assim couber na largura (telas estreitas, ~1024), volta ao tamanho pela largura e a página rola.
      const LMax = W - (1 + R) * MIN - 3 * G
      poe(LMax, MIN)
      if (LMax <= L2 || pe() < 0) { poe(L1, hLarg(L1)); return }
      const L3 = bissecta(L2, LMax, (L) => { poe(L, MIN); return pe() })
      poe(L3, MIN)
    }
    ajusta(true)
    const ro = new ResizeObserver(() => ajusta())
    ro.observe(el)
    const aoRedimensionar = () => ajusta()
    addEventListener('resize', aoRedimensionar)
    const muda = () => ajusta(true)
    mq.addEventListener('change', muda)
    mqLargo.addEventListener('change', muda)
    document.fonts?.ready.then(muda)
    return () => { ro.disconnect(); removeEventListener('resize', aoRedimensionar); mq.removeEventListener('change', muda); mqLargo.removeEventListener('change', muda); sonda.remove() }
  }, [ref])
}

function Destaque({ p }: { p: typeof tcc }) {
  const papeis = ['defesa', 'formatura', 'concistec']
  const ref = useRef<HTMLElement>(null)
  useColunasIguais(ref)
  return (
    <article className="destaque" aria-labelledby="t-rpa" ref={ref}>
      <ul className="destaque__lista">
        {p.mosaico.map((f, i) => (
          <li className={`destaque__foto destaque__foto--${papeis[i]}`} key={f.media.src}>
            <figure className="destaque__fig">
              <div className="destaque__img"><Photo media={f.media} /></div>
              <figcaption className="destaque__legenda">{f.legenda}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="destaque__texto">
        <div className="destaque__topo">
          <h3 className="destaque__title" id="t-rpa">{p.name}</h3>
          <p className="destaque__sub">{p.subtitle}</p>
        </div>
        <p className="destaque__desc">{p.desc}</p>
        <div className="destaque__base">
          <ul className="destaque__fatos">
            {p.facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <a
            className="link-linha destaque__cta" href={p.article.href} target="_blank" rel="noopener noreferrer"
            aria-label="Ler o artigo no Google Drive (abre em nova aba)"
          >
            Ler o artigo<span className="link-linha__seta" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  )
}

function SecaoProjetos() {
  return (
    <section className="wrap secao secao--projetos" id="projetos" aria-labelledby="titulo-projetos">
      <div className="secao__head">
        <h2 className="secao__title" id="titulo-projetos">Meus projetos</h2>
        <p className="secao__lead">{gallery.lead}</p>
      </div>
      <Destaque p={tcc} />
      <ul className="compact">
        {compact.map((p) => (
          <li className="compact__row" key={p.id}>
            <h3 className="compact__name">{p.name}</h3>
            <p className="compact__desc">
              {p.desc}
              {p.link?.on && <> <a className="link" href={p.link.href} target="_blank" rel="noopener noreferrer">Ver site →</a></>}
            </p>
            {p.role && <p className="role">{p.role}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* Sala de aula em pixels: o fundo da composição (sem moldura: as bordas se desfazem no papel).
   O canvas fica escondido dos leitores de tela; a figura tem nome. Se o canvas falhar, mostra o PNG do build. */
function Selo() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => {
    if (!canvas.current) return
    try { return iniciaSala(canvas.current) } catch { setFalhou(true) }
  }, [])
  return (
    <figure className="agora__selo" aria-label={agora.selo.nome}>
      <div className="selo">
        <canvas className="selo__canvas" ref={canvas} aria-hidden="true" />
        {falhou && <img className="selo__png" src={agora.selo.png} alt="" width={agora.selo.width} height={agora.selo.height} />}
      </div>
    </figure>
  )
}

/* "Conhecer o app": botão secundário. Com app.href, abre o link numa nova aba.
   Sem link ainda, abre um <dialog> nativo "Em construção": o foco entra no diálogo e volta ao botão ao fechar;
   Esc, "Fechar" e um clique fora fecham; a página atrás não rola enquanto ele está aberto. */
function AppCta() {
  const dlg = useRef<HTMLDialogElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  if (app.href) {
    return <a className="btn btn--secondary agora__cta" href={app.href} target="_blank" rel="noopener noreferrer"><BtnFx />Conhecer o app</a>
  }
  const abre = () => { document.documentElement.classList.add('sem-rolagem'); dlg.current?.showModal() }
  const fecha = () => dlg.current?.close()
  const aoFechar = () => { document.documentElement.classList.remove('sem-rolagem'); btn.current?.focus() }
  return (
    <>
      <button type="button" className="btn btn--secondary agora__cta" ref={btn} aria-haspopup="dialog" onClick={abre}><BtnFx />Conhecer o app</button>
      <dialog className="dialogo" ref={dlg} aria-labelledby="dialogo-app-titulo" onClose={aoFechar}
        onClick={(e) => { if (e.target === dlg.current) fecha() }}>
        <div className="dialogo__corpo">
          <h2 className="dialogo__titulo" id="dialogo-app-titulo">{app.titulo}</h2>
          <p>{app.aviso}</p>
          <button type="button" className="btn btn--secondary" autoFocus onClick={fecha}><BtnFx />Fechar</button>
        </div>
      </dialog>
    </>
  )
}

/* Agora: à esquerda, o parágrafo e o botão do app; à direita, uma composição só: a sala em pixels ao fundo,
   as duas fotos "presas" no quadro branco (por cima, nunca cobertas) e a nota "eu, dando aula" apontando para aula3.
   640–1023: texto e botão em cima; a composição na largura toda.
   < 640: texto e botão, a sala como uma faixa (só TV, alto do quadro e mesa) e as duas fotos lado a lado (aula3, depois aula). */
function SecaoAgora() {
  const [f1, f2] = agora.fotos
  return (
    <section className="wrap secao" id="agora" aria-labelledby="titulo-agora">
      <div className="secao__head">
        <h2 className="secao__title" id="titulo-agora">Agora</h2>
        <p className="secao__lead">{agora.kicker}</p>
      </div>
      <div className="agora">
        <div className="agora__col">
          <p className="agora__texto">{agora.texto}</p>
          <AppCta />
        </div>
        <div className="agora__comp">
          <p className="annot" aria-hidden="true">
            <span className="annot__text">{agora.anotacao}</span>
            <svg className="annot__arrow" viewBox="0 0 72 56">
              <path d="M4 10c14-6 31-6 43 4 9 8 13 19 14 33" />
              <path d="M53 39c3 3 6 6 8 10 2-5 4-9 7-12" />
            </svg>
          </p>
          <div className="comp">
            <Selo />
            <figure className="comp__fotos">
              <div className="frame frame--fita comp__foto comp__foto--aula3"><Photo media={f1} /></div>
              <div className="frame frame--fita comp__foto comp__foto--aula"><Photo media={f2} /></div>
              <figcaption className="sr-only">{agora.legenda}</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Stack: meu 2026, mês a mês ----------
   Tudo é calculado de `stackYear` e `stackPeriods` em content.ts: a ordem, o tempo total e a tabela.
   Só entram marcas com datas confirmadas.
   Entrada (uma vez, quando ~20% do calendário aparece): as linhas se desenham de cima para baixo; em cada linha as
   marcas crescem da esquerda para a direita, como escritas mês a mês; marcos e "‹" aparecem logo depois; por último
   "Docência em TI", e então a linha "hoje" desce. O estado final já está na página: sem JS, com "reduzir movimento",
   sem IntersectionObserver ou se o calendário já está na tela ao carregar, ele aparece pronto. */
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONTHS_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function todayHalfMonths() {
  const d = new Date()
  if (d.getFullYear() > 2026) return 24
  if (d.getFullYear() < 2026) return 0
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return (d.getMonth() + (d.getDate() - 1) / days) * 2
}

const isConfirmed = (m: StackMark) => m.start !== null && m.end !== null // contexto vazio = não informado, a marca aparece sem ele
const markSpan = (m: StackMark, today: number) => {
  const s = m.start === 'antes' ? 0 : (m.start as number)
  const e = m.end === 'hoje' ? today : (m.end as number)
  return { s, e: Math.max(e, s) }
}
function halfText(h: number, edge: 'start' | 'end') {
  if (edge === 'start') return h % 2 ? `fim de ${MONTHS[(h - 1) / 2]}` : MONTHS[h / 2]
  return h % 2 ? `meados de ${MONTHS[(h - 1) / 2]}` : MONTHS[h / 2 - 1]
}
function periodOf(m: StackMark) {
  const to = m.end === 'hoje' ? 'hoje' : m.endText ?? halfText(m.end as number, 'end')
  if (m.start === 'antes') return `desde 2025 a ${to}`
  const from = halfText(m.start as number, 'start')
  return from === to ? from : `${from} a ${to}`
}
function monthsText(halves: number) {
  const h = Math.max(1, Math.round(halves))
  if (h === 1) return 'meio mês'
  const n = Math.floor(h / 2)
  return `${n} ${n === 1 ? 'mês' : 'meses'}${h % 2 ? ' e meio' : ''}`
}
const joinPt = (xs: string[]) => {
  if (xs.length < 2) return xs.join('')
  if (/ e /.test(xs[xs.length - 1])) return xs.join(', ') // o último nome já tem "e": "TypeScript, SQL e bancos de dados"
  return `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`
}
const tipOf = (ctx: string, what?: string) => [ctx, what].filter(Boolean).join(' · ')

interface RowView {
  row: StackRow
  marks: (StackMark & { s: number; e: number })[]
  milestones: { month: number; name: string; ctx: string }[]
  halves: number // tempo em 2026, união das marcas
  open: boolean
  now: boolean
}

function buildRows(today: number): RowView[] {
  return stackYear
    .map((row) => {
      const marks = row.marks.filter(isConfirmed).map((m) => ({ ...m, ...markSpan(m, today) }))
      const milestones = (row.milestones ?? []).filter((x): x is RowView['milestones'][number] => x.month !== null)
      // União dos intervalos, para não contar duas vezes o mesmo mês
      const ivs = marks.map((m) => [m.s, m.e]).sort((a, b) => a[0] - b[0])
      let halves = 0, cur: number[] | null = null
      for (const iv of ivs) {
        if (!cur || iv[0] > cur[1]) { if (cur) halves += cur[1] - cur[0]; cur = [...iv] } else cur[1] = Math.max(cur[1], iv[1])
      }
      if (cur) halves += cur[1] - cur[0]
      return { row, marks, milestones, halves, open: marks.some((m) => m.start === 'antes'), now: marks.some((m) => m.end === 'hoje') }
    })
    .filter((r) => r.marks.length > 0 || r.milestones.length > 0)
}

const byTime = (a: RowView, b: RowView) =>
  b.halves - a.halves || a.row.name.localeCompare(b.row.name, 'pt-BR')

/* Rótulo de hover e foco: 1ª linha contexto e projeto (se houver); 2ª linha período e duração exata */
function markWhen(m: StackMark & { s: number; e: number }) {
  return `${periodOf(m)}, ${monthsText(m.e - m.s)}${m.start === 'antes' ? ' em 2026' : ''}`
}
function Tip({ first, second }: { first: string; second: string }) {
  return (
    <span className="mk__tip" aria-hidden="true">
      {first && <span className="mk__tip-l1">{first}</span>}
      <span className="mk__tip-l2">{second}</span>
    </span>
  )
}

/* Tempo total em texto: "8 meses"; se começou neste mês ou no anterior, "desde nov".
   O começo em 2025 já aparece na ponta aberta da barra, então não se repete aqui. */
function totalText(r: RowView, today: number) {
  if (!r.marks.length) return ''
  const firstStart = Math.min(...r.marks.map((m) => m.s))
  const startMonth = Math.floor(firstStart / 2), thisMonth = Math.floor(today / 2)
  if (!r.open && thisMonth - startMonth <= 1) return `desde ${MONTHS[startMonth]}`
  return monthsText(r.halves)
}

/* Marcos do mesmo mês viram um ponto só, com os nomes juntos */
function groupMilestones(ms: RowView['milestones']) {
  const by = new Map<number, RowView['milestones']>()
  ms.forEach((x) => by.set(x.month, [...(by.get(x.month) ?? []), x]))
  return [...by.entries()].map(([month, items]) => ({ month, items }))
}

function StackRowView({ r, today, i: idx }: { r: RowView; today: number; i: number }) {
  const pct = (v: number) => `${(v / 24) * 100}%`
  const marks = [...r.marks].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'uso' ? -1 : 1)) // estudo por cima
  return (
    <div className="sk__row" style={{ ['--i' as string]: idx }}>
      <div className="sk__name">
        <h3 className="sk__title">{r.row.name}</h3>
      </div>
      <div className="sk__track">
        {r.open && <span className="sk__open sk-depois" aria-hidden="true">‹</span>}
        {/* estudo e uso da mesma linha crescem juntos, numa varrida só (de janeiro ao último mês da linha) */}
        <div className="sk__bars">
        {marks.map((m, i) => {
          const tip = tipOf(m.ctx, m.what)
          const kind = m.kind === 'uso' ? 'Uso' : 'Estudo'
          // sem contexto (ex.: estudo por conta própria): a dica e o leitor dizem só "Estudo, jan a abr, 4 meses"
          const rotulo = tip ? `${kind}: ${tip}, ${markWhen(m)}` : `${kind}, ${markWhen(m)}`
          return (
            <button
              type="button" key={i}
              className={`mk mk--${m.kind}${m.start === 'antes' ? ' is-open' : ''}${m.s > 12 ? ' tip-end' : ''}`}
              style={{ left: pct(m.s), width: pct(m.e - m.s) }}
              aria-label={rotulo}
            >
              <Tip first={tip || kind} second={markWhen(m)} />
            </button>
          )
        })}
        </div>
        {groupMilestones(r.milestones).map(({ month, items }) => {
          const names = joinPt(items.map((x) => x.name))
          const ctxs = [...new Set(items.map((x) => x.ctx))].join(' e ')
          return (
            <button
              type="button" key={month}
              className={`mk mk--dot sk-depois${month >= 6 ? ' tip-end' : ''}`}
              style={{ left: pct(month * 2 + 1) }}
              aria-label={`${items.length > 1 ? 'Marcos' : 'Marco'}: ${names}, ${MONTHS_FULL[month]}`}
            >
              <Tip first={tipOf(ctxs, names)} second={MONTHS_FULL[month]} />
            </button>
          )
        })}
        <span className="sk__tick" style={{ left: pct(today) }} aria-hidden="true" />
      </div>
    </div>
  )
}

/* Linha de contexto (ex.: Docência em TI): depois de todas as stacks, no mesmo estilo de nome das outras linhas.
   É a única barra azul do calendário ("atual"), cheia, do mesmo formato das outras, até "hoje". Não é uma stack. */
function StackPeriodRow({ p, today, i: idx }: { p: (typeof stackPeriods)[number]; today: number; i: number }) {
  const pct = (v: number) => `${(v / 24) * 100}%`
  const s = p.start, e = p.end === 'hoje' ? today : p.end
  const when = periodOf({ kind: 'uso', ctx: '', start: s, end: p.end })
  return (
    <div className="sk__row sk__row--ctx" style={{ ['--i' as string]: idx }}>
      <div className="sk__name">
        <h3 className="sk__title">{p.label}</h3>
      </div>
      <div className="sk__track">
        <div className="sk__bars">
        <button
          type="button"
          className={`mk mk--atual${s > 12 ? ' tip-end' : ''}`}
          style={{ left: pct(s), width: pct(e - s) }}
          aria-label={`Atual: ${p.label}, ${when}`}
        >
          <Tip first={`${p.label} · ${p.detalhe}`} second={when} />
        </button>
        </div>
        <span className="sk__tick" style={{ left: pct(today) }} aria-hidden="true" />
      </div>
    </div>
  )
}

function StackYear() {
  const today = todayHalfMonths()
  // "Ver todas as stacks" é um link para a lista (sempre visível): rola até o título, que fica logo abaixo do menu,
  // e leva o foco para ele. Rolagem suave; imediata com "reduzir movimento". Sem JS, o link funciona como âncora.
  const listTitle = useRef<HTMLHeadingElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  // Entrada da lista (uma vez, quando ~30% dela aparece; de novo pelo link): a área desce, os grupos sobem em
  // sequência e o traço roxo do título se desenha. Sem JS, com "reduzir movimento" ou já na tela: estado final direto.
  const entra = () => {
    const l = lista.current
    if (!l || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    l.classList.remove('is-armado', 'is-entra')
    void l.offsetWidth // reinicia a animação
    l.classList.add('is-entra')
  }
  useEffect(() => {
    const l = lista.current
    if (!l || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    if (l.getBoundingClientRect().top < innerHeight) return // já à vista: fica no estado final
    l.classList.add('is-armado')
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { entra(); io.disconnect() } }, { threshold: 0.3 })
    io.observe(l)
    return () => io.disconnect()
  }, [])
  const vaiParaLista = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const t = listTitle.current
    if (!t) return
    e.preventDefault()
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches
    t.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' })
    t.focus({ preventScroll: true })
    entra()
  }
  const rows = buildRows(today)
  // Grupos na ordem definida; dentro de cada grupo, maior tempo primeiro
  // Uma diagonal: ordem de início (2025 primeiro), empate pelo maior tempo, depois pelo nome
  const startKey = (r: RowView) => (r.open ? -1 : Math.min(...r.marks.map((m) => m.s)))
  const ordered = [...rows].sort((a, b) => startKey(a) - startKey(b) || byTime(a, b))
  const nLinhas = ordered.length + stackPeriods.length // "Docência em TI" é a última a se desenhar

  // Entrada do calendário (uma vez). Arma antes da primeira pintura só se o calendário ainda está abaixo da tela;
  // toca quando ~20% dele aparece; no fim tira as classes (nada fica recortado: as dicas abrem inteiras).
  const skRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = skRef.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    if (el.getBoundingClientRect().top < window.innerHeight) return // já está na tela: mostra pronto
    const ms = (v: string) => { const n = parseFloat(v); return v.trim().endsWith('ms') ? n : n * 1000 }
    const css = getComputedStyle(document.documentElement)
    const reveal = ms(css.getPropertyValue('--dur-reveal')), stagger = ms(css.getPropertyValue('--stagger')), base = ms(css.getPropertyValue('--dur-base'))
    const total = (nLinhas - 1) * stagger + 2 * reveal + base + 120
    let timer = 0
    el.classList.add('is-armed')
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return
      io.disconnect()
      requestAnimationFrame(() => {
        el.classList.add('is-in')
        timer = window.setTimeout(() => el.classList.remove('is-armed', 'is-in'), total)
      })
    }, { threshold: 0.2 })
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(timer); el.classList.remove('is-armed', 'is-in') }
  }, [nLinhas])

  // Dicas sempre inteiras: ao passar o mouse ou focar uma marca, a dica desliza para dentro da tela se for preciso
  useEffect(() => {
    const el = skRef.current
    if (!el) return
    const ajusta = (e: Event) => {
      const mk = (e.target as Element | null)?.closest?.('.mk')
      const tip = mk?.querySelector<HTMLElement>('.mk__tip')
      if (!tip) return
      tip.style.setProperty('--dx', '0px')
      requestAnimationFrame(() => {
        if (getComputedStyle(tip).display === 'none') return
        const r = tip.getBoundingClientRect(), m = 8, vw = document.documentElement.clientWidth
        const dx = r.left < m ? m - r.left : r.right > vw - m ? vw - m - r.right : 0
        tip.style.setProperty('--dx', `${Math.round(dx)}px`)
      })
    }
    el.addEventListener('pointerover', ajusta)
    el.addEventListener('focusin', ajusta)
    return () => { el.removeEventListener('pointerover', ajusta); el.removeEventListener('focusin', ajusta) }
  }, [])

  return (
    <section className="band" id="stack" aria-labelledby="titulo-stack">
      <div className="wrap">
        <div className="stack__head">
          <h2 className="stack__title" id="titulo-stack">Meu 2026, <Em>mês a mês</Em></h2>
          <p className="stack__lead">{stack.lead}</p>
        </div>

        <div className="sk__bar">
          <ul className="sk__legend">
            <li><span className="sw sw--uso" aria-hidden="true" />uso</li>
            <li><span className="sw sw--estudo" aria-hidden="true" />estudo</li>
            <li><span className="sw sw--dot" aria-hidden="true" />marco</li>
            <li><span className="sw sw--atual" aria-hidden="true" />atual</li>
          </ul>
          <a className="sk__toggle" href="#stack-lista" onClick={vaiParaLista}>Ver todas as stacks</a>
        </div>

        <div className="sk" ref={skRef} style={{ ['--today' as string]: today / 24, ['--n' as string]: nLinhas - 1 }}>
          <div className="sk__head" aria-hidden="true">
            <span />
            <div className="sk__months">
              {MONTHS.map((m, i) => <span key={m}><span className="sk__m-full">{m}</span><span className="sk__m-ini">{INITIALS[i]}</span></span>)}
            </div>
            <span />
          </div>
          {ordered.map((r, i) => <StackRowView r={r} today={today} i={i} key={r.row.name} />)}
          {stackPeriods.map((p, i) => <StackPeriodRow p={p} today={today} i={ordered.length + i} key={p.label} />)}
          <div className="sk__today" aria-hidden="true"><span className="sk__today-lbl">hoje</span></div>
        </div>

        {/* Em sala de aula: sempre visível, sem barras nem durações */}
        <div className="sk-class" aria-labelledby="titulo-sala">
          <h3 className="sk-class__title" id="titulo-sala">
            <span className="sk-list__dot" aria-hidden="true" /><span className="sr-only">em andamento: </span>{teaching.title}
          </h3>
          <p className="sk-class__note">{teaching.note}</p>
          <div className="sk-class__cols">
            {teaching.courses.map((c) => (
              <div className="sk-class__course" key={c.name}>
                <p className="sk-class__name">{c.name}</p>
                <ul className="sk-class__list">{c.components.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>

        {/* Lista completa: sempre visível, depois de "Em sala de aula" */}
        <div className="sk-list" id="stack-lista" ref={lista}>
          <div className="sk-list__head">
            <h3 className="sk-list__title" ref={listTitle} tabIndex={-1}>
              <span className="scribble-host sk-list__scribble">
                Tudo que uso
                <svg className="scribble" viewBox="0 0 240 14" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 9c34-5 70-6 106-3s76 4 128-2" pathLength={1} />
                </svg>
              </span>
            </h3>
          </div>
          <p className="sk-list__note">{stack.listNote}</p>
          <div className="sk-list__groups">
            {stackAll.map((g, i) => (
              <div className="sk-list__group" key={g.group} style={{ ['--i' as string]: i }}>
                <p className="sk-list__label">{g.group}</p>
                <ul className="sk-list__tags">
                  {g.items.map((it) => (
                    <li className="sk-list__tag" key={it.name}>
                      {it.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Dados do calendário para leitores de tela (sempre disponível, visualmente oculto) */}
        <div className="sr-only" id="stack-tabela">
          <table>
            <caption className="sr-only">Stacks de 2026: tipo de marca, contexto, período, projeto ou curso e tempo total</caption>
            <thead><tr><th scope="col">Stack</th><th scope="col">Grupo</th><th scope="col">Marca</th><th scope="col">Contexto</th><th scope="col">Período</th><th scope="col">Projeto ou curso</th><th scope="col">Duração</th><th scope="col">Tempo total</th></tr></thead>
            <tbody>
              {ordered.flatMap((r) => {
                const total = r.open ? `desde 2025 (${monthsText(r.halves)} em 2026)` : totalText(r, today)
                return [
                  ...r.marks.map((m, i) => (
                    <tr key={`${r.row.name}-m${i}`}>
                      <th scope="row">{r.row.name}</th><td>{r.row.group}</td><td>{m.kind === 'uso' ? 'Uso' : 'Estudo'}</td><td>{m.ctx}</td><td>{periodOf(m)}</td><td>{m.what ?? ''}</td>
                      <td>{monthsText(m.e - m.s)}{m.start === 'antes' ? ' em 2026' : ''}</td><td>{total}</td>
                    </tr>
                  )),
                  ...r.milestones.map((x) => (
                    <tr key={`${r.row.name}-${x.name}`}>
                      <th scope="row">{r.row.name}</th><td>{r.row.group}</td><td>Marco</td><td>{x.ctx}</td><td>{MONTHS[x.month]}</td><td>{x.name}</td><td></td><td>{total}</td>
                    </tr>
                  )),
                ]
              })}
              {stackPeriods.map((p) => (
                <tr key={`periodo-${p.label}`}>
                  <th scope="row">{p.label}</th><td>Contexto</td><td>Atual</td><td></td>
                  <td>{periodOf({ kind: 'uso', ctx: '', start: p.start, end: p.end })}</td><td></td><td></td><td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}



/* ---------- Contato: curto ---------- */
function Contact() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
      setStatus('ok')
    } catch {
      setStatus('err')
    }
  }
  return (
    <section className="wrap contact" id="contato" aria-labelledby="titulo-contato">
      <div className="contact__intro">
        <h2 className="contact__title" id="titulo-contato">{contact.title}</h2>
        <p className="contact__lead">{contact.lead}</p>
        <p className="disponivel"><span className="sk-list__dot" aria-hidden="true" />{contact.disponibilidade}</p>
      </div>
      <div className="contact__main">
        <a className="contact__mail link link--quiet" href={`mailto:${contact.email}`}>{contact.email}</a>
        <div className="contact__actions">
          <button type="button" className="btn btn--primary" onClick={copy}><BtnFx />Copiar e-mail</button>
          <a className="btn btn--secondary" href={curriculo.href} download={curriculo.arquivo} aria-label={curriculo.nome}><BtnFx />Baixar currículo <Download /></a>
        </div>
        <p className={`status${status === 'ok' ? ' status--ok' : ''}`} role="status" aria-live="polite">
          {status === 'ok' && 'E-mail copiado.'}
          {status === 'err' && 'Não copiou. Selecione o e-mail acima e copie.'}
        </p>
      </div>
    </section>
  )
}

function Footer({ pencilAvailable, pencilOn, onTogglePencil }: { pencilAvailable: boolean; pencilOn: boolean; onTogglePencil: () => void }) {
  return (
    <footer className="footer">
      <div className="wrap footer__row">
        <span className="footer__copy">© 2026 Hitawana da Silva Araújo</span>
        <ul>
          <li><a className="link" href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
          <li><a className="link" href={contact.github} target="_blank" rel="noreferrer">GitHub</a></li>
          <li><a className="link" href="#masthead">Voltar ao topo</a></li>
          {pencilAvailable && (
            <li>
              <button type="button" className="textbtn" onClick={onTogglePencil}>
                {pencilOn ? 'Desligar o cursor de lápis' : 'Ligar o cursor de lápis'}
              </button>
            </li>
          )}
        </ul>
      </div>
    </footer>
  )
}

/* ---------- Página ---------- */
export default function App() {
  const [available, setAvailable] = useState(() => canUsePencil())
  const [pencilOn, setPencilOn] = useState(() => readPencilPref())

  // Reage se a pessoa ligar "reduzir movimento" ou trocar de mouse para toque
  useEffect(() => {
    const queries = [matchMedia('(prefers-reduced-motion: reduce)'), matchMedia('(pointer: fine)')]
    const update = () => setAvailable(canUsePencil())
    queries.forEach((q) => q.addEventListener('change', update))
    return () => queries.forEach((q) => q.removeEventListener('change', update))
  }, [])

  useEffect(() => {
    if (!available || !pencilOn) return
    return startPencil()
  }, [available, pencilOn])

  const toggle = () => setPencilOn((v) => { savePencilPref(!v); return !v })

  return (
    <>
      <a className="skip" href="#conteudo">Pular para o conteúdo</a>
      <Masthead />
      <Nav />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <SecaoProjetos />
        <SecaoAgora />
        <StackYear />
        <Contact />
      </main>
      <Footer pencilAvailable={available} pencilOn={pencilOn} onTogglePencil={toggle} />
    </>
  )
}
