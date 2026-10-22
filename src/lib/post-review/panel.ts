import {
  articleOf,
  insertAnnotation,
  loadAnnotations,
  pendingFrom,
  rangeAt,
  storeAnnotations,
  type Pending,
} from './dom';
import { LIMITS, REVIEW_APP_ID, REVIEW_EVENTS, type Annotation } from './schema';

export type PanelServer = {
  send: <T>(event: string, payload: T) => void;
  on: <T>(event: string, callback: (data: T) => void) => void;
};

export type PanelDeps = {
  canvas: ShadowRoot;
  doc: Document;
  server: PanelServer;
  storage?: Storage;
  paint?: (ranges: Range[]) => void;
  currentRange?: () => Range | null;
};

export type Panel = { setActive: (state: boolean) => void };

/** Static markup only; every piece of post text goes in through textContent. */
const TEMPLATE = `
<style>
  section, form { display: flex; flex-direction: column; gap: 0.5rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; }
  textarea { font: inherit; min-height: 4rem; }
  blockquote { margin: 0; padding-left: 0.5rem; border-left: 2px solid currentColor; }
  h2 { margin: 0 0 12px; }
  p { margin: 0; }
  section[data-review] > p:first-of-type { margin-bottom: 8px; padding-right: 12px; }
  li { margin-bottom: 5px; }
  li:last-child { margin-bottom: 0; }
  [data-status]:empty, [data-error]:empty { display: none; }
  ol { margin: 0; padding: 0 12px 0 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
  /* The toolbar window centers itself and pads 24px. Same corner as Audit, with the padding given back to the list. */
  astro-dev-toolbar-window {
    overflow: hidden;
    top: 8px !important;
    right: 8px !important;
    bottom: 72px !important;
    left: auto !important;
    transform: none !important;
    width: min(22rem, calc(100vw - 16px)) !important;
    max-height: none !important;
    padding: 8px 0 6px 12px !important;
  }
  section[data-review] { min-height: 0; flex: 1; overflow: hidden; }
  [data-list] { overflow-y: auto; min-height: 0; flex: 1; }
  [hidden] { display: none !important; }
</style>
<astro-dev-toolbar-window>
  <h2>Revisar texto</h2>
  <p data-empty hidden>Abra um post para revisar</p>
  <section data-review hidden>
    <p>Selecione um trecho do título, do resumo ou do texto (no teclado, Shift+setas) e aperte Alt+R.</p>
    <form data-form hidden>
      <blockquote data-quote></blockquote>
      <label>O que mudar <textarea name="request" maxlength="${LIMITS.request}"></textarea></label>
      <label>Texto novo <textarea name="replacement" maxlength="${LIMITS.replacement}"></textarea></label>
      <p data-error role="alert"></p>
      <div><button type="submit">Anotar</button> <button type="button" data-cancel>Cancelar</button></div>
    </form>
    <p data-count></p>
    <ol data-list tabindex="0" aria-label="Anotações"></ol>
    <div><button type="button" data-save>Salvar revisão</button> <button type="button" data-clear>Limpar</button></div>
    <p data-status role="status"></p>
  </section>
</astro-dev-toolbar-window>`;

/** Marks on the page without touching its DOM (CSS Custom Highlight API). */
const paintHighlights = (ranges: Range[]): void => {
  if (typeof Highlight === 'undefined' || !CSS.highlights) return;
  if (ranges.length === 0) CSS.highlights.delete(REVIEW_APP_ID);
  else CSS.highlights.set(REVIEW_APP_ID, new Highlight(...ranges));
};

const HIGHLIGHT_STYLE = `::highlight(${REVIEW_APP_ID}) { background-color: Mark; color: MarkText; }`;

const safeStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export const mountPanel = ({
  canvas,
  doc,
  server,
  storage = safeStorage(),
  paint = paintHighlights,
  currentRange = () => {
    const selection = doc.getSelection();
    return selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  },
}: PanelDeps): Panel => {
  canvas.innerHTML = TEMPLATE;
  const $ = <T extends Element>(selector: string): T => canvas.querySelector<T>(selector)!;
  const article = articleOf(doc);
  const slug = article?.dataset.postSlug;

  if (!article || !slug) {
    $<HTMLElement>('[data-empty]').hidden = false;
    return { setActive: () => {} };
  }

  $<HTMLElement>('[data-review]').hidden = false;
  const form = $<HTMLFormElement>('[data-form]');
  const quote = $<HTMLElement>('[data-quote]');
  const request = $<HTMLTextAreaElement>('textarea[name="request"]');
  const replacement = $<HTMLTextAreaElement>('textarea[name="replacement"]');
  const error = $<HTMLElement>('[data-error]');
  const count = $<HTMLElement>('[data-count]');
  const listView = $<HTMLOListElement>('[data-list]');
  const status = $<HTMLElement>('[data-status]');
  const style = Object.assign(doc.createElement('style'), { textContent: HIGHLIGHT_STYLE });

  let list = loadAnnotations(storage, slug);
  let pending: Pending | null = null;
  let active = false;

  const item = (annotation: Annotation, index: number): HTMLLIElement => {
    const li = doc.createElement('li');
    const cited = Object.assign(doc.createElement('blockquote'), { textContent: annotation.quote });
    const note = Object.assign(doc.createElement('p'), {
      textContent: annotation.request || `Texto novo: ${annotation.replacement}`,
    });
    const remove = Object.assign(doc.createElement('button'), { type: 'button', textContent: 'Remover' });
    remove.setAttribute('aria-label', `Remover anotação ${index + 1}`);
    remove.addEventListener('click', () => {
      list = list.filter(other => other !== annotation);
      commit();
    });
    li.append(cited, note, remove);
    return li;
  };

  const stillThere = (annotation: Annotation): boolean =>
    rangeAt(article, annotation.start, annotation.end)?.toString() === annotation.quote;

  const render = (): void => {
    const fresh = list.filter(stillThere);
    if (fresh.length !== list.length) {
      list = fresh;
      storeAnnotations(storage, slug, list);
    }
    count.textContent = list.length === 1 ? '1 anotação' : `${list.length} anotações`;
    listView.replaceChildren(...list.map(item));
    paint(
      active ? list.map(a => rangeAt(article, a.start, a.end)).filter((range): range is Range => range !== null) : [],
    );
  };

  const commit = (): void => {
    storeAnnotations(storage, slug, list);
    render();
  };

  const closeForm = (): void => {
    pending = null;
    form.reset();
    quote.textContent = '';
    error.textContent = '';
    form.hidden = true;
  };

  /** Opens the form for a range; leaves the panel as it was when the range is not annotatable. */
  const annotate = (range: Range | null): boolean => {
    const next = range ? pendingFrom(article, range) : null;
    if (!next) return false;
    pending = next;
    quote.textContent = next.quote;
    error.textContent = '';
    form.hidden = false;
    request.focus();
    return true;
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!pending) return;
    const asked = request.value.trim();
    const written = replacement.value.trim();
    if (!asked && !written) {
      error.textContent = 'Escreva o pedido ou o texto novo';
      return;
    }
    if (list.length >= LIMITS.annotations) {
      error.textContent = `No máximo ${LIMITS.annotations} anotações por post`;
      return;
    }
    list = insertAnnotation(list, { ...pending, request: asked, replacement: written });
    closeForm();
    commit();
  });

  $<HTMLButtonElement>('[data-cancel]').addEventListener('click', closeForm);

  $<HTMLButtonElement>('[data-save]').addEventListener('click', () => {
    if (list.length === 0) {
      status.textContent = 'Nenhuma anotação para salvar';
      return;
    }
    status.textContent = 'Salvando…';
    server.send(REVIEW_EVENTS.save, { slug, annotations: list });
  });

  $<HTMLButtonElement>('[data-clear]').addEventListener('click', () => {
    list = [];
    closeForm();
    commit();
    status.textContent = 'Anotações removidas';
  });

  server.on<{ path: string }>(REVIEW_EVENTS.saved, ({ path }) => {
    status.textContent = `Salvo em ${path}`;
  });
  server.on<{ reason: string }>(REVIEW_EVENTS.failed, ({ reason }) => {
    status.textContent = reason;
  });

  const formIsDirty = (): boolean => !form.hidden && (request.value.trim() !== '' || replacement.value.trim() !== '');

  const onMouseUp = (event: MouseEvent): void => {
    // Clicks inside the panel keep the page selection; they must not reopen the form.
    if (event.composedPath().includes(canvas.host)) return;
    // A started note belongs to the quote already on screen. Alt+R still moves it.
    if (formIsDirty()) return;
    annotate(currentRange());
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!event.altKey || event.key.toLowerCase() !== 'r') return;
    event.preventDefault();
    if (!annotate(currentRange())) status.textContent = 'Selecione um trecho do título, do resumo ou do texto';
  };

  const setActive = (state: boolean): void => {
    active = state;
    if (state) {
      doc.addEventListener('mouseup', onMouseUp);
      doc.addEventListener('keydown', onKeyDown);
      doc.head.append(style);
    } else {
      doc.removeEventListener('mouseup', onMouseUp);
      doc.removeEventListener('keydown', onKeyDown);
      style.remove();
      closeForm();
    }
    render();
  };

  render();
  return { setActive };
};
