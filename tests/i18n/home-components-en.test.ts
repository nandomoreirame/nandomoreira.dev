import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import About from '../../src/components/home/About.astro';
import CollectionSection from '../../src/components/home/CollectionSection.astro';
import Contact from '../../src/components/home/Contact.astro';
import Hero from '../../src/components/home/Hero.astro';
import LatestPosts from '../../src/components/home/LatestPosts.astro';
import Services from '../../src/components/home/Services.astro';
import Trajectory from '../../src/components/home/Trajectory.astro';
import AgentBrief from '../../src/components/contact/AgentBrief.astro';
import AgentBriefWindow from '../../src/components/contact/AgentBriefWindow.astro';
import type { Project } from '../../src/content/schemas/project';
import { getAllProjects, getProfile } from '../../src/lib/content';
import type { PostSummary } from '../../src/lib/content';
import { ptLeftovers } from '../helpers/pt-leftovers';

const SITE = 'https://nandomoreira.dev';

const render = async (component: unknown, props: Record<string, unknown> = {}) =>
  (await AstroContainer.create()).renderToString(component as never, { props });

const heroPt = {
  name: 'Fernando Moreira',
  headline: 'Engenheiro de produto com agentes de IA',
  positioning: 'Construo ferramental de agentes e produtos com IA em produção.',
};

const heroEn = {
  name: 'Fernando Moreira',
  headline: 'Product engineer with AI agents',
  positioning: 'I build agent tooling and AI products in production.',
};

const statsPt = [
  {
    value: '964',
    label: 'estrelas no GitHub',
    context: 'cerca de 700 vêm de temas Jekyll de 2018',
  },
  { value: '99', label: 'repositórios próprios', context: 'desde 2012' },
];

const statsEn = [
  {
    value: '964',
    label: 'stars on GitHub',
    context: 'about 700 come from Jekyll themes from 2018',
  },
  { value: '99', label: 'own repositories', context: 'since 2012' },
];

const contacts = [
  { kind: 'email', value: 'oi@nandomoreira.dev' },
  { kind: 'github', value: 'https://github.com/nandomoreirame' },
];

const post = (overrides: Partial<PostSummary> = {}): PostSummary => ({
  slug: 'my-post',
  title: 'My post',
  summary: 'A summary.',
  date: '2026-10-16',
  markers: ['niri', 'wayland', 'shell'],
  draft: false,
  archived: false,
  readingMinutes: 6,
  ...overrides,
});

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    slug: 'forja',
    title: 'Forja',
    block: 'ai-tooling',
    summary: 'Multi-CLI GUI client',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Rust'],
    repoUrl: 'https://example.com',
    liveUrl: null,
    featured: true,
    confidential: false,
    date: '2026-01-15',
    ...overrides,
  }) as Project;

const brief = '# AGENTS.md: hire X\nPOST https://nandomoreira.dev/api/hire\n{"from":"a"}';

describe('home components keep pt-BR HTML (REQ-002)', () => {
  it('Hero', async () => {
    await expect(await render(Hero, heroPt)).toMatchFileSnapshot('../__snapshots__/home-hero.pt.html');
  });

  it('Services', async () => {
    const services = [
      {
        title: 'Tooling com agentes',
        description: 'Ferramental interno para times que usam agentes de código.',
        caseSlug: 'forja',
      },
    ];
    const projects = [{ slug: 'forja', block: 'ai-tooling' as const }];
    await expect(await render(Services, { services, projects })).toMatchFileSnapshot(
      '../__snapshots__/home-services.pt.html',
    );
  });

  it('Trajectory', async () => {
    await expect(
      await render(Trajectory, { stats: statsPt, narrative: 'A maior tração vem de 2018.' }),
    ).toMatchFileSnapshot('../__snapshots__/home-trajectory.pt.html');
  });

  it('LatestPosts', async () => {
    await expect(
      await render(LatestPosts, {
        site: SITE,
        posts: [
          {
            slug: 'meu-post',
            title: 'Meu post',
            summary: 'Um resumo.',
            date: '2026-10-16',
            markers: ['niri', 'wayland', 'shell'],
            draft: false,
            archived: false,
            readingMinutes: 6,
          },
        ],
      }),
    ).toMatchFileSnapshot('../__snapshots__/home-latest-posts.pt.html');
  });

  it('Contact', async () => {
    await expect(await render(Contact, { contacts })).toMatchFileSnapshot('../__snapshots__/home-contact.pt.html');
  });

  it('About', async () => {
    await expect(await render(About, { summary: 'Construo ferramental de agentes.' })).toMatchFileSnapshot(
      '../__snapshots__/home-about.pt.html',
    );
  });

  it('CollectionSection portfolio', async () => {
    await expect(
      await render(CollectionSection, {
        collection: 'portfolio',
        projects: [project({ block: 'professional', slug: 'bragstack', title: 'BragStack' })],
        totalCount: 9,
      }),
    ).toMatchFileSnapshot('../__snapshots__/home-collection-portfolio.pt.html');
  });

  it('CollectionSection lab', async () => {
    await expect(
      await render(CollectionSection, { collection: 'lab', projects: [project()], totalCount: 9 }),
    ).toMatchFileSnapshot('../__snapshots__/home-collection-lab.pt.html');
  });

  it('AgentBrief', async () => {
    await expect(await render(AgentBrief, { brief })).toMatchFileSnapshot('../__snapshots__/home-agent-brief.pt.html');
  });

  it('AgentBriefWindow', async () => {
    await expect(await render(AgentBriefWindow, { brief })).toMatchFileSnapshot(
      '../__snapshots__/home-agent-brief-window.pt.html',
    );
  });
});

describe('home components in English (REQ-003, REQ-008)', () => {
  it('Hero', async () => {
    const html = await render(Hero, { ...heroEn, locale: 'en' });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('Services', async () => {
    const profile = await getProfile('en');
    const projects = (await getAllProjects()).map(p => ({ slug: p.slug, block: p.block }));
    const html = await render(Services, {
      locale: 'en',
      services: profile.services,
      projects,
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('Trajectory', async () => {
    const html = await render(Trajectory, {
      locale: 'en',
      stats: statsEn,
      narrative: 'Most of the traction comes from 2018.',
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('LatestPosts', async () => {
    const html = await render(LatestPosts, {
      locale: 'en',
      site: SITE,
      posts: [post({ keyPoints: ['First point.', 'Second point.'] })],
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('Contact', async () => {
    const html = await render(Contact, { locale: 'en', contacts });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('About', async () => {
    const html = await render(About, {
      locale: 'en',
      summary: 'I build tooling for agents.',
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('CollectionSection', async () => {
    const portfolio = await render(CollectionSection, {
      locale: 'en',
      collection: 'portfolio',
      projects: [project({ block: 'professional', slug: 'bragstack', title: 'BragStack' })],
      totalCount: 9,
    });
    const lab = await render(CollectionSection, {
      locale: 'en',
      collection: 'lab',
      projects: [project()],
      totalCount: 9,
    });
    const empty = await render(CollectionSection, {
      locale: 'en',
      collection: 'lab',
      projects: [],
      totalCount: 0,
    });
    expect(ptLeftovers(portfolio)).toEqual([]);
    expect(ptLeftovers(lab)).toEqual([]);
    expect(ptLeftovers(empty)).toEqual([]);
  });

  it('AgentBrief', async () => {
    const html = await render(AgentBrief, { locale: 'en', brief });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('AgentBriefWindow', async () => {
    const html = await render(AgentBriefWindow, { locale: 'en', brief });
    expect(ptLeftovers(html)).toEqual([]);
  });
});
