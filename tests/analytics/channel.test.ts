import { describe, expect, it } from 'vitest';
import { OWN_HOSTS, channelOf, utmOf } from '../../src/lib/analytics/channel';

const channel = (referrer: string | null, search = '') =>
  channelOf({ referrer, utm: utmOf(new URLSearchParams(search)), ownHosts: OWN_HOSTS });

describe('channelOf', () => {
  it.each([
    ['https://www.google.com/', 'google'],
    ['https://www.google.com.br/', 'google'],
    ['https://www.bing.com/search?q=x', 'bing'],
    ['https://duckduckgo.com/', 'duckduckgo'],
    ['https://www.linkedin.com/feed/', 'linkedin'],
    ['https://lnkd.in/abc', 'linkedin'],
    ['https://m.linkedin.com/', 'linkedin'],
    ['https://github.com/nandomoreirame', 'github'],
    ['https://t.co/xyz', 'x'],
    ['https://x.com/someone', 'x'],
    ['https://bsky.app/profile/x', 'bluesky'],
    ['https://news.ycombinator.com/', 'other'],
    ['android-app://com.linkedin.android/', 'linkedin'],
    ['android-app://com.google.android.googlequicksearchbox/', 'google'],
    ['android-app://com.google.android.gm/', 'google'],
    ['android-app://com.twitter.android/', 'x'],
    ['android-app://xyz.blueskyweb.app/', 'bluesky'],
    ['android-app://com.github.android/', 'github'],
  ])('maps %s to %s', (referrer, expected) => {
    expect(channel(referrer)).toBe(expected);
  });

  it('is direct without a referrer, and for a referrer that is not a URL', () => {
    expect(channel(null)).toBe('direct');
    expect(channel('not a url')).toBe('direct');
  });

  it('marks navigation inside the site as internal, never as a channel', () => {
    expect(channel('https://nandomoreira.dev/lab')).toBe('internal');
  });

  it('treats the sales landing host as the same site', () => {
    expect(OWN_HOSTS).toContain('contrate.nandomoreira.dev');
  });

  it.each([...OWN_HOSTS])('marks own host %s as internal', host => {
    expect(channel(`https://${host}/path`)).toBe('internal');
  });

  it('uses a custom ownHosts list', () => {
    expect(
      channelOf({
        referrer: 'https://staging.example/',
        utm: null,
        ownHosts: ['staging.example'],
      }),
    ).toBe('internal');
    expect(
      channelOf({
        referrer: 'https://nandomoreira.dev/',
        utm: null,
        ownHosts: ['staging.example'],
      }),
    ).toBe('other');
  });

  it('strips a trailing dot from the hostname', () => {
    expect(channel('https://www.nandomoreira.dev./x')).toBe('internal');
    expect(channel('https://google.com./')).toBe('google');
  });

  it.each([
    ['https://notgoogle.com/', 'other'],
    ['https://evil-github.com/', 'other'],
    ['https://google.com.evil.io/', 'other'],
    ['https://fakelinkedin.com/', 'other'],
  ])('rejects lookalike host %s as %s', (referrer, expected) => {
    expect(channel(referrer)).toBe(expected);
  });

  it('lets a UTM source win over the referrer', () => {
    expect(channel('https://www.linkedin.com/', 'utm_source=Newsletter')).toBe('utm:newsletter');
  });

  it('lets a UTM source win over an internal referrer and over no referrer', () => {
    expect(channel('https://nandomoreira.dev/', 'utm_source=x')).toBe('utm:x');
    expect(channel(null, 'utm_source=x')).toBe('utm:x');
  });

  it('falls back to the referrer when utm_source is only whitespace', () => {
    expect(channel('https://www.linkedin.com/', 'utm_source=%20%20')).toBe('linkedin');
  });
});

describe('utmOf', () => {
  it('reads the three fields', () => {
    expect(utmOf(new URLSearchParams('utm_source=linkedin&utm_medium=social&utm_campaign=rdo'))).toEqual({
      source: 'linkedin',
      medium: 'social',
      campaign: 'rdo',
    });
  });

  it('is null without a source', () => {
    expect(utmOf(new URLSearchParams('utm_medium=social'))).toBeNull();
  });

  it('is null when source is only whitespace', () => {
    expect(utmOf(new URLSearchParams('utm_source=%20%20'))).toBeNull();
  });

  it('strips control characters and caps each field at 64', () => {
    const utm = utmOf(new URLSearchParams(`utm_source=a%00b%0A&utm_campaign=${'x'.repeat(100)}`));
    expect(utm?.source).toBe('ab');
    expect(utm?.campaign).toHaveLength(64);
    expect(utm?.medium).toBeNull();
  });

  it('caps source and medium at 64 and trims', () => {
    const utm = utmOf(
      new URLSearchParams(
        `utm_source=${'s'.repeat(100)}&utm_medium=${encodeURIComponent('  ' + 'm'.repeat(100) + '  ')}`,
      ),
    );
    expect(utm?.source).toHaveLength(64);
    expect(utm?.medium).toHaveLength(64);
    expect(utm?.medium?.startsWith(' ')).toBe(false);
  });

  it('strips line/paragraph separators and private-use code points', () => {
    // U+200B (Cf), U+2028 (Zl), U+2029 (Zp), U+E000 (Co).
    const params = new URLSearchParams();
    params.set('utm_source', 'a\u200Bb\u2028c\u2029d\uE000e');
    expect(utmOf(params)?.source).toBe('abcde');
  });

  it('truncates by code point so an emoji at the boundary leaves no lone surrogate', () => {
    const emoji = '😀';
    const prefix = 'a'.repeat(63);
    const utm = utmOf(new URLSearchParams(`utm_source=${encodeURIComponent(prefix + emoji + 'z')}`));
    expect(utm?.source).toBe(prefix + emoji);
    expect([...utm!.source]).toHaveLength(64);
    // Lone high or low surrogate (not a well-formed pair).
    expect(utm?.source).not.toMatch(/(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF](?:$|[^\uDC00-\uDFFF])/);
  });
});
