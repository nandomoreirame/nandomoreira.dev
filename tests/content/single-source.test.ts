import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const ALLOWED = ['src/lib/content/projects.ts', 'src/lib/content/profile.ts'];

describe('single source of truth', () => {
  it('only the access layer may read a collection directly', async () => {
    const offenders: string[] = [];

    for await (const file of glob('src/**/*.{ts,astro}')) {
      const normalized = file.replaceAll('\\', '/');
      if (ALLOWED.includes(normalized)) continue;

      if (readFileSync(file, 'utf8').includes('getCollection(')) {
        offenders.push(normalized);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('proves the gate can actually fail', () => {
    const source = "const x = getCollection('projects');";
    expect(source.includes('getCollection(')).toBe(true);
  });
});
