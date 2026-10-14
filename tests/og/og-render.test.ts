import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { colorTokens, renderOgPng } from '../../src/lib/og/render';

describe('colorTokens', () => {
  it('reads the palette from the token file, the only place hex lives', () => {
    const tokens = colorTokens();
    expect(tokens.background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tokens.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tokens.foreground).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('renderOgPng', () => {
  it('renders a 1200x630 PNG with the title, accents included', async () => {
    const png = await renderOgPng({
      key: 'sessoes-do-red-dead-online-p2p-relays-e-nat-duplo',
      title: 'Meu estudo sobre as sessões do Red Dead Online: P2P, relays da Rockstar e o NAT duplo',
      eyebrow: 'Blog · 13/10/2026',
      art: { slug: 'sessoes-do-red-dead-online-p2p-relays-e-nat-duplo', art: 'terminal' },
    });
    const meta = await sharp(png).metadata();

    expect(meta.format).toBe('png');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });
});
