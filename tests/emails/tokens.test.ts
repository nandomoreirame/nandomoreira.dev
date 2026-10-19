import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EMAIL_COLORS } from '../../src/emails/_shared/tokens';

/**
 * Mail clients read no CSS variables, so the templates carry literal colors.
 * This keeps them a copy of global.css, never a second palette.
 */
const css = readFileSync('src/styles/global.css', 'utf8');
const token = (name: string): string | undefined =>
  css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

const kebab = (name: string): string => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

describe('email color tokens', () => {
  it.each(Object.entries(EMAIL_COLORS))('%s mirrors --color-%s', (name, value) => {
    expect(value).toBe(token(kebab(name)));
  });

  it('proves the mirror check can fail', () => {
    expect(token('primary')).not.toBe('#000000');
  });
});
