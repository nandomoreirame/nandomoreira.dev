import { absoluteUrl } from '../aeo/urls';

/**
 * The /releases page: what each release of the current version shipped, at
 * the level of features, never commit by commit. The first release sums up
 * everything from the first commit (2026-08-08) to the day the page was
 * written, read from the git log.
 */
export const RELEASES_PATH = '/releases';

export const RELEASES_LEAD =
  'O que entrou em cada lançamento desta versão do site, por recurso e não por commit. O primeiro junta tudo o que foi feito desde o primeiro commit desta versão.';

export interface ReleaseGroup {
  /** Anchor of the group on the page. */
  id: string;
  title: string;
  items: string[];
}

export interface Release {
  version: string;
  /** ISO date of the release (YYYY-MM-DD). */
  date: string;
  title: string;
  summary: string;
  groups: ReleaseGroup[];
}

export const RELEASES: Release[] = [
  {
    version: 'v17.746',
    date: '2026-10-19',
    title: 'Astro, do zero',
    summary:
      'A primeira release da versão 17: o site reescrito do zero em Astro entre 8 de agosto e 19 de outubro de 2026, com portfólio, blog, páginas pessoais, uma landing de serviços e uma camada inteira feita para agentes de IA lerem.',
    groups: [
      {
        id: 'v17-base',
        title: 'Base',
        items: [
          'Astro 7 com renderização no servidor, publicado no Firebase App Hosting com rollout automático a cada push em main.',
          'Conteúdo em Content Collections validadas por Zod, com uma camada de acesso única que alimenta todas as páginas e rotas de máquina.',
          'Design system em tokens do Tailwind CSS 4, com portões automáticos de contraste WCAG AA e de valores fora da escala.',
          'JavaScript no navegador só por exceção nomeada: um script por página, com orçamento de tamanho verificado no build.',
          'Homologação no homelab, com os rascunhos visíveis, antes de publicar.',
        ],
      },
      {
        id: 'v17-portfolio',
        title: 'Portfólio e lab',
        items: [
          'Cases de clientes e produtos em /portfolio e projetos pessoais em /lab, cada um com links de evidência e JSON-LD próprio.',
          'Arte generativa por case, desenhada no servidor a partir de uma semente, com um motivo por tipo de produto.',
          'Imagens dos cases em tamanho real com lightbox sem JavaScript.',
        ],
      },
      {
        id: 'v17-blog',
        title: 'Blog',
        items: [
          'Posts migrados do Gatsby e do Notion, com o arquivo de 2015 a 2019 separado por ano e RSS.',
          'Página do post redesenhada: índice fixo que marca a seção lida, tempo de leitura, posts relacionados e card do autor.',
          'Modo leitura com fundo, tamanho, entrelinha e largura escolhidos pelo leitor.',
          'Blocos de código com barra de título, Raw e Copiar, e links para resumir o post com Claude, Google AI ou ChatGPT.',
          'Newsletter com confirmação por e-mail.',
        ],
      },
      {
        id: 'v17-agentes',
        title: 'Para agentes de IA',
        items: [
          'llms.txt, llms-full.txt, ai-index.json e AGENTS.md gerados da mesma fonte das páginas.',
          'Servidor MCP em /api/mcp com as ferramentas de perfil, projetos, currículo e disponibilidade.',
          'POST /api/hire para um agente mandar a proposta de projeto em nome de alguém.',
          'Currículo em JSON Resume e em texto puro.',
          'Visão IA de cada página: o markdown em <página>.md e a página como o agente lê em <página>/ia, com o seletor Humano | IA.',
        ],
      },
      {
        id: 'v17-paginas',
        title: 'Páginas',
        items: [
          '/sobre com retrato ilustrado animado, linha do tempo da carreira e a stack com ícones.',
          '/now com o que estou ouvindo no Spotify, jogando no Xbox e commitando no GitHub, com prévia das músicas.',
          '/setup com hardware, sistema, terminal, agentes, apps e homelab.',
          '/contato como o único formulário do site, com e-mails em React Email e WhatsApp.',
          '/curriculo, /mcp e /privacidade.',
          '/version e /releases, contando a história do site e desta versão.',
        ],
      },
      {
        id: 'v17-servicos',
        title: 'Serviços',
        items: [
          'Landing de vendas em contrate.nandomoreira.dev, com catálogo de serviços validado por Zod, depoimentos reais, trabalhos anteriores e FAQ.',
          'Card de disponibilidade e chamadas para orçamento ligando o site à landing.',
        ],
      },
      {
        id: 'v17-navegacao',
        title: 'Navegação',
        items: [
          'Paleta de comandos com Ctrl K, busca sem acento nem caixa em posts, cases e serviços, e atalhos G + letra.',
          'Transições entre páginas, entradas em camadas e o campo de pontos que segue o ponteiro.',
          'Menu em tela cheia no celular e PWA instalável.',
        ],
      },
      {
        id: 'v17-medicao',
        title: 'SEO e medição',
        items: [
          'Card de compartilhamento desenhado por página no build, títulos e descrições ajustados para a busca e sitemap com datas.',
          'Medição de visitas no servidor, sem script de terceiros, com o visitante anonimizado por uma chave HMAC diária.',
          'Links de saída contados por /go e o stats, uma TUI em Rust para ler visitas, funil e leads.',
        ],
      },
    ],
  },
];

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
    lines.push(`## ${release.version}: ${release.title} (${release.date})`, '', release.summary, '');
    for (const group of release.groups) {
      lines.push(`### ${group.title}`, '', ...group.items.map(item => `- ${item}`), '');
    }
  }

  return lines.join('\n');
};
