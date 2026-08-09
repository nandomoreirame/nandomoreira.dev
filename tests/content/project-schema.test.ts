import { describe, expect, it } from 'vitest';
import { projectSchema } from '../../src/content/schemas/project';

const valid = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling',
  summary: 'Cliente GUI multi-CLI para agentes de código',
  problem: 'Alternar entre três CLIs de agente custa contexto.',
  decisions: 'Tauri em vez de Electron, por peso do binário.',
  outcome: '11 estrelas e uso diário próprio.',
  tech: ['Rust', 'Tauri', 'TypeScript'],
  repoUrl: 'https://github.com/nandomoreirame/forja',
  liveUrl: null,
  featured: true,
  confidential: false,
  date: '2026-04-01',
};

describe('projectSchema', () => {
  it('accepts a complete project', () => {
    expect(projectSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    'slug',
    'title',
    'block',
    'summary',
    'problem',
    'decisions',
    'outcome',
    'tech',
    'featured',
    'confidential',
  ])('rejects a project missing %s', (field) => {
    const { [field as keyof typeof valid]: _removed, ...incomplete } = valid;
    expect(projectSchema.safeParse(incomplete).success).toBe(false);
  });

  it('rejects a block outside the four declared ones', () => {
    const result = projectSchema.safeParse({ ...valid, block: 'side-project' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty tech list, since a case with no stack proves nothing', () => {
    expect(projectSchema.safeParse({ ...valid, tech: [] }).success).toBe(false);
  });

  it('rejects a relative repo URL', () => {
    expect(
      projectSchema.safeParse({ ...valid, repoUrl: '/nandomoreirame/forja' }).success,
    ).toBe(false);
  });

  it('rejects an image without alternative text', () => {
    const result = projectSchema.safeParse({
      ...valid,
      images: [{ src: '/img/forja.png', alt: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a project with no images at all', () => {
    expect(projectSchema.safeParse({ ...valid, images: undefined }).success).toBe(true);
  });

  it('accepts optional clientName and confidentialMetrics when absent', () => {
    expect(projectSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional clientName and confidentialMetrics when present', () => {
    expect(
      projectSchema.safeParse({
        ...valid,
        clientName: 'Acme',
        confidentialMetrics: ['R$ 2,3M'],
      }).success,
    ).toBe(true);
  });

  it('rejects a confidential case whose slug identifies the client', () => {
    const result = projectSchema.safeParse({
      ...valid,
      confidential: true,
      clientName: 'Acme',
      slug: 'acme-plataforma',
      repoUrl: 'https://github.com/x/y',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a confidential case whose liveUrl identifies the client', () => {
    const result = projectSchema.safeParse({
      ...valid,
      confidential: true,
      clientName: 'Acme',
      slug: 'plataforma-interna',
      repoUrl: null,
      liveUrl: 'https://Acme.example.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a confidential case with a neutral slug and URL', () => {
    const result = projectSchema.safeParse({
      ...valid,
      confidential: true,
      clientName: 'Acme',
      slug: 'plataforma-conciliacao',
      repoUrl: null,
      liveUrl: 'https://app.example.com',
    });
    expect(result.success).toBe(true);
  });

  it('requires a date, which the row pattern shows in its leading column', () => {
    const { date: _dropped, ...withoutDate } = { ...valid, date: '2026-04-01' };
    expect(projectSchema.safeParse(withoutDate).success).toBe(false);
  });

  it('accepts an ISO-8601 date', () => {
    expect(projectSchema.safeParse({ ...valid, date: '2026-04-01' }).success).toBe(true);
  });

  it('rejects a date that is not ISO-8601', () => {
    expect(projectSchema.safeParse({ ...valid, date: '01/04/2026' }).success).toBe(false);
  });
});

describe('link requirement', () => {
  const base = {
    slug: 'exemplo',
    title: 'Exemplo',
    block: 'professional' as const,
    summary: 's',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Python'],
    featured: false,
    date: '2026-01-01',
  };

  it('accepts a confidential case with no link at all', () => {
    // A client repo is private and the client domain carries the client name,
    // so the second refine forbids every link a real case could offer.
    const parsed = projectSchema.parse({ ...base, confidential: true });
    expect(parsed.repoUrl ?? null).toBeNull();
  });

  it('still rejects a public case with no link', () => {
    expect(() => projectSchema.parse({ ...base, confidential: false })).toThrow(
      /verifiable evidence/,
    );
  });
});

describe('discontinued projects', () => {
  const base = {
    slug: 'exemplo',
    title: 'Exemplo',
    block: 'professional' as const,
    summary: 's',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['TypeScript'],
    featured: false,
    confidential: false,
    date: '2025-01-01',
  };

  it('accepts a discontinued case with no link', () => {
    // A shut-down site has no live URL by definition, and a dead link is worse
    // than none: it promises evidence and delivers a connection error.
    const parsed = projectSchema.parse({ ...base, discontinued: true });
    expect(parsed.discontinued).toBe(true);
    expect(parsed.liveUrl ?? null).toBeNull();
  });

  it('defaults to false, so an ordinary case is unaffected', () => {
    expect(projectSchema.parse({ ...base, liveUrl: 'https://x.example' }).discontinued).toBe(
      false,
    );
  });

  it('still rejects a live case with no link', () => {
    // The exception must stay pinned to the two facts that justify it:
    // confidentiality and shutdown. Nothing else may omit the link.
    expect(() => projectSchema.parse(base)).toThrow(/verifiable evidence/);
  });
});
