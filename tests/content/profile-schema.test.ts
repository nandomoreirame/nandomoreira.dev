import { describe, expect, it } from 'vitest';
import { profileSchema } from '../../src/content/schemas/profile';

const valid = {
  name: 'Fernando Moreira Costa',
  headline: 'Engenheiro de produto com agentes de IA',
  bio: 'Construo ferramental de agentes e produtos com IA em produção.',
  positioning: 'IA, agentes e tooling de AI coding.',
  stack: ['TypeScript', 'Rust', 'Astro'],
  trajectory: [
    {
      value: '964',
      label: 'estrelas no GitHub',
      context: 'cerca de 700 vêm de temas Jekyll de 2018',
    },
  ],
  services: [
    {
      title: 'Tooling com agentes',
      description: 'Ferramental interno para times que usam agentes de código.',
      caseSlug: 'forja',
    },
  ],
  availability: {
    status: 'open',
    detail: 'Aberto a consultoria de escopo fechado e a posição sênior.',
    updatedAt: '2026-08-08',
  },
  contacts: [{ kind: 'email', value: 'fernando@nandomoreira.dev' }],
};

describe('profileSchema', () => {
  it('accepts a complete profile', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it('requires availability to carry the date it was last updated', () => {
    const { updatedAt: _dropped, ...availability } = valid.availability;
    expect(profileSchema.safeParse({ ...valid, availability }).success).toBe(false);
  });

  it('rejects an availability date that is not ISO-8601', () => {
    const result = profileSchema.safeParse({
      ...valid,
      availability: { ...valid.availability, updatedAt: '08/08/2026' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a trajectory number with no narrative context', () => {
    const result = profileSchema.safeParse({
      ...valid,
      trajectory: [{ value: '964', label: 'estrelas', context: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a service that references no case, since every service needs proof', () => {
    const result = profileSchema.safeParse({
      ...valid,
      services: [{ title: 'X', description: 'Y', caseSlug: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one contact channel', () => {
    expect(profileSchema.safeParse({ ...valid, contacts: [] }).success).toBe(false);
  });
});
