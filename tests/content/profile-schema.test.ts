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

describe('profileSchema: career history', () => {
  it('accepts a position with no end date, meaning it is current', () => {
    const parsed = profileSchema.parse({
      ...valid,
      work: [{ name: 'Empresa', position: 'Cargo', startDate: '2024-01-01' }],
    });

    expect(parsed.work?.[0]?.endDate).toBeUndefined();
  });

  it('requires an ISO start date, because a resume without dates is unreadable', () => {
    const result = profileSchema.safeParse({
      ...valid,
      work: [{ name: 'X', position: 'Y', startDate: '2024' }],
    });

    expect(result.success).toBe(false);
  });

  it('keeps both fields optional, so the profile stays valid until they are written', () => {
    const parsed = profileSchema.parse(valid);

    expect(parsed.work).toBeUndefined();
    expect(parsed.education).toBeUndefined();
  });

  it('rejects a date that matches the shape but is not a real calendar date', () => {
    const result = profileSchema.safeParse({
      ...valid,
      work: [{ name: 'X', position: 'Y', startDate: '2024-99-99' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an employer with no name, which would render as a blank line', () => {
    const result = profileSchema.safeParse({
      ...valid,
      work: [{ name: '', position: 'Cargo', startDate: '2024-01-01' }],
    });

    expect(result.success).toBe(false);
  });

  it('accepts an education entry with the same date discipline', () => {
    const parsed = profileSchema.parse({
      ...valid,
      education: [
        {
          institution: 'Instituição',
          area: 'Área',
          studyType: 'Bacharelado',
          startDate: '2008-02-01',
          endDate: '2012-12-01',
        },
      ],
    });

    expect(parsed.education?.[0]?.endDate).toBe('2012-12-01');
  });
});
