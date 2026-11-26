// Conteúdo do portfólio. Só fatos reais. Imagens: troque `src` pelo arquivo real.
// Campo vazio ('' ou null) não aparece na página: preencha quando tiver o fato.

export type Illo =
  | 'portrait' | 'class' | 'process'
  | 'rpalex' | 'admin' | 'chromebook' | 'health' | 'portal' | 'canhoto' | 'quiz'

export interface Media {
  src: string
  width?: number // tamanho real do arquivo web (reserva o espaço)
  height?: number
  alt: string
}

/* ---------- Abertura ---------- */
export const hero = {
  lead: 'Comecei no atendimento, ouvindo demandas e registrando chamados. Nas escolas, descobri como automatizar as tarefas que se repetiam toda semana. Hoje, uno tecnologia e sala de aula: dou aula de TI e desenvolvo ferramentas pensadas para facilitar o dia a dia de quem ensina e de quem aprende.',
  // os três números da abertura são contados do conteúdo: veja `heroFacts`, no fim do arquivo
  annotation: 'eu, dando aula',
  now: 'Hoje dou aula no ensino técnico, no interior do Maranhão, para turmas de Informática para Internet e de Programação de Jogos Digitais. Quando falta equipamento no laboratório, a aula precisa continuar. É daí que vem o app que estou começando a desenvolver: offline-first, em TypeScript, com módulos de ilustração, simulação e questionário que rodam no celular sem internet e guardam as respostas no aparelho até a conexão voltar.',
  // Opcional: uma situação real de sala de aula, em uma frase. Vazio = não aparece.
  classroomLine: '',
}

/* ---------- Retrato em pixels (abertura) ----------
   A foto nunca aparece: só é lida no build para gerar o pontilhado (retrato-build.cjs).
   Para trocar de foto, mude só `retratoAtivo` e rode o build de novo.
   Frações: `quadro` é relativo à foto inteira; `mascara` é relativa ao quadro (0–1). */
export type RetratoId = 'perfil2' | 'perfil1'
export const retratoAtivo: RetratoId = 'perfil2'

export interface Retrato {
  foto: string // arquivo original, só leitura
  quadro: { x: number; y: number; w: number; h: number } // recorte justo no rosto, proporção 4:5
  mascara: { cx: number; cy: number; rx: number; ry: number; rxFim: number; ryFim: number; borda: number; cantos: number } // inteiro dentro de rx×ry; papel a partir de rxFim×ryFim; `borda` e `cantos`: faixa junto às quatro bordas (cantos arredondados) que termina em papel
  ajuste: { pBaixo: number; pAlto: number; gama: number; local: number; sombra: number; luz: number }
}

export const retratos: Record<RetratoId, Retrato> = {
  // Cabeça, cabelo e o alto dos ombros, centrado no rosto. Tom suave, sem contorno gravado.
  perfil2: {
    foto: 'imagens/perfil 2.jpeg',
    quadro: { x: 0.125, y: 0.203, w: 0.833, h: 0.781 },
    mascara: { cx: 0.5, cy: 0.42, rx: 0.33, ry: 0.42, rxFim: 0.6, ryFim: 0.77, borda: 0.12, cantos: 0.4 },
    ajuste: { pBaixo: 0.01, pAlto: 0.99, gama: 0.75, local: 0, sombra: 0, luz: 1 },
  },
  perfil1: {
    foto: 'imagens/Perfil 1.jpeg',
    quadro: { x: 0.117, y: 0.184, w: 0.767, h: 0.719 },
    mascara: { cx: 0.5, cy: 0.42, rx: 0.33, ry: 0.42, rxFim: 0.6, ryFim: 0.77, borda: 0.12, cantos: 0.4 },
    ajuste: { pBaixo: 0.01, pAlto: 0.99, gama: 0.75, local: 0, sombra: 0, luz: 1 },
  },
}

/* ---------- Projetos: três escalas ---------- */
export interface Project {
  id: string
  name: string
  desc: string
  role: string // papel real (Autoria, Consultoria, Orientação técnica); vazio = não aparece
  stack?: string
  media?: Media
  link?: { href: string; on: boolean } // on: false = link preparado, ainda não aparece
}

export const gallery = {
  lead: 'Alguns nasceram no trabalho. Outros, de curiosidade.',
}

