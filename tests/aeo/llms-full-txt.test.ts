import { describe, expect, it } from 'vitest';
import { buildLlmsFullTxt } from '../../src/lib/aeo/llms-full-txt';

const site = new URL('https://nandomoreira.dev');

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Product engineer working with AI agents',
  bio: 'I build agent tooling and AI products in production.',
  positioning: 'AI, agents and AI coding tooling',
  stack: ['TypeScript', 'Rust'],
  trajectory: [
    {
      value: '964',
      label: 'stars',
      context: 'mostly Jekyll themes\nfrom 2018',
    },
  ],
  services: [
    {
      title: 'Agent tooling',
      description: 'Internal tooling for coding agents.',
      caseSlug: 'forja',
    },
  ],
  availability: {
    status: 'open',
    detail: 'Open to fixed-scope consulting.',
    updatedAt: '2026-08-08',
  },
  contacts: [{ kind: 'email', value: 'oi@nandomoreira.dev' }],
  work: [
    {
      name: 'Liquid AI',
      position: 'AI Engineer',
      startDate: '2025-11-01',
      summary: 'Building agent tooling in production.',
      highlights: ['Shipped the pre-normalizer', 'Owns the MCP surface'],
    },
    {
      name: 'Past Co',
      position: 'Senior Engineer',
      startDate: '2020-01-01',
      endDate: '2024-12-31',
      summary: 'Previous role.',
    },
  ],
  education: [
    {
      institution: 'Universidade Positivo',
      area: 'Sistemas para Internet',
      studyType: 'Tecnólogo',
      startDate: '2012-01-01',
      endDate: '2015-12-31',
    },
  ],
} as never;

const projects = [
  {
    slug: 'forja',
    title: 'Forja',
    summary: 'Multi-CLI GUI client for coding agents',
    problem: 'Three terminals, one context loss.',
    decisions: 'Tauri and Rust for a small binary.',
    outcome: 'Daily driver for agent work.',
    block: 'ai-tooling',
    tech: ['Rust', 'Tauri'],
    date: '2026-05-01',
    repoUrl: 'https://github.com/nandomoreirame/forja',
    liveUrl: null,
    featured: false,
    confidential: false,
    discontinued: false,
    updatedAt: '2026-08-01',
  },
  {
    slug: 'financial-normalization',
    title: 'Financial normalization',
    summary: 'Heterogeneous financial data into one pipeline.',
    problem: 'Each client ships a different schema.',
    decisions: 'Hexagonal adapters per source.',
    outcome: 'Days down to minutes.',
    block: 'professional',
    tech: ['Python'],
    date: '2025-03-01',
    repoUrl: null,
    liveUrl: null,
    featured: false,
    confidential: true,
    discontinued: false,
    clientName: 'Acme Corp',
    confidentialMetrics: ['saved $1.2M'],
    updatedAt: '2026-07-01',
  },
  {
    slug: 'old-tool',
    title: 'Old Tool',
    summary: 'A retired experiment.',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    block: 'systems-cli',
    tech: ['Go'],
    date: '2020-01-01',
    repoUrl: null,
    liveUrl: null,
    featured: false,
    confidential: false,
    discontinued: true,
    updatedAt: '2021-01-01',
  },
] as never[];

const output = () => buildLlmsFullTxt({ site, profile, projects });

