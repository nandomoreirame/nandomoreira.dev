import type { Locale } from '../i18n/locale';
import { messagesFor } from '../i18n/messages';

/**
 * Reading mode on a post (2026-10-16): the site around the article goes away
 * and the reader picks background, text size, line height and width. Each
 * choice is a radio whose id the stylesheet keys on, so the mode works with
 * CSS alone; the site script only remembers the choices.
 */
export interface ReaderChoice {
  value: string;
  label: string;
}

export interface ReaderSetting {
  name: 'theme' | 'size' | 'leading' | 'width';
  legend: string;
  /** chips: every choice side by side. stepper: − value +, one value shown. */
  kind: 'chips' | 'stepper';
  initial: string;
  choices: ReaderChoice[];
}

export const READER_SWITCH_ID = 'reader-on';

export const readerInputId = (name: string, value: string): string => `reader-${name}-${value}`;

const range = (from: number, to: number, step: number): number[] =>
  Array.from({ length: Math.round((to - from) / step) + 1 }, (_, index) => from + index * step);

const leadingLabel = (tenths: number, locale: Locale): string =>
  (tenths / 10).toFixed(1).replace('.', locale === 'en' ? '.' : ',');

/** Reading mode settings with legends and choice labels for `locale`. */
export const readerSettings = (locale: Locale = 'pt-BR'): ReaderSetting[] => {
  const t = messagesFor(locale).posts.reader;
  return [
    {
      name: 'theme',
      legend: t.themeLegend,
      kind: 'chips',
      initial: 'dark',
      choices: [
        { value: 'dark', label: t.themeDark },
        { value: 'black', label: t.themeBlack },
        { value: 'sepia', label: t.themeSepia },
        { value: 'light', label: t.themeLight },
      ],
    },
    {
      // px of the body text; 18 is the prose size.
      name: 'size',
      legend: t.sizeLegend,
      kind: 'stepper',
      initial: '18',
      choices: range(14, 28, 2).map(px => ({ value: String(px), label: `${px}px` })),
    },
    {
      // Tenths of the text size; the panel shows the result in px (global.css).
      name: 'leading',
      legend: t.leadingLegend,
      kind: 'stepper',
      initial: '17',
      choices: range(13, 21, 1).map(tenths => ({
        value: String(tenths),
        label: leadingLabel(tenths, locale),
      })),
    },
    {
      name: 'width',
      legend: t.widthLegend,
      kind: 'stepper',
      initial: '640',
      choices: range(480, 960, 80).map(px => ({ value: String(px), label: `${px}px` })),
    },
  ];
};

// Every setting starts on the site as it is, so turning the mode on changes
// only what it hides until the reader asks for more.
export const READER_SETTINGS: ReaderSetting[] = readerSettings('pt-BR');
