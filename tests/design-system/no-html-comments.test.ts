import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('authoring notes stay out of the output', () => {
  it('uses {/* */} in .astro templates, never <!-- -->', async () => {
    // An HTML comment in a .astro template is shipped to every visitor. The
    // notes explaining a layout decision are for whoever edits the file, not
    // for the page source. `{/* */}` is compiled away.
    const offenders: string[] = [];

    for await (const file of glob('src/**/*.astro')) {
      const text = readFileSync(file, 'utf8');
      if (text.includes('<!--')) {
        offenders.push(file.replaceAll('\\', '/'));
      }
    }

    expect(offenders).toEqual([]);
  });
});
