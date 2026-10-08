import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PointerField from '../../src/components/art/PointerField.astro';

const source = readFileSync('src/components/art/PointerField.astro', 'utf8');

describe('PointerField', () => {
  it('wraps its content in the marked field the script and the gate look for', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PointerField, { slots: { default: '<p>inside</p>' } });

    expect(html).toContain('data-pointer-field');
    expect(html).toContain('pointer-field');
    expect(html).toContain('<p>inside</p>');
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
