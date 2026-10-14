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

describe('Portrait tilt in the single site script', () => {
  it('writes the pointer position relative to each [data-tilt] element, centred and clamped', () => {
    expect(source).toContain("'[data-tilt]'");
    for (const variable of ['--tx', '--ty']) expect(source).toContain(`'${variable}'`);
    expect(source).toMatch(/Math\.max\(-0\.5,\s*Math\.min\(0\.5/);
  });

  it('straightens the portrait when the pointer leaves', () => {
    expect(source).toMatch(/pointerleave[\s\S]*removeProperty\('--tx'\)/);
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

describe('Copy in the single site script (ai-view REQ-007)', () => {
  it('reveals the copy button only when the script runs', () => {
    expect(source).toContain('[data-copy]');
    expect(source).toMatch(/\.hidden\s*=\s*false|removeAttribute\('hidden'\)/);
  });

  it('copies the element the button names, by id', () => {
    expect(source).toContain('getElementById(button.dataset.copy');
    expect(source).toContain('navigator.clipboard.writeText');
  });

  it('takes the confirmation label from the button, which reads it from the label map', () => {
    expect(source).toContain('labelCopied');
  });

  it('works regardless of the pointer and motion conditions that gate the effect', () => {
    expect(source.indexOf('[data-copy]')).toBeLessThan(source.indexOf('if (fine && !calm)'));
  });
});
