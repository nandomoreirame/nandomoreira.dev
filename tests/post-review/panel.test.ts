// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { mountPanel, type PanelServer } from '../../src/lib/post-review/panel';

const markup = `
<article data-reader-article data-post-slug="meu-post">
  <h1>Título do post</h1>
  <div data-prose><p>Primeira frase. Segunda frase.</p></div>
</article>`;

type Handler = (data: unknown) => void;

const fakeServer = () => {
  const handlers = new Map<string, Handler>();
  const sent: [string, unknown][] = [];
  const server: PanelServer = {
    send: (event, payload) => void sent.push([event, payload]),
    on: (event, handler) => void handlers.set(event, handler as Handler),
  };
  return { server, sent, emit: (event: string, data: unknown) => handlers.get(event)?.(data) };
};

let canvas: ShadowRoot;
let painted: Range[][];
let selected: Range | null;

const paragraph = () => document.querySelector('[data-prose] p')!.firstChild as Text;
const select = (start: number, end: number) => {
  selected = document.createRange();
  selected.setStart(paragraph(), start);
  selected.setEnd(paragraph(), end);
};
const $ = <T extends Element>(selector: string) => canvas.querySelector<T>(selector)!;
const altR = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', altKey: true }));

const mount = (server: PanelServer) => {
  const host = document.createElement('div');
  document.body.append(host);
  canvas = host.attachShadow({ mode: 'open' });
  const panel = mountPanel({
    canvas,
    doc: document,
    server,
    storage: localStorage,
    paint: ranges => void painted.push(ranges),
    currentRange: () => selected,
  });
  panel.setActive(true);
  return panel;
};

const annotate = (start: number, end: number, request: string, replacement = '') => {
  select(start, end);
  altR();
  $<HTMLTextAreaElement>('textarea[name="request"]').value = request;
  $<HTMLTextAreaElement>('textarea[name="replacement"]').value = replacement;
  $<HTMLFormElement>('[data-form]').dispatchEvent(new Event('submit', { cancelable: true }));
};

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = markup;
  painted = [];
  selected = null;
});

