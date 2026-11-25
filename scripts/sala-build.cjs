// Gera imagens/web/sala-pb.png: a sala de aula em pixels, quadro estático (para quem está sem JavaScript).
// Mesmo desenho do navegador (sala-core.ts), células de 4 px; tinta dos tokens, papel transparente (as bordas se desfazem no papel).
// Uso: node sala-build.cjs [pasta-do-projeto]   (precisa de esbuild e sharp instalados na pasta atual)
const path = require('path'), fs = require('fs'), { createRequire } = require('module');
const req = createRequire(path.join(process.cwd(), 'noop.js'));
const esbuild = req('esbuild'), sharp = req('sharp');
const ROOT = path.resolve(process.argv[2] || __dirname);
const COLS = 180, ROWS = 90, CELULA = 4;

(async () => {
  const out = esbuild.buildSync({ entryPoints: [path.join(ROOT, 'sala-core.ts')], bundle: true, format: 'cjs', platform: 'node', write: false }).outputFiles[0].text;
  const m = { exports: {} }; new Function('module', 'exports', 'require', out)(m, m.exports, require);
  const cells = new Uint8Array(COLS * ROWS);
  m.exports.pintaSala(cells, COLS, ROWS);
  const tokens = fs.readFileSync(path.join(ROOT, 'tokens.css'), 'utf8');
  const cor = (n) => { const h = tokens.match(new RegExp(`--${n}:\\s*#([0-9a-f]{6})`, 'i'))[1]; return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const ink = cor('ink');
  const w = COLS * CELULA, h = ROWS * CELULA, px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = cells[Math.floor(y / CELULA) * COLS + Math.floor(x / CELULA)], o = (y * w + x) * 4;
    if (!v) continue;
    px[o] = ink[0]; px[o + 1] = ink[1]; px[o + 2] = ink[2]; px[o + 3] = 255;
  }
  const arquivo = path.join(ROOT, 'imagens/web/sala-pb.png');
  await sharp(px, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9, palette: true, colours: 2 }).toFile(arquivo);
  console.log('png', arquivo, w + 'x' + h);
})().catch((e) => { console.error(e); process.exit(1); });
