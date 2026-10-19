// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const markup = `
<button id="opener" data-palette-trigger>abrir</button>
<input id="field" />
<dialog data-command-palette aria-label="Buscar no site" class="palette">
  <input role="combobox" aria-controls="palette-list" aria-expanded="true" />
  <ul id="palette-list" role="listbox"></ul>
  <p aria-live="polite" data-palette-status></p>
</dialog>
<p aria-live="polite" data-palette-announce></p>`;

const index = [{ kind: 'post', title: 'Meu homelab', path: '/homelab' }];

const load = async () => {
  vi.resetModules();
  return import('../../src/scripts/palette');
};

const dialog = () => document.querySelector('dialog')!;
const input = () => dialog().querySelector('input')!;
const listbox = () => document.querySelector('[role="listbox"]')!;
const status = () => document.querySelector('[data-palette-status]')!.textContent;
const announce = () => document.querySelector('[data-palette-announce]')!.textContent;

const type = (value: string) => {
  input().value = value;
  input().dispatchEvent(new Event('input'));
};

const press = (key: string, target: EventTarget = input()) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

/** A keydown with an explicit timeStamp, so the G window never depends on the clock. */
const keyAt = (key: string, timeStamp: number, target: EventTarget = document) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  target.dispatchEvent(event);
};

const serve = (body: unknown, init?: ResponseInit) => {
  globalThis.fetch = vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), init)) as never;
};

const mockClipboard = (writeText: (text: string) => Promise<void>) => {
  const spy = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: spy }, configurable: true });
  return spy;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  document.body.innerHTML = markup;
  dialog().showModal = vi.fn(() => dialog().setAttribute('open', ''));
  dialog().close = vi.fn(() => {
    dialog().removeAttribute('open');
    dialog().dispatchEvent(new Event('close'));
  });
  serve(index);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('palette module', () => {
  it('offers the human version from the dialog data on the AI view', async () => {
    document.querySelector('dialog')!.dataset.paletteHuman = '/sobre';
    const palette = await load();
    await palette.open(null);
    expect(document.querySelector('[role="listbox"]')!.textContent).toContain('Versão para humanos');
  });

  it('lists the page markdown and AI view from the dialog data', async () => {
    const dialog = document.querySelector('dialog')!;
    dialog.dataset.paletteMd = '/sobre.md';
    dialog.dataset.paletteAi = '/sobre/ia';
    const palette = await load();
    await palette.open(null);
    const text = document.querySelector('[role="listbox"]')!.textContent;
    expect(text).toContain('Versão .md');
    expect(text).toContain('Versão para IA');
  });

  it('opens with the input focused and the empty-query groups', async () => {
    const palette = await load();
    await palette.open(document.getElementById('opener'));
    expect(dialog().hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(input());
    expect(listbox().textContent).toContain('Copiar link');
  });

  it('fetches the index once and finds a post without accents', async () => {
    const palette = await load();
    await palette.open(null);
    await palette.open(null);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    type('homelab');
    expect(listbox().textContent).toContain('Meu homelab');
    expect(status()).toBe('1 resultado');
  });

  it('finds an accented title from an upper-case query without accents', async () => {
    serve([{ kind: 'page', title: 'Configuração', path: '/config' }]);
    const palette = await load();
    await palette.open(null);
    type('CONFIGURACAO');
    expect(listbox().textContent).toContain('Configuração');
  });

  it('moves the active option with the arrows and sets aria-activedescendant', async () => {
    const palette = await load();
    await palette.open(null);
    press('ArrowDown');
    const active = input().getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)!.getAttribute('aria-selected')).toBe('true');
  });

  it('wraps ArrowUp from the first option to the last one', async () => {
    const palette = await load();
    await palette.open(null);
    expect(input().getAttribute('aria-activedescendant')).toBe('opt-copy-link');
    press('ArrowUp');
    const options = listbox().querySelectorAll('[role="option"]');
    expect(input().getAttribute('aria-activedescendant')).toBe(options[options.length - 1].id);
  });

  it('navigates to the active option on Enter', async () => {
    const palette = await load();
    const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
    await palette.open(null);
    type('homelab');
    press('Enter');
    expect(go).toHaveBeenCalledWith('/homelab');
    expect(dialog().hasAttribute('open')).toBe(false);
  });

  it('navigates to an option on click', async () => {
    const palette = await load();
    const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
    await palette.open(null);
    type('homelab');
    (listbox().querySelector('[role="option"]') as HTMLElement).click();
    expect(go).toHaveBeenCalledWith('/homelab');
  });

  it('follows the pointer: hovering an option makes it the active one', async () => {
    const palette = await load();
    await palette.open(null);
    const options = [...document.querySelectorAll('[role="option"]')];
    options[2].dispatchEvent(new Event('pointermove', { bubbles: true }));
    expect(options[2].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    expect(input().getAttribute('aria-activedescendant')).toBe(options[2].id);
  });

  it('closes and gives the focus back to the opener', async () => {
    const palette = await load();
    const opener = document.getElementById('opener')!;
    await palette.open(opener);
    dialog().close();
    expect(document.activeElement).toBe(opener);
  });

  it('keeps the first opener when Ctrl+K fires again while open', async () => {
    const palette = await load();
    const opener = document.getElementById('opener')!;
    await palette.open(opener);
    await palette.open(input());
    dialog().close();
    expect(document.activeElement).toBe(opener);
  });

  it('closes on a click on the backdrop, not on a click inside the panel', async () => {
    const palette = await load();
    await palette.open(null);
    listbox().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog().hasAttribute('open')).toBe(true);
    dialog().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog().hasAttribute('open')).toBe(false);
  });

  it('keeps the actions when the index cannot be fetched', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('offline');
    }) as never;
    const palette = await load();
    await palette.open(null);
    expect(status()).toContain('indisponível');
    type('blog');
    expect(listbox().textContent).toContain('Blog');
  });

  it('says the search is unavailable when the index answers with an error status', async () => {
    serve('', { status: 500 });
    const palette = await load();
    await palette.open(null);
    expect(status()).toContain('indisponível');
  });

  it('shows and announces the empty state when nothing matches', async () => {
    const palette = await load();
    await palette.open(null);
    type('zzqqxx');
    expect(listbox().textContent).toContain('Nada encontrado.');
    expect(listbox().textContent).toContain('Ir para o contato');
    expect(status()).toBe('Nada encontrado.');
  });

  it('clears the status when the query is emptied', async () => {
    const palette = await load();
    await palette.open(null);
    type('homelab');
    expect(status()).toBe('1 resultado');
    type('');
    expect(status()).toBe('');
  });

  it('keeps only index items with a string title and a site or https path', async () => {
    serve([
      { kind: 'post', title: 'Post bom', path: '/bom' },
      { kind: 'post', title: 'Post externo', path: 'https://example.com/x' },
      { kind: 'post', title: 'Post mau', path: 'javascript:alert(1)' },
      { kind: 'post', title: 42, path: '/numero' },
      { kind: 'post', title: 'Post sem caminho' },
      null,
      'texto solto',
    ]);
    const palette = await load();
    await palette.open(null);
    type('post');
    const text = listbox().textContent;
    expect(text).toContain('Post bom');
    expect(text).toContain('Post externo');
    expect(text).not.toContain('Post mau');
    expect(text).not.toContain('Post sem caminho');
    expect(status()).not.toContain('indisponível');
  });

  it('renders titles as text, never as HTML', async () => {
    const title = '<img src=x onerror=alert(1)>';
    serve([{ kind: 'post', title, path: '/x' }]);
    const palette = await load();
    await palette.open(null);
    type('img');
    expect(listbox().querySelector('img')).toBeNull();
    expect(listbox().textContent).toContain(title);
  });

  describe('copy link', () => {
    it('copies the URL, closes and announces outside the dialog only after the write resolves', async () => {
      let resolve!: () => void;
      const writeText = mockClipboard(() => new Promise<void>((done) => (resolve = done)));
      const palette = await load();
      await palette.open(null);
      press('Enter');
      expect(writeText).toHaveBeenCalledWith(window.location.href);
      expect(dialog().hasAttribute('open')).toBe(false);
      expect(announce()).toBe('');
      resolve();
      await flush();
      expect(announce()).toBe('Link copiado');
    });

    it('claims nothing when the clipboard rejects', async () => {
      mockClipboard(async () => {
        throw new Error('denied');
      });
      const palette = await load();
      await palette.open(null);
      press('Enter');
      await flush();
      expect(announce()).toBe('');
      expect(status()).not.toBe('Link copiado');
    });

    it('claims nothing when there is no clipboard', async () => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      const palette = await load();
      await palette.open(null);
      press('Enter');
      await flush();
      expect(announce()).toBe('');
      expect(dialog().hasAttribute('open')).toBe(false);
    });
  });

  describe('G sequence', () => {
    it('navigates on G then a mapped letter inside the window', async () => {
      const palette = await load();
      const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
      palette.armGo(1000);
      keyAt('b', 1500);
      expect(go).toHaveBeenCalledWith('/posts');
    });

    it('ignores the letter once the window expired', async () => {
      const palette = await load();
      const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
      palette.armGo(1000);
      keyAt('b', 2001);
      expect(go).not.toHaveBeenCalled();
    });

    it('ignores a letter that was not preceded by G', async () => {
      const palette = await load();
      const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
      keyAt('b', 1500);
      expect(go).not.toHaveBeenCalled();
    });

    it('does not navigate on G then an unmapped key, and disarms', async () => {
      const palette = await load();
      const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
      palette.armGo(1000);
      keyAt('x', 1100);
      keyAt('b', 1200);
      expect(go).not.toHaveBeenCalled();
    });

    it('does not navigate when the letter is typed in a field', async () => {
      const palette = await load();
      const go = vi.spyOn(palette.nav, 'go').mockImplementation(() => undefined);
      palette.armGo(1000);
      keyAt('b', 1100, document.getElementById('field')!);
      expect(go).not.toHaveBeenCalled();
    });

    it('closes the open palette before navigating', async () => {
      const palette = await load();
      await palette.open(null);
      let openWhenNavigating: boolean | undefined;
      vi.spyOn(palette.nav, 'go').mockImplementation(() => {
        openWhenNavigating = dialog().hasAttribute('open');
      });
      palette.armGo(1000);
      keyAt('h', 1100);
      expect(openWhenNavigating).toBe(false);
    });
  });

  it('carries the gate marker in its own source', () => {
    expect(readFileSync('src/scripts/palette.ts', 'utf8')).toContain('data-command-palette');
  });
});
