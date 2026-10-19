/**
 * Minutes to read a post body (REQ-008): words at 200 per minute, rounded
 * up, never below one. Code blocks, images, URLs, HTML tags, the frontmatter
 * and markdown syntax do not count.
 */
const WORDS_PER_MINUTE = 200;

export const readingMinutes = (markdown: string): number => {
  const text = markdown
    .replace(/^---\n[\s\S]*?\n---\n?/, ' ')
    .replace(/(```|~~~)[\s\S]*?\1/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, ' ')
    .replace(/[*_`~|]/g, ' ');
  const count = text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
  return Math.max(1, Math.ceil(count / WORDS_PER_MINUTE));
};
