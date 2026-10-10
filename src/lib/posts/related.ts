import type { Post } from '../../content/schemas/post';

/** Words too common in pt-BR titles to say anything about the topic. */
const STOPWORDS = new Set([
  'como',
  'para',
  'pelo',
  'pela',
  'porque',
  'sobre',
  'com',
  'sem',
  'uma',
  'umas',
  'uns',
  'que',
  'por',
  'mais',
  'menos',
  'seu',
  'sua',
  'meu',
  'minha',
  'voce',
  'esta',
  'este',
  'isso',
  'usar',
  'usando',
]);

const normalise = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const titleWords = (title: string): Set<string> =>
  new Set(
    normalise(title)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word)),
  );

const shared = (a: Set<string>, b: Set<string>): number => [...a].filter((item) => b.has(item)).length;

const days = (iso: string): number => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

/**
 * Posts to suggest under `current`. A marker in common weighs more than a
 * title word in common; the same pool (current or archived) comes first, so a
 * 2026 post does not send readers to a 2015 one when recent ones exist; and
 * the closest date breaks ties, which keeps the result deterministic.
 */
export const relatedPosts = (current: Post, all: readonly Post[], limit = 3): Post[] => {
  const markers = new Set((current.markers ?? []).map(normalise));
  const words = titleWords(current.title);
  const when = days(current.date);

  return all
    .filter((post) => post.slug !== current.slug && post.draft !== true)
    .map((post) => ({
      post,
      samePool: post.archived === current.archived ? 1 : 0,
      score:
        2 * shared(markers, new Set((post.markers ?? []).map(normalise))) + shared(words, titleWords(post.title)),
      distance: Math.abs(days(post.date) - when),
    }))
    .sort((a, b) => b.samePool - a.samePool || b.score - a.score || a.distance - b.distance)
    .slice(0, limit)
    .map(({ post }) => post);
};
