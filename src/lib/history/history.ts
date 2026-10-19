import { absoluteUrl } from '../aeo/urls';

/**
 * The /version page: the versions of this site that survived as GitHub
 * repositories, and the technologies that passed through them. Others were
 * lost, so the count (and the tag) is approximate. It is also where the
 * version tag in the footer comes from (siteVersionTag).
 *
 * Commit counts and dates were read from the GitHub API on 2026-10-19 and are
 * frozen: those repositories are archived. The current one is counted live
 * from the GitHub API (commits.ts).
 */
export const HISTORY_PATH = '/version';

/** First commit of the first surviving repository (nandomoreira-jekyll-theme). */
export const FIRST_COMMIT_AT = '2015-11-12T18:44:48Z';

/** Whole years since the first commit; the page is server-rendered, so it turns on the anniversary. */
export const siteAgeYears = (now: Date): number => {
  const first = new Date(FIRST_COMMIT_AT);
  const years = now.getUTCFullYear() - first.getUTCFullYear();
  const anniversary = new Date(first);
  anniversary.setUTCFullYear(now.getUTCFullYear());
  return now < anniversary ? years - 1 : years;
};

export const HISTORY_LEAD =
  'Não sei ao certo quantas versões este site já teve; provavelmente mais de vinte. Estas são as que sobreviveram em repositórios no GitHub, da primeira em Jekyll até esta aqui.';

export const historyTitle = (now: Date): string => `Esse site faz ${siteAgeYears(now)} anos desde o primeiro commit 🎈`;

export interface SiteVersion {
  number: number;
  /** Repository under github.com/nandomoreirame. */
  repo: string;
  /** Short name of the version, usually its main framework. */
  name: string;
  /** Year and month of the first commit (YYYY-MM). */
  start: string;
  /** Year and month of the last commit; absent for the current version. */
  end?: string;
  /** Commits in the repository; the current one is counted at build time. */
  commits: number;
  stack: string[];
  summary: string;
}

/**
 * Commits of this repository when the history was written. The live count
 * comes from the GitHub API (commits.ts); this stands in when it cannot.
 */
export const RECORDED_COMMITS = 746;

