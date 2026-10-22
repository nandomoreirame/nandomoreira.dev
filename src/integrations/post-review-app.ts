import { defineToolbarApp } from 'astro/toolbar';
import { mountPanel } from '../lib/post-review/panel';

/** Dev Toolbar shell over the reviewer panel (spec post-review). Dev only. */
export default defineToolbarApp({
  init(canvas, app, server) {
    const panel = mountPanel({ canvas, doc: document, server });
    app.onToggled(({ state }) => panel.setActive(state));
  },
});
