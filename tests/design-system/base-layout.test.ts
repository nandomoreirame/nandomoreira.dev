import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: { title: 'Título', description: 'Descrição da página' },
    slots: { default: '<p>conteúdo</p>' },
  });
};

describe('BaseLayout', () => {
  it('declares the page language as Brazilian Portuguese', async () => {
    expect(await render()).toContain('lang="pt-BR"');
  });

  it('offers a skip link as the first focusable element', async () => {
    const html = await render();
    const skipIndex = html.indexOf('href="#main"');
    const mainIndex = html.indexOf('id="main"');

    expect(skipIndex).toBeGreaterThan(-1);
    expect(skipIndex).toBeLessThan(mainIndex);
  });

  it('exposes exactly one main landmark', async () => {
    const html = await render();
    expect(html.match(/<main[\s>]/g) ?? []).toHaveLength(1);
  });

  it('makes the main landmark programmatically focusable for the skip link', async () => {
    const html = await render();
    expect(html).toMatch(/<main[^>]*\btabindex="-1"/);
  });

  it('draws no focus ring around main: it is a skip-link target, not a control', async () => {
    const html = await render();
    expect(html).toMatch(/<main[^>]*class="[^"]*\bfocus:outline-none\b/);
  });

  it('stacks the skip link above the sticky header, which would cover it', async () => {
    const html = await render();
    const zOf = (classes: string) => Number(classes.match(/\bz-(\d+)\b/)?.[1] ?? 0);
    const skip = html.match(/<a[^>]*href="#main"[^>]*class="([^"]*)"/)?.[1] ?? '';
    const header = html.match(/<header[^>]*class="([^"]*)"/)?.[1] ?? '';
    expect(zOf(header)).toBeGreaterThan(0);
    expect(zOf(skip)).toBeGreaterThan(zOf(header));
  });

  // The horizontal-overflow guard moved to the base layer of global.css, where
  // html and body are styled. It is asserted in global-tags.test.ts.

  it('caps the container width at the layout token', async () => {
    // `--container-page` lives in Tailwind's --container-* namespace, so the
    // token generates a `max-w-page` utility directly.
    expect(await render()).toContain('max-w-page');
  });

  it('renders the banner before the main landmark', async () => {
    const html = await render();
    const banner = html.indexOf('<header');

    // Guard the index explicitly: a missing tag yields -1, which would satisfy
    // a bare "less than" comparison and let the assertion pass vacuously.
    expect(banner).toBeGreaterThan(-1);
    expect(banner).toBeLessThan(html.indexOf('<main'));
  });

  it('lets the banner and footer rules span the viewport', async () => {
    const html = await render();

    // Header and footer own their inner container so their borders reach the
    // viewport edges, as the reference theme does. A single wrapper around all
    // three would clip both rules to the measure. Asserting the inner <div>
    // is not enough: it survives the wrapper. Count the enclosing divs instead,
    // which is the property that actually breaks.
    const unclosedDivsBefore = (tag: string) => {
      const upTo = html.slice(0, html.indexOf(tag));
      const opened = (upTo.match(/<div\b/g) ?? []).length;
      const closed = (upTo.match(/<\/div>/g) ?? []).length;
      return opened - closed;
    };

    expect(html).toContain('<header');
    expect(html).toContain('<footer');
    expect(unclosedDivsBefore('<header')).toBe(0);
    expect(unclosedDivsBefore('<footer')).toBe(0);

    // And each owns a container on its inner row.
    expect(html).toMatch(/<header[^>]*>\s*<div[^>]*max-w-page/);
    expect(html).toMatch(/<footer[^>]*>\s*<div[^>]*max-w-page/);
  });

  it('renders the footer on every page', async () => {
    expect(await render()).toContain('<footer');
  });

  it('keeps the footer outside the main landmark', async () => {
    const html = await render();
    expect(html.indexOf('</main>')).toBeLessThan(html.indexOf('<footer'));
  });
});
