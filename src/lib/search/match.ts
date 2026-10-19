export interface Searchable {
  title: string;
  summary?: string;
  keywords?: readonly string[];
}

/** Lower case, no accents, single spaces: what the visitor types is compared like this. */
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const terms = (query: string): string[] => normalize(query).split(' ').filter(Boolean);

/**
 * 0 when some term is missing (or the query is empty); otherwise title hits
 * weigh 3, keyword hits 2 and summary hits 1 (D4).
 */
export const scoreOf = (item: Searchable, query: string): number => {
  const words = terms(query);
  if (words.length === 0) return 0;
  const title = normalize(item.title);
  const keywords = normalize((item.keywords ?? []).join(' '));
  const summary = normalize(item.summary ?? '');
  let score = 0;
  for (const word of words) {
    const hit = (title.includes(word) ? 3 : 0) + (keywords.includes(word) ? 2 : 0) + (summary.includes(word) ? 1 : 0);
    if (hit === 0) return 0;
    score += hit;
  }
  return score;
};
