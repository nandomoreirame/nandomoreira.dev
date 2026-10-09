import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const base = css.slice(css.indexOf('@layer base'));

describe('pointer cursor on buttons', () => {
  // Tailwind 4 dropped cursor:pointer from <button>; one base rule restores it
  // for every enabled button, so a new component cannot forget it.
  it('gives every enabled button the pointer cursor in the base layer', () => {
    expect(base).toMatch(/button:not\(:disabled\)[^{]*\{\s*cursor:\s*pointer;?\s*\}/);
  });

  it('keeps the not-allowed cursor on disabled buttons', () => {
    expect(readFileSync('src/components/ui/Button.astro', 'utf8')).toContain('disabled:cursor-not-allowed');
  });
});
