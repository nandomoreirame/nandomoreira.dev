import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TurnstileWidget from '../../src/components/security/TurnstileWidget.astro';

describe('TurnstileWidget', () => {
  it('widget só renderiza com site key configurada', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TurnstileWidget, { props: { siteKey: '' } });
    expect(html).not.toContain('cf-turnstile');
    expect(html).not.toContain('data-turnstile-loader');
  });

  it('com site key, marca o widget e carrega o script da Cloudflare', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TurnstileWidget, { props: { siteKey: 'site-key' } });
    expect(html).toContain('class="cf-turnstile"');
    expect(html).toContain('data-sitekey="site-key"');
    expect(html).toContain('data-turnstile-widget');
    expect(html).toContain('data-turnstile-loader');
    expect(html).toContain('https://challenges.cloudflare.com/turnstile/v0/api.js');
  });
});
