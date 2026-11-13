import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NewsletterCard from '../../src/components/posts/NewsletterCard.astro';
import { newsletterCopy } from '../../src/lib/newsletter/copy';
import { subscribeOriginOf } from '../../src/lib/newsletter/handler';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('newsletter in English', () => {
  it('accepts the English pages as return origins and nothing else', () => {
    const at = (origem: string) =>
      new Request(`https://nandomoreira.dev/api/subscribe?origem=${encodeURIComponent(origem)}`);
    expect(subscribeOriginOf(at('/en'))).toBe('/en');
    expect(subscribeOriginOf(at('/en/posts'))).toBe('/en/posts');
    expect(subscribeOriginOf(at('/en/evil'))).toBe('/posts');
    expect(subscribeOriginOf(at('https://evil.example'))).toBe('/posts');
  });

  it('card copy and outcomes', async () => {
    expect(newsletterCopy('en').button).toBe('Subscribe');
    const html = await (
      await AstroContainer.create()
    ).renderToString(NewsletterCard, {
      props: { locale: 'en', returnTo: '/en/posts', outcome: 'ok' },
    });
    expect(html).toContain('origem=%2Fen%2Fposts');
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('passes locale to Turnstile when the public key is set', async () => {
    const previous = process.env.TURNSTILE_SITE_KEY;
    process.env.TURNSTILE_SITE_KEY = 'fake-public-key';
    try {
      const html = await (
        await AstroContainer.create()
      ).renderToString(NewsletterCard, {
        props: { locale: 'en', returnTo: '/en/posts' },
      });
      expect(html).toContain('data-language="en"');
      expect(html).not.toContain('data-language="pt-br"');
    } finally {
      if (previous === undefined) delete process.env.TURNSTILE_SITE_KEY;
      else process.env.TURNSTILE_SITE_KEY = previous;
    }
  });
});
