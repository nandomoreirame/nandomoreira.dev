import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const LEGACY = /\bnotas\b|getAllNotes|noteSchema|\bNote\b/;

describe('legacy notes cleanup', () => {
  it('keeps no reference to the old collection name in src', async () => {
    const offenders: string[] = [];

    for await (const file of glob('src/**/*.{astro,ts}')) {
      const normalized = file.replaceAll('\\', '/');
      const text = readFileSync(file, 'utf8');
      if (LEGACY.test(text)) {
        offenders.push(normalized);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps no file or directory named after the old collection', async () => {
    // Scanning contents alone let a whole `src/pages/notas/` directory back in:
    // a redirect page holds the old name only in its path, never in its text.
    const offenders: string[] = [];

    for await (const file of glob('src/**/*')) {
      const normalized = file.replaceAll('\\', '/');
      if (normalized.split('/').some(segment => LEGACY.test(segment))) {
        offenders.push(normalized);
      }
    }

    expect(offenders).toEqual([]);
  });
});
