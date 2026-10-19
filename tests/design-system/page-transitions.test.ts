import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

// The @media block that opens nearest before `index`, so a rule can be checked
// for sitting under the reduced-motion guard.
const enclosingMedia = (index: number) => {
  const before = css.slice(0, index);
  return before.slice(before.lastIndexOf('@media')).split('{')[0];
};

const keyframes = (name: string) => {
  const start = css.indexOf(`@keyframes ${name}`);
  expect(start, `@keyframes ${name}`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('\n}', start));
};

const rule = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
};

describe('page transitions', () => {
  it('turns on cross-document view transitions with CSS alone, only without reduced motion', () => {
    const at = css.indexOf('@view-transition');
    expect(at).toBeGreaterThan(-1);
    expect(css.slice(at, css.indexOf('}', at))).toMatch(/navigation:\s*auto/);
    expect(enclosingMedia(at)).toContain('prefers-reduced-motion: no-preference');
  });

  it('fades the old page out and the new one in, from the motion tokens', () => {
    expect(rule('::view-transition-old(root)')).toMatch(/animation:\s*page-leave var\(--duration-slow\)/);
    expect(rule('::view-transition-new(root)')).toMatch(/animation:\s*page-enter var\(--duration-slow\)/);
  });

  it('keeps the header in place while the page under it changes', () => {
    // Other [data-site-header] rules exist (the scrolled state), so match the pair.
    expect(css).toMatch(/\[data-site-header\]\s*\{\s*view-transition-name:\s*site-header;/);
  });

  it('ranks the blocks of main top to bottom, skipping the scripts that sit among them', () => {
    // A JSON-LD <script> is a child of main on several pages; counted, it
    // would push every real block one step later.
    // The second block starts at 2, not 1: a header of three lines (items 0
    // to 2) would otherwise finish after the list below it began (/posts).
    const expected = { '2': 2, '3': 3, 'n + 4': 4 };
    for (const [i, block] of Object.entries(expected)) {
      expect(rule(`main > :nth-child(${i} of :not(script))`)).toContain(`--block: ${block};`);
    }
  });

  it('ranks the elements inside each block, so a page of one big block still enters in steps', () => {
    for (let j = 2; j <= 5; j++) {
      expect(rule(`main > * > :nth-child(${j} of :not(script))`)).toContain(`--item: ${j - 1};`);
    }
  });

  it('gives each tier its own duration and delay, faster at the top, slower below, only without reduced motion', () => {
    const selector = 'main > * > :not(script), main > :not(script):not(:has(> *))';
    const at = css.indexOf(`${selector} {`);
    expect(at).toBeGreaterThan(-1);
    expect(enclosingMedia(at)).toContain('prefers-reduced-motion: no-preference');
    const body = rule(selector);
    // Five tiers (0 to 4): 0.8x to 1.6x the slow token, 100ms apart.
    expect(body).toMatch(/--tier:\s*min\(var\(--block, 0\) \+ var\(--item, 0\), 4\)/);
    expect(body).toMatch(
      /animation:\s*enter-rise calc\(var\(--duration-slow\) \* \(0\.8 \+ 0\.2 \* var\(--tier\)\)\) var\(--ease-out\) both/,
    );
    expect(body).toMatch(/animation-delay:\s*calc\(var\(--tier\) \* 100ms\)/);
  });

  it('rises from far enough to read as an entrance', () => {
    // 1.5rem since 2026-10-15: 0.75rem read as a twitch, not as an entrance.
    expect(keyframes('enter-rise')).toMatch(/translateY\(1\.5rem\)/);
  });

  it('moves only opacity and transform, never layout', () => {
    for (const name of ['page-leave', 'page-enter', 'enter-rise']) {
      const body = keyframes(name);
      expect(body).not.toMatch(/\b(top|left|margin|padding|width|height):/);
      expect(body).toMatch(/opacity|transform/);
    }
  });
});

describe('main menu underline', () => {
  it('draws a rule under the link, collapsed by scale, not by width', () => {
    const after = rule('.nav-underline::after');
    expect(after).toMatch(/transform:\s*scaleX\(0\)/);
    expect(after).toMatch(/transform-origin:\s*right/);
    expect(after).toMatch(/transition:\s*transform var\(--duration-slow\) var\(--ease-out\)/);
    expect(after).not.toMatch(/transition:[^;]*width/);
  });

  it('stays drawn under the link of the current page or section', () => {
    // The page itself ("page") and a section the visitor is inside ("true").
    expect(rule('.nav-underline[aria-current]::after')).toMatch(/transform:\s*scaleX\(1\)/);
  });

  it('grows in from the left on hover and focus, and leaves to the right', () => {
    const hover = rule('.nav-underline:is(:hover, :focus-visible)::after');
    expect(hover).toMatch(/transform:\s*scaleX\(1\)/);
    expect(hover).toMatch(/transform-origin:\s*left/);
  });
});
