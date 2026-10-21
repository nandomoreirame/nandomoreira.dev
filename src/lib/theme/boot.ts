/**
 * Theme boot (docs/specs/theme-modes, REQ-003, REQ-005, REQ-006, REQ-010).
 *
 * Inlined in <head> by both layouts, so it runs before the first paint on every
 * route, pre-rendered ones included: a stored choice wins, otherwise the system
 * scheme decides. It also owns the toggle's click, by delegation on document,
 * so the pointer script's budget stays untouched. Storage can throw (private
 * window, blocked site data); the theme then lives for this page only.
 */
export const THEME_STORAGE_KEY = 'theme';
export const THEME_BOOT_MARKER = 'data-theme-boot';
export const THEME_BOOT_BUDGET_BYTES = 512;

export const THEME_BOOT_SCRIPT = `(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: light)');
  let stored = null;
  try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch {}
  const pick = () => (stored === 'noir' || stored === 'paper' ? stored : system.matches ? 'paper' : 'noir');
  root.dataset.theme = pick();
  root.setAttribute('${THEME_BOOT_MARKER}', '');
  system.addEventListener?.('change', () => { root.dataset.theme = pick(); });
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('[data-theme-toggle]')) return;
    stored = root.dataset.theme === 'paper' ? 'noir' : 'paper';
    root.dataset.theme = stored;
    try { localStorage.setItem('${THEME_STORAGE_KEY}', stored); } catch {}
  });
})();`;
