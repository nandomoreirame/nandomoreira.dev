import { describe, expect, it } from 'vitest';
import type { Profile } from '../../src/content/schemas/profile';
import type { Project } from '../../src/content/schemas/project';
import { buildResume } from '../../src/lib/aeo/resume';

const site = new URL('https://nandomoreira.dev');

const profile: Profile = {
  name: 'Fernando Moreira Costa',
  wordmark: 'NandoMoreira',
  headline: 'Engenheiro de produto com agentes de IA',
  bio: 'Construo ferramental de agentes de IA.\nO acervo recente inclui cliente multi-CLI.',
  positioning: 'IA, agentes e tooling de AI coding',
  stack: ['TypeScript', 'Rust', 'Astro'],
  trajectory: [{ value: '964', label: 'estrelas', context: 'a maioria de temas Jekyll' }],
  services: [{ title: 'Tooling', description: 'Ferramental interno.', caseSlug: 'forja' }],
  availability: {
    status: 'open',
    detail: 'Aberto a consultoria de escopo fechado.',
    updatedAt: '2026-08-08',
  },
  contacts: [
    { kind: 'email', value: 'oi@nandomoreira.dev' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
    { kind: 'linkedin', value: 'https://www.linkedin.com/in/nandomoreirame/' },
  ],
};

const base = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling',
  summary: 'Cliente multi-CLI para agentes de código.',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  tech: ['Rust', 'Tauri'],
  repoUrl: 'https://github.com/nandomoreirame/forja',
  liveUrl: 'https://forja.web.app',
  featured: true,
  confidential: false,
  discontinued: false,
  date: '2026-05-01',
} satisfies Project;

const project = (overrides: Partial<Project> = {}): Project => ({ ...base, ...overrides });

describe('buildResume: basics and skills', () => {
  it('derives basics from the profile, never from a literal', () => {
    const resume = buildResume({ site, profile, projects: [] });

    expect(resume.basics.name).toBe(profile.name);
    expect(resume.basics.label).toBe(profile.headline);
    expect(resume.basics.summary).toContain(profile.bio.split('\n')[0]);
  });

  it('maps the stack to a single skills entry, not one per item', () => {
    const resume = buildResume({ site, profile, projects: [] });

    expect(resume.skills).toHaveLength(1);
    expect(resume.skills?.[0]?.keywords).toEqual(profile.stack);
  });

  it('never puts an e-mail in the payload', () => {
    // Machine routes carry no e-mail; /api/hire is the agent channel.
    const payload = JSON.stringify(buildResume({ site, profile, projects: [] }));

    expect(payload).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(buildResume({ site, profile, projects: [] }).basics.email).toBeUndefined();
  });

  it('publishes the network profiles that are not an e-mail', () => {
    const resume = buildResume({ site, profile, projects: [] });
    const networks = resume.basics.profiles?.map((entry) => entry.network);

    expect(networks).toEqual(['github', 'linkedin']);
  });

  it('carries the site as the canonical URL, so an agent can trace the source', () => {
    const resume = buildResume({ site, profile, projects: [] });

    expect(resume.basics.url).toBe('https://nandomoreira.dev/');
    expect(resume.meta?.canonical).toBe('https://nandomoreira.dev/api/resume.json');
  });

  it('carries the work history when the author has written it', () => {
    const withJob: Profile = {
      ...profile,
      work: [{ name: 'Empresa', position: 'Cargo', startDate: '2024-01-01' }],
    };

    expect(buildResume({ site, profile: withJob, projects: [] }).work).toHaveLength(1);
  });

  it('omits work entirely when the history is absent, instead of an empty array', () => {
    // An empty array reads as "no career"; absence reads as "not published yet".
    expect(buildResume({ site, profile, projects: [] }).work).toBeUndefined();
  });
});

describe('buildResume: extension block', () => {
  it('isolates the non-standard part in its own top-level key', () => {
    const resume = buildResume({ site, profile, projects: [] });

    expect(resume.x_agent).toBeDefined();
    expect(resume.x_agent.availability.status).toBe(profile.availability.status);
    // The date is what lets an agent calibrate how stale the answer is.
    expect(resume.x_agent.availability.updatedAt).toBe(profile.availability.updatedAt);
    expect(resume.x_agent.positioning).toBe(profile.positioning);
  });

  it('points the agent at the hire endpoint rather than at a person', () => {
    const resume = buildResume({ site, profile, projects: [] });

    expect(resume.x_agent.contact.endpoint).toBe('https://nandomoreira.dev/api/hire');
    expect(resume.x_agent.contact.method).toBe('POST');
  });

  it('keeps the extension out of the standard blocks', () => {
    const resume = buildResume({ site, profile, projects: [] });

    expect(resume.basics).not.toHaveProperty('positioning');
    expect(resume.basics).not.toHaveProperty('availability');
  });
});

describe('buildResume: projects', () => {
  it('never names the client of a confidential case', () => {
    const resume = buildResume({
      site,
      profile,
      projects: [
        project({
          slug: 'plataforma-interna',
          confidential: true,
          clientName: 'Acme',
          title: 'Plataforma da Acme',
          summary: 'Plataforma interna da Acme para operação.',
          repoUrl: null,
          liveUrl: null,
        }),
      ],
    });

    expect(JSON.stringify(resume)).not.toMatch(/acme/i);
  });

  it('marks a discontinued case instead of presenting it as running', () => {
    const resume = buildResume({
      site,
      profile,
      projects: [project({ discontinued: true, liveUrl: null })],
    });

    expect(resume.projects?.[0]?.endDate).toBeDefined();
  });

  it('leaves a running case open-ended, so the dates mean something', () => {
    const resume = buildResume({ site, profile, projects: [project()] });

    expect(resume.projects?.[0]?.endDate).toBeUndefined();
    expect(resume.projects?.[0]?.startDate).toBe('2026-05-01');
  });

  it('maps the case to the standard fields an agent expects', () => {
    const resume = buildResume({ site, profile, projects: [project()] });
    const entry = resume.projects?.[0];

    expect(entry?.name).toBe('Forja');
    expect(entry?.description).toBe('Cliente multi-CLI para agentes de código.');
    expect(entry?.keywords).toEqual(['Rust', 'Tauri']);
  });

  it('prefers the live URL as evidence, falling back to the repository', () => {
    const live = buildResume({ site, profile, projects: [project()] });
    const repoOnly = buildResume({ site, profile, projects: [project({ liveUrl: null })] });

    expect(live.projects?.[0]?.url).toBe('https://forja.web.app');
    expect(repoOnly.projects?.[0]?.url).toBe('https://github.com/nandomoreirame/forja');
  });

  it('falls back to the case page when a case has no external link', () => {
    // A confidential case has no public repo or site, but it still has a page.
    const resume = buildResume({
      site,
      profile,
      projects: [
        project({ slug: 'sem-link', confidential: true, repoUrl: null, liveUrl: null }),
      ],
    });

    expect(resume.projects?.[0]?.url).toBe('https://nandomoreira.dev/lab/sem-link');
  });

  it('ranks cases with verifiable evidence above the ones without', () => {
    const resume = buildResume({
      site,
      profile,
      projects: [
        project({ slug: 'sem-link', title: 'Sem link', confidential: true, repoUrl: null, liveUrl: null }),
        project({ slug: 'com-link', title: 'Com link' }),
      ],
    });

    expect(resume.projects?.map((entry) => entry.name)).toEqual(['Com link', 'Sem link']);
  });
});
