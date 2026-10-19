/** Google shows about 60 characters of a title and 160 of a description. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/**
 * The browser-tab title: `<title> | <name>` when it fits, the bare title when
 * the suffix would push it past the SERP width (SEO audit 2026-10-13, item 12).
 */
/** Between a page's name and the site author's in <title> (Fernando, 2026-10-19). */
export const TITLE_SEPARATOR = ' // ';

export const pageTitle = (title: string, name: string): string => {
  const full = `${title}${TITLE_SEPARATOR}${name}`;

  return full.length <= TITLE_MAX ? full : title;
};

/**
 * A meta description within 160 characters. Cut at the last full sentence that
 * fits; with none, at the last word, with an ellipsis. Summaries are written for
 * the page, so this only trims, never rewrites (SEO audit 2026-10-13, item 10).
 */
export const metaDescription = (text: string, max = DESCRIPTION_MAX): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const window = clean.slice(0, max);
  const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '));
  if (sentenceEnd > 0) return window.slice(0, sentenceEnd + 1);
  if (/[.!?]$/.test(window)) return window;

  const words = clean.slice(0, max - 1);
  return `${words.slice(0, words.lastIndexOf(' ')).replace(/[\s,;:]+$/, '')}…`;
};
