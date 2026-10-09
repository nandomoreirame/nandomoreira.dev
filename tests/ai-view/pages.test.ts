import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import type { Profile } from '../../src/content/schemas/profile';
import type { Project } from '../../src/content/schemas/project';
import {
  aboutMarkdown,
  archiveMarkdown,
  archiveYearMarkdown,
  collectionMarkdown,
  connectMarkdown,
  contactMarkdown,
  homeMarkdown,
  postsMarkdown,
} from '../../src/lib/ai-view/pages';

const site = new URL('https://nandomoreira.dev');

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Engenheiro de IA e produto',
  bio: 'Construo software de ponta a ponta.',
  positioning: 'Produto, esteira e padrão de engenharia.',
  stack: ['TypeScript', 'Rust'],
  trajectory: [
    { value: '5→30', label: 'minutos', context: 'Liquid AI, bases de cliente.' },
  ],
  services: [
    {
      title: 'Produto de ponta a ponta',
      description: 'Do papel à produção.',
      caseSlug: 'bragstack',
    },
  ],
  availability: { status: 'open', detail: 'Aberto.', updatedAt: '2026-08-08' },
  contacts: [
    { kind: 'email', value: 'oi@nandomoreira.dev' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
    { kind: 'linkedin', value: 'https://linkedin.com/in/nandomoreira' },
  ],
  work: [
    {
      name: 'Liquid AI',
      position: 'AI Engineer',
      startDate: '2024-01-01',
      summary: 'Esteira de dados.',
      highlights: ['Reduzi o tempo de base.', 'Gate de cobertura no CI.'],
    },
  ],
  education: [
    {
      institution: 'USP',
      area: 'Computação',
      studyType: 'Bacharelado',
      startDate: '2008-01-01',
      endDate: '2012-12-01',
    },
  ],
} satisfies Profile;

const portfolioCase = {
  slug: 'financial-normalization',
  title: 'Financial normalization',
  summary: 'Pré-normalização de bases.',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  block: 'professional',
  tech: ['Python', 'Polars'],
  date: '2025-06-01',
  repoUrl: null,
  liveUrl: null,
  featured: true,
  confidential: true,
  discontinued: false,
  clientName: 'Acme Corp',
  confidentialMetrics: ['R$ 2M'],
} as Project;

const labCase = {
  slug: 'forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI.',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  block: 'ai-tooling',
  tech: ['Rust', 'Tauri'],
  date: '2026-05-01',
  repoUrl: 'https://github.com/nandomoreirame/forja',
  liveUrl: null,
  featured: true,
  confidential: false,
  discontinued: false,
} satisfies Project;

const bragstack = {
  ...labCase,
  slug: 'bragstack',
  title: 'BragStack',
  block: 'ai-product',
  tech: ['TypeScript'],
} satisfies Project;

const post = {
  slug: 'por-que-parenteses-no-tailwind',
  title: 'Por que parênteses no Tailwind 4',
  summary: 'Colchetes geram CSS inválido.',
  date: '2026-08-09',
  draft: false,
  archived: false,
} satisfies Post;

const archived = {
  slug: 'comece-com-gulp',
  title: 'Comece com Gulp',
  summary: 'Task runner.',
  date: '2017-03-01',
  draft: false,
  archived: true,
} satisfies Post;

const opensWithFrontmatter = (text: string, title: string, url: string) => {
  expect(text.startsWith('---\n')).toBe(true);
  expect(text).toContain(`title: ${title}`);
  expect(text).toContain(`url: ${url}`);
};

describe('homeMarkdown', () => {
  it('opens with frontmatter and mirrors the human home sections', () => {
    const text = homeMarkdown({
      site,
      profile,
      portfolio: [portfolioCase],
      lab: [labCase, bragstack],
    });

    opensWithFrontmatter(text, profile.headline, 'https://nandomoreira.dev/');
    expect(text).toContain(`# ${profile.headline}`);
    expect(text).toContain(profile.positioning);
    expect(text).toContain('Disponível para novos projetos');
    expect(text).toContain('## Portfólio');
    expect(text).toContain('[Financial normalization](https://nandomoreira.dev/portfolio/financial-normalization)');
    expect(text).toContain('## Laboratório');
    expect(text).toContain('[Forja](https://nandomoreira.dev/lab/forja)');
    expect(text).toContain('## Serviços');
    expect(text).toContain('Produto de ponta a ponta');
  });

  it('caps each collection at five cases', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      ...labCase,
      slug: `case-${i}`,
      title: `Case ${i}`,
    }));
    const text = homeMarkdown({
      site,
      profile,
      portfolio: [],
      lab: many,
    });

    expect(text).toContain('Case 0');
    expect(text).toContain('Case 4');
    expect(text).not.toContain('Case 5');
  });
});

