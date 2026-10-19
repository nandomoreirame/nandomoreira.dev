/**
 * The post index (2026-10-16): a sticky column left of the text from lg, a
 * popover behind a fixed button on phones. Built from the headings Astro
 * already slugs when it renders the markdown.
 */
export interface TocItem {
  depth: 2 | 3;
  slug: string;
  text: string;
}

export const POST_TOC_ID = 'post-toc';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

// Sections and their subsections; one section alone has nothing to index.
export const tocFrom = (headings: readonly Heading[]): TocItem[] => {
  const items = headings.filter((heading): heading is TocItem => heading.depth === 2 || heading.depth === 3);
  return items.filter(item => item.depth === 2).length >= 2 ? items : [];
};