describe('buildLlmsFullTxt', () => {
  it('opens with an H1 title and a blockquote summary', () => {
    const text = output();
    expect(text.split('\n')[0]).toBe('# Fernando Moreira Costa');
    expect(text).toMatch(/\n> Product engineer working with AI agents\. I build agent tooling/);
  });

  it('includes an About section with positioning, availability and stack', () => {
    const text = output();
    expect(text).toContain('## About');
    expect(text).toContain('AI, agents and AI coding tooling');
    expect(text).toContain('open');
    expect(text).toContain('Open to fixed-scope consulting.');
    expect(text).toContain('2026-08-08');
    expect(text).toContain('TypeScript');
    expect(text).toContain('Rust');
  });

  it('lists Results with value, label and a single-line context', () => {
    const text = output();
    expect(text).toContain('## Results');
    expect(text).toContain('- 964 stars: mostly Jekyll themes from 2018');
    expect(text).not.toContain('mostly Jekyll themes\nfrom 2018');
  });

  it('lists Services with title, description and the proving case absolute URL', () => {
    const text = output();
    expect(text).toContain('## Services');
    expect(text).toContain('Agent tooling');
    expect(text).toContain('Internal tooling for coding agents.');
    expect(text).toContain('https://nandomoreira.dev/lab/forja');
  });

  it('lists Work history with period, summary and highlight sub-bullets', () => {
    const text = output();
    expect(text).toContain('## Work history');
    expect(text).toContain('AI Engineer');
    expect(text).toContain('Liquid AI');
    expect(text).toContain('2025-11-01');
    expect(text).toContain('present');
    expect(text).toContain('2020-01-01');
    expect(text).toContain('2024-12-31');
    expect(text).toContain('Building agent tooling in production.');
    expect(text).toContain('Shipped the pre-normalizer');
  });

  it('lists Education after work history', () => {
    const text = output();
    const work = text.indexOf('## Work history');
    const education = text.indexOf('## Education');
    expect(education).toBeGreaterThan(work);
    expect(text).toContain('Universidade Positivo');
    expect(text).toContain('Sistemas para Internet');
    expect(text).toContain('Tecnólogo');
  });

  it('lists every project with problem, decisions and outcome', () => {
    const text = output();
    expect(text).toContain('## Projects');
    expect(text).toContain('### Forja');
    expect(text).toContain('https://nandomoreira.dev/lab/forja');
    expect(text).toContain('collection: lab');
    expect(text).toContain('tech: Rust, Tauri');
    expect(text).toContain('Problem: Three terminals, one context loss.');
    expect(text).toContain('Decisions: Tauri and Rust for a small binary.');
    expect(text).toContain('Outcome: Daily driver for agent work.');
    expect(text).toContain('https://github.com/nandomoreirame/forja');

    expect(text).toContain('### Financial normalization');
    expect(text).toContain('https://nandomoreira.dev/portfolio/financial-normalization');
    expect(text).toContain('status: confidential');
    expect(text).toContain('Problem: Each client ships a different schema.');

    expect(text).toContain('### Old Tool');
    expect(text).toContain('status: discontinued');
  });

  it('never prints clientName or confidentialMetrics even when present on the fixture', () => {
    const text = output();
    expect(text).not.toContain('Acme Corp');
    expect(text).not.toContain('saved $1.2M');
    expect(text).not.toContain('clientName');
    expect(text).not.toContain('confidentialMetrics');
  });

  it('lists Posts with title, URL and summary only', () => {
    const text = buildLlmsFullTxt({
      site,
      profile,
      projects,
      posts: [
        {
          slug: 'tailwind-parens',
          title: 'Why parens in Tailwind 4',
          summary: 'Brackets emit invalid CSS.',
          date: '2026-08-09',
          draft: false,
          archived: false,
        },
      ] as never[],
    });

    expect(text).toContain('## Posts');
    expect(text).toContain('Why parens in Tailwind 4');
    expect(text).toContain('https://nandomoreira.dev/tailwind-parens');
    expect(text).toContain('Brackets emit invalid CSS.');
  });

  it('includes Machine routes and Language like llms.txt', () => {
    const text = output();
    expect(text).toContain('## Machine routes');
    expect(text).toContain('/api/resume.json');
    expect(text).toContain('/api/hire');
    expect(text).toContain('## Language');
    expect(text).toContain('Human-facing pages are written in Brazilian Portuguese.');
    expect(text).toContain('Machine-facing routes are written in English.');
  });

  it('never leaks the email address', () => {
    expect(output()).not.toContain('@nandomoreira.dev');
  });

  it('survives an empty catalogue', () => {
    expect(() => buildLlmsFullTxt({ site, profile, projects: [] })).not.toThrow();
  });
});