export const SITE_VERSIONS: SiteVersion[] = [
  {
    number: 1,
    repo: 'nandomoreira-jekyll-theme',
    name: 'Jekyll',
    start: '2015-11',
    end: '2018-01',
    commits: 20,
    stack: ['Jekyll', 'Ruby', 'Sass', 'Compass', 'Gulp', 'Bower', 'GitHub Pages'],
    summary:
      'O primeiro nandomoreira.me: um tema Jekyll com Sass e Compass, compilado pelo Gulp, com as dependências de front-end pelo Bower. Acabou publicado como tema aberto no GitHub Pages.',
  },
  {
    number: 2,
    repo: 'portfolio-jekyll',
    name: 'Jekyll',
    start: '2016-01',
    end: '2016-06',
    commits: 21,
    stack: ['Jekyll', 'Ruby', 'Sass', 'Travis CI'],
    summary:
      'Um portfólio separado do blog, ainda em Jekyll, com deploy pelo Travis CI e o html-proofer conferindo os links antes de publicar.',
  },
  {
    number: 3,
    repo: 'nandomoreira.me-nuxt-theme',
    name: 'Nuxt',
    start: '2016-07',
    end: '2019-03',
    commits: 454,
    stack: ['Vue.js', 'Nuxt', 'Stylus', 'PWA', 'Disqus', 'Markdown'],
    summary:
      'Site e blog como SPA em Vue.js e Nuxt, com os posts em Markdown, PWA, Stylus e comentários pelo Disqus. Foram 454 commits, a versão mais trabalhada antes desta.',
  },
  {
    number: 4,
    repo: 'nandomoreira.me-html',
    name: 'HTML',
    start: '2016-08',
    end: '2016-08',
    commits: 2,
    stack: ['HTML', 'Nunjucks', 'Sass', 'Gulp'],
    summary:
      'Um recomeço em HTML puro, com templates Nunjucks, Sass com Bourbon e Neat e o Gulp de sempre. Durou um dia e dois commits.',
  },
  {
    number: 5,
    repo: 'middleman-blog',
    name: 'Middleman',
    start: '2017-10',
    end: '2018-01',
    commits: 10,
    stack: ['Middleman', 'Ruby', 'Slim', 'Sass', 'Gulp'],
    summary:
      'O blog em Middleman, com templates Slim, Sass, Gulp e um service worker gerado pelo sw-precache, numa época em que offline-first era a novidade.',
  },
  {
    number: 6,
    repo: 'old-nandomoreira.me',
    name: 'Nuxt',
    start: '2018-05',
    end: '2024-05',
    commits: 133,
    stack: ['Vue.js', 'Nuxt', 'Vuex', 'Stylus', 'PWA', 'Netlify'],
    summary:
      'De volta ao Nuxt, agora com Vuex, tradução por vue-i18n e a lista dos meus repositórios do GitHub direto na página, publicado na Netlify.',
  },
  {
    number: 7,
    repo: 'blog-nandomoreira',
    name: 'Jekyll',
    start: '2018-08',
    end: '2019-06',
    commits: 70,
    stack: ['Jekyll', 'Ruby', 'Vue.js', 'Bootstrap', 'Sass'],
    summary:
      'O blog voltou ao Jekyll, com Vue.js e Bootstrap por cima, os assets montados pelo Laravel Mix e cache offline pelo Workbox.',
  },
  {
    number: 8,
    repo: 'gatsby.nandomoreira.dev',
    name: 'Gatsby',
    start: '2019-03',
    end: '2020-06',
    commits: 135,
    stack: ['Gatsby', 'React', 'GraphQL', 'Stylus', 'Mailchimp', 'Netlify'],
    summary:
      'A mudança para o domínio nandomoreira.dev: Gatsby e React, posts em Markdown consultados por GraphQL, newsletter no Mailchimp e deploy na Netlify.',
  },
  {
    number: 9,
    repo: 'gatsby-blog.nandomoreira.dev',
    name: 'Gatsby',
    start: '2019-12',
    end: '2020-03',
    commits: 35,
    stack: ['Gatsby', 'React', 'TypeScript', 'Emotion', 'Netlify'],
    summary:
      'O blog separado em blog.nandomoreira.dev, ainda em Gatsby, agora com TypeScript e CSS em Emotion. Foi a primeira versão com TypeScript.',
  },
  {
    number: 10,
    repo: 'strapi.nandomoreira.dev',
    name: 'Strapi',
    start: '2020-08',
    end: '2020-08',
    commits: 1,
    stack: ['Strapi', 'Node.js', 'PostgreSQL'],
    summary:
      'Um CMS headless em Strapi com PostgreSQL para alimentar o site seguinte. Ficou no primeiro commit, no mesmo dia em que a versão em Next.js começou.',
  },
  {
    number: 11,
    repo: 'next.nandomoreira.dev',
    name: 'Next.js',
    start: '2020-08',
    end: '2021-08',
    commits: 29,
    stack: ['Next.js', 'React', 'TypeScript', 'Chakra UI', 'Sanity', 'Vercel'],
    summary: 'Next.js com Chakra UI e Framer Motion, o conteúdo no Sanity em vez do Strapi e o deploy na Vercel.',
  },
  {
    number: 12,
    repo: 'new.nandomoreira.dev',
    name: 'Next.js',
    start: '2021-07',
    end: '2021-07',
    commits: 1,
    stack: ['Next.js', 'React', 'TypeScript', 'Chakra UI', 'Jest'],
    summary:
      'Outro recomeço em Next.js e Chakra UI, desta vez com Jest configurado desde o início. Parou no primeiro commit.',
  },
  {
    number: 13,
    repo: 'remix-notion.nandomoreira.dev',
    name: 'Remix',
    start: '2022-04',
    end: '2022-04',
    commits: 24,
    stack: ['Remix', 'React', 'TypeScript', 'Notion', 'Sass', 'Vercel'],
    summary:
      'Remix com o Notion como CMS, feito em cinco dias e publicado na Vercel. Tinha um easter egg: quem digitasse "batman" em qualquer página ganhava chuva de confete e um vídeo do YouTube.',
  },
  {
    number: 14,
    repo: 'nandomoreira.dev-nextjs',
    name: 'Next.js',
    start: '2024-05',
    end: '2025-10',
    commits: 121,
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Notion', 'Resend', 'Biome'],
    summary:
      'Next.js com App Router, Tailwind CSS e shadcn/ui, os posts ainda no Notion, e-mail pelo Resend e o Biome no lugar do ESLint e do Prettier.',
  },
  {
    number: 15,
    repo: 'svelte-nandomoreira.dev',
    name: 'SvelteKit',
    start: '2025-10',
    end: '2025-12',
    commits: 99,
    stack: ['Svelte', 'SvelteKit', 'TypeScript', 'Bun', 'Tailwind CSS', 'Vitest', 'Playwright', 'Firebase'],
    summary:
      'SvelteKit com Bun e Tailwind CSS, testes em Vitest e Playwright e hospedagem no Firebase. Foi a primeira versão com um CLAUDE.md no repositório.',
  },
  {
    number: 16,
    repo: 'nandomoreira.dev-chat',
    name: 'Next.js',
    start: '2026-01',
    end: '2026-03',
    commits: 39,
    stack: ['Next.js', 'React', 'TypeScript', 'AI SDK', 'Tailwind CSS', 'Playwright', 'Firebase'],
    summary:
      'O portfólio virou uma conversa: uma página de chat em Next.js com o AI SDK, as respostas em streaming e o Firebase por trás.',
  },
  {
    number: 17,
    repo: 'nandomoreira.dev',
    name: 'Astro',
    start: '2026-08',
    commits: RECORDED_COMMITS,
    stack: ['Astro', 'TypeScript', 'Tailwind CSS', 'Zod', 'Vitest', 'MCP', 'Firebase'],
    summary:
      'Esta aqui: Astro com renderização no servidor no Firebase App Hosting, conteúdo em Markdown validado por Zod, um servidor MCP para agentes e quase nenhum JavaScript no navegador.',
  },
];

