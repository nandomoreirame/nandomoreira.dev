/** A Markdown line as it reads rendered: link text kept, inline marks gone, spaces collapsed. */
export const plainText = (markdown: string): string =>
  markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 1-based line of the first source line that contains the quote, or null.
 * A quote spanning paragraphs is looked up by its first one, since the source
 * keeps each paragraph on its own lines.
 */
export const locateLine = (source: string, quote: string): number | null => {
  const firstParagraph = quote.split(/\n\s*\n/).find(part => part.trim() !== '') ?? '';
  const needle = plainText(firstParagraph);
  if (needle === '') return null;
  const index = source.split('\n').findIndex(line => plainText(line).includes(needle));
  return index === -1 ? null : index + 1;
};
