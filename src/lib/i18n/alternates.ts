import { translationPairs, type TranslationPair } from '../content';
import { EN_PUBLISHED } from './live';
import { staticCounterpart } from './routes';

/**
 * The two language versions of a page, or undefined when it exists in one
 * language only (D6) or English is not published yet (D8). Feeds hreflang, the
 * switcher, the suggestion banner and the sitemap.
 */
export const alternatesFrom = (
  path: string,
  pairs: readonly TranslationPair[],
  live: boolean,
): TranslationPair | undefined => {
  if (!live) return undefined;
  return staticCounterpart(path) ?? pairs.find(pair => pair['pt-BR'] === path || pair.en === path);
};

export const alternatesFor = async (path: string): Promise<TranslationPair | undefined> =>
  alternatesFrom(path, await translationPairs(), EN_PUBLISHED);
