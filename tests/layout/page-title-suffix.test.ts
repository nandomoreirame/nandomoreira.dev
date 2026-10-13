import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('page title suffix', () => {
  it('ends every page title with the author name, never the domain', async () => {
    const offenders: string[] = [];

    for await (const file of glob('src/pages/**/*.astro')) {
      const source = readFileSync(file, 'utf8');
      if (/\|\s*nandomoreira\.dev[`"]/.test(source)) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });
});
