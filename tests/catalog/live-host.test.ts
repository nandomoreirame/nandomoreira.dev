import { describe, expect, it } from 'vitest';
import { liveHost } from '../../src/lib/catalog/live-host';

describe('liveHost', () => {
  it('drops the protocol, www and the path', () => {
    expect(liveHost('https://www.bragstack.app/')).toBe('bragstack.app');
    expect(liveHost('https://mousai.gallery/g/abc')).toBe('mousai.gallery');
  });

  it('keeps any other subdomain', () => {
    expect(liveHost('https://app.exemplo.com')).toBe('app.exemplo.com');
  });

  it('returns undefined for no URL or an invalid one', () => {
    expect(liveHost(undefined)).toBeUndefined();
    expect(liveHost(null)).toBeUndefined();
    expect(liveHost('not a url')).toBeUndefined();
  });
});
