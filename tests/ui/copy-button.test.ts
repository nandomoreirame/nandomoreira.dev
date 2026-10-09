import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CopyButton from '../../src/components/ui/CopyButton.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(CopyButton, { props: { target: 'x', ...props } });
};

describe('CopyButton', () => {
  it('swaps the copy icon for a check while data-copied is set', async () => {
    const html = await render({});
    const copy = html.match(/<svg[^>]*data-icon="lucide:copy"[^>]*>/)?.[0] ?? '';
    const check = html.match(/<svg[^>]*data-icon="lucide:check"[^>]*>/)?.[0] ?? '';

    expect(html).toMatch(/<button[^>]*class="[^"]*\bgroup\/copy\b/);
    expect(copy).toMatch(/\bgroup-data-copied\/copy:hidden\b/);
    expect(check).toMatch(/\bhidden\b/);
    expect(check).toMatch(/\bgroup-data-copied\/copy:block\b/);
  });

  it('keeps the visible label by default', async () => {
    const span = (await render({})).match(/<span[^>]*>Copiar<\/span>/)?.[0] ?? '';
    expect(span).not.toMatch(/\bsr-only\b/);
  });

  it('icon-only: a 44px square whose label stays for screen readers', async () => {
    const html = await render({ iconOnly: true, label: 'Copiar o endpoint MCP' });
    const button = html.match(/<button[^>]*>/)?.[0] ?? '';

    expect(button).toMatch(/\bsize-11\b/);
    expect(button).not.toMatch(/\bpx-md\b/);
    expect(button).toContain('aria-label="Copiar o endpoint MCP"');
    expect(html).toMatch(/<span class="sr-only">Copiar<\/span>/);
  });
});

describe('copy feedback in the single site script', () => {
  it('sets data-copied while confirming, and clears it after', () => {
    const script = readFileSync('src/components/art/PointerField.astro', 'utf8');
    expect(script).toContain("toggleAttribute('data-copied', true)");
    expect(script).toContain("removeAttribute('data-copied')");
  });
});

describe('/mcp code rows', () => {
  it('uses icon-only buttons and code boxes at least as tall as them', () => {
    const page = readFileSync('src/pages/mcp.astro', 'utf8');
    expect(page.match(/<CopyButton[^>]*iconOnly/g) ?? []).toHaveLength(2);
    expect(page).toMatch(/const codeClass =\s*'[^']*\bmin-h-11\b/);
  });
});
