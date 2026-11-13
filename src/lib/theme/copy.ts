import type { Locale } from '../i18n/locale';

/** Visible names of the theme switch (theme-modes, REQ-004, REQ-011): each names the theme it turns on. */
const THEME_COPY_PT = {
  toPaper: 'Usar tema claro',
  toNoir: 'Usar tema escuro',
} as const;

const THEME_COPY_EN: Record<keyof typeof THEME_COPY_PT, string> = {
  toPaper: 'Use light theme',
  toNoir: 'Use dark theme',
};

export const themeCopy = (locale: Locale = 'pt-BR'): Record<keyof typeof THEME_COPY_PT, string> =>
  locale === 'en' ? THEME_COPY_EN : THEME_COPY_PT;

/** pt-BR object kept for the palette until task 14b switches it to themeCopy. */
export const THEME_COPY = themeCopy('pt-BR');
