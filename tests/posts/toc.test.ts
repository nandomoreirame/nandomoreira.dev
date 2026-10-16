import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostToc from '../../src/components/posts/PostToc.astro';
import PostTocToggle from '../../src/components/posts/PostTocToggle.astro';
import { POST_TOC_ID, tocFrom } from '../../src/lib/posts/toc';

const css = readFileSync('src/styles/global.css', 'utf8');
const page = readFileSync('src/pages/[slug].astro', 'utf8');
const script = readFileSync('src/components/art/PointerField.astro', 'utf8');

const heading = (depth: number, slug: string, text = slug) => ({ depth, slug, text });

describe('tocFrom', () => {
  it('keeps the section headings and their subsections, in order', () => {
    const items = tocFrom([heading(2, 'a'), heading(3, 'a-1'), heading(4, 'deep'), heading(2, 'b')]);
    expect(items.map((item) => item.slug)).toEqual(['a', 'a-1', 'b']);
  });

  it('drops the post title, which is the page h1', () => {
    expect(tocFrom([heading(1, 'title'), heading(2, 'a'), heading(2, 'b')]).map((item) => item.slug)).toEqual([
      'a',
      'b',
    ]);
  });

  it('returns nothing below two sections, where an index has nothing to index', () => {
    expect(tocFrom([heading(2, 'only'), heading(3, 'sub')])).toEqual([]);
    expect(tocFrom([])).toEqual([]);
  });
});

describe('PostToc', () => {
  const items = tocFrom([heading(2, 'o-problema', 'O problema'), heading(3, 'a-causa', 'A causa'), heading(2, 'o-que-fica', 'O que fica')]);
  const render = async () => (await AstroContainer.create()).renderToString(PostToc, { props: { items } });

  it('is a named navigation landmark, a native popover on phones', async () => {
    const html = await render();
    expect(html).toMatch(new RegExp(`<nav[^>]*id="${POST_TOC_ID}"`));
    expect(html).toMatch(/<nav[^>]*popover/);
    expect(html).toMatch(/<nav[^>]*aria-label="Índice"/);
    expect(html).toMatch(/<nav[^>]*data-toc/);
  });

  it('links every heading by its anchor, subsections marked for indent', async () => {
    const html = await render();
    expect(html).toContain('href="#o-problema"');
    expect(html).toContain('href="#o-que-fica"');
    expect(html).toMatch(/<li[^>]*data-depth="3"[^>]*>\s*<a[^>]*href="#a-causa"/);
  });

  it('leaves the page in reading mode', async () => {
    expect(await render()).toContain('data-reader-hide');
  });
});

describe('PostTocToggle', () => {
  const render = async () => (await AstroContainer.create()).renderToString(PostTocToggle);

  it('is a button that toggles the index popover, with a spoken name', async () => {
    const html = await render();
    expect(html).toMatch(new RegExp(`<button[^>]*popovertarget="${POST_TOC_ID}"`));
    expect(html).toMatch(/<button[^>]*aria-label="Índice do post"/);
  });

  it('is only below 768px and leaves the page in reading mode', async () => {
    const html = await render();
    expect(html).toContain('md:hidden');
    expect(html).not.toContain('lg:hidden');
    expect(html).toContain('data-reader-hide');
  });
});

describe('post page', () => {
  it('builds the index from the rendered headings', () => {
    expect(page).toMatch(/const \{ Content, headings \} = await render\(live\)/);
    expect(page).toContain('tocFrom(headings)');
  });

  it('puts the index in a column left of the text from md, wider from lg, only when there is one', () => {
    expect(page).toContain(
      "'md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:gap-xl lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-2xl'",
    );
    expect(page).toMatch(/<PostToc items=\{toc\} \/>\}\s*<Prose>/);
  });

  it('keeps the phone toggle a direct child of the article, outside the animated blocks', () => {
    // An animated ancestor becomes the containing block of a fixed element
    // (measured on the reading mode controls), which would pin the toggle to it.
    expect(page).toMatch(/<\/div>\s*\{toc\.length > 0 && <PostTocToggle \/>\}\s*<\/article>/);
  });
});

describe('index styles', () => {
  it('turns the popover into a sticky column from 768px', () => {
    const at = css.indexOf('@media (width >= 48rem) {\n  [data-toc][popover] {');
    expect(at).toBeGreaterThan(-1);
    const block = css.slice(at, css.indexOf('}', at));
    expect(block).toMatch(/position:\s*sticky/);
    expect(block).toMatch(/display:\s*block/);
    // The inset shorthand resets top, so it has to come first (measured: the column scrolled away).
    expect(block.indexOf('inset: auto')).toBeLessThan(block.indexOf('top: var(--spacing-3xl)'));
  });

  it('adds no scroll margin of its own: the root scroll padding already clears the header', () => {
    // A heading margin on top of html's scroll-pt-3xl stopped jumps at 192px instead of 96px.
    expect(css).not.toMatch(/\[data-prose\][^{]*\{\s*scroll-margin-top/);
  });

  it('gives the text the whole column back in reading mode', () => {
    expect(css).toMatch(/:root:has\(#reader-on:checked\) \[data-toc-layout\] \{\s*display: block;/);
  });
});

describe('active section', () => {
  it('underlines the current item like the main menu does, through aria-current', () => {
    expect(css).toMatch(/\.toc-underline\[aria-current\]::after \{\s*transform: scaleX\(1\);/);
    expect(css).toMatch(/\.toc-underline\[aria-current\] \{\s*color: var\(--color-primary\);/);
  });

  it('gives every index link the underline class', async () => {
    const items = tocFrom([heading(2, 'a'), heading(2, 'b')]);
    const html = await (await AstroContainer.create()).renderToString(PostToc, { props: { items } });
    expect(html.match(/<a[^>]*class="[^"]*toc-underline/g)?.length).toBe(2);
  });

  it('marks the section being read through aria-current', () => {
    expect(script).toMatch(/setAttribute\('aria-current', 'true'\)/);
    expect(script).toMatch(/removeAttribute\('aria-current'\)/);
  });

  it('recomputes from the headings on scroll, at most once per frame', () => {
    // An IntersectionObserver missed jumps: a heading that goes from below the
    // band to above it in one scroll never intersects (measured at 800px).
    expect(script).not.toContain('IntersectionObserver');
    expect(script).toMatch(/findLastIndex\(\(\{ heading \}\) => heading\.getBoundingClientRect\(\)\.top <= /);
    expect(script).toMatch(/addEventListener\('scroll', [^)]*\{ passive: true \}\)/);
  });
});

describe('index script', () => {
  it('closes the phone popover after a jump, so the text is not covered', () => {
    expect(script).toContain('[data-toc] a');
    expect(script).toContain('hidePopover()');
  });
});
