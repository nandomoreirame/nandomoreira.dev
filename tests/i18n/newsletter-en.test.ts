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
    const html = await (await AstroContainer.create()).renderToString(NewsletterCard, {
      props: { locale: 'en', returnTo: '/en/posts', outcome: 'ok' },
    });
    expect(html).toContain('origem=%2Fen%2Fposts');
    expect(ptLeftovers(html)).toEqual([]);
  });
});
