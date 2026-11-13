import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LanguageSwitch from '../../src/components/layout/LanguageSwitch.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(LanguageSwitch, { props });

describe('LanguageSwitch', () => {
  it('points a pt-BR page at its English pair, labelled in English', async () => {
    const html = await render({ locale: 'pt-BR', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toMatch(/<a[^>]*href="\/en\/about"/);
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('lang="en"');
    expect(html).toContain('Read in English');
    expect(html).toMatch(/>\s*EN\s*</);
  });

  it('points an English page back at the pt-BR pair', async () => {
    const html = await render({ locale: 'en', alternates: { 'pt-BR': '/sobre', en: '/en/about' } });
    expect(html).toMatch(/<a[^>]*href="\/sobre"/);
    expect(html).toContain('hreflang="pt-BR"');
    expect(html).toContain('Ler em português');
  });

  it('falls back to the other home without a pair', async () => {
    expect(await render({ locale: 'pt-BR', live: true })).toMatch(/href="\/en"/);
    expect(await render({ locale: 'en', live: true })).toMatch(/href="\/"/);
  });

  it('renders nothing while English is not live (REQ-005)', async () => {
    expect((await render({ locale: 'pt-BR', live: false })).trim()).toBe('');
  });
});
