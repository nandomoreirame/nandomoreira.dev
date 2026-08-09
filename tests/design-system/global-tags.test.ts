import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const GLOBAL_CSS = readFileSync('src/styles/global.css', 'utf8');

const collectAstro = async (): Promise<string[]> => {
  const files: string[] = [];
  for await (const entry of glob('src/**/*.astro')) files.push(entry);
  return files;
};

/** `<html ... class="...">` or `<body ... class="...">`, attributes in any order. */
const GLOBAL_TAG_WITH_CLASS = /<(html|body)\b[^>]*\bclass\s*=/g;

describe('global tags are styled in CSS, never with utility classes in markup', () => {
  it('styles html and body from the base layer of global.css', () => {
    const baseLayer = GLOBAL_CSS.slice(GLOBAL_CSS.indexOf('@layer base'));

    expect(baseLayer).toMatch(/\bhtml\b/);
    expect(baseLayer).toMatch(/\bbody\b/);
    expect(baseLayer).toContain('@apply');
  });

  it('never puts a class attribute on html or body in any component', async () => {
    const offenders: string[] = [];

    for (const file of await collectAstro()) {
      const matches = readFileSync(file, 'utf8').match(GLOBAL_TAG_WITH_CLASS) ?? [];
      if (matches.length > 0) offenders.push(`${file}: ${matches.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });

  it('keeps the horizontal-overflow guard in CSS, where the rule now lives', () => {
    expect(GLOBAL_CSS).toContain('overflow-x-clip');
  });

  it('clips rather than hides, because overflow-x-hidden kills the sticky header', () => {
    // `overflow: hidden` on an ancestor makes that ancestor a scroll container,
    // and `position: sticky` then sticks to it instead of to the viewport — so
    // the header silently stops sticking. `clip` forbids the same overflow
    // without creating a scroll container, so REQ-012 holds and sticky works.
    const baseLayer = GLOBAL_CSS.slice(GLOBAL_CSS.indexOf('@layer base'));

    expect(baseLayer).not.toMatch(/\boverflow-(x-)?hidden\b/);
  });

  it('scrolls smoothly to anchors and clears the sticky header', () => {
    const baseLayer = GLOBAL_CSS.slice(GLOBAL_CSS.indexOf('@layer base'));

    expect(baseLayer).toMatch(/\bscroll-smooth\b/);
    // Without scroll padding the anchor target lands under the sticky header.
    expect(baseLayer).toMatch(/\bscroll-pt-[a-z0-9]+\b/);
  });

  it('never forces a viewport-width minimum on a global tag', () => {
    // A viewport width unit resolves against the initial containing block, which
    // includes the classic scrollbar gutter. `min-w-dvw` therefore makes the page
    // wider than the usable area and manufactures the very horizontal overflow
    // REQ-012 forbids, which overflow-x-hidden would then merely hide.
    const baseLayer = GLOBAL_CSS.slice(GLOBAL_CSS.indexOf('@layer base'));

    expect(baseLayer).not.toMatch(/\bmin-w-(dvw|svw|lvw|screen|\[100[a-z]*vw\])/);
  });
});
