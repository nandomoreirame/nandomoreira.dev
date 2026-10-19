import { absoluteUrl } from '../aeo/urls';

/**
 * The /releases page: one release per day of work on the current version,
 * newest first, told by the macro features that shipped that day, never commit
 * by commit. Read from the git log on 2026-10-19; the commit count in each tag
 * is the repository total at the end of that day. Days whose commits changed
 * nothing a visitor sees (2026-08-12 and 2026-10-12) are left out.
 */
export const RELEASES_PATH = '/releases';

export const RELEASES_LEAD =
  'Um lançamento por dia de trabalho desde o primeiro commit desta versão, em 8 de agosto de 2026. Cada dia conta as features grandes que entraram, não os commits.';

export interface Release {
  /** v<site version>.<commits in the repository at the end of the day>. */
  version: string;
  /** ISO date of the day (YYYY-MM-DD). */
  date: string;
  title: string;
  summary: string;
  /** The macro features of the day, two to six. */
  highlights: string[];
}

export const RELEASES: Release[] = [
  {
    version: 'v17.753',
    date: '2026-10-19',
    title: 'Busca, versões e lançamentos',
    summary: 'O site ganhou uma paleta de comandos, passou a contar a própria história e fechou o caminho do contato.',
    highlights: [
      'Paleta de comandos com Ctrl K, busca sem acento nem caixa em posts, cases e serviços, e atalhos G + letra.',
      '/version com todas as versões do site desde 2015 e /releases com o que entrou em cada dia desta.',
      '/contato como o único formulário do site, com WhatsApp, e e-mails de lead e de newsletter em React Email.',
      'Card do GitHub no /now, com o calendário de contribuições do ano e o último commit.',
      'Aba de vendas no stats, com o funil da landing e a empresa de quem baixa o currículo.',
    ],
  },
  {
    version: 'v17.686',
    date: '2026-10-18',
    title: 'Landing de serviços',
    summary: 'Nasceu a landing de vendas, separada do site pessoal e servida no próprio subdomínio.',
    highlights: [
      'Landing em contrate.nandomoreira.dev, com hero, serviços, etapas do trabalho, ferramentas e FAQ.',
      'Catálogo de serviços validado por Zod e uma página de detalhe para o site institucional.',
      'Depoimentos reais e trabalhos anteriores, com as imagens num lightbox sem JavaScript.',
      'Formulário que aceita o serviço escolhido e o contato por e-mail ou telefone, com WhatsApp flutuante.',
    ],
  },
  {
    version: 'v17.634',
    date: '2026-10-17',
    title: 'Blog redesenhado e newsletter',
    summary: 'A página do post e a listagem do blog foram redesenhadas, e o site ganhou uma newsletter.',
    highlights: [
      'Página do post redesenhada, com tempo de leitura, pontos-chave e blocos de código com barra de título, Raw e Copiar.',
      'Blog paginado em cards, e a home com os três posts mais recentes e a chamada para o MCP.',
      'Newsletter com inscrição por e-mail, no blog e na home.',
      'Seções numeradas com índice no /now e no /setup, e o /contato em duas colunas.',
    ],
  },
  {
    version: 'v17.585',
    date: '2026-10-16',
    title: 'Leitura',
    summary: 'O dia foi de quem lê: o post ficou ajustável e passou a ter um índice que acompanha a leitura.',
    highlights: [
      'Modo leitura com fundo, tamanho, entrelinha e largura escolhidos pelo leitor.',
      'Índice fixo do post, que marca a seção sendo lida.',
      'Links para resumir o post com Claude, Google AI ou ChatGPT.',
      'Disponibilidade num ponto pulsante no header e no footer, e no /now o que estou estudando.',
    ],
  },
  {
    version: 'v17.567',
    date: '2026-10-15',
    title: 'Movimento',
    summary: 'As páginas passaram a entrar e sair com animação, sempre respeitando quem prefere menos movimento.',
    highlights: [
      'Transições entre páginas e entradas em camadas.',
      'Menu com sublinhado animado, marcando a seção atual também em posts e cases.',
    ],
  },
  {
    version: 'v17.556',
    date: '2026-10-14',
    title: 'Medição própria e o stats',
    summary: 'O site passou a medir as próprias visitas sem script de terceiros, e ganhou uma TUI para ler os números.',
    highlights: [
      'Medição de visitas no servidor, com o visitante anonimizado por uma chave HMAC diária e um pixel para as páginas pré-renderizadas.',
      'Links de saída contados por /go, e a jornada do dia anexada ao e-mail de cada lead.',
      'stats, uma TUI em Rust que lê visitas, funil, tráfego, cidades e uso do MCP.',
      'Retrato ilustrado e animado no /sobre e atrás do hero da home.',
    ],
  },
  {
    version: 'v17.490',
    date: '2026-10-13',
    title: 'SEO e cards de compartilhamento',
    summary: 'Cada página ganhou um card de compartilhamento próprio, e a busca passou a ver o site do jeito certo.',
    highlights: [
      'Card de compartilhamento desenhado por página no build.',
      'Títulos e descrições ajustados para a busca, artigos ligados ao autor e sitemap com datas.',
      'Domínio do App Hosting fora do índice, e as cópias em markdown apontando para a página humana.',
    ],
  },
  {
    version: 'v17.454',
    date: '2026-10-11',
    title: 'A página /now',
    summary: 'Nasceu o /now, com o que estou ouvindo, jogando e commitando, e o site ficou instalável.',
    highlights: [
      '/now com repositórios ativos do GitHub, músicas do Spotify com capa e prévia, e jogos do Xbox com progresso.',
      'Cada fonte do /now carrega sozinha, com cache e tempo limite, sem derrubar a página.',
      '/setup com hardware, sistema, terminal, agentes e homelab.',
      'Menu em tela cheia no celular e PWA instalável.',
      'Currículo para baixar e a home abrindo com os posts mais recentes.',
    ],
  },
  {
    version: 'v17.364',
    date: '2026-10-10',
    title: 'Mais blog e mais lab',
    summary: 'O blog e o lab cresceram, e passou a existir uma homologação para ver rascunhos antes de publicar.',
    highlights: [
      "Os sete artigos do blog da A's Code republicados, posts relacionados e arte gerada para posts sem capa.",
      'Novos cases no lab, entre eles AI Bar, Gistbar, FlipClock e Forja Plugins, e os outros repositórios abertos no fim da lista.',
      'Imagens dos cases em tamanho real, com lightbox sem JavaScript.',
      'Blocos de código com Raw e Copiar.',
      'Homologação no homelab, com os rascunhos visíveis.',
    ],
  },
  {
    version: 'v17.305',
    date: '2026-10-09',
    title: 'Velocidade e dados estruturados',
    summary: 'Um dia de acabamento: o site ficou mais rápido e mais legível para buscadores.',
    highlights: [
      'CSS embutido no HTML e fontes com fingerprint e preload, sem requisição bloqueando a renderização.',
      'JSON-LD de Organization, WebPage e HowTo na home.',
      'Seção "Sobre esse site" no /sobre e os cases do Daybar e do Desktop Sticky Notes.',
    ],
  },
  {
    version: 'v17.289',
    date: '2026-10-08',
    title: 'Arte generativa e a visão IA',
    summary: 'Os cases ganharam arte própria, e cada página passou a ter uma versão para agentes de IA.',
    highlights: [
      'Arte generativa por case, desenhada no servidor a partir de uma semente, com um motivo por tipo de produto.',
      'O campo de pontos que segue o ponteiro, espalhado por todas as páginas.',
      'Visão IA de cada página: o markdown em <página>.md e a página como o agente lê em <página>/ia, com o seletor Humano | IA.',
      'Formulário de contato ligado ao /api/hire, /mcp no menu e a política de privacidade.',
    ],
  },
  {
    version: 'v17.219',
    date: '2026-08-09',
    title: 'Portfólio, blog e a camada para agentes',
    summary: 'O maior dia desta versão: o site ganhou conteúdo, páginas e tudo o que um agente de IA precisa para ler.',
    highlights: [
      'Conteúdo em Content Collections validadas por Zod, com uma camada de acesso única.',
      'Cases em /portfolio e /lab, cada um com links de evidência e JSON-LD próprio, e a home montada a partir deles.',
      'Blog migrado do Gatsby e do Notion, com o arquivo de 2015 a 2019 separado e RSS.',
      'llms.txt, AGENTS.md, sitemap e robots gerados da mesma fonte das páginas.',
      'Currículo em JSON Resume e em texto, servidor MCP em /api/mcp e POST /api/hire.',
      '/sobre e a primeira página de contato.',
    ],
  },
  {
    version: 'v17.44',
    date: '2026-08-08',
    title: 'A fundação',
    summary: 'O primeiro commit desta versão: Astro com renderização no servidor, provado no Firebase App Hosting.',
    highlights: [
      'Astro com SSR publicado no Firebase App Hosting, com uma rota de saúde como prova.',
      'Design system em tokens do Tailwind CSS 4, com portão automático de contraste WCAG AA.',
      'Inter e JetBrains Mono servidas localmente, e respeito a quem prefere menos movimento.',
      'Os primeiros componentes: botão, badge de tecnologia, bloco de código e card de projeto.',
    ],
  },
];

/** Anchor of a day on the page: "dia-2026-10-19". */
export const releaseAnchor = (release: Pick<Release, 'date'>): string => `dia-${release.date}`;

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Index entry of a day: "19 out · v17.753". */
export const releaseTocLabelOf = (release: Pick<Release, 'date' | 'version'>): string => {
  const [, month, day] = release.date.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} · ${release.version}`;
};

const DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "19 de outubro de 2026". */
export const releaseDateOf = (date: string): string => DATE.format(new Date(`${date}T00:00:00Z`));

export const releasesMarkdown = ({ site }: { site: URL }): string => {
  const lines: string[] = [
    '---',
    'title: Lançamentos',
    `url: ${absoluteUrl(site, RELEASES_PATH)}`,
    '---',
    '',
    '# Lançamentos',
    '',
    RELEASES_LEAD,
    '',
  ];

  for (const release of RELEASES) {
    lines.push(
      `## ${releaseDateOf(release.date)}: ${release.title} (${release.version})`,
      '',
      release.summary,
      '',
      ...release.highlights.map(item => `- ${item}`),
      '',
    );
  }

  return lines.join('\n');
};
