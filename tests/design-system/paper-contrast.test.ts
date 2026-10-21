import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

/**
 * Paper, the light variant of Terminal Noir (docs/specs/theme-modes). Read from
 * the stylesheet like contrast.test.ts, never copied: the ratios are the ones the
 * browser renders. Two blocks carry the palette (the system-light media query and
 * the explicit choice), so this gate also fails when they drift apart.
 */
const CSS = readFileSync('src/styles/global.css', 'utf8');

const SYSTEM_SELECTOR = ':root:not([data-theme="noir"])';
const CHOSEN_SELECTOR = ':root[data-theme="paper"]';

const body = (selector: string): string => {
  const at = CSS.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`${selector} not found in global.css`);
  return CSS.slice(at, CSS.indexOf('}', at));
};

const tokensOf = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, name, hex]) => [name, hex!.toLowerCase()]),
  );

const noirTokens = tokensOf(body('@theme'));
const paper = tokensOf(body(CHOSEN_SELECTOR));
const t = (name: string): string => {
  const hex = paper[name];
  if (!hex) throw new Error(`--color-${name} missing from the Paper block`);
  return hex;
};

describe('Paper palette (theme-modes, REQ-001)', () => {
  it('re-points every colour token the Noir theme declares', () => {
    expect(Object.keys(paper).sort()).toEqual(Object.keys(noirTokens).sort());
  });

  it('takes the Terminal Noir light values', () => {
    expect(paper).toMatchObject({
      background: '#fbfaf7',
      surface: '#f1efea',
      'surface-elevated': '#e9e6df',
      border: '#dcd8cf',
      'border-strong': '#88837a',
      selection: '#d6d2c8',
      foreground: '#1c1a17',
      'muted-foreground': '#5e5a53',
      primary: '#865700',
      'primary-foreground': '#fbfaf7',
      success: '#0b7656',
      warning: '#8a5300',
      destructive: '#b42318',
      whatsapp: '#075e54',
      'whatsapp-foreground': '#fbfaf7',
    });
  });

  it('keeps the system-light block identical to the chosen one (REQ-008)', () => {
    expect(tokensOf(body(SYSTEM_SELECTOR))).toEqual(paper);
  });

  it('applies the system block only under prefers-color-scheme: light (REQ-002)', () => {
    const media = CSS.lastIndexOf('@media (prefers-color-scheme: light)', CSS.indexOf(`${SYSTEM_SELECTOR} {`));
    expect(media).toBeGreaterThan(-1);
  });

  it('switches the colour scheme to light in both blocks, while html stays dark by default', () => {
    expect(body(SYSTEM_SELECTOR)).toMatch(/color-scheme:\s*light/);
    expect(body(CHOSEN_SELECTOR)).toMatch(/color-scheme:\s*light/);
    expect(CSS).toMatch(/html\s*\{[^}]*scheme-dark/);
  });
});

/** Every readable pair, in both themes, on every surface it can sit on (REQ-008). */
const THEMES = { noir: noirTokens, paper } as const;
const SURFACES = ['background', 'surface', 'surface-elevated'] as const;
const TEXT = ['foreground', 'muted-foreground', 'primary', 'success', 'warning', 'destructive'] as const;
const GRAPHIC = ['border-strong', 'whatsapp'] as const;

describe.each(Object.entries(THEMES))('%s contrast (theme-modes, REQ-008)', (_theme, tokens) => {
  const c = (name: string): string => {
    const hex = tokens[name];
    if (!hex) throw new Error(`--color-${name} missing`);
    return hex;
  };

  it.each(TEXT.flatMap(fg => SURFACES.map(bg => [fg, bg] as const)))('%s on %s clears 4.5:1', (fg, bg) => {
    expect(contrastRatio(c(fg), c(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(GRAPHIC.flatMap(fg => SURFACES.map(bg => [fg, bg] as const)))('%s on %s clears 3:1', (fg, bg) => {
    expect(contrastRatio(c(fg), c(bg))).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ['primary-foreground', 'primary'],
    ['whatsapp-foreground', 'whatsapp'],
    ['foreground', 'selection'],
  ])('%s on %s clears 4.5:1', (fg, bg) => {
    expect(contrastRatio(c(fg), c(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps border decorative', () => {
    expect(contrastRatio(c('border'), c('background'))).toBeLessThan(3);
  });
});

describe('Paper worst cases, as measured in the spec', () => {
  it.each([
    ['foreground', 13.93],
    ['muted-foreground', 5.5],
    ['primary', 4.99],
    ['success', 4.51],
    ['warning', 5.08],
    ['destructive', 5.27],
  ])('%s on surface-elevated is %s:1', (name, expected) => {
    expect(contrastRatio(t(name), t('surface-elevated'))).toBeCloseTo(expected, 1);
  });

  it('proves the gate can fail: the pre-contrast-gate values and the WhatsApp brand green', () => {
    expect(contrastRatio('#047857', t('surface-elevated'))).toBeLessThan(4.5);
    expect(contrastRatio('#8a857c', t('surface-elevated'))).toBeLessThan(3);
    expect(contrastRatio(noirTokens.whatsapp!, t('background'))).toBeLessThan(3);
  });
});

describe('documentation (theme-modes, REQ-012)', () => {
  it('no longer promises a single dark theme, and names the theme boot exception', () => {
    const guide = readFileSync('CLAUDE.md', 'utf8');
    expect(guide).not.toContain('Tema escuro único');
    expect(guide).toContain('data-theme-boot');
  });

  it('documents the Paper palette with its measured ratios', () => {
    expect(readFileSync('docs/DESIGN-GUIDELINES.md', 'utf8')).toMatch(/### Paper[\s\S]*16,63:1/);
  });
});
