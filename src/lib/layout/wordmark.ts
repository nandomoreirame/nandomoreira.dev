export interface WordmarkParts {
  before: string;
  accent: string;
  after: string;
}

/**
 * Splits the header brand around the part painted in the primary colour.
 * An accent that is absent from the brand leaves it whole, so a profile edit
 * can never render a broken or half-coloured wordmark.
 */
export const splitWordmark = (text: string, accent = ''): WordmarkParts => {
  const at = accent ? text.indexOf(accent) : -1;
  if (at === -1) return { before: text, accent: '', after: '' };
  return {
    before: text.slice(0, at),
    accent,
    after: text.slice(at + accent.length),
  };
};
