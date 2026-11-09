import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

describe('favicon', () => {
  it('ships the brand icons from the site itself, so /favicon.ico never reaches the post route', () => {
    for (const file of ['public/favicon.ico', 'public/favicon-32.png', 'public/favicon-16.png']) {
      expect(existsSync(file), file).toBe(true);
    }
  });

  it('declares them in the head of every page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: 'T', description: 'D' },
      slots: { default: '<p>x</p>' },
    });
    expect(html).toMatch(/<link[^>]*rel="icon"[^>]*href="\/favicon\.ico"/);
    expect(html).toMatch(/<link[^>]*rel="icon"[^>]*href="\/favicon-32\.png"[^>]*type="image\/png"/);
    expect(html).toContain('href="/icons/apple-touch-icon.png"');
  });
});

describe('astro-icon local directory', () => {
  it('exists, so the integration does not warn on every dev start', () => {
    expect(existsSync('src/icons')).toBe(true);
  });
});
