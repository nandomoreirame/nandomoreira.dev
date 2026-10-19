/**
 * The site's design tokens, as literal values for mail clients, which read no
 * CSS variables and load no web fonts reliably. Every color is a copy of
 * src/styles/global.css (tests/emails/tokens.test.ts fails on drift), and this
 * is the only file under src/emails allowed to hold a hex (no-ad-hoc gate).
 */
export const EMAIL_COLORS = {
  background: '#0b0b0c',
  surface: '#121214',
  surfaceElevated: '#18181b',
  border: '#222226',
  borderStrong: '#6b6b74',
  foreground: '#f4f4f5',
  mutedForeground: '#a1a1aa',
  primary: '#f5a623',
  primaryForeground: '#0b0b0c',
  success: '#34d399',
} as const;

/** DESIGN-GUIDELINES families, with the fallbacks a mail client will actually use. */
export const EMAIL_FONTS = {
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  sans: 'Inter, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

/** Spacing scale in px (DESIGN-GUIDELINES, 1rem = 16px): xs 4, sm 8, md 16, lg 24, xl 40. */
export const EMAIL_SPACE = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;

/** Radius scale in px: md for buttons and fields, lg for panels. */
export const EMAIL_RADIUS = { md: 6, lg: 8 } as const;

/** One column, the width every mail client renders without scrolling. */
export const EMAIL_WIDTH = 600;
