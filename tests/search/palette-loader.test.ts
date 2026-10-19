import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/art/PointerField.astro', 'utf8');
const loader = source.slice(source.indexOf('// Command palette loader'), source.indexOf('// End command palette loader'));

describe('palette loader in the site script', () => {
  it('only arms where a trigger exists, so the sales layout gets nothing', () => {
    expect(loader).toMatch(/querySelectorAll<HTMLElement>\('\[data-palette-trigger\]'\)/);
    expect(loader).toMatch(/if \(triggers\.length\)/);
  });

  it('imports the module on demand and never names the gate marker', () => {
    expect(loader).toMatch(/import\('\.\.\/\.\.\/scripts\/palette'\)/);
    expect(loader).not.toContain('data-command-palette');
  });

  it('opens on Ctrl or Cmd + K, arms G outside fields and swaps Ctrl for ⌘ on a Mac', () => {
    expect(loader).toMatch(/event\.ctrlKey \|\| event\.metaKey/);
    expect(loader).toMatch(/preventDefault\(\)/);
    expect(loader).toMatch(/armGo/);
    expect(loader).toMatch(/isContentEditable/);
    expect(loader).toMatch(/data-palette-mod/);
  });
});
