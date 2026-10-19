import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { generateArt } from '../art';
import type { OgPage } from './pages';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * Build-time only (the /og route is pre-rendered), so files are read from the
 * project root. Satori needs TTF/OTF/WOFF, never WOFF2: these are the WOFF
 * twins of the fonts the site ships.
 */
const fromRoot = (...parts: string[]): string => join(process.cwd(), ...parts);

let fontCache: Parameters<typeof satori>[1]['fonts'] | undefined;
const fonts = () =>
  (fontCache ??= [
    {
      name: 'Literata',
      weight: 600,
      style: 'normal',
      data: readFileSync(fromRoot('src/assets/fonts/og/literata-latin-600-normal.woff')),
    },
    {
      name: 'Alegreya Sans',
      weight: 500,
      style: 'normal',
      data: readFileSync(fromRoot('src/assets/fonts/og/alegreya-sans-latin-500-normal.woff')),
    },
    {
      name: 'JetBrains Mono',
      weight: 400,
      style: 'normal',
      data: readFileSync(fromRoot('src/assets/fonts/og/jetbrains-mono-latin-400-normal.woff')),
    },
  ]);

type Tokens = Record<'background' | 'foreground' | 'muted' | 'primary' | 'faint', string>;

/** The palette, read from the token file: hex never lives outside it (REQ-004 of design-system). */
export const colorTokens = (): Tokens => {
  const css = readFileSync(fromRoot('src/styles/global.css'), 'utf8');
  const token = (name: string): string => {
    const value = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
    if (!value) throw new Error(`--color-${name} not found in global.css`);
    return value;
  };
  return {
    background: token('background'),
    foreground: token('foreground'),
    muted: token('muted-foreground'),
    primary: token('primary'),
    faint: token('border-strong'),
  };
};

const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = [1, 3, 5].map(start => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * The page art colours its shapes through classes bound to tokens in CSS.
 * Outside the browser there is no stylesheet, so the classes become attributes.
 */
const paintArt = (svg: string, tokens: Tokens): string => {
  const tone = { 'art-hero': tokens.primary, 'art-base': tokens.muted, 'art-faint': tokens.faint } as const;
  return svg
    .replace('<svg ', `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" `)
    .replace(
      /class="(art-hero|art-base|art-faint) art-ring"/g,
      (_, t: keyof typeof tone) => `fill="none" stroke="${tone[t]}" stroke-width="0.3"`,
    )
    .replace(
      /class="(art-hero|art-base|art-faint) art-line"/g,
      (_, t: keyof typeof tone) => `stroke="${tone[t]}" stroke-width="0.25"`,
    )
    .replace(/class="(art-hero|art-base|art-faint)"/g, (_, t: keyof typeof tone) => `fill="${tone[t]}" stroke="none"`);
};

const titleSize = (title: string): number => (title.length <= 40 ? 72 : title.length <= 75 ? 60 : 48);

type Node = { type: string; props: { style?: Record<string, unknown>; children?: Node | Node[] | string } };
const el = (style: Record<string, unknown>, children?: Node | Node[] | string): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

/** The text layer of the card, as SVG: eyebrow, title and signature over a fade. */
export const ogTextSvg = async (
  page: Pick<OgPage, 'title' | 'eyebrow'>,
  tokens: Tokens = colorTokens(),
): Promise<string> => {
  // Satori adds padding to the box size, so the margins live on an inner box.
  const [padX, padY] = [80, 72];
  const card = el(
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      backgroundImage: `linear-gradient(90deg, ${rgba(tokens.background, 1)} 0%, ${rgba(tokens.background, 0.96)} 50%, ${rgba(tokens.background, 0.55)} 80%, ${rgba(tokens.background, 0.25)} 100%)`,
    },
    el(
      {
        width: OG_WIDTH - 2 * padX,
        height: OG_HEIGHT - 2 * padY,
        margin: `${padY}px ${padX}px`,
        flexDirection: 'column',
        justifyContent: 'space-between',
      },
      [
        el(
          {
            fontFamily: 'JetBrains Mono',
            fontSize: 26,
            color: tokens.primary,
            letterSpacing: 3,
            textTransform: 'uppercase',
          },
          page.eyebrow,
        ),
        el(
          {
            fontFamily: 'Literata',
            fontWeight: 600,
            fontSize: titleSize(page.title),
            lineHeight: 1.15,
            color: tokens.foreground,
            maxWidth: 820,
          },
          page.title,
        ),
        el({ justifyContent: 'space-between', alignItems: 'center', width: '100%' }, [
          el(
            { fontFamily: 'Alegreya Sans', fontWeight: 500, fontSize: 32, color: tokens.foreground },
            'Fernando Moreira',
          ),
          el({ fontFamily: 'JetBrains Mono', fontSize: 24, color: tokens.muted }, 'nandomoreira.dev'),
        ]),
      ],
    ),
  );

  return satori(card as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts: fonts() });
};

/** The share card of one page: its art behind, the title over a fade on the left. */
export const renderOgPng = async (page: OgPage): Promise<Buffer> => {
  const tokens = colorTokens();
  const art = paintArt(generateArt({ ...page.art, aspect: 'banner' } as Parameters<typeof generateArt>[0]), tokens);
  // The art leaves gaps; flattened on the page background they read as the page, not as transparency.
  const backdrop = await sharp(Buffer.from(art))
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
    .flatten({ background: tokens.background })
    .png()
    .toBuffer();
  const text = await sharp(Buffer.from(await ogTextSvg(page, tokens)))
    .png()
    .toBuffer();

  return sharp(backdrop)
    .composite([{ input: text }])
    .png({ compressionLevel: 9 })
    .toBuffer();
};
