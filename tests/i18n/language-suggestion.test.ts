import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LanguageSuggestion from '../../src/components/layout/LanguageSuggestion.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(LanguageSuggestion, { props });

describe('LanguageSuggestion', () => {
  it('ships hidden, in the language it offers, naming the target', async () => {
    const html = await render({ locale: 'pt-BR', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toMatch(/<aside[^>]*hidden/);
    expect(html).toContain('data-lang-suggest="en"');
    expect(html).toContain('lang="en"');
    expect(html).toContain('This page is also available in English.');
    expect(html).toMatch(/<a[^>]*href="\/en\/about"[^>]*hreflang="en"/);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*data-lang-dismiss/);
    expect(html).toContain('Dismiss');
  });

  it('offers pt-BR on an English page', async () => {
    const html = await render({ locale: 'en', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toContain('data-lang-suggest="pt"');
    expect(html).toContain('Esta página também existe em português.');
  });

  it('renders nothing without a pair (REQ-018)', async () => {
    expect((await render({ locale: 'pt-BR' })).trim()).toBe('');
  });
});

describe('the site script', () => {
  const script = readFileSync('src/components/art/PointerField.astro', 'utf8');

  it('reveals the suggestion from navigator.languages and never redirects', () => {
    expect(script).toContain('[data-lang-suggest]');
    expect(script).toContain('navigator.languages');
    expect(script).not.toMatch(/location\.(href|assign|replace)/);
  });

  it('wraps storage in try/catch (REQ-019)', () => {
    const block = script.slice(script.indexOf('[data-lang-suggest]'));
    expect(block.slice(0, 900)).toMatch(/try\s*{[^}]*localStorage/);
  });
});