// TCC em destaque, no topo de "Meus projetos": um mosaico em que o texto é um bloco do próprio mosaico.
// Todas as fotos no enquadramento original, inteiras (sem corte e sem moldura forçada).
// Ordem do DOM = ordem cronológica (defesa, formatura, CONCISTEC); a grade posiciona cada uma.
export interface FotoLegenda { media: Media; legenda: string }
export const tcc = {
  id: 'rpa',
  name: 'RPA',
  subtitle: 'como estratégia de interoperabilidade entre sistemas de gestão escolar e plataformas educacionais digitais', // continua o título "RPA"
  desc: 'Robô em UiPath que mantém os cadastros de estudantes alinhados entre o sistema de gestão escolar e a plataforma educacional, compara os registros, corrige sozinho o que é seguro e envia os casos ambíguos para revisão humana. Desenvolvido como observadora participante do processo.',
  role: '', // sem papel no bloco do RPA
  facts: ['Nota 10 no TCC', 'Artigo aceito no CONCISTEC 2026'],
  article: {
    href: 'https://drive.google.com/file/d/1zqF-ijFL9t6fMANF_v6V6kIm8vNt9MEX/view?usp=drive_link',
  },
  // Defesa 1:1 e CONCISTEC 16:9 inteiras; formatura só sem as laterais (de 13% a 82% da largura, altura toda)
  mosaico: [
    { legenda: 'Defesa do TCC', media: { src: 'imagens/web/tcc-defesa.jpg', alt: 'Hitawana apresentando o TCC em sala de aula.', width: 460, height: 460 } },
    { legenda: 'Formatura, agosto de 2026', media: { src: 'imagens/web/formatura-recorte.jpg', alt: 'Hitawana de beca e capelo, erguendo o canudo no palco da formatura.', width: 600, height: 1159 } },
    { legenda: 'Artigo apresentado no CONCISTEC 2026', media: { src: 'imagens/web/concistec-apresentacao.jpg', alt: 'Capa da apresentação do artigo no CONCISTEC 2026, com Hitawana na câmera, no canto inferior esquerdo.', width: 800, height: 450 } },
  ] as FotoLegenda[],
}

// Meus projetos: uma lista só, sem imagem. Coluna da direita: só o papel (as ferramentas ficam no calendário do stack).
export const compact: Project[] = [
  { id: 'google-admin', name: 'Usuários no Google Admin', desc: 'Criação de contas no Google Admin automatizada com Python e Playwright. O robô executa o cadastro no console e passa por travas antes de qualquer ação destrutiva, trocando um trabalho manual repetitivo por um fluxo previsível.', role: 'Autoria' },
  { id: 'chromebooks', name: 'Reserva de Chromebooks', desc: 'Construí um sistema de reserva em cinco módulos.', role: 'Autoria' },
  {
    id: 'divjus', name: 'Portal DivJus',
    desc: 'Site institucional e portal de artigos jurídicos para um escritório de advocacia: áreas de atuação, equipe e artigos filtrados por área.',
    role: 'Consultoria',
    // Link "Ver site →": troque `on` para true quando puder publicar
    link: { href: 'https://divjus-advocacia-not-cias-jur-dicas.ai.studio', on: false },
  },
  { id: 'tiraco', name: 'Tiracó', desc: 'RPG educativo sobre a cultura das quebradeiras de coco do Maranhão. Premiado no XVII Encontro Científico da UNDB, em 2024.', role: 'Autoria' },
  { id: 'profile-health', name: 'Profile Analyts Health', desc: 'SPA sem servidor que lê a planilha .xlsx do corredor e projeta o tempo da próxima prova: média móvel ponderada quando a distância é parecida com o histórico, equação de Riegel quando há salto de distância.', role: 'Autoria' },
  { id: 'canhoto', name: 'Sistema Canhoto', desc: 'Protótipo idealizado como solução para a gestão de notas de uma escola', role: 'Orientação técnica' },
  { id: 'jogos', name: 'Jogos educativos de quiz', desc: 'Jogo da Comunicação, Human or AI? e Show de Tradições: quizzes educativos personalizados para o tema de cada evento da escola. Construídos com o público idealizador, funcionam como ponte entre o conteúdo e a ferramenta técnica, aumentando a imersão dos participantes.', role: 'Orientação técnica' },
]

