import { describe, expect, it } from 'vitest';
import { DEFAULT_LIVE_BAR, liveBarResponse, loadLiveBar, parseLiveBar } from '../../src/lib/live-bar/config';

describe('parseLiveBar', () => {
  it('takes the items and the enabled flag from the document', () => {
    const config = parseLiveBar({
      enabled: true,
      items: [
        { text: ' Novo post no ar ', badge: 'Novo', href: 'https://nandomoreira.dev/posts' },
        { text: 'Só texto' },
      ],
    });

    expect(config.enabled).toBe(true);
    expect(config.items).toEqual([
      { text: 'Novo post no ar', badge: 'Novo', href: 'https://nandomoreira.dev/posts' },
      { text: 'Só texto' },
    ]);
  });

  it('maps a channel to its measured /go path', () => {
    expect(parseLiveBar({ items: [{ text: 'x', channel: 'twitch' }] }).items).toEqual([
      { text: 'x', href: '/go/contato/twitch', external: true },
    ]);
  });

  it('drops items without text and links that are not https or a site path', () => {
    const { items } = parseLiveBar({
      items: [
        { text: '' },
        { badge: 'x' },
        'solto',
        { text: 'a', href: 'javascript:alert(1)' },
        { text: 'b', href: '//evil.example' },
        { text: 'c', channel: 'nope' },
      ],
    });

    expect(items).toEqual([{ text: 'a' }, { text: 'b' }, { text: 'c' }]);
  });

  it('keeps at most 8 items and 160 characters of text', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ text: `${i}`.padEnd(500, 'a') }));
    const parsed = parseLiveBar({ items }).items;

    expect(parsed).toHaveLength(8);
    expect(parsed[0]!.text.length).toBe(160);
  });

  it('falls back to the default items when there are none, and reads the legacy schedule', () => {
    expect(parseLiveBar({}).items).toEqual(DEFAULT_LIVE_BAR.items);
    expect(parseLiveBar({ items: [] }).items).toEqual(DEFAULT_LIVE_BAR.items);
    expect(parseLiveBar({ schedule: 'Live às terças' }).items.map(i => i.text)).toEqual([
      'Live às terças, no YouTube.',
      'Live às terças, no Twitch.',
    ]);
  });

  it('hides the bar only when enabled is explicitly false', () => {
    expect(parseLiveBar({}).enabled).toBe(true);
    expect(parseLiveBar({ enabled: false }).enabled).toBe(false);
  });
});

describe('loadLiveBar', () => {
  it('returns the default when the document does not exist', async () => {
    expect(await loadLiveBar(async () => undefined)).toEqual(DEFAULT_LIVE_BAR);
  });

  it('returns the default when Firestore fails, so the header never breaks', async () => {
    expect(
      await loadLiveBar(async () => {
        throw new Error('unavailable');
      }),
    ).toEqual(DEFAULT_LIVE_BAR);
  });
});

describe('liveBarResponse', () => {
  it('answers enabled and the rendered track as JSON with a short public cache', async () => {
    const response = await liveBarResponse(async () => ({ items: [{ text: 'Olá <b>' }] }));
    const body = await response.json();

    expect(response.headers.get('cache-control')).toBe('public, max-age=60, s-maxage=300');
    expect(body.enabled).toBe(true);
    expect(body.html).toContain('Olá &lt;b&gt;');
    expect(body.html).not.toContain('<b>');
  });
});
