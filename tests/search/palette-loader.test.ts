import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { viewFor } from '../../src/lib/search/controller';

const source = readFileSync('src/components/art/PointerField.astro', 'utf8');
const bare = readFileSync('src/lib/search/bare-letter.ts', 'utf8');
const loader = source.slice(
  source.indexOf('// Command palette loader'),
  source.indexOf('// End command palette loader'),
);

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
    expect(loader).toMatch(/forwardBareLetter\(origin, event, touch\)/);
    expect(bare).toMatch(/!event\.ctrlKey && !event\.metaKey && !event\.altKey/);
    expect(bare).toMatch(/isContentEditable/);
    expect(loader).toMatch(/\[glemsit\]/);
    expect(loader).toMatch(/\.press\(/);
    expect(loader).not.toMatch(/armGo/);
  });

  // The loader only fetches the module on these letters, so a General shortcut
  // missing from them does nothing on a fresh page (theme-modes, REQ-011: T).
  it('loads on every one-letter General shortcut the controller offers', () => {
    const letters = loader.match(/\/\^\[([a-z]+)\]\$\/i\.test\(key\)/)?.[1] ?? '';
    const all = { mdPath: '/x.md', aiPath: '/x/ia', humanPath: '/x', theme: 'noir' as const };
    const keys = (viewFor(undefined, '', all)[0]?.options ?? []).map(option => option.keys?.[0]?.toLowerCase());
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) expect(letters, `shortcut ${key}`).toContain(key);
    expect(letters).toContain('g');
  });

  it('queues the letters typed while the module is still loading, so G + letter survives a slow network', () => {
    expect(loader).toMatch(/else if \(queue\) queue\.push\(\[key, timeStamp\]\)/);
    expect(loader).toMatch(/pending\.forEach\(\(\[letter, at\]\) => module\.press\(letter, at\)\)/);
  });

  it('turns the letter shortcuts off on touch screens', () => {
    expect(loader).toMatch(/matchMedia\('\(hover: none\)'\)\.matches/);
  });

  it('reads the typed node through the shadow root', () => {
    expect(loader).toMatch(/const origin = event\.composedPath\(\)\[0\]/);
    expect(loader).not.toContain('data-post-review');
  });
});
