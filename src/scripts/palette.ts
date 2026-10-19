/**
 * The command palette (docs/specs/command-palette), loaded on demand by the
 * loader in PointerField.astro. Third named JS exception: this file must stay
 * under 4 KB gzip (tests/helpers/client-scripts.ts). Text only, never innerHTML.
 */
import type { SearchItem } from '../lib/search/build-index';
import { move, viewFor, type PaletteOption } from '../lib/search/controller';
import { PALETTE_COPY } from '../lib/search/copy';
import { goPathFor, isTypingTarget } from '../lib/search/go-sequence';

const dialog = document.querySelector<HTMLDialogElement>('[data-command-palette]')!;
const input = dialog.querySelector('input')!;
const list = dialog.querySelector<HTMLUListElement>('[role="listbox"]')!;
const status = dialog.querySelector<HTMLElement>('[data-palette-status]')!;
// Outside the dialog, so "Link copiado" is still announced after it closes.
const announce = document.querySelector<HTMLElement>('[data-palette-announce]');

/** Indirection so the test can watch navigation. */
export const nav = { go: (href: string) => window.location.assign(href) };

let index: SearchItem[] | undefined;
let loading: Promise<void> | undefined;
let options: PaletteOption[] = [];
let active = -1;
let opener: HTMLElement | null = null;
let armedAt: number | undefined;
let unavailable = false;

/** Only an object with a string title and a site or https path reaches the list. */
const valid = (item: unknown): item is SearchItem =>
  typeof item === 'object' &&
  item !== null &&
  typeof (item as SearchItem).title === 'string' &&
  typeof (item as SearchItem).path === 'string' &&
  /^(\/|https:\/\/)/.test((item as SearchItem).path);

const loadIndex = () =>
  (loading ??= fetch('/search.json')
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((items: unknown) => {
      index = Array.isArray(items) ? items.filter(valid) : [];
    })
    .catch(() => {
      unavailable = true;
    }));

const kbd = (key: string) => {
  const element = document.createElement('kbd');
  element.className = 'rounded-md border border-border-strong bg-background px-xs font-mono text-caption text-muted-foreground';
  element.textContent = key;
  return element;
};

const paint = () => {
  const groups = viewFor(index, input.value, { mdPath: dialog.dataset.paletteMd, aiPath: dialog.dataset.paletteAi, humanPath: dialog.dataset.paletteHuman });
  options = groups.flatMap((group) => group.options);
  list.replaceChildren(
    ...groups.flatMap((group) => {
      const heading = document.createElement('li');
      heading.setAttribute('role', 'presentation');
      heading.className = 'px-lg pt-md pb-xs font-mono text-caption uppercase tracking-eyebrow text-muted-foreground';
      heading.textContent = group.label;
      return [
        heading,
        ...group.options.map((option) => {
          const at = options.indexOf(option);
          const item = document.createElement('li');
          item.id = option.id;
          item.setAttribute('role', 'option');
          item.setAttribute('aria-selected', 'false');
          item.className = 'flex min-h-11 cursor-pointer items-center justify-between gap-md px-lg text-body text-muted-foreground';
          const label = document.createElement('span');
          label.textContent = option.label;
          const keys = document.createElement('span');
          keys.className = 'flex gap-xs';
          keys.append(...(option.keys ?? []).map(kbd));
          item.append(label, keys);
          item.addEventListener('click', () => choose(option));
          // The pointer and the arrows share one highlight: hovering moves it.
          item.addEventListener('pointermove', () => at !== active && setActive(at));
          return item;
        }),
      ];
    }),
  );
  status.textContent = !input.value.trim()
    ? unavailable
      ? PALETTE_COPY.unavailable
      : ''
    : groups[0]?.empty
      ? PALETTE_COPY.empty
      : PALETTE_COPY.results(options.length);
  setActive(options.length ? 0 : -1);
};

const setActive = (next: number) => {
  active = next;
  options.forEach((option, at) => document.getElementById(option.id)?.setAttribute('aria-selected', String(at === active)));
  const current = options[active];
  if (current) {
    input.setAttribute('aria-activedescendant', current.id);
    document.getElementById(current.id)?.scrollIntoView?.({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');
};

const choose = (option: PaletteOption) => {
  if (option.action === 'copy-link') {
    dialog.close();
    if (announce) announce.textContent = '';
    // Success is claimed only once the write resolves; without a clipboard the
    // optional chain skips the whole call, so nothing is claimed either.
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(
        () => {
          if (announce) announce.textContent = PALETTE_COPY.copied;
        },
        () => undefined,
      );
    return;
  }
  dialog.close();
  if (option.href) nav.go(option.href);
};

input.addEventListener('input', paint);
input.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    setActive(move(active, event.key === 'ArrowDown' ? 1 : -1, options.length));
  } else if (event.key === 'Enter' && options[active]) {
    event.preventDefault();
    choose(options[active]);
  }
});
// A click on the backdrop lands on the dialog itself, outside the panel.
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  opener?.focus();
});

document.addEventListener('keydown', (event) => {
  const path = goPathFor({ armedAt, now: event.timeStamp || performance.now(), key: event.key });
  if (event.key.toLowerCase() !== 'g') armedAt = undefined;
  if (path && !isTypingTarget(event.target instanceof HTMLElement ? event.target : null)) {
    if (dialog.open) dialog.close();
    nav.go(path);
  }
});

/** Opens the palette (REQ-001, REQ-002); `from` gets the focus back on close. */
export const open = async (from: HTMLElement | null) => {
  input.value = '';
  // Ctrl+K again while open would hand back the palette's own input.
  if (!dialog.open) {
    opener = from;
    dialog.showModal();
  }
  input.focus();
  paint();
  await loadIndex();
  paint();
};

/** Called by the loader on a lone G (REQ-011). */
export const armGo = (at: number) => {
  armedAt = at;
};
