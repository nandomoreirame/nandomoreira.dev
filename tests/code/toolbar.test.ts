import { codeToHtml } from 'shiki';
import { describe, expect, it } from 'vitest';
import { CODE_TOOLBAR_LABELS, codeToolbar, svgBody } from '../../src/lib/code/toolbar';

const highlight = (code: string) =>
  codeToHtml(code, { lang: 'python', theme: 'github-dark-default', transformers: [codeToolbar()] });

describe('svgBody', () => {
  it('turns an icon body, nested groups included, into hast elements', () => {
    const nodes = svgBody('<g fill="none" stroke="currentColor"><rect width="14" height="14"/><path d="M4 16"/></g>');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: 'element', tagName: 'g', properties: { fill: 'none' } });
    expect((nodes[0] as { children: { tagName: string }[] }).children.map((child) => child.tagName)).toEqual([
      'rect',
      'path',
    ]);
  });
});

describe('codeToolbar', () => {
  it('wraps the block with a toolbar of icon actions', async () => {
    const html = await highlight('print("oi")');

    expect(html).toMatch(/^<div[^>]*class="code-block"[^>]*data-code-block/);
    expect(html).toMatch(/<div[^>]*class="code-toolbar"/);
    expect(html.indexOf('code-toolbar')).toBeLessThan(html.indexOf('<pre'));
  });

  it('copies the block through the site script, by the id of its <pre>', async () => {
    const html = await highlight('print("oi")');
    const id = html.match(/<pre[^>]*id="([^"]+)"/)?.[1];

    expect(id).toMatch(/^code-\d+$/);
    // Ships hidden: only the script reveals it, so without JS it promises nothing.
    expect(html).toMatch(new RegExp(`<button[^>]*type="button"[^>]*data-copy="${id}"[^>]*hidden`));
    expect(html).toContain(`data-label-copied="${CODE_TOOLBAR_LABELS.copied}"`);
  });

  it('gives each block its own id', async () => {
    const ids = [await highlight('a = 1'), await highlight('b = 2')].map((html) => html.match(/<pre[^>]*id="([^"]+)"/)?.[1]);
    expect(new Set(ids).size).toBe(2);
  });

  it('toggles the raw view with a checkbox, so it needs no script', async () => {
    const html = await highlight('print("oi")');
    expect(html).toMatch(/<label[^>]*class="code-action"[^>]*><input[^>]*type="checkbox"[^>]*class="code-raw-toggle sr-only"/);
  });

  it('names each action by its tooltip, which is the visible label', async () => {
    const html = await highlight('print("oi")');
    const tooltips = [...html.matchAll(/<span class="code-tooltip">([^<]+)<\/span>/g)].map((match) => match[1]);

    expect(tooltips).toEqual([CODE_TOOLBAR_LABELS.raw, CODE_TOOLBAR_LABELS.copy]);
  });

  it('draws the icons as decorative inline SVG', async () => {
    const svgs = (await highlight('print("oi")')).match(/<svg\b[^>]*>/g) ?? [];

    expect(svgs).toHaveLength(3); // raw, copy, and the check shown after copying
    for (const svg of svgs) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('viewBox="0 0 24 24"');
    }
  });

  it('labels the actions in Portuguese', () => {
    expect(CODE_TOOLBAR_LABELS).toEqual({ raw: 'Raw', copy: 'Copiar', copied: 'Copiado' });
  });
});

describe('markdown pipeline', () => {
  it('registers the toolbar in the Shiki config', async () => {
    const config = (await import('node:fs')).readFileSync('astro.config.mjs', 'utf8');
    expect(config).toMatch(/transformers:\s*\[codeToolbar\(\)\]/);
  });
});
