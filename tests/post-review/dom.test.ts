// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  articleOf,
  headingsOf,
  insertAnnotation,
  loadAnnotations,
  pendingFrom,
  rangeAt,
  storeAnnotations,
  textOffset,
} from '../../src/lib/post-review/dom';
import type { Annotation } from '../../src/lib/post-review/schema';

const markup = `
<article data-reader-article data-post-slug="meu-post">
  <h1>Título do post</h1>
  <p data-post-lead>Resumo curto.</p>
  <div data-post-toolbar>Copiar link</div>
  <div data-prose>
    <p>Abertura com <strong>negrito</strong> aqui.</p>
    <h2>Contexto</h2>
    <p>Texto da seção.</p>
  </div>
</article>`;

let article: HTMLElement;

const textNode = (selector: string): Text => document.querySelector(selector)!.firstChild as Text;

const rangeOver = (node: Text, start: number, end: number): Range => {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
};

beforeEach(() => {
  document.body.innerHTML = markup;
  article = articleOf(document)!;
});

describe('articleOf', () => {
  it('finds the post article, or null elsewhere', () => {
    expect(article.dataset.postSlug).toBe('meu-post');
    document.body.innerHTML = '<main>Outra página</main>';
    expect(articleOf(document)).toBeNull();
  });
});

describe('offsets', () => {
  it('measures a position in the article text and maps it back to a range', () => {
    const text = article.textContent ?? '';
    const node = textNode('strong');
    const start = textOffset(article, node, 0);
    expect(text.slice(start, start + 7)).toBe('negrito');
    expect(rangeAt(article, start, start + 7)?.toString()).toBe('negrito');
  });

  it('is null for offsets beyond the text', () => {
    expect(rangeAt(article, 0, 99999)).toBeNull();
  });
});

describe('pendingFrom', () => {
  it('anchors a selection inside the body with its section', () => {
    const pending = pendingFrom(article, rangeOver(textNode('h2 + p'), 0, 5));
    expect(pending?.quote).toBe('Texto');
    expect(pending?.section).toBe('Contexto');
    expect(pending?.prefix.endsWith('Contexto\n    ')).toBe(true);
  });

  it('accepts the title and the lead, with no section', () => {
    expect(pendingFrom(article, rangeOver(textNode('h1'), 0, 6))).toMatchObject({ quote: 'Título', section: null });
    expect(pendingFrom(article, rangeOver(textNode('[data-post-lead]'), 0, 6))?.quote).toBe('Resumo');
  });

  it('ignores a selection outside the regions, across regions or collapsed', () => {
    expect(pendingFrom(article, rangeOver(textNode('[data-post-toolbar]'), 0, 6))).toBeNull();
    const across = document.createRange();
    across.setStart(textNode('h1'), 0);
    across.setEnd(textNode('[data-post-lead]'), 6);
    expect(pendingFrom(article, across)).toBeNull();
    expect(pendingFrom(article, rangeOver(textNode('h1'), 2, 2))).toBeNull();
  });
});

describe('headingsOf', () => {
  it('lists the body h2/h3 with their offsets', () => {
    const [heading] = headingsOf(article);
    expect(heading?.text).toBe('Contexto');
    expect((article.textContent ?? '').slice(heading!.offset, heading!.offset + 8)).toBe('Contexto');
  });
});

const annotation = (start: number): Annotation => ({
  quote: 'x',
  prefix: '',
  suffix: '',
  section: null,
  request: 'troca',
  replacement: '',
  start,
  end: start + 1,
});

describe('annotations list and storage', () => {
  it('keeps the list in text order', () => {
    const list = insertAnnotation(insertAnnotation([], annotation(50)), annotation(10));
    expect(list.map(a => a.start)).toEqual([10, 50]);
  });

  it('round-trips through storage and removes the key when empty', () => {
    storeAnnotations(localStorage, 'meu-post', [annotation(10)]);
    expect(loadAnnotations(localStorage, 'meu-post')).toEqual([annotation(10)]);
    storeAnnotations(localStorage, 'meu-post', []);
    expect(localStorage.getItem('post-review:meu-post')).toBeNull();
  });

  it('survives broken or throwing storage', () => {
    localStorage.setItem('post-review:meu-post', '{nope');
    expect(loadAnnotations(localStorage, 'meu-post')).toEqual([]);
    localStorage.setItem('post-review:meu-post', JSON.stringify([annotation(1), { quote: '' }]));
    expect(loadAnnotations(localStorage, 'meu-post')).toEqual([annotation(1)]);
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadAnnotations(throwing, 'meu-post')).toEqual([]);
    expect(() => storeAnnotations(throwing, 'meu-post', [annotation(1)])).not.toThrow();
    expect(loadAnnotations(undefined, 'meu-post')).toEqual([]);
  });
});
