import type { ReactElement } from 'react'
import type { Illo } from './content'

// Ilustrações provisórias, em traço, com as cores do sistema.
// Saem de cena assim que a imagem real (src) é informada.

const Browser = () => (
  <>
    <rect className="i-card" x="24" y="32" width="352" height="236" rx="6" />
    <rect className="i-bar" x="24" y="32" width="352" height="22" rx="6" />
    <circle className="i-strong" cx="38" cy="43" r="3.5" />
    <circle className="i-strong" cx="50" cy="43" r="3.5" />
    <circle className="i-strong" cx="62" cy="43" r="3.5" />
  </>
)

const scenes: Record<Illo, ReactElement> = {
  portrait: (
    <>
      <rect className="i-sand-soft" x="0" y="0" width="400" height="500" />
      <path className="i-line" d="M40 420h320M70 420V330h90M330 420V300" />
      <rect className="i-card" x="250" y="250" width="90" height="62" rx="4" />
      <path className="i-line" d="M262 268h40M262 282h60M262 296h28" />
      <circle className="i-card" cx="190" cy="190" r="62" />
      <path className="i-card" d="M86 420c0-74 46-120 104-120s104 46 104 120z" />
      <path className="i-line" d="M162 196c8 8 48 8 56 0M168 172h0M212 172h0" />
      <path className="i-line-accent" d="M140 140c20-36 80-40 104 0" />
    </>
  ),
  class: (
    <>
      <rect className="i-sand-soft" x="0" y="0" width="400" height="300" />
      <rect className="i-card" x="40" y="40" width="220" height="140" rx="4" />
      <path className="i-line" d="M64 76h120M64 100h160M64 124h96" />
      <path className="i-line-accent" d="M64 150l30-18 30 10 40-28" />
      <circle className="i-card" cx="310" cy="120" r="30" />
      <path className="i-card" d="M262 260c0-56 22-90 48-90s48 34 48 90z" />
      <path className="i-line" d="M276 200l-30-40" />
      <path className="i-line" d="M20 260h360" />
    </>
  ),
  process: (
    <>
      <rect className="i-sand-soft" x="0" y="0" width="400" height="300" />
      <rect className="i-sand" x="44" y="48" width="84" height="60" rx="3" />
      <rect className="i-tint" x="140" y="48" width="84" height="60" rx="3" />
      <rect className="i-card" x="236" y="48" width="84" height="60" rx="3" />
      <path className="i-line" d="M128 78h12M224 78h12" />
      <path className="i-line" d="M58 66h48M58 80h56M154 66h40M154 80h52M250 66h44M250 80h30" />
      <circle className="i-card" cx="130" cy="176" r="24" />
      <path className="i-card" d="M90 270c0-44 18-70 40-70s40 26 40 70z" />
      <circle className="i-card" cx="270" cy="176" r="24" />
      <path className="i-card" d="M230 270c0-44 18-70 40-70s40 26 40 70z" />
      <path className="i-line-accent" d="M176 168c16-10 32-10 48 0" />
    </>
  ),
  rpalex: (
    <>
      <rect className="i-bg" width="400" height="300" />
      <rect className="i-card" x="24" y="40" width="148" height="220" rx="6" />
      <rect className="i-ink" x="38" y="56" width="56" height="9" rx="2" />
      {[82, 104, 126, 148, 170, 192, 214].map((y, i) => (
        <rect key={'l' + y} className={i === 2 || i === 5 ? 'i-tint' : 'i-bar'} x="38" y={y} width="120" height="14" rx="2" />
      ))}
      <rect className="i-card" x="228" y="40" width="148" height="220" rx="6" />
      <rect className="i-ink" x="242" y="56" width="56" height="9" rx="2" />
      {[82, 104, 126, 148, 170, 192, 214].map((y, i) => (
        <rect key={'r' + y} className={i === 2 || i === 5 ? 'i-tint' : 'i-bar'} x="242" y={y} width="120" height="14" rx="2" />
      ))}
      <path className="i-line-accent" d="M178 133h44M214 125l8 8-8 8M178 199h44M214 191l8 8-8 8" />
      <circle className="i-sand" cx="200" cy="96" r="14" />
      <path className="i-line" d="M194 96l4 4 8-8" />
    </>
  ),
  admin: (
    <>
      <rect className="i-bg" width="400" height="300" />
      <Browser />
      {[84, 116, 148, 180, 212].map((y, i) => (
        <g key={y}>
          <circle className={i % 2 ? 'i-tint' : 'i-sand'} cx="52" cy={y} r="10" />
          <rect className="i-bar" x="70" y={y - 4} width={[90, 74, 96, 64, 84][i]} height="8" rx="4" />
        </g>
      ))}
      <rect className="i-ink" x="208" y="76" width="96" height="10" rx="2" />
      <rect className="i-card" x="208" y="100" width="148" height="24" rx="3" />
      <rect className="i-card" x="208" y="134" width="148" height="24" rx="3" />
      <rect className="i-card" x="208" y="168" width="148" height="24" rx="3" />
      <rect className="i-accent" x="208" y="210" width="72" height="22" rx="11" />
    </>
  ),
  chromebook: (
    <>
      <rect className="i-bg" width="400" height="300" />
      <rect className="i-card" x="24" y="32" width="352" height="236" rx="6" />
      <rect className="i-ink" x="44" y="52" width="88" height="10" rx="2" />
      <rect className="i-accent" x="300" y="48" width="56" height="18" rx="9" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect
            key={r + '-' + c}
            className={['i-tint', 'i-bar', 'i-sand', 'i-bar', 'i-bar', 'i-tint'][(r * 5 + c * 2) % 6]}
            x={44 + c * 64} y={84 + r * 44} width="56" height="36" rx="3"
          />
        )),
      )}
    </>
  ),
  health: (
    <>
      <rect className="i-bg" width="400" height="300" />
      <rect className="i-card" x="24" y="32" width="352" height="236" rx="6" />
      <rect className="i-tint" x="44" y="52" width="96" height="48" rx="4" />
      <rect className="i-bar" x="152" y="52" width="96" height="48" rx="4" />
      <rect className="i-sand" x="260" y="52" width="96" height="48" rx="4" />
      <rect className="i-ink" x="56" y="64" width="40" height="8" rx="2" />
      <rect className="i-ink" x="164" y="64" width="40" height="8" rx="2" />
      <rect className="i-ink" x="272" y="64" width="40" height="8" rx="2" />
      <path className="i-line" d="M44 248h312M44 120v128" />
      <path className="i-line" d="M44 216h312M44 184h312M44 152h312" strokeDasharray="3 5" />
      <polyline className="i-line-accent" points="52,226 96,210 140,214 184,186 228,178 272,152 316,140 348,128" />
      <circle className="i-accent" cx="348" cy="128" r="5" />
    </>
  ),
  portal: (
    <>
      <rect className="i-bg" width="400" height="300" />
      <Browser />
      <rect className="i-bar" x="24" y="54" width="72" height="214" />
      <rect className="i-ink" x="36" y="72" width="44" height="8" rx="2" />
      <path className="i-line" d="M36 100h40M36 120h32M36 140h44" />
      <rect className="i-ink" x="116" y="72" width="120" height="12" rx="2" />
      {[0, 1, 2].map((c) => (
        <rect key={'a' + c} className={['i-tint', 'i-sand', 'i-card'][c]} x={116 + c * 84} y="100" width="72" height="64" rx="4" />
      ))}
      {[0, 1, 2].map((c) => (
        <rect key={'b' + c} className={['i-card', 'i-tint', 'i-sand'][c]} x={116 + c * 84} y="176" width="72" height="64" rx="4" />
      ))}
    </>
  ),
  canhoto: (
    <>
      <rect className="i-bg" width="400" height="300" />
      <Browser />
      <rect className="i-ink" x="44" y="72" width="110" height="10" rx="2" />
      <rect className="i-accent" x="300" y="68" width="56" height="18" rx="9" />
      <rect className="i-bar" x="44" y="100" width="312" height="18" rx="2" />
      {[126, 152, 178, 204, 230].map((y, i) => (
        <g key={y}>
          <rect className="i-strong" x="52" y={y + 4} width="90" height="6" rx="3" />
          <rect className={i === 2 ? 'i-tint' : 'i-bar'} x="200" y={y} width="40" height="16" rx="2" />
          <rect className="i-bar" x="250" y={y} width="40" height="16" rx="2" />
          <rect className={i === 4 ? 'i-sand' : 'i-bar'} x="300" y={y} width="40" height="16" rx="2" />
        </g>
      ))}
    </>
  ),
  quiz: (
    <>
      <rect className="i-bg" width="400" height="300" />
      <rect className="i-card" x="40" y="36" width="320" height="228" rx="8" />
      <rect className="i-strong" x="64" y="58" width="60" height="8" rx="4" />
      <rect className="i-ink" x="64" y="80" width="230" height="14" rx="2" />
      <rect className="i-ink" x="64" y="102" width="160" height="14" rx="2" />
      <rect className="i-tint" x="64" y="140" width="128" height="44" rx="6" />
      <rect className="i-bar" x="208" y="140" width="128" height="44" rx="6" />
      <rect className="i-bar" x="64" y="196" width="128" height="44" rx="6" />
      <rect className="i-sand" x="208" y="196" width="128" height="44" rx="6" />
      <circle className="i-accent" cx="320" cy="62" r="10" />
    </>
  ),
}

export function Illustration({ illo, label }: { illo: Illo; label: string }) {
  const tall = illo === 'portrait'
  return (
    <svg viewBox={tall ? '0 0 400 500' : '0 0 400 300'} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      {scenes[illo]}
    </svg>
  )
}
