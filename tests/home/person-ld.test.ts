import { describe, expect, it } from 'vitest';
import { personLd } from '../../src/lib/home/person-ld';

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Engenheiro de produto com agentes de IA',
  bio: 'Construo ferramental de agentes.',
  stack: ['TypeScript', 'Rust'],
  contacts: [
    { kind: 'email', value: 'oi@nandomoreira.dev' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
    { kind: 'linkedin', value: 'https://linkedin.com/in/nandomoreirame' },
  ],
} as never;

const SITE = 'https://nandomoreira.dev';

describe('personLd', () => {
  it('declares the schema.org Person type', () => {
    const ld = personLd(profile, SITE);

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Person');
  });

  it('derives the name and job title from the profile', () => {
    const ld = personLd(profile, SITE);

    expect(ld.name).toBe('Fernando Moreira Costa');
    expect(ld.jobTitle).toBe('Engenheiro de produto com agentes de IA');
  });

  it('lists external profiles under sameAs', () => {
    expect(personLd(profile, SITE).sameAs).toEqual([
      'https://github.com/nandomoreirame',
      'https://linkedin.com/in/nandomoreirame',
    ]);
  });

  it('never leaks the email address into structured data', () => {
    expect(JSON.stringify(personLd(profile, SITE))).not.toContain('@nandomoreira.dev');
  });

  it('points image at the absolute URL of the portrait', () => {
    expect(personLd(profile, SITE).image).toBe(`${SITE}/profile/fernando-moreira-v2-960.jpg`);
  });

  it('serialises to valid JSON', () => {
    expect(() => JSON.parse(JSON.stringify(personLd(profile, SITE)))).not.toThrow();
  });
});

describe('personLd identity', () => {
  it('has a stable @id the articles point their author at', async () => {
    const { getProfile } = await import('../../src/lib/content');
    expect(personLd(await getProfile(), 'https://nandomoreira.dev')['@id']).toBe('https://nandomoreira.dev/#person');
  });
});
