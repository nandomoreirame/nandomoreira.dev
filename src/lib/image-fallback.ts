/**
 * Deterministic visual fallback for a project without an image.
 * The same slug must always produce the same initials, so a returning
 * visitor never sees the card change identity between visits.
 */
export const initialsFromSlug = (slug: string): string => {
  const words = slug.split('-').filter(Boolean);

  if (words.length === 0) {
    throw new Error('Cannot derive initials from an empty slug');
  }

  const initials =
    words.length === 1
      ? words[0].slice(0, 2)
      : words
          .slice(0, 2)
          .map((word) => word[0])
          .join('');

  return initials.toUpperCase();
};
