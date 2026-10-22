// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import app from '../../src/integrations/post-review-app';

describe('post-review toolbar app', () => {
  it('mounts the panel and follows the toggle', async () => {
    document.body.innerHTML = '<article data-post-slug="meu-post"><div data-prose><p>Uma frase.</p></div></article>';
    const host = document.createElement('div');
    document.body.append(host);
    const canvas = host.attachShadow({ mode: 'open' });
    let toggled: ((options: { state: boolean }) => void) | undefined;
    const target = { onToggled: (callback: typeof toggled) => (toggled = callback) };
    const server = { send: vi.fn(), on: vi.fn() };

    await app.init?.(canvas, target as never, server as never);

    expect(canvas.querySelector('[data-review]')?.hasAttribute('hidden')).toBe(false);
    expect(server.on).toHaveBeenCalledWith('post-review:saved', expect.any(Function));
    toggled?.({ state: true });
    expect(document.head.querySelector('style')?.textContent).toContain('::highlight(post-review)');
    toggled?.({ state: false });
    expect(document.head.querySelector('style')).toBeNull();
  });
});