export interface StackEntry {
  name: string;
  /** Number of the version where it first appeared. */
  firstVersion: number;
  /** How many versions used it. */
  versions: number;
}

/** Every technology once, in the order it first appeared. */
export const stackTimeline = (): StackEntry[] => {
  const entries = new Map<string, StackEntry>();
  for (const version of SITE_VERSIONS) {
    for (const name of version.stack) {
      const entry = entries.get(name);
      if (entry) entry.versions += 1;
      else entries.set(name, { name, firstVersion: version.number, versions: 1 });
    }
  }
  return [...entries.values()];
};

/** v<versions>.<commits in this repository> (commits from the GitHub API, commits.ts). */
export const siteVersionTag = (commits: number): string => `v${SITE_VERSIONS.length}.${commits}`;

export const repoUrl = (repo: string): string => `https://github.com/nandomoreirame/${repo}`;

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const monthOf = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-');
  return `${MONTHS[Number(month) - 1]}/${year}`;
};

/** Index entry of a version: "nov/2015 · Jekyll". */
export const tocLabelOf = (version: Pick<SiteVersion, 'start' | 'name'>): string =>
  `${monthOf(version.start)} · ${version.name}`;

/** "nov/2015 a jan/2018", "ago/2016" for a single month, "ago/2026 até hoje" for the current one. */
export const periodOf = (version: Pick<SiteVersion, 'start' | 'end'>): string => {
  if (!version.end) return `${monthOf(version.start)} até hoje`;
  if (version.end === version.start) return monthOf(version.start);
  return `${monthOf(version.start)} a ${monthOf(version.end)}`;
};

export const historyMarkdown = ({ site, commits, now }: { site: URL; commits: number; now: Date }): string => {
  const lines: string[] = [
    '---',
    'title: Versões do site',
    `url: ${absoluteUrl(site, HISTORY_PATH)}`,
    `version: ${siteVersionTag(commits)}`,
    '---',
    '',
    `# ${historyTitle(now)}`,
    '',
    HISTORY_LEAD,
    '',
    '## Versões',
    '',
  ];

  for (const version of [...SITE_VERSIONS].reverse()) {
    const count = version.end ? version.commits : commits;
    lines.push(
      `### v${version.number}: ${version.name} (${periodOf(version)})`,
      '',
      version.summary,
      '',
      `- Repositório: ${repoUrl(version.repo)}`,
      `- Commits: ${count}`,
      `- Stack: ${version.stack.join(', ')}`,
      '',
    );
  }

  lines.push('## Tecnologias que passaram por aqui', '');
  for (const entry of stackTimeline()) {
    lines.push(
      `- ${entry.name}: desde a v${entry.firstVersion}, em ${entry.versions} ${entry.versions === 1 ? 'versão' : 'versões'}`,
    );
  }
  lines.push('');

  return lines.join('\n');
};
