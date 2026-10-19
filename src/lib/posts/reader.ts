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

// Every setting starts on the site as it is, so turning the mode on changes
// only what it hides until the reader asks for more.
export const READER_SETTINGS: ReaderSetting[] = [
  {
    name: 'theme',
    legend: 'Fundo',
    kind: 'chips',
    initial: 'dark',
    choices: [
      { value: 'dark', label: 'Escuro' },
      { value: 'black', label: 'Preto' },
      { value: 'sepia', label: 'Sépia' },
      { value: 'light', label: 'Claro' },
    ],
  },
  {
    // px of the body text; 18 is the prose size.
    name: 'size',
    legend: 'Tamanho do texto',
    kind: 'stepper',
    initial: '18',
    choices: range(14, 28, 2).map(px => ({ value: String(px), label: `${px}px` })),
  },
  {
    // Tenths of the text size; the panel shows the result in px (global.css).
    name: 'leading',
    legend: 'Entrelinha',
    kind: 'stepper',
    initial: '17',
    choices: range(13, 21, 1).map(tenths => ({
      value: String(tenths),
      label: (tenths / 10).toFixed(1).replace('.', ','),
    })),
  },
  {
    name: 'width',
    legend: 'Largura',
    kind: 'stepper',
    initial: '640',
    choices: range(480, 960, 80).map(px => ({ value: String(px), label: `${px}px` })),
  },
];
