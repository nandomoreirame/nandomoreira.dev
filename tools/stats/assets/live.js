// Live updates for the stats panel (docs/specs/stats-web REQ-016): swaps in
// the body the server renders and escapes, sent over SSE. While focus is
// inside it the swap waits, so a keyboard user keeps their place (REQ-015).
(() => {
  const root = document.querySelector('[data-live]');
  if (!root || !('EventSource' in window)) return;
  let pending = null;

  const apply = () => {
    if (pending === null) return;
    const open = [...root.querySelectorAll('details[open]')].map(d => d.id);
    root.innerHTML = pending;
    pending = null;
    open.forEach(id => document.getElementById(id)?.setAttribute('open', ''));
  };

  root.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!root.contains(document.activeElement)) apply();
    }, 0);
  });

  const source = new EventSource('/events?' + root.dataset.query);
  source.addEventListener('view', event => {
    pending = event.data;
    if (!root.contains(document.activeElement)) apply();
  });
})();
