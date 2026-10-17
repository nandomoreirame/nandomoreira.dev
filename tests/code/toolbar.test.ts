import { codeToHtml } from 'shiki';
import { describe, expect, it } from 'vitest';
import { CODE_TOOLBAR_LABELS, codeToolbar, svgBody } from '../../src/lib/code/toolbar';

const highlight = (code: string, lang = 'python', meta?: string) =>
  codeToHtml(code, {
    lang,
    theme: 'github-dark-default',
    meta: meta ? { __raw: meta } : undefined,
    transformers: [codeToolbar()],
  });

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
  it('puts a header bar above the code, always in the markup', async () => {
    const html = await highlight('print("oi")');
    expect(html).toMatch(/^<div[^>]*class="code-block"[^>]*data-code-block/);
    expect(html).toMatch(/<div class="code-header">/);
    expect(html.indexOf('code-header')).toBeLessThan(html.indexOf('<pre'));
  });

  it('labels the bar with the fence title', async () => {
    const html = await highlight('wid=1', 'bash', 'title="bin/scratchpad.sh — scratchpad_toggle()"');
    expect(html).toMatch(/<span class="code-title">bin\/scratchpad\.sh — scratchpad_toggle\(\)<\/span>/);
  });

  it('falls back to the language, and to "texto" without one', async () => {
    expect(await highlight('a', 'bash')).toMatch(/<span class="code-title">bash<\/span>/);
    expect(await highlight('a', 'text')).toMatch(/<span class="code-title">texto<\/span>/);
    expect(await highlight('a', 'plaintext')).toMatch(/<span class="code-title">texto<\/span>/);
  });

  it('draws a decorative dot before the label', async () => {
    expect(await highlight('a')).toMatch(/<span class="code-dot" aria-hidden="true"><\/span>\s*<span class="code-title">/);
  });

  it('shows Raw and Copiar as text actions on the right, no tooltip', async () => {
    const html = await highlight('print("oi")');
    const actions = html.match(/<div class="code-actions">[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(actions).toMatch(/<label class="code-action"><input type="checkbox" class="code-raw-toggle sr-only"[^>]*>Raw<\/label>/);
    expect(actions).toMatch(/<button[^>]*class="code-action"[^>]*><span>Copiar<\/span><\/button>/);
    expect(html).not.toContain('code-tooltip');
  });

  it('copies the block through the site script, by the id of its <pre>', async () => {
    const html = await highlight('print("oi")');
    const id = html.match(/<pre[^>]*id="([^"]+)"/)?.[1];
    expect(id).toMatch(/^code-\d+$/);
    expect(html).toMatch(new RegExp(`<button[^>]*type="button"[^>]*data-copy="${id}"[^>]*hidden`));
    expect(html).toContain(`data-label-copied="${CODE_TOOLBAR_LABELS.copied}"`);
  });

  it('gives each block its own id', async () => {
    const ids = [await highlight('a = 1'), await highlight('b = 2')].map((html) => html.match(/<pre[^>]*id="([^"]+)"/)?.[1]);
    expect(new Set(ids).size).toBe(2);
  });

  it('labels the actions in Portuguese', () => {
    expect(CODE_TOOLBAR_LABELS).toEqual({ raw: 'Raw', copy: 'Copiar', copied: 'Copiado', plain: 'texto' });
  });
});

describe('markdown pipeline', () => {
  it('registers the toolbar in the Shiki config', async () => {
    const config = (await import('node:fs')).readFileSync('astro.config.mjs', 'utf8');
    expect(config).toMatch(/transformers:\s*\[codeToolbar\(\)\]/);
  });
});
