import { Window } from 'happy-dom';
import { describe, expect, it, vi } from 'vitest';
import { GISCUS_FAILURE_MESSAGE } from '../../src/lib/posts/giscus-config';
import { GISCUS_LOADER_MARKER, GISCUS_ORIGIN, GISCUS_TIMEOUT_MS, startGiscus } from '../../src/lib/posts/giscus-loader';

const FIXTURE_CATEGORY_ID = 'DIC_kwDOTyj5uc4DJVQY';

interface Clock {
  setTimeout: (fn: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
}

const mount = (options?: { theme?: string; categoryId?: string }) => {
  const window = new Window({
    url: 'https://nandomoreira.dev/um-post',
    settings: {
      disableJavaScriptFileLoading: true,
      handleDisabledFileLoadingAsSuccess: true,
    },
  });
  const { document } = window;
  document.documentElement.setAttribute('data-theme', options?.theme ?? 'noir');
  const categoryId = options?.categoryId ?? FIXTURE_CATEGORY_ID;
  document.body.innerHTML = `
    <article>Texto do post</article>
    <section data-giscus-comments
      data-repo="nandomoreirame/nandomoreira.dev"
      data-repo-id="R_kgDOTyj5uQ"
      data-category="Blog"
      data-category-id="${categoryId}"
      data-mapping="pathname"
      data-strict="1"
      data-reactions-enabled="0"
      data-lang="pt">
      <p data-giscus-fallback role="status" hidden>${GISCUS_FAILURE_MESSAGE}</p>
      <p data-giscus-empty role="status" hidden>Nenhum comentário ainda. Seja o primeiro a escrever.</p>
      <div data-giscus-slot></div>
    </section>
  `;

  const pending: Array<{ fn: () => void; ms: number } | undefined> = [];
  const clock: Clock = {
    setTimeout(fn, ms) {
      pending.push({ fn, ms });
      return pending.length;
    },
    clearTimeout(id) {
      pending[id - 1] = undefined;
    },
  };

  let observer: { callback: IntersectionObserverCallback } | undefined;
  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: class {
      constructor(callback: IntersectionObserverCallback) {
        observer = { callback };
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    },
  });

  startGiscus(document as unknown as Document, clock);

  const section = document.querySelector('[data-giscus-comments]');
  if (!section) throw new Error('missing giscus section');
  const status = (selector: string) => {
    const node = section.querySelector(selector);
    if (!node || !(node instanceof window.HTMLElement)) throw new Error(`missing ${selector}`);
    return node;
  };
  const fallback = () => status('[data-giscus-fallback]');
  const empty = () => status('[data-giscus-empty]');
  const scripts = () => [...document.querySelectorAll('script')].filter(script => script.src.includes('giscus.app'));

  return {
    window,
    document,
    section,
    pending,
    fallback,
    empty,
    scripts,
    intersect(isIntersecting = true) {
      observer?.callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    },
    message(origin: string, data: unknown) {
      window.dispatchEvent(new window.MessageEvent('message', { origin, data }));
    },
  };
};

