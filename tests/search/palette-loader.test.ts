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

  it('opens on Ctrl or Cmd + K and swaps Ctrl for ⌘ on a Mac', () => {
    expect(loader).toMatch(/event\.ctrlKey \|\| event\.metaKey/);
    expect(loader).toMatch(/preventDefault\(\)/);
    expect(loader).toMatch(/data-palette-mod/);
  });

  it('forwards bare letters typed outside fields to press, loading on G or a shortcut letter', () => {
    expect(loader).toMatch(/!event\.ctrlKey && !event\.metaKey && !event\.altKey/);
    expect(loader).toMatch(/isContentEditable/);
    expect(loader).toMatch(/\[glemi\]/);
    expect(loader).toMatch(/\.press\(/);
    expect(loader).not.toMatch(/armGo/);
  });

  it('queues the letters typed while the module is still loading, so G + letter survives a slow network', () => {
    expect(loader).toMatch(/else if \(queue\) queue\.push\(\[key, timeStamp\]\)/);
    expect(loader).toMatch(/pending\.forEach\(\(\[letter, at\]\) => module\.press\(letter, at\)\)/);
  });

  it('turns the letter shortcuts off on touch screens', () => {
    expect(loader).toMatch(/matchMedia\('\(hover: none\)'\)\.matches/);
  });
});
