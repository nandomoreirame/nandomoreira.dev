import { Script, createContext } from 'node:vm';
import { gzipSync } from 'node:zlib';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { THEME_BOOT_BUDGET_BYTES, THEME_BOOT_MARKER, THEME_BOOT_SCRIPT } from '../../src/lib/theme/boot';

interface BootOptions {
  stored?: string | null;
  light?: boolean;
  storageThrows?: boolean;
  /** Old Safari MediaQueryList had no addEventListener (only addListener). */
  systemHasAddEventListener?: boolean;
}

/**
 * Runs the real inline script against a fresh happy-dom window, so every test
 * starts with one click listener on its own document. vm is test-only: the
 * production page runs the same string as a plain <script>.
 */
const boot = ({
  stored = null,
  light = false,
  storageThrows = false,
  systemHasAddEventListener = true,
}: BootOptions = {}) => {
  const window = new Window();
  const { document } = window;
  document.body.innerHTML =
    '<button type="button" data-theme-toggle><svg><path></path></svg></button><p id="other">texto</p>';
  const listeners: Array<() => void> = [];
  const system: { matches: boolean; addEventListener?: (type: string, fn: () => void) => void } = {
    matches: light,
  };
  if (systemHasAddEventListener) {
    system.addEventListener = (_type: string, fn: () => void) => listeners.push(fn);
  }
  const store = new Map<string, string>(stored === null ? [] : [['theme', stored]]);
  const localStorage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error('blocked');
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (storageThrows) throw new Error('blocked');
      store.set(key, value);
    },
  };
  new Script(THEME_BOOT_SCRIPT).runInContext(
    createContext({ document, Element: window.Element, localStorage, matchMedia: () => system }),
  );
  const click = (selector: string) =>
    document.querySelector(selector)!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const changeSystem = (matches: boolean) => {
    system.matches = matches;
    listeners.forEach(fn => fn());
  };
  return { root: document.documentElement, store, click, changeSystem };
};

describe('theme boot script', () => {
  it('follows the system when nothing is stored (REQ-002, REQ-003)', () => {
    expect(boot({ light: true }).root.dataset.theme).toBe('paper');
    expect(boot({ light: false }).root.dataset.theme).toBe('noir');
  });

  it('lets a stored choice win over the system', () => {
    expect(boot({ stored: 'noir', light: true }).root.dataset.theme).toBe('noir');
    expect(boot({ stored: 'paper', light: false }).root.dataset.theme).toBe('paper');
  });

  it('treats an unknown stored value as no choice', () => {
    expect(boot({ stored: 'sepia', light: true }).root.dataset.theme).toBe('paper');
  });

  it('survives blocked storage and still follows the system', () => {
    expect(boot({ storageThrows: true, light: true }).root.dataset.theme).toBe('paper');
  });

  it('marks the root once it ran, which is what shows the toggle', () => {
    expect(boot().root.hasAttribute(THEME_BOOT_MARKER)).toBe(true);
  });

  it('flips the theme and stores it on a click inside the toggle (REQ-005)', () => {
    const page = boot({ light: false });
    page.click('[data-theme-toggle] path');
    expect(page.root.dataset.theme).toBe('paper');
    expect(page.store.get('theme')).toBe('paper');
    page.click('[data-theme-toggle]');
    expect(page.root.dataset.theme).toBe('noir');
    expect(page.store.get('theme')).toBe('noir');
  });

  it('keeps the toggle working when matchMedia has no addEventListener', () => {
    const page = boot({ light: false, systemHasAddEventListener: false });
    page.click('[data-theme-toggle]');
    expect(page.root.dataset.theme).toBe('paper');
    expect(page.store.get('theme')).toBe('paper');
  });

  it('ignores clicks elsewhere', () => {
    const page = boot({ light: false });
    page.click('#other');
    expect(page.root.dataset.theme).toBe('noir');
    expect(page.store.has('theme')).toBe(false);
  });

  it('still flips for this page when storage is blocked', () => {
    const page = boot({ storageThrows: true, light: false });
    page.click('[data-theme-toggle]');
    expect(page.root.dataset.theme).toBe('paper');
  });

  it('follows a live system change only while nothing is chosen (REQ-006)', () => {
    const free = boot({ light: false });
    free.changeSystem(true);
    expect(free.root.dataset.theme).toBe('paper');

    const chosen = boot({ stored: 'noir', light: false });
    chosen.changeSystem(true);
    expect(chosen.root.dataset.theme).toBe('noir');

    const clicked = boot({ light: false });
    clicked.click('[data-theme-toggle]');
    clicked.changeSystem(false);
    expect(clicked.root.dataset.theme).toBe('paper');
  });

  it('carries its marker and stays within budget (REQ-010)', () => {
    expect(THEME_BOOT_SCRIPT).toContain(THEME_BOOT_MARKER);
    expect(gzipSync(THEME_BOOT_SCRIPT).length).toBeLessThanOrEqual(THEME_BOOT_BUDGET_BYTES);
  });
});
