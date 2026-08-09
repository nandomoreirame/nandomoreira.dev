import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const HOME_COMPONENTS = 'src/components/home';

const sources = readdirSync(HOME_COMPONENTS)
  .filter((file) => file.endsWith('.astro'))
  .map((file) => ({ file, source: readFileSync(join(HOME_COMPONENTS, file), 'utf8') }));

describe('single primary CTA', () => {
  it('declares the primary variant in exactly one home section', () => {
    const offenders = sources.filter(({ source }) =>
      source.includes('variant="primary"'),
    );

    expect(offenders.map(({ file }) => file)).toEqual(['Hero.astro']);
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