describe('giscus loader', () => {
  it('does not insert the script before the section intersects', () => {
    const page = mount();
    expect(page.scripts()).toHaveLength(0);
    expect(page.section.getAttribute(GISCUS_LOADER_MARKER)).toBe('');
    page.intersect(false);
    expect(page.scripts()).toHaveLength(0);
  });

  it('loads pathname strict mode, the configured category, pt and no reactions', () => {
    const page = mount();
    page.intersect();
    const [script] = page.scripts();
    expect(script.src).toBe(`${GISCUS_ORIGIN}/client.js`);
    expect(script.async).toBe(true);
    expect(script.crossOrigin).toBe('anonymous');
    expect(script.getAttribute('data-mapping')).toBe('pathname');
    expect(script.getAttribute('data-strict')).toBe('1');
    expect(script.getAttribute('data-category')).toBe('Blog');
    expect(script.getAttribute('data-category-id')).toBe(FIXTURE_CATEGORY_ID);
    expect(script.getAttribute('data-lang')).toBe('pt');
    expect(script.getAttribute('data-reactions-enabled')).toBe('0');
    expect(script.getAttribute('data-emit-metadata')).toBe('1');
    expect(script.getAttribute('data-theme')).toBe('dark');
    page.intersect();
    expect(page.scripts()).toHaveLength(1);
  });

  it('maps noir to dark and paper to light', () => {
    const noir = mount({ theme: 'noir' });
    noir.intersect();
    expect(noir.scripts()[0].getAttribute('data-theme')).toBe('dark');

    const paper = mount({ theme: 'paper' });
    paper.intersect();
    expect(paper.scripts()[0].getAttribute('data-theme')).toBe('light');
  });

  it('keeps a theme chosen before the iframe exists and applies it when the frame appears', async () => {
    const page = mount();
    page.intersect();
    const [script] = page.scripts();
    expect(script.getAttribute('data-theme')).toBe('dark');

    page.document.documentElement.setAttribute('data-theme', 'paper');
    await page.window.happyDOM.waitUntilComplete();
    expect(script.getAttribute('data-theme')).toBe('light');

    const iframe = page.document.createElement('iframe');
    iframe.className = 'giscus-frame';
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: { postMessage } });
    page.section.append(iframe);
    await page.window.happyDOM.waitUntilComplete();

    expect(postMessage).toHaveBeenCalledWith({ giscus: { setConfig: { theme: 'light' } } }, GISCUS_ORIGIN);
    expect(page.scripts()).toHaveLength(1);
    expect(page.window.location.href).toBe('https://nandomoreira.dev/um-post');
  });

  it('tells the iframe about a theme change and does not reload the page', async () => {
    const page = mount();
    page.intersect();
    const iframe = page.document.createElement('iframe');
    iframe.className = 'giscus-frame';
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: { postMessage } });
    page.section.append(iframe);

    page.document.documentElement.setAttribute('data-theme', 'paper');
    await page.window.happyDOM.waitUntilComplete();

    expect(postMessage).toHaveBeenCalledWith({ giscus: { setConfig: { theme: 'light' } } }, GISCUS_ORIGIN);
    expect(page.scripts()).toHaveLength(1);
    expect(page.window.location.href).toBe('https://nandomoreira.dev/um-post');
    expect(page.document.querySelector('article')?.textContent).toContain('Texto do post');
  });

  it('keeps the post readable when the iframe refuses the theme message', async () => {
    const page = mount();
    page.intersect();
    const iframe = page.document.createElement('iframe');
    iframe.className = 'giscus-frame';
    Object.defineProperty(iframe, 'contentWindow', {
      configurable: true,
      value: {
        postMessage: () => {
          throw new Error('blocked');
        },
      },
    });
    page.section.append(iframe);
    page.document.documentElement.setAttribute('data-theme', 'paper');
    await page.window.happyDOM.waitUntilComplete();
    expect(page.document.querySelector('article')?.textContent).toContain('Texto do post');
  });

  it('ignores a message from any other origin', () => {
    const page = mount();
    page.intersect();
    page.message('https://evil.example', { giscus: { error: 'nope' } });
    expect(page.fallback().hidden).toBe(true);
  });

  it('invites the first comment when the discussion does not exist yet', () => {
    const page = mount();
    page.intersect();
    page.message(GISCUS_ORIGIN, { giscus: { error: 'Discussion not found' } });
    expect(page.empty().hidden).toBe(false);
    expect(page.empty().textContent).toContain('Nenhum comentário ainda. Seja o primeiro a escrever.');
    expect(page.fallback().hidden).toBe(true);
    page.message(GISCUS_ORIGIN, { giscus: { resizeHeight: 180 } });
    expect(page.empty().hidden).toBe(false);
    expect(page.fallback().hidden).toBe(true);
    for (const item of page.pending) item?.fn();
    expect(page.fallback().hidden).toBe(true);
  });

  it('shows the Portuguese fallback when the Giscus plugin reports an error', () => {
    const page = mount();
    page.intersect();
    page.message(GISCUS_ORIGIN, { giscus: { error: 'giscus is not installed on this repository' } });
    expect(page.fallback().hidden).toBe(false);
    expect(page.fallback().textContent).toContain(GISCUS_FAILURE_MESSAGE);
    expect(page.empty().hidden).toBe(true);
    page.message(GISCUS_ORIGIN, { giscus: { resizeHeight: 80 } });
    expect(page.fallback().hidden).toBe(false);
    expect(page.document.querySelector('article')?.textContent).toContain('Texto do post');
  });

  it('hides the invitation once the discussion has a comment', () => {
    const page = mount();
    page.intersect();
    page.message(GISCUS_ORIGIN, { giscus: { error: 'Discussion not found' } });
    page.message(GISCUS_ORIGIN, {
      giscus: { discussion: { totalCommentCount: 2, totalReplyCount: 1 }, viewer: {} },
    });
    expect(page.empty().hidden).toBe(true);
    expect(page.fallback().hidden).toBe(true);
  });

  it('shows the invitation when the discussion exists and has no comments', () => {
    const page = mount();
    page.intersect();
    page.message(GISCUS_ORIGIN, {
      giscus: { discussion: { totalCommentCount: 0, totalReplyCount: 0 }, viewer: {} },
    });
    expect(page.empty().hidden).toBe(false);
    expect(page.fallback().hidden).toBe(true);
  });

  it('shows the fallback when the script fails or the timeout expires', () => {
    const failed = mount();
    failed.intersect();
    failed.scripts()[0].dispatchEvent(new failed.window.Event('error'));
    expect(failed.fallback().hidden).toBe(false);
    expect(failed.empty().hidden).toBe(true);
    expect(failed.document.querySelector('article')?.textContent).toContain('Texto do post');

    const timed = mount();
    timed.intersect();
    expect(timed.pending[0]?.ms).toBe(GISCUS_TIMEOUT_MS);
    timed.pending[0]?.fn();
    expect(timed.fallback().hidden).toBe(false);
    expect(timed.empty().hidden).toBe(true);
  });

  it('does not show the fallback when Giscus answers before the timeout', () => {
    const page = mount();
    page.intersect();
    page.message(GISCUS_ORIGIN, { giscus: { resizeHeight: 120 } });
    for (const item of page.pending) item?.fn();
    expect(page.fallback().hidden).toBe(true);
  });

  it('refuses to inject Giscus when the category id is missing', () => {
    const page = mount({ categoryId: '' });
    expect(page.fallback().hidden).toBe(false);
    page.intersect();
    expect(page.scripts()).toHaveLength(0);
    expect(page.document.querySelector('article')?.textContent).toContain('Texto do post');
  });
});
