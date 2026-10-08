import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PointerField from '../../src/components/art/PointerField.astro';

const source = readFileSync('src/components/art/PointerField.astro', 'utf8');

describe('PointerField', () => {
  it('renders no wrapper, so the header and footer rules still span the viewport', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PointerField);
    expect(html).not.toMatch(/<div\b/);
  });

  it('starts only for a fine pointer and only without a reduced-motion request', () => {
    expect(source).toContain("matchMedia('(pointer: fine)')");
    expect(source).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
  });

  it('writes at most once per frame', () => {
    expect(source).toContain('requestAnimationFrame');
  });

  it('only writes CSS variables, leaving the drawing to CSS', () => {
    for (const variable of ['--gx', '--gy', '--mx', '--my']) expect(source).toContain(`'${variable}'`);
    expect(source).not.toMatch(/\.style\.(transform|left|top)\b/);
  });

  it('resets the parallax when the pointer leaves', () => {
    expect(source).toContain('pointerleave');
    expect(source).toContain('removeProperty');
  });

  it('snaps the glow on entry and clears the marker on the next frame', () => {
    expect(source).toContain('dataset.snap');
    expect(source).toMatch(/delete\s+field\.dataset\.snap/);
    expect(source).toMatch(/pointerleave[\s\S]*dataset\.snap/);
  });

  it('uses no framework island', () => {
    expect(source).not.toContain('client:');
  });
});

describe('PointerField on the whole page', () => {
  it('loads on every page and marks the body as the field', () => {
    const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
    expect(layout).toContain('<PointerField />');
    expect(layout).toMatch(/<body data-pointer-field>/);
  });

  it('writes the glow position in viewport coordinates, matching the fixed layer', () => {
    expect(source).toContain('`${last.clientX}px`');
    expect(source).toContain('`${last.clientY}px`');
  });
});
