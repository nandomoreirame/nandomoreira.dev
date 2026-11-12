import { describe, expect, it } from 'vitest';
import { liveBarHtml } from '../../src/lib/live-bar/render';

describe('liveBarHtml', () => {
  const html = liveBarHtml([
    { text: 'Com link', badge: 'Ao vivo', href: '/go/contato/youtube', external: true },
    { text: 'Sem link' },
  ]);

  it('renders every item twice, the second copy hidden from screen readers and the tab order', () => {
    expect(html.match(/<div class="live-bar-group/g)).toHaveLength(2);
    expect(
      html.match(/aria-hidden="true" class="live-bar-group|class="live-bar-group[^"]*"\s+aria-hidden="true"/g),
    ).toHaveLength(1);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(1);
  });

  it('opens external links in a new tab and labels the real one', () => {
    expect(html).toMatch(/<a [^>]*href="\/go\/contato\/youtube"[^>]*target="_blank"[^>]*rel="noopener"/);
    expect(html).toContain('aria-label="Com link. Abre em nova aba"');
  });

  it('does not double the final period in the label', () => {
    expect(liveBarHtml([{ text: 'No YouTube.', href: '/x' }])).toContain('aria-label="No YouTube. Abre em nova aba"');
  });

  it('renders an item without href as plain text, with its badge when present', () => {
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).toContain('Ao vivo</span>');
    expect(html.match(/Sem link/g)).toHaveLength(2);
  });

  it('escapes text and attributes', () => {
    const out = liveBarHtml([{ text: '"><script>x</script>', href: '/a"b' }]);
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('href="/a"b"');
  });
});
