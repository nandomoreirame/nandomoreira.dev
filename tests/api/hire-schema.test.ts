import { describe, expect, it } from 'vitest';
import { HONEYPOT_FIELD, hireSchema } from '../../src/lib/hire/schema';

const valid = {
  from: 'Agente da Acme',
  contact: 'contato@example.com',
  brief: 'Precisamos de um cliente multi-CLI para a equipe de plataforma.',
};

describe('hireSchema', () => {
  it('accepts the shape the PRD data model declares', () => {
    expect(hireSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a brief that is only whitespace', () => {
    expect(hireSchema.safeParse({ ...valid, brief: '   ' }).success).toBe(false);
  });

  it('rejects unknown keys instead of storing whatever arrives', () => {
    expect(hireSchema.safeParse({ ...valid, extra: 'x' }).success).toBe(false);
  });

  it('requires a way to answer, or the briefing is undeliverable', () => {
    expect(hireSchema.safeParse({ ...valid, contact: '' }).success).toBe(false);
  });

  it('requires who is asking', () => {
    expect(hireSchema.safeParse({ ...valid, from: '' }).success).toBe(false);
  });

  it('caps each field, so a valid-looking payload cannot be a payload attack', () => {
    expect(hireSchema.safeParse({ ...valid, brief: 'x'.repeat(10_000) }).success).toBe(false);
    expect(hireSchema.safeParse({ ...valid, from: 'x'.repeat(500) }).success).toBe(false);
  });

  it('accepts the honeypot as optional, so an honest client never trips it', () => {
    expect(hireSchema.safeParse(valid).success).toBe(true);
    expect(hireSchema.safeParse({ ...valid, [HONEYPOT_FIELD]: '' }).success).toBe(true);
  });

  it('accepts a filled honeypot at the schema, because the route decides what to do', () => {
    // Rejecting here would answer 400 and teach the attacker which field is the
    // trap. The route answers as if accepted instead (REQ-004).
    expect(hireSchema.safeParse({ ...valid, [HONEYPOT_FIELD]: 'http://spam' }).success).toBe(
      true,
    );
  });

  it('trims, so a padded field cannot smuggle length past the cap', () => {
    const parsed = hireSchema.parse({ ...valid, from: '  Agente  ' });

    expect(parsed.from).toBe('Agente');
  });
});

describe('hireSchema optional context fields', () => {
  it('accepts company, budget and interests from the closed lists', () => {
    const parsed = hireSchema.parse({
      ...valid,
      company: 'Acme',
      budget: '10k-30k',
      interests: ['freelance', 'ai-product'],
    });

    expect(parsed).toMatchObject({ company: 'Acme', budget: '10k-30k', interests: ['freelance', 'ai-product'] });
  });

  it('keeps every new field optional, so existing agents are not broken', () => {
    expect(hireSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a budget or an interest outside the closed lists', () => {
    expect(hireSchema.safeParse({ ...valid, budget: 'a lot' }).success).toBe(false);
    expect(hireSchema.safeParse({ ...valid, interests: ['crypto'] }).success).toBe(false);
  });

  it('rejects repeated interests and oversized companies', () => {
    expect(hireSchema.safeParse({ ...valid, interests: ['aeo', 'aeo'] }).success).toBe(false);
    expect(hireSchema.safeParse({ ...valid, company: 'x'.repeat(201) }).success).toBe(false);
  });
});
