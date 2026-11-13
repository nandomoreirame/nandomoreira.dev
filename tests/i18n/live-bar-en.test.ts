import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BackToTop from '../../src/components/layout/BackToTop.astro';
import LiveBar from '../../src/components/layout/LiveBar.astro';
import { DEFAULT_LIVE_BAR, liveBarResponse } from '../../src/lib/live-bar/config';
import { liveBarHtml } from '../../src/lib/live-bar/render';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('live bar and back-to-top in English', () => {
  it('liveBarHtml uses textEn/badgeEn and drops items without a translation', () => {
    const html = liveBarHtml(
      [
        { text: 'Só português', badge: 'Novo', href: '/a' },
        { text: 'Com inglês', textEn: 'With English', badge: 'Novo', badgeEn: 'New', href: '/b' },
      ],
      'en',
    );

    expect(html).toContain('With English');
    expect(html).toContain('New');
    expect(html).not.toContain('Só português');
    expect(html).not.toContain('Com inglês');
    expect(html).not.toContain('Novo');
    expect(html).toContain('Opens in a new tab');
  });

  it('DEFAULT_LIVE_BAR ships the English schedule with a Live badge', () => {
    const html = liveBarHtml(DEFAULT_LIVE_BAR.items, 'en');

    expect(html).toContain('Live every day, 9:00 AM to 12:00 PM (Brasília time), on YouTube.');
    expect(html).toContain('Live every day, 9:00 AM to 12:00 PM (Brasília time), on Twitch.');
    expect(html).toContain('>Live</span>');
    expect(html).not.toContain('Ao vivo');
    expect(html).toContain('Opens in a new tab');
    expect(html.match(/aria-label="Live every day/g)?.length).toBe(2);
  });

  it('LiveBar with locale en renders the English default and fetches the English API', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(LiveBar, {
      props: { locale: 'en' },
    });

    expect(html).toContain('Live every day, 9:00 AM to 12:00 PM (Brasília time), on YouTube.');
    expect(html).toContain('/api/live-bar?locale=en');
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('BackToTop in English names the control Back to top', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(BackToTop, {
      props: { locale: 'en' },
    });

    expect(html).toContain('aria-label="Back to top"');
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('hides the English bar when no item has textEn', async () => {
    const response = await liveBarResponse(async () => ({ items: [{ text: 'Só pt-BR' }] }), 'en');
    const body = await response.json();

    expect(body.enabled).toBe(false);
  });
});
