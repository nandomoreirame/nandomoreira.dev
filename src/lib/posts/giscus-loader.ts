/**
 * On-demand Giscus embed (docs/specs/giscus-comments, REQ-004, REQ-005, REQ-008).
 * The external script is inserted only after the section nears the viewport.
 * Incoming messages are ignored unless their origin is https://giscus.app.
 */

import { GISCUS_EMPTY_DISCUSSION_ERROR } from './giscus-config';

export const GISCUS_ORIGIN = 'https://giscus.app';
export const GISCUS_LOADER_MARKER = 'data-giscus-loader';
export const GISCUS_TIMEOUT_MS = 8000;

export interface GiscusClock {
  setTimeout: (fn: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
}

/** noir (and anything unset) is the dark widget; paper is the light one. */
export const giscusTheme = (siteTheme: string | null): 'dark' | 'light' => (siteTheme === 'paper' ? 'light' : 'dark');

const read = (section: Element, name: string): string => section.getAttribute(name)?.trim() ?? '';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const commentCount = (discussion: unknown): number | null => {
  if (!isRecord(discussion) || typeof discussion.totalCommentCount !== 'number') return null;
  const replies = typeof discussion.totalReplyCount === 'number' ? discussion.totalReplyCount : 0;
  return discussion.totalCommentCount + replies;
};

export const startGiscus = (doc: Document = document, clock?: GiscusClock): void => {
  const section = doc.querySelector('[data-giscus-comments]');
  if (!section || section.hasAttribute(GISCUS_LOADER_MARKER)) return;
  section.setAttribute(GISCUS_LOADER_MARKER, '');

  const view = doc.defaultView;
  if (!view) return;

  const fallback = section.querySelector<HTMLElement>('[data-giscus-fallback]');
  const empty = section.querySelector<HTMLElement>('[data-giscus-empty]');
  const showFailure = () => {
    if (fallback) fallback.hidden = false;
    if (empty) empty.hidden = true;
  };
  const hideFailure = () => {
    if (fallback) fallback.hidden = true;
  };
  const showEmpty = () => {
    if (empty) empty.hidden = false;
    hideFailure();
  };
  const hideEmpty = () => {
    if (empty) empty.hidden = true;
  };

  const repoId = read(section, 'data-repo-id');
  const categoryId = read(section, 'data-category-id');
  if (!repoId || !categoryId) {
    showFailure();
    return;
  }

  const timers: GiscusClock = clock ?? {
    setTimeout: (fn, ms) => view.setTimeout(fn, ms) as unknown as number,
    clearTimeout: id => view.clearTimeout(id),
  };

  let timer: number | undefined;
  const clearTimer = () => {
    if (timer === undefined) return;
    timers.clearTimeout(timer);
    timer = undefined;
  };
  const fail = () => {
    clearTimer();
    showFailure();
  };

  const applyTheme = () => {
    const theme = giscusTheme(doc.documentElement.getAttribute('data-theme'));
    section.querySelector('script')?.setAttribute('data-theme', theme);
    const frame = section.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    const target = frame?.contentWindow;
    if (!target) return;
    try {
      target.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN);
    } catch {
      // A blocked frame must not take the post down with it.
    }
  };

  new view.MutationObserver(applyTheme).observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  // The frame is created after the script. A theme chosen in that gap has to
  // ride along when the iframe shows up, not only on the next theme click.
  new view.MutationObserver(applyTheme).observe(section, { childList: true, subtree: true });

  view.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== GISCUS_ORIGIN) return;
    if (!isRecord(event.data) || !isRecord(event.data.giscus)) return;
    const giscus = event.data.giscus;
    if (giscus.error === GISCUS_EMPTY_DISCUSSION_ERROR) {
      clearTimer();
      showEmpty();
      return;
    }
    if (giscus.error) {
      fail();
      return;
    }
    if ('discussion' in giscus) {
      clearTimer();
      const count = commentCount(giscus.discussion);
      if (count === 0) showEmpty();
      else {
        hideEmpty();
        hideFailure();
      }
      return;
    }
    if ('resizeHeight' in giscus) clearTimer();
  });

  let started = false;
  const load = () => {
    if (started) return;
    started = true;
    const script = doc.createElement('script');
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', read(section, 'data-repo'));
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', read(section, 'data-category'));
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', read(section, 'data-mapping'));
    script.setAttribute('data-strict', read(section, 'data-strict'));
    script.setAttribute('data-reactions-enabled', read(section, 'data-reactions-enabled'));
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-lang', read(section, 'data-lang'));
    script.setAttribute('data-theme', giscusTheme(doc.documentElement.getAttribute('data-theme')));
    script.addEventListener('error', () => fail());
    (section.querySelector('[data-giscus-slot]') ?? section).append(script);
    timer = timers.setTimeout(() => fail(), GISCUS_TIMEOUT_MS);
  };

  const observer = new view.IntersectionObserver(
    entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    },
    { rootMargin: '240px 0px' },
  );
  observer.observe(section);
};
