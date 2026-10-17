import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Prose from '../../src/components/ui/Prose.astro';

const css = readFileSync('src/styles/global.css', 'utf8');
const render = async (props: Record<string, unknown> = {}) =>
  (await AstroContainer.create()).renderToString(Prose, { props, slots: { default: '<h2>A</h2><p>x</p>' } });

describe('Prose ruled', () => {
  it('marks the body for ruled sections only when asked', async () => {
    expect(await render({ ruled: true })).toMatch(/<div[^>]*data-prose-ruled/);
    expect(await render()).not.toContain('data-prose-ruled');
  });

  it('rules every section after the first', () => {
    expect(css).toMatch(/\[data-prose-ruled\] h2 ~ h2 \{[^}]*border-top: 1px solid var\(--color-border\);/);
  });

  it('never numbers the sections (author, 2026-10-17)', () => {
    expect(css).not.toMatch(/\[data-prose-ruled\][^{]*\{[^}]*counter/);
  });
});