/* ---------- Agora ----------
   Parágrafo e o botão "Conhecer o app"; ao lado, uma composição: a frente de uma sala de aula em pixels
   (gerada, sem foto: sala.ts / sala-core.ts) com as duas fotos reais "presas" no quadro branco, por cima,
   e a nota "eu, dando aula" apontando para aula3.
   Sem rostos de estudantes nem nomes legíveis. O parágrafo é hero.now, sem mudança. */
export const agora = {
  kicker: 'No ensino técnico desde setembro de 2026',
  anotacao: hero.annotation,
  selo: { nome: 'Ilustração em pixels de uma sala de aula', png: 'imagens/web/sala-pb.png', width: 720, height: 360 },
  legenda: 'Duas fotos de aula: Hitawana em sala com o notebook aberto, e a sala com a TV e dois celulares com jogos em pixel dos estudantes.',
  texto: hero.now,
  fotos: [
    // aula3: o original sem os 200 px de cima (onde aparecem rostos de estudantes), só reduzido
    { src: 'imagens/web/aula-sala-notebook.jpg', alt: 'Hitawana em sala de aula, com o notebook aberto na mesa.', width: 740, height: 543 },
    { src: 'imagens/web/aula-tv-celulares.jpg', alt: 'Sala de aula com a TV mostrando o slide da aula e dois celulares com jogos em pixel feitos pelos estudantes.', width: 800, height: 600 },
  ] as Media[],
}

/* App em construção (botão "Conhecer o app", na seção Agora).
   Com `href`, o botão abre o link numa nova aba. Vazio: o botão abre o aviso "Em andamento". */
export const app = {
  href: '',
  titulo: 'Em construção',
  aviso: 'O app está em desenvolvimento. O link aparece aqui quando a primeira versão for publicada.',
}

/* Currículo em PDF (publicado junto com o artifact). Baixado pelo botão da abertura e pelo item "Currículo" do menu. */
export const curriculo = { href: 'curriculo/Hitawana-Araujo-Curriculo.pdf', arquivo: 'Hitawana-Araujo-Curriculo.pdf', nome: 'Baixar currículo em PDF' }

export const pullQuote = 'Quando falta equipamento, a aula precisa continuar.'

/* ---------- Stack 2026: meu ano, mês a mês ----------
   Todas as datas desta seção ficam aqui. Precisão de quinzena.
   Unidades: quinzenas de 2026. ini('abr') = início de abril; fim('abr') = fim de abril;
   FIM_AGO = segunda quinzena de agosto. 'antes' = começou em 2025. 'hoje' = continua.
   null = a confirmar: a marca não aparece. A linha some só se não tiver nenhuma marca confirmada.
   Privacidade: contexto só pelo tipo (Estágio, Trabalho CLT, TCC, Cliente, Projeto pessoal,
   Ensino técnico, Curso). Nunca o nome do empregador ou da escola. */
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const
type Mes = (typeof MESES)[number]
const ini = (m: Mes) => MESES.indexOf(m) * 2
const fim = (m: Mes) => MESES.indexOf(m) * 2 + 2
const mes = (m: Mes) => MESES.indexOf(m) // mês de um marco (0–11)
const FIM_AGO = 15

export interface StackMark {
  kind: 'uso' | 'estudo' // uso = trabalho ou projeto; estudo = curso ou estudo próprio
  ctx: string // tipo de contexto
  what?: string // projeto ou curso, quando houver
  start: number | 'antes' | null
  end: number | 'hoje' | null
  endText?: string // fim com precisão de dia, só para o texto
}
/* Marco = um momento datado que prova algo: uma entrega, um curso concluído, um artigo ou o início de um projeto.
   Sem a data exata, fica no último mês do período de uso daquele projeto (é quando o trabalho foi entregue).
   No máximo dois marcos por linha (marcos do mesmo mês viram um ponto só). O nome do projeto é o mesmo de "Meus projetos". */
export interface StackMilestone { month: number | null; name: string; ctx: string }
export const STACK_GROUPS = [
  'Linguagens', 'Desenvolvimento web', 'Dados', 'Análise e documentação',
  'Automação', 'Administração de sistemas', 'Ensino técnico',
] as const
export type StackGroup = (typeof STACK_GROUPS)[number]

export interface StackRow {
  name: string // nome de mercado, o que um recrutador procura
  group: StackGroup
  marks: StackMark[]
  milestones?: StackMilestone[]
}

