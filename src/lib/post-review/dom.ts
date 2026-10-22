import { anchorFrom, sectionFor, type Anchor, type HeadingMark } from './anchor';
import { annotationSchema, storageKey, type Annotation } from './schema';

/** Where an annotation may start and end: the title, the lead, the body. */
export const REGIONS = 'h1, [data-post-lead], [data-prose]';

export type Pending = Anchor & { section: string | null };

type ReviewStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const articleOf = (doc: Document): HTMLElement | null =>
  doc.querySelector<HTMLElement>('article[data-post-slug]');

const elementOf = (node: Node): Element | null => (node instanceof Element ? node : node.parentElement);

/** Character offset of (node, offset) in root's textContent. */
export const textOffset = (root: Node, node: Node, offset: number): number => {
  const range = (root.ownerDocument ?? document).createRange();
  range.setStart(root, 0);
  range.setEnd(node, offset);
  return range.toString().length;
};

/** The range over [start, end) of root's textContent; null past its end. */
export const rangeAt = (root: Node, start: number, end: number): Range | null => {
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let seen = 0;
  let started = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (!started && start <= seen + length) {
      range.setStart(node, start - seen);
      started = true;
    }
    if (started && end <= seen + length) {
      range.setEnd(node, end - seen);
      return range;
    }
    seen += length;
  }
  return null;
};

export const headingsOf = (article: HTMLElement): HeadingMark[] =>
  [...article.querySelectorAll('[data-prose] :is(h2, h3)')].map(heading => ({
    offset: textOffset(article, heading, 0),
    text: heading.textContent?.trim() ?? '',
  }));

/** The anchored selection, or null when it is empty or leaves one region. */
export const pendingFrom = (article: HTMLElement, range: Range): Pending | null => {
  if (range.collapsed) return null;
  const region = elementOf(range.startContainer)?.closest(REGIONS);
  if (!region || !article.contains(region)) return null;
  if (elementOf(range.endContainer)?.closest(REGIONS) !== region) return null;

  const anchor = anchorFrom(
    article.textContent ?? '',
    textOffset(article, range.startContainer, range.startOffset),
    textOffset(article, range.endContainer, range.endOffset),
  );
  if (anchor.quote === '') return null;
  return { ...anchor, section: sectionFor(headingsOf(article), anchor.start) };
};

export const insertAnnotation = (list: readonly Annotation[], annotation: Annotation): Annotation[] =>
  [...list, annotation].sort((a, b) => a.start - b.start);

export const loadAnnotations = (storage: ReviewStorage | undefined, slug: string): Annotation[] => {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(storageKey(slug)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(item => annotationSchema.safeParse(item).success) : [];
  } catch {
    return [];
  }
};

export const storeAnnotations = (
  storage: ReviewStorage | undefined,
  slug: string,
  list: readonly Annotation[],
): void => {
  try {
    if (list.length === 0) storage?.removeItem(storageKey(slug));
    else storage?.setItem(storageKey(slug), JSON.stringify(list));
  } catch {
    // Blocked storage: the list lives until the page reloads.
  }
};
