import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LiveBar from '../../src/components/layout/LiveBar.astro';

const render = async () => (await AstroContainer.create()).renderToString(LiveBar);

describe('LiveBar', () => {
  it('announces the daily live, 9h00 to 12h00, with one link per channel through /go', async () => {
    const html = await render();

    expect(html).toContain('data-live-bar');
    expect(html).toContain('9h00 às 12h00');
    for (const kind of ['youtube', 'twitch']) {
      expect(html).toMatch(new RegExp(`<a[^>]*href="/go/contato/${kind}"[^>]*target="_blank"[^>]*rel="noopener"`));
    }
  });

  it('repeats the channels in a second copy that screen readers and the tab order skip', async () => {
    const html = await render();

    expect(html.match(/<a /g)?.length).toBe(4);
    expect(html.match(/tabindex="-1"/g)?.length).toBe(2);
    expect(html.match(/aria-label="Live todos/g)?.length).toBe(2);
  });

  it('slides right to left and stops under reduced motion', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');

    expect(css).toMatch(/@keyframes live-bar-slide\s*{\s*to\s*{\s*transform:\s*translateX\(-50%\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{\s*\.live-bar-track\s*{\s*animation: none/);
  });
});
