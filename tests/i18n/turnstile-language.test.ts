import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TurnstileWidget from '../../src/components/security/TurnstileWidget.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(TurnstileWidget as never, { props });

describe('TurnstileWidget language', () => {
  it('asks Cloudflare for the page language', async () => {
    expect(await render({ siteKey: 'k', locale: 'en' })).toContain('data-language="en"');
    expect(await render({ siteKey: 'k' })).toContain('data-language="pt-br"');
  });
});
