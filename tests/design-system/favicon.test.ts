import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

describe('favicon', () => {
  it('ships an SVG icon from the site itself', () => {
    expect(existsSync('public/favicon.svg')).toBe(true);
    expect(readFileSync('public/favicon.svg', 'utf8')).toMatch(/^<svg[^>]*viewBox="0 0 32 32"/);
  });

  it('outlines the tile with the primary colour at half opacity, like the header mark', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8');
    const css = readFileSync('src/styles/global.css', 'utf8');
    const primary = css.match(/--color-primary:\s*(#[0-9a-fA-F]{6})/)?.[1];
    const rect = svg.match(/<rect[^>]*stroke=[^>]*>/)?.[0] ?? '';
    expect(rect).toContain(`stroke="${primary}"`);
    expect(rect).toContain('stroke-opacity="0.5"');
  });

  it('declares it in the head of every page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: 'T', description: 'D' },
      slots: { default: '<p>x</p>' },
    });
    expect(html).toMatch(/<link[^>]*rel="icon"[^>]*href="\/favicon\.svg"[^>]*type="image\/svg\+xml"/);
  });

  it('answers the default /favicon.ico request with a redirect, not the post route', () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).toMatch(/'\/favicon\.ico':\s*'\/favicon\.svg'/);
  });
});

describe('astro-icon local directory', () => {
  it('exists, so the integration does not warn on every dev start', () => {
    expect(existsSync('src/icons')).toBe(true);
  });
});
