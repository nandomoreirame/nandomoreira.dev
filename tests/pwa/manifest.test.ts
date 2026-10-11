import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const MANIFEST_PATH = 'public/manifest.webmanifest';
const CSS = readFileSync('src/styles/global.css', 'utf8');

const backgroundColor = (): string => {
  const match = /--color-background:\s*(#[0-9a-fA-F]{6})/.exec(CSS);
  if (!match) {
    throw new Error('--color-background not found in global.css, or not authored as hex');
  }
  return match[1]!;
};

const pngSize = (path: string): { width: number; height: number } => {
  const buf = readFileSync(path);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
};

describe('PWA web app manifest', () => {
  it('parses as JSON with the required install fields', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Record<string, unknown>;

    expect(manifest.name).toBe('Fernando Moreira');
    expect(manifest.short_name).toBe('Fernando');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('pt-BR');
  });

  it('uses the site background colour for splash and chrome', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Record<string, unknown>;
    const bg = backgroundColor();

    expect(manifest.background_color).toBe(bg);
    expect(manifest.theme_color).toBe(bg);
  });

  it('lists any and maskable icons that exist at the declared sizes', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as {
      icons: Array<{ src: string; sizes: string; purpose: string }>;
    };

    const any192 = manifest.icons.find((i) => i.sizes === '192x192' && i.purpose === 'any');
    const any512 = manifest.icons.find((i) => i.sizes === '512x512' && i.purpose === 'any');
    const maskable512 = manifest.icons.find((i) => i.sizes === '512x512' && i.purpose === 'maskable');

    expect(any192).toBeDefined();
    expect(any512).toBeDefined();
    expect(maskable512).toBeDefined();

    for (const icon of [any192!, any512!, maskable512!]) {
      const path = `public${icon.src}`;
      expect(existsSync(path), path).toBe(true);
      const [w, h] = icon.sizes.split('x').map(Number);
      const size = pngSize(path);
      expect(size.width).toBe(w);
      expect(size.height).toBe(h);
    }
  });

  it('declares the manifest link in BaseLayout', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: 'T', description: 'D' },
      slots: { default: '<p>x</p>' },
    });

    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest"');
  });
});
