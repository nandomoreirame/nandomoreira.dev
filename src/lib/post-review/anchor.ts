import { CONTEXT_CHARS } from './schema';

export type Anchor = { quote: string; prefix: string; suffix: string; start: number; end: number };

export type HeadingMark = { offset: number; text: string };

const isSpace = (char: string | undefined): boolean => char !== undefined && /\s/.test(char);

/** The quote at [start, end) of the article text, trimmed, with its context. */
export const anchorFrom = (text: string, start: number, end: number): Anchor => {
  let from = start;
  let to = end;
  while (from < to && isSpace(text[from])) from += 1;
  while (to > from && isSpace(text[to - 1])) to -= 1;
  return {
    quote: text.slice(from, to),
    prefix: text.slice(Math.max(0, from - CONTEXT_CHARS), from),
    suffix: text.slice(to, to + CONTEXT_CHARS),
    start: from,
    end: to,
  };
};

/** The last h2/h3 that starts at or before `start`; null in the opening. */
export const sectionFor = (headings: readonly HeadingMark[], start: number): string | null =>
  headings.filter(heading => heading.offset <= start).at(-1)?.text ?? null;
