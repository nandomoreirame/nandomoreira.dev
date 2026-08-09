import { describe, expect, it } from 'vitest';
import { profileSchema } from '../../src/content/schemas/profile';

const base = {
  name: 'Fernando Moreira Costa',
  headline: 'Engenheiro de produto com agentes de IA',
  bio: 'Construo ferramental de agentes.',
  positioning: 'IA, agentes e tooling',
  stack: ['TypeScript'],
  trajectory: [{ value: '10', label: 'anos', context: 'em produto' }],
  services: [{ title: 'Serviço', description: 'Descrição', caseSlug: 'forja' }],
  availability: { status: 'open' as const, detail: 'Aberto', updatedAt: '2026-08-09' },
  contacts: [{ kind: 'github' as const, value: 'https://github.com/nandomoreirame' }],
};

describe('profile wordmark', () => {
  it('accepts a wordmark distinct from the legal name', () => {
    const parsed = profileSchema.parse({ ...base, wordmark: 'Nando Moreira' });

    expect(parsed.wordmark).toBe('Nando Moreira');
    // The legal name stays put: it feeds Person JSON-LD, the resume, the
    // machine routes and the copyright line, where the short brand would be wrong.
    expect(parsed.name).toBe('Fernando Moreira Costa');
  });

  it('is optional, falling back to the legal name when absent', () => {
    expect(profileSchema.parse(base).wordmark).toBeUndefined();
  });

  it('rejects an empty wordmark rather than rendering a blank brand', () => {
    expect(() => profileSchema.parse({ ...base, wordmark: '' })).toThrow();
  });
});
