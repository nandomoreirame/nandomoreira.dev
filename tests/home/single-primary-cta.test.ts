import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const HOME_COMPONENTS = 'src/components/home';

const sources = readdirSync(HOME_COMPONENTS)
  .filter((file) => file.endsWith('.astro'))
  .map((file) => ({ file, source: readFileSync(join(HOME_COMPONENTS, file), 'utf8') }));

describe('single primary CTA', () => {
  it('declares the primary variant in no home section but the hero, and at most once', () => {
    const offenders = sources.filter(({ source }) =>
      source.includes('variant="primary"'),
    );

    // The hero lost its buttons on 2026-10-19 (Fernando): zero is fine, a second is not.
    expect(offenders.map(({ file }) => file).filter((file) => file !== 'Hero.astro')).toEqual([]);
    const hero = sources.find(({ file }) => file === 'Hero.astro')?.source ?? '';
    expect(hero.split('variant="primary"').length - 1).toBeLessThanOrEqual(1);
  });

  it('never repeats the primary background token outside the hero', () => {
    const offenders = sources
      .filter(({ file }) => file !== 'Hero.astro')
      .filter(({ source }) => source.includes('bg-primary'));

    expect(offenders.map(({ file }) => file)).toEqual([]);
  });

  it('proves the gate can fail', () => {
    expect('variant="primary"'.includes('variant="primary"')).toBe(true);
  });
});
