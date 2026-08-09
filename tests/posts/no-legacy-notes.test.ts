import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('legacy notes cleanup', () => {
  it('keeps no reference to the old collection name in src', async () => {
    const offenders: string[] = [];

    for await (const file of glob('src/**/*.{astro,ts}')) {
      const normalized = file.replaceAll('\\', '/');
      const text = readFileSync(file, 'utf8');
      if (/\bnotas\b|getAllNotes|noteSchema|\bNote\b/.test(text)) {
        // Redirect pages under notas/ are intentional (REQ-014).
        if (normalized.includes('/pages/notas/')) continue;
        // Archive path contains "arquivo", not "notas".
        offenders.push(normalized);
      }
    }

    expect(offenders).toEqual([]);
  });
});