describe('post-review panel', () => {
  it('asks for a post on any other page', () => {
    document.body.innerHTML = '<main>Outra página</main>';
    mount(fakeServer().server);
    expect($('[data-empty]').hasAttribute('hidden')).toBe(false);
    expect($('[data-empty]').textContent).toBe('Abra um post para revisar');
    expect($('[data-review]').hasAttribute('hidden')).toBe(true);
  });

  it('opens the form with the quote on Alt+R and focuses the request', () => {
    mount(fakeServer().server);
    select(0, 15);
    altR();
    expect($('[data-form]').hasAttribute('hidden')).toBe(false);
    expect($('[data-quote]').textContent).toBe('Primeira frase.');
    expect(canvas.activeElement).toBe($('textarea[name="request"]'));
  });

  it('refuses an annotation with neither request nor replacement', () => {
    mount(fakeServer().server);
    annotate(0, 15, '  ');
    expect($('[data-error]').textContent).toBe('Escreva o pedido ou o texto novo');
    expect($('[data-list]').children.length).toBe(0);
  });

  it('lists annotations in text order, highlights them and keeps them after a reload', () => {
    mount(fakeServer().server);
    annotate(16, 30, '', 'Outra frase.');
    annotate(0, 15, 'mais curto');
    const items = [...$('[data-list]').children].map(item => item.querySelector('blockquote')?.textContent);
    expect(items).toEqual(['Primeira frase.', 'Segunda frase.']);
    expect($('[data-count]').textContent).toBe('2 anotações');
    expect(painted.at(-1)?.map(range => range.toString())).toEqual(['Primeira frase.', 'Segunda frase.']);

    document.body.innerHTML = markup;
    mount(fakeServer().server);
    expect($('[data-list]').children.length).toBe(2);
  });

  it('removes one annotation by its labelled button', () => {
    mount(fakeServer().server);
    annotate(0, 15, 'mais curto');
    const remove = $<HTMLButtonElement>('[data-list] button');
    expect(remove.getAttribute('aria-label')).toBe('Remover anotação 1');
    remove.click();
    expect($('[data-list]').children.length).toBe(0);
    expect(localStorage.getItem('post-review:meu-post')).toBeNull();
  });

  it('sends the review on save and shows where it was written', () => {
    const { server, sent, emit } = fakeServer();
    mount(server);
    annotate(0, 15, 'mais curto');
    $<HTMLButtonElement>('[data-save]').click();
    expect(sent[0]?.[0]).toBe('post-review:save');
    expect(sent[0]?.[1]).toMatchObject({ slug: 'meu-post', annotations: [{ quote: 'Primeira frase.' }] });
    emit('post-review:saved', { path: 'docs/post-reviews/meu-post.md' });
    expect($('[data-status]').textContent).toBe('Salvo em docs/post-reviews/meu-post.md');
    emit('post-review:failed', { reason: 'Post não encontrado: meu-post' });
    expect($('[data-status]').textContent).toBe('Post não encontrado: meu-post');
  });

  it('clears the list, the highlights and the storage', () => {
    mount(fakeServer().server);
    annotate(0, 15, 'mais curto');
    $<HTMLButtonElement>('[data-clear]').click();
    expect($('[data-list]').children.length).toBe(0);
    expect(painted.at(-1)).toEqual([]);
    expect(localStorage.getItem('post-review:meu-post')).toBeNull();
  });

  it('lets the annotation list scroll inside the toolbar window', () => {
    mount(fakeServer().server);
    const css = canvas.querySelector('style')?.textContent ?? '';
    expect(css).toMatch(/\[data-list\][^{]*\{[^}]*overflow-y:\s*auto/);
    expect(css).toMatch(/top:\s*8px\s*!important/);
    expect(css).toMatch(/right:\s*8px\s*!important/);
    expect(css).toMatch(/transform:\s*none\s*!important/);
    const list = $<HTMLOListElement>('[data-list]');
    expect(list.tabIndex).toBe(0);
    expect(list.getAttribute('aria-label')).toBe('Anotações');
  });

  it('drops a stored annotation when the passage no longer matches', () => {
    mount(fakeServer().server);
    annotate(0, 15, 'mais curto');
    document.body.innerHTML = markup.replace('Primeira frase. Segunda frase.', 'Outro assunto por completo.');
    painted = [];
    mount(fakeServer().server);
    expect($('[data-list]').textContent ?? '').not.toContain('Primeira frase.');
    expect(painted.at(-1) ?? []).toEqual([]);
  });

  it('keeps a filled form when a later mouse selection arrives', () => {
    mount(fakeServer().server);
    select(0, 15);
    altR();
    $<HTMLTextAreaElement>('textarea[name="request"]').value = 'mais curto';
    select(16, 30);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect($('[data-quote]').textContent).toBe('Primeira frase.');
    expect($<HTMLTextAreaElement>('textarea[name="request"]').value).toBe('mais curto');
  });

  it('still retargets the quote on Alt+R while the form is filled', () => {
    mount(fakeServer().server);
    select(0, 15);
    altR();
    $<HTMLTextAreaElement>('textarea[name="request"]').value = 'mais curto';
    select(16, 30);
    altR();
    expect($('[data-quote]').textContent).toBe('Segunda frase.');
  });

  it('stops listening and removes the highlights when switched off', () => {
    const panel = mount(fakeServer().server);
    annotate(0, 15, 'mais curto');
    panel.setActive(false);
    expect(painted.at(-1)).toEqual([]);
    select(16, 30);
    altR();
    expect($('[data-quote]').textContent).toBe('');
  });

  it('labels every control', () => {
    mount(fakeServer().server);
    for (const field of canvas.querySelectorAll('textarea')) expect(field.closest('label')).not.toBeNull();
    for (const button of canvas.querySelectorAll('button')) expect(button.textContent?.trim()).not.toBe('');
  });
});
