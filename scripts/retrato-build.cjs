// Gera o retrato em pixels a partir da foto ativa em content.ts (retratoAtivo).
// - Lê a foto original (só leitura: nada é editado, borrado ou salvo dela).
// - Grava retrato-dados.ts: brilho por célula nas grades de 160 e 110 colunas.
// - Grava imagens/web/retrato-pb.png: o mesmo pontilhado, quadro estático (para quem está sem JavaScript).
// Uso: node retrato-build.cjs [pasta-do-projeto]   (precisa de esbuild e sharp instalados na pasta atual)
const path = require('path'), fs = require('fs'), { createRequire } = require('module');
const req = createRequire(path.join(process.cwd(), 'noop.js'));
const esbuild = req('esbuild'), sharp = req('sharp');
const ROOT = path.resolve(process.argv[2] || __dirname);

const GRADES = [{ chave: 'g160', cols: 160, rows: 200 }, { chave: 'g110', cols: 110, rows: 138 }];
const CELULA = 3; // px por célula no PNG

(async () => {
  // Carrega content.ts e retrato-core.ts (TypeScript) num módulo temporário
  const out = esbuild.buildSync({
    stdin: { contents: "export * from './content'; export * as core from './retrato-core'", resolveDir: ROOT, loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false,
  }).outputFiles[0].text;
  const m = { exports: {} }; new Function('module', 'exports', 'require', out)(m, m.exports, require);
  const { retratos, retratoAtivo, core } = m.exports;
  const cfg = retratos[retratoAtivo];
  const foto = path.join(ROOT, cfg.foto);
  const { width: W, height: H } = await sharp(foto).metadata();
  const q = cfg.quadro;
  const area = { left: Math.round(q.x * W), top: Math.round(q.y * H), width: Math.round(q.w * W), height: Math.round(q.h * H) };

  const grades = {};
  for (const g of GRADES) {
    const lum = await sharp(foto).extract(area).resize(g.cols, g.rows, { fit: 'fill', kernel: 'lanczos3' })
      .toColourspace('b-w').raw().toBuffer();
    if (lum.length !== g.cols * g.rows) throw new Error('grade inesperada ' + lum.length);
    grades[g.chave] = { cols: g.cols, rows: g.rows, lum: Buffer.from(lum).toString('base64') };
  }
  fs.writeFileSync(path.join(ROOT, 'retrato-dados.ts'),
    `// GERADO por retrato-build.cjs a partir de "${cfg.foto}" (${retratoAtivo}). Não edite à mão.\n` +
    `// Brilho 0–255 por célula, linha a linha, em base64. Não é a foto: é a matéria-prima do pontilhado.\n` +
    `export const retratoDados = ${JSON.stringify({ id: retratoAtivo, ...grades }, null, 2)} as const\n`);

  // Cores dos tokens Edição P&B
  const tokens = fs.readFileSync(path.join(ROOT, 'tokens.css'), 'utf8');
  const cor = (n) => { const h = tokens.match(new RegExp(`--${n}:\\s*#([0-9a-f]{6})`, 'i'))[1]; return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const ink = cor('ink');

  const desenha = async (chave, arquivo) => {
    const g = grades[chave], lum = Buffer.from(g.lum, 'base64');
    const campo = core.prepara(new Uint8Array(lum), g.cols, g.rows, cfg.ajuste, cfg.mascara);
    const bits = new Uint8Array(g.cols * g.rows);
    core.pinta(campo, bits, 0, 0, 1, 1); // estático: luz de frente, sem entrada
    // Tinta opaca; papel transparente (igual ao canvas: o fundo da página aparece)
    const w = g.cols * CELULA, h = g.rows * CELULA, px = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const on = bits[Math.floor(y / CELULA) * g.cols + Math.floor(x / CELULA)], o = (y * w + x) * 4;
      px[o] = ink[0]; px[o + 1] = ink[1]; px[o + 2] = ink[2]; px[o + 3] = on ? 255 : 0;
    }
    await sharp(px, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9, palette: true, colours: 2 }).toFile(arquivo);
    return arquivo;
  };
  fs.mkdirSync(path.join(ROOT, 'imagens/web'), { recursive: true });
  console.log('png', await desenha('g160', path.join(ROOT, 'imagens/web/retrato-pb.png')));
  if (process.env.PREVIA) console.log('previa', await desenha('g110', path.join(process.env.PREVIA, `previa-110-${retratoAtivo}.png`)));
  console.log('ativo', retratoAtivo, 'quadro', area);
})().catch(e => { console.error(e); process.exit(1); });
