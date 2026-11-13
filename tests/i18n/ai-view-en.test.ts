import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markdownForPathIn } from '../../src/lib/ai-view/registry';
import { resetLoadNowForTests } from '../../src/lib/now/load';
import { ptLeftovers } from '../helpers/pt-leftovers';

const site = new URL('https://nandomoreira.dev');

/** .com TLDs and proper names that legitimately carry Portuguese particles. */
const withoutFalsePositives = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/https?:\/\/[^\s)]+/g, ' ')
    .replace(/\b[\w.-]+\.com\b/gi, ' ')
    .replace(/Colégio Estadual do Paraná/g, ' ')
    .replace(/Mesa ErgoDesk com regulagem de altura/g, ' ')
    .replace(/Zsh com Oh My Zsh/g, ' ')
    .replace(/Gemini no fluxo de implementação/g, ' ')
    .replace(/Irmão do Jorel/gi, ' ');

describe('English AI view', () => {
  beforeEach(() => {
    // GitHub repo descriptions are author-written Portuguese; keep this suite
    // offline so the gate owns curated /now copy and the writing slug, not the API.
    resetLoadNowForTests();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetLoadNowForTests();
  });

  it('en home lists English case titles and summaries', async () => {
    const page = await markdownForPathIn(site, 'en', true);
    expect(page?.humanPath).toBe('/en');
    expect(page?.mdPath).toBe('/en/index.md');
    // First five of each collection (alphabetical); pick one from each.
    expect(page!.markdown).toContain('Institutional site for a nonprofit');
    expect(page!.markdown).toContain('Persistent, deterministic memory layer');
    expect(page!.markdown).not.toContain('Site institucional de uma organização sem fins lucrativos');
    expect(page!.markdown).not.toContain('Camada de memória persistente');
    expect(ptLeftovers(withoutFalsePositives(page!.markdown))).toEqual([]);
  });
  it('en about links services to English case titles', async () => {
    const page = await markdownForPathIn(site, 'en/about', true);
    expect(page?.mdPath).toBe('/en/about.md');
    expect(page!.markdown).toContain('Financial data normalization');
    expect(page!.markdown).not.toContain('Normalização de dados financeiros');
    expect(ptLeftovers(withoutFalsePositives(page!.markdown))).toEqual([]);
  });

  it('en case markdown uses English URL and section labels', async () => {
    const page = await markdownForPathIn(site, 'en/lab/forja', true);
    expect(page?.humanPath).toBe('/en/lab/forja');
    expect(page?.mdPath).toBe('/en/lab/forja.md');
    expect(page!.markdown).toContain('url: https://nandomoreira.dev/en/lab/forja');
    expect(page!.markdown).toContain('## Problem');
    expect(page!.markdown).toContain('Desktop client that brings Claude Code');
    expect(page!.markdown).not.toContain('url: https://nandomoreira.dev/lab/forja\n');
    expect(page!.markdown).not.toContain('## Problema');
    expect(ptLeftovers(withoutFalsePositives(page!.markdown))).toEqual([]);
  });

  it.each(['en/contact', 'en/portfolio', 'en/lab', 'en/posts', 'en/setup', 'en/now', 'en/privacy', 'en/mcp'])(
    '%s has an English markdown mirror',
    async path => {
      const page = await markdownForPathIn(site, path, true);
      expect(page?.humanPath).toBe(`/${path}`);
      expect(page?.mdPath).toBe(`/${path}.md`);
      const cleaned = withoutFalsePositives(page!.markdown);
      expect(ptLeftovers(cleaned)).toEqual([]);
      if (path === 'en/now') {
        expect(page!.markdown).toContain('https://nandomoreira.dev/en/ai-harness-with-rpi');
        expect(page!.markdown).not.toContain('/en/meu-harness-de-ia-com-rpi');
        expect(page!.markdown).toContain('End-to-end product');
        expect(page!.markdown).toContain('hybrid search');
      }
    },
  );

  it('has no English archive and nothing while not live', async () => {
    expect(await markdownForPathIn(site, 'en/posts/arquivo', true)).toBeUndefined();
    expect(await markdownForPathIn(site, 'en/about', false)).toBeUndefined();
  });

  it('keeps every pt-BR key', async () => {
    expect((await markdownForPathIn(site, 'sobre', false))?.humanPath).toBe('/sobre');
  });
});
