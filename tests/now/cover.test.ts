import { describe, expect, it } from 'vitest';
import { coverPathFromUpstream, upstreamFromCover } from '../../src/lib/now/cover';

const HEX = 'ab67616d00001e02' + 'a'.repeat(24);
const XBOX = 'apps.46694.68182501197884443.ac728a87-7bc1-4a0d-8bc6-0123456789ab.0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0';

describe('cover paths', () => {
  it('maps a Spotify image to the local route and back', () => {
    expect(coverPathFromUpstream(`https://i.scdn.co/image/${HEX}`)).toBe(`/api/now/cover/spotify/${HEX}`);
    expect(upstreamFromCover('spotify', HEX)).toBe(`https://i.scdn.co/image/${HEX}`);
  });

  it('maps an Xbox store image, http or https, and asks for a 320 px JPEG', () => {
    expect(coverPathFromUpstream(`http://store-images.s-microsoft.com/image/${XBOX}`)).toBe(`/api/now/cover/xbox/${XBOX}`);
    expect(upstreamFromCover('xbox', XBOX)).toBe(
      `https://store-images.s-microsoft.com/image/${XBOX}?w=320&h=320&q=80&format=jpg`,
    );
  });

  it('refuses anything outside the two patterns', () => {
    for (const url of [
      'https://evil.example/image/x',
      `https://i.scdn.co/image/${HEX}/../x`,
      `https://i.scdn.co.evil.io/image/${HEX}`,
      'javascript:alert(1)',
    ]) {
      expect(coverPathFromUpstream(url), url).toBeUndefined();
    }
    expect(upstreamFromCover('spotify', 'not-hex')).toBeUndefined();
    expect(upstreamFromCover('xbox', '../../etc/passwd')).toBeUndefined();
    expect(upstreamFromCover('github', HEX)).toBeUndefined();
  });
});