export const stack = {
  lead: 'Cada linha é uma ferramenta: quando estudei, quando coloquei em prática e onde estou agora.',
  listNote: 'Aqui entram também as ferramentas que não aparecem no calendário.',
}

// Períodos de uso de Python, repetidos em JavaScript e TypeScript (mesmos períodos e contextos)
const usoPython = (): StackMark[] => [
  { kind: 'uso', ctx: 'Estágio', start: 'antes', end: fim('abr') },
  { kind: 'uso', ctx: 'Trabalho CLT', start: ini('abr'), end: null }, // fim: [a confirmar]
]
const CLT_ABR_AGO: StackMark = { kind: 'uso', ctx: 'Trabalho CLT', start: ini('abr'), end: fim('ago'), endText: '27 de ago' }

export const stackYear: StackRow[] = [
  // Linguagens
  {
    name: 'Python', group: 'Linguagens',
    marks: [...usoPython(), { kind: 'estudo', ctx: 'Curso', start: ini('jan'), end: fim('jan') }],
    milestones: [
      { month: mes('jan'), name: 'Fundamentos de Python e Dados (Alura)', ctx: 'Curso' },
      { month: mes('jan'), name: 'Estatística e Machine Learning (Alura)', ctx: 'Curso' },
      { month: mes('abr'), name: 'Automate Cybersecurity Tasks with Python (Google)', ctx: 'Curso' },
    ],
  },
  { name: 'JavaScript', group: 'Linguagens', marks: usoPython() },
  {
    name: 'TypeScript', group: 'Linguagens',
    // estudo atual: da segunda quinzena de setembro até hoje
    marks: [...usoPython(), { kind: 'estudo', ctx: 'Projeto pessoal', what: 'app de ensino offline', start: ini('set') + 1, end: 'hoje' }],
    milestones: [{ month: mes('nov'), name: 'App de ensino offline: início', ctx: 'Projeto pessoal' }],
  },

  // Desenvolvimento web
  { name: 'Next.js', group: 'Desenvolvimento web', marks: [{ kind: 'uso', ctx: 'Estágio', start: 'antes', end: fim('abr') }] },
  { name: 'APIs REST', group: 'Desenvolvimento web', marks: [{ ...CLT_ABR_AGO }] },

  // Dados
  {
    name: 'SQL e bancos de dados', group: 'Dados',
    marks: [
      // primeiro o estudo, depois o uso: as duas marcas se encostam (fim de abril = início de maio)
      { kind: 'estudo', ctx: '', start: ini('jan'), end: fim('abr') }, // sem contexto: dica e leitor dizem só "Estudo"
      { kind: 'uso', ctx: 'Projetos paralelos', start: ini('mai'), end: fim('jul') },
      { kind: 'uso', ctx: 'Trabalho CLT', what: 'SQL', start: null, end: null }, // [período de SQL no trabalho, se houver]
    ],
    // entregas dos projetos paralelos, no último mês do uso (julho): um ponto só, com os dois nomes
    milestones: [
      { month: mes('jul'), name: 'Sistema Canhoto', ctx: 'Projetos paralelos' },
      { month: mes('jul'), name: 'Portal DivJus', ctx: 'Projetos paralelos' },
    ],
  },

  // Análise e documentação
  // No calendário, uma linha só (mesmo período); na lista "Tudo que uso" continuam separados
  { name: 'Requisitos e documentação técnica', group: 'Análise e documentação', marks: [{ ...CLT_ABR_AGO }] },

  // Automação (só rótulo de grupo; cada ferramenta tem sua linha)
  {
    name: 'Playwright', group: 'Automação',
    marks: [{ kind: 'uso', ctx: 'Trabalho CLT', start: ini('mar'), end: fim('ago') }],
    milestones: [{ month: mes('ago'), name: 'Usuários no Google Admin', ctx: 'Trabalho CLT' }], // entrega no último mês do uso
  },
  {
    name: 'UiPath', group: 'Automação',
    marks: [
      { kind: 'uso', ctx: 'TCC', what: 'RPA', start: ini('jan'), end: fim('jun') },
      { kind: 'estudo', ctx: '', start: ini('jan'), end: fim('fev') }, // hachurado por cima do uso, como em Python; sem contexto
    ],
    milestones: [
      { month: mes('jun'), name: 'Entrega do TCC (RPA), nota 10', ctx: 'TCC' }, // último mês do uso
      { month: mes('out'), name: 'Artigo apresentado no CONCISTEC 2026', ctx: 'Artigo' }, // depois da barra, no trilho vazio
    ],
  },

  // Administração de sistemas
  {
    name: 'Google Workspace Admin', group: 'Administração de sistemas',
    marks: [{ kind: 'uso', ctx: 'Estágio e Trabalho CLT', start: 'antes', end: fim('ago'), endText: '27 de ago' }],
  },

]

