// Cópias web: só redução de tamanho (até ~1,5x o tamanho em que aparecem), no enquadramento original.
// Sem borrão, filtro, retoque ou zoom. Recortes permitidos, só tirando faixas (nada é ampliado):
//   - aula3.jpeg: sem os 200 px de cima (de 937), onde aparecem rostos de estudantes (fica 1005x737).
//   - formatura.jpeg (1200x1600): só as laterais; fica de 13% a 82% da largura (x = 156 a 984) e a altura toda
//     (fica 828x1600). A pessoa e a frase "#OsMelhores SeFormamAqui" ficam inteiras e centralizadas.
// Os originais em imagens/ são só leitura. Uso: node imagens-web.cjs [arquivo-de-saída ...] (precisa de sharp na pasta atual)
// Com nomes de saída, gera só esses (ex.: node imagens-web.cjs formatura-recorte.jpg).
const path = require('path'), { createRequire } = require('module');
const sharp = createRequire(path.join(process.cwd(), 'noop.js'))('sharp');
const SRC = path.join(__dirname, 'imagens'), OUT = path.join(__dirname, 'imagens', 'web');

const jobs = [
  // Destaque do TCC: defesa 1:1 e CONCISTEC 16:9 inteiras; formatura sem as laterais (828x1600, altura toda)
  { de: 'TCC.jpeg', para: 'tcc-defesa.jpg', largura: 460 },
  { de: 'formatura.jpeg', para: 'formatura-recorte.jpg', recorte: { left: 156, top: 0, width: 828, height: 1600 }, largura: 600 },
  { de: 'consistec.png', para: 'concistec-apresentacao.jpg', largura: 800 },
  // Agora: aula3 sem os 200 px de cima (rostos de estudantes) e aula, inteira; só reduzidas
  { de: 'aula3.jpeg', para: 'aula-sala-notebook.jpg', recorte: { left: 0, top: 200, width: 1005, height: 737 }, largura: 740 },
  { de: 'aula.jpeg', para: 'aula-tv-celulares.jpg', largura: 800 },
];

(async () => {
  const so = process.argv.slice(2)
  for (const j of jobs.filter((x) => !so.length || so.includes(x.para))) {
    let img = sharp(path.join(SRC, j.de));
    if (j.recorte) img = img.extract(j.recorte);
    if (j.largura) img = img.resize({ width: j.largura, withoutEnlargement: true });
    const r = await img.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(path.join(OUT, j.para));
    console.log(j.para, r.width + 'x' + r.height, Math.round(r.size / 1024) + 'KB');
  }
})();
