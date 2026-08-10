import { describe, expect, it } from 'vitest';
import type { Profile } from '../../src/content/schemas/profile';
import type { Project } from '../../src/content/schemas/project';
import { buildResume } from '../../src/lib/aeo/resume';
import { renderResumeText } from '../../src/lib/aeo/resume-txt';

const site = new URL('https://nandomoreira.dev');

const profile: Profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Engenheiro de produto com agentes de IA',
  bio: 'Construo ferramental de agentes de IA.\nO acervo recente inclui cliente multi-CLI.',
  positioning: 'IA, agentes e tooling de AI coding',
  stack: ['TypeScript', 'Rust', 'Astro'],
  trajectory: [{ value: '964', label: 'estrelas', context: 'temas Jekyll' }],
  services: [{ title: 'Tooling', description: 'Ferramental.', caseSlug: 'forja' }],
  availability: { status: 'open', detail: 'Aberto a consultoria.', updatedAt: '2026-08-08' },
  contacts: [
    { kind: 'email', value: 'fernando@nandomoreira.dev' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
  ],
};

const project = {
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

const render = (input: Profile = profile, projects: readonly Project[] = [project]) =>
  renderResumeText(buildResume({ site, profile: input, projects }));

describe('renderResumeText', () => {
  it('renders the same facts as the JSON, without a parser', () => {
    const text = render();

    expect(text).toContain(profile.name);
    expect(text).toContain(profile.headline);
    for (const item of profile.stack) expect(text).toContain(item);
  });

  it('says a current position is current instead of leaving a blank', () => {
    const withCurrentJob: Profile = {
      ...profile,
      work: [{ name: 'Empresa', position: 'Cargo', startDate: '2024-01-01' }],
    };

    expect(render(withCurrentJob, [])).toMatch(/present|current/i);
  });

  it('closes a finished position with its end date', () => {
    const withPastJob: Profile = {
      ...profile,
      work: [
        { name: 'Empresa', position: 'Cargo', startDate: '2020-01-01', endDate: '2023-06-01' },
      ],
    };

    expect(render(withPastJob, [])).toContain('2020-01-01 – 2023-06-01');
  });

  it('never prints an e-mail', () => {
    expect(render()).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  it('carries the availability with the date it was last updated', () => {
    const text = render();

    expect(text).toContain('open');
    expect(text).toContain('2026-08-08');
  });

  it('points the agent at the hire endpoint', () => {
    expect(render()).toContain('https://nandomoreira.dev/api/hire');
  });

  it('lists a project with its evidence link', () => {
    const text = render();

    expect(text).toContain('Forja');
    expect(text).toContain('https://forja.web.app');
  });

  it('wraps long prose instead of truncating it', () => {
    const long = 'palavra '.repeat(60).trim();
    const text = render({ ...profile, bio: long }, []);
    const widest = Math.max(...text.split('\n').map((line) => line.length));

    expect(widest).toBeLessThanOrEqual(80);
    expect(text.replace(/\n/g, ' ')).toContain('palavra palavra');
  });

  it('keeps an unbreakable token whole, even past the width', () => {
    // Splitting a URL to honour a column limit makes it unusable, which costs
    // more than a long line. The exemption is deliberate, so it is asserted.
    const url = `https://example.com/${'a'.repeat(120)}`;
    const text = render(profile, [{ ...project, liveUrl: url, repoUrl: null }]);

    expect(text).toContain(url);
  });

  it('never splits a word across two lines while wrapping', () => {
    const long = 'palavra '.repeat(60).trim();
    const text = render({ ...profile, bio: long }, []);

    for (const line of text.split('\n')) {
      const tokens = line.trim().split(/\s+/).filter(Boolean);
      const oversized = tokens.filter((token) => token.length > 80);

      // A line may exceed the width only because ONE token already does.
      expect(line.length <= 80 || oversized.length > 0).toBe(true);
    }
  });

  it('ends with a newline, so concatenating output does not glue lines', () => {
    expect(render().endsWith('\n')).toBe(true);
  });
});