describe('aboutMarkdown', () => {
  it('covers bio, results, fronts, experience, education and stack', () => {
    const text = aboutMarkdown({
      site,
      profile,
      projects: [bragstack, portfolioCase],
    });

    opensWithFrontmatter(text, `Sobre | ${profile.name}`, 'https://nandomoreira.dev/sobre');
    expect(text).toContain(profile.headline);
    expect(text).toContain(profile.bio);
    expect(text).toContain('## Resultados');
    expect(text).toContain('5→30');
    expect(text).toContain('minutos');
    expect(text).toContain('Liquid AI, bases de cliente.');
    expect(text).toContain('## Como posso ajudar');
    expect(text).toContain('[BragStack](https://nandomoreira.dev/lab/bragstack)');
    expect(text).toContain('## Experiência');
    expect(text).toContain('AI Engineer');
    expect(text).toContain('Liquid AI');
    expect(text).toContain('Esteira de dados.');
    expect(text).toContain('Reduzi o tempo de base.');
    expect(text).toContain('## Formação');
    expect(text).toContain('Bacharelado em Computação, USP');
    expect(text).toContain('## Stack');
    expect(text).toContain('- TypeScript');
    expect(text).toContain('- Rust');
  });
});

describe('collectionMarkdown', () => {
  it('lists each case with summary, stack, situation and .md link', () => {
    const text = collectionMarkdown({
      site,
      collection: 'portfolio',
      title: 'Trabalho de cliente, do problema à produção',
      description: 'Plataformas de dados com IA.',
      projects: [portfolioCase],
    });

    opensWithFrontmatter(
      text,
      'Trabalho de cliente, do problema à produção',
      'https://nandomoreira.dev/portfolio',
    );
    expect(text).toContain('Plataformas de dados com IA.');
    expect(text).toContain('## Financial normalization');
    expect(text).toContain('Pré-normalização de bases.');
    expect(text).toContain('Python');
    expect(text).toContain('Polars');
    expect(text).toContain('Confidencial');
    expect(text).toContain(
      '[financial-normalization.md](https://nandomoreira.dev/portfolio/financial-normalization.md)',
    );
  });

  it('marks a discontinued case', () => {
    const text = collectionMarkdown({
      site,
      collection: 'lab',
      title: 'Lab',
      description: 'd',
      projects: [{ ...labCase, discontinued: true }],
    });
    expect(text).toContain('Descontinuado');
  });
});

describe('postsMarkdown', () => {
  it('lists current posts with date, title, summary and link', () => {
    const text = postsMarkdown({ site, posts: [post] });

    opensWithFrontmatter(text, 'Posts', 'https://nandomoreira.dev/posts');
    expect(text).toContain('2026-08-09');
    expect(text).toContain(
      '[Por que parênteses no Tailwind 4](https://nandomoreira.dev/por-que-parenteses-no-tailwind)',
    );
    expect(text).toContain('Colchetes geram CSS inválido.');
  });
});

describe('archiveMarkdown', () => {
  it('lists archive years with counts and links', () => {
    const text = archiveMarkdown({
      site,
      years: [
        { year: '2017', count: 3 },
        { year: '2016', count: 1 },
      ],
    });

    opensWithFrontmatter(text, 'Arquivo', 'https://nandomoreira.dev/posts/arquivo');
    expect(text).toContain('[2017](https://nandomoreira.dev/posts/arquivo/2017)');
    expect(text).toContain('3 textos');
    expect(text).toContain('[2016](https://nandomoreira.dev/posts/arquivo/2016)');
    expect(text).toContain('1 texto');
  });
});

describe('archiveYearMarkdown', () => {
  it('lists the posts of one year', () => {
    const text = archiveYearMarkdown({
      site,
      year: '2017',
      posts: [archived],
    });

    opensWithFrontmatter(text, 'Arquivo 2017', 'https://nandomoreira.dev/posts/arquivo/2017');
    expect(text).toContain('2017-03-01');
    expect(text).toContain('[Comece com Gulp](https://nandomoreira.dev/comece-com-gulp)');
    expect(text).toContain('Task runner.');
  });
});

describe('contactMarkdown', () => {
  it('lists GitHub, LinkedIn, hire and connect without the e-mail', () => {
    const text = contactMarkdown({ site, profile });

    opensWithFrontmatter(text, 'Contato', 'https://nandomoreira.dev/contato');
    expect(text).toContain('https://github.com/nandomoreirame');
    expect(text).toContain('https://linkedin.com/in/nandomoreira');
    expect(text).toContain('POST /api/hire');
    expect(text).toContain('/mcp');
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toContain('oi@nandomoreira.dev');
  });
});

describe('connectMarkdown', () => {
  it('documents the MCP endpoint, clients, tools and hire', () => {
    const text = connectMarkdown({ site });

    opensWithFrontmatter(text, 'Conectar via MCP', 'https://nandomoreira.dev/mcp');
    expect(text).toContain('https://nandomoreira.dev/api/mcp');
    expect(text).toContain('Claude Code');
    expect(text).toContain('get_profile');
    expect(text).toContain('check_availability');
    expect(text).toContain('POST /api/hire');
  });
});

describe('builders never read confidential fields', () => {
  it('does not mention clientName or confidentialMetrics in source', () => {
    const source = readFileSync('src/lib/ai-view/pages.ts', 'utf8');
    expect(source).not.toContain('clientName');
    expect(source).not.toContain('confidentialMetrics');
  });

  it('does not leak confidential fixture values into markdown', () => {
    const text = collectionMarkdown({
      site,
      collection: 'portfolio',
      title: 't',
      description: 'd',
      projects: [portfolioCase],
    });
    expect(text).not.toContain('Acme Corp');
    expect(text).not.toContain('R$ 2M');
  });
});