/* Períodos de contexto: não são stacks, não entram no tempo nem na lista "Tudo que uso".
   Aparecem como a última linha do calendário, com barra vazada (só contorno). */
export interface StackPeriod { label: string; detalhe: string; start: number; end: number | 'hoje' }
export const stackPeriods: StackPeriod[] = [
  { label: 'Docência em TI', detalhe: 'ensino médio técnico', start: ini('set'), end: 'hoje' },
]

/* Lista completa ("Tudo que uso"): só uso, nunca tempo, nível ou porcentagem.
   now: true = uso hoje (ponto azul). Inclui ferramentas que ainda não estão no calendário. */
export const stackAll: { group: string; items: { name: string; now?: boolean }[] }[] = [
  { group: 'Linguagens', items: [{ name: 'Python' }, { name: 'JavaScript' }, { name: 'TypeScript', now: true }] },
  { group: 'Desenvolvimento web', items: [{ name: 'Next.js' }, { name: 'APIs REST' }, { name: 'Tailwind CSS' }, { name: 'Git e GitHub' }] },
  { group: 'Dados', items: [{ name: 'SQL' }, { name: 'Supabase', now: true }, { name: 'Firebase', now: true }, { name: 'Power BI' }, { name: 'Excel' }] },
  { group: 'Análise e documentação', items: [{ name: 'Levantamento de requisitos' }, { name: 'Documentação técnica' }] },
  { group: 'Automação', items: [{ name: 'Playwright' }, { name: 'UiPath' }] },
  { group: 'Administração de sistemas', items: [{ name: 'Google Workspace Admin' }, { name: 'Mosyle' }, { name: 'TOTVS RM' }] },
  { group: 'Design e jogos', items: [{ name: 'Figma' }, { name: 'Godot' }] },
]

export const stackAllYear = 'Google Workspace, Git e GitHub, documentação técnica'

/* Bloco "Em sala de aula" (abaixo do calendário): componentes com o nome oficial, sem datas por item */
export const teaching = {
  title: 'Em sala de aula',
  note: 'As disciplinas que leciono hoje no ensino médio técnico',
  courses: [
    {
      name: 'Técnico em Informática para Internet',
      components: ['Projeto de Aplicações Web', 'Qualidade e Teste de Software', 'Governança e Compliance em TI'],
    },
    {
      name: 'Técnico em Programação de Jogos Digitais',
      components: ['Teste de Jogos Digitais', 'Manutenção de Jogos Digitais', 'Planejamento e Publicação de Jogos Digitais', 'Governança e Compliance em TI'],
    },
  ],
}

/* ---------- Contato ---------- */
export const contact = {
  email: 'hitawanas.araujo@gmail.com',
  linkedin: 'https://www.linkedin.com/in/hitawana',
  github: 'https://github.com/hitawana',
  title: 'Entre em contato',
  lead: 'Para conversar sobre uma vaga ou um projeto, envie um e-mail ou uma mensagem no LinkedIn.',
  disponibilidade: 'Disponível para vagas e projetos', // linha abaixo do texto, com o quadradinho azul
}

/* ---------- Números da abertura ----------
   O primeiro é texto fixo. Os outros dois são contados do conteúdo, nunca digitados:
   projetos = o bloco do RPA + cada linha da lista; de autoria = papel "Autoria" (o RPA conta como autoria);
   stacks = linhas do calendário (a linha de contexto "Docência em TI" fica de fora: está em stackPeriods). */
const nProjetos = 1 + compact.length
const nAutoria = 1 + compact.filter((p) => p.role === 'Autoria').length
const nStacks = stackYear.length
export const heroFacts = [
  { value: 'Desde 2023', text: 'trabalhando com tecnologia' },
  { value: String(nProjetos), text: `projetos, ${nAutoria} deles de autoria` },
  { value: String(nStacks), text: 'stacks usadas ou estudadas em 2026' },
]
