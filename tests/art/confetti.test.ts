import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Confetti from '../../src/components/art/Confetti.astro';
import VersionsPage from '../../src/pages/releases/index.astro';
import ReleasesPage from '../../src/pages/releases/17.astro';
import { CONFETTI_COLORS, confettiPieces } from '../../src/lib/art/confetti';

const render = async (component: Parameters<AstroContainer['renderToString']>[0], path: string, props = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props, request: new Request(`https://nandomoreira.dev${path}`) });
};

describe('confettiPieces', () => {
  it('draws the same pieces for the same seed, and others for another', () => {
    expect(confettiPieces('releases', 40)).toEqual(confettiPieces('releases', 40));
    expect(confettiPieces('releases', 40)).not.toEqual(confettiPieces('other', 40));
  });

  it('keeps every piece inside the screen, raining for about four seconds', () => {
    const pieces = confettiPieces('releases', 120);

    expect(pieces).toHaveLength(120);
    expect(Math.max(...pieces.map(piece => piece.delay))).toBeGreaterThan(3.5);
    for (const piece of pieces) {
      expect(piece.x).toBeGreaterThanOrEqual(0);
      expect(piece.x).toBeLessThanOrEqual(100);
      expect(piece.delay).toBeGreaterThanOrEqual(0);
      expect(piece.delay).toBeLessThanOrEqual(4);
      expect(piece.delay + piece.duration).toBeLessThanOrEqual(8);
      expect(Math.abs(piece.drift)).toBeLessThanOrEqual(12);
      expect(CONFETTI_COLORS).toContain(piece.color);
    }
  });

  it('paints only with design tokens', () => {
    for (const color of CONFETTI_COLORS) expect(color).toMatch(/^var\(--color-[a-z-]+\)$/);
  });
});

describe('Confetti', () => {
  it('is decoration only: hidden from assistive technology and from the pointer', async () => {
    const html = await render(Confetti, '/releases', { seed: 'test', count: 10 });

    expect(html).toMatch(/<div[^>]*data-confetti[^>]*aria-hidden="true"|<div[^>]*aria-hidden="true"[^>]*data-confetti/);
    expect(html).toContain('pointer-events-none');
    expect(html.match(/data-confetti-piece/g)).toHaveLength(10);
    expect(html).not.toContain('data-confetti-balloon');
  });

  it('rains once on /releases and never on the releases of a version', async () => {
    expect(await render(VersionsPage, '/releases')).toContain('data-confetti');
    expect(await render(ReleasesPage, '/releases/17')).not.toContain('data-confetti');
  });

  it('only moves for people who did not ask for less motion, and plays once', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    const block = css.slice(css.indexOf('/* Confetti'));

    expect(block).toMatch(/\[data-confetti\][^{]*\{[^}]*display:\s*none/);
    expect(block).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)[\s\S]*\[data-confetti\][\s\S]*display:\s*block/,
    );
    expect(block).toMatch(/animation:[^;]*\bforwards\b/);
    expect(block).not.toContain('balloon');
    expect(block).not.toMatch(/animation:[^;]*\binfinite\b/);
  });
});
