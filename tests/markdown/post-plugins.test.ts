import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { externalLinks, lightboxImages } from '../../src/lib/markdown/post-plugins';

const render = async (markdown: string) => {
  const processor = await createSatteriMarkdownProcessor({
    syntaxHighlight: false,
    hastPlugins: [lightboxImages(), externalLinks()],
  });
  return (await processor.render(markdown)).code;
};

describe('externalLinks', () => {
  it('opens an external link in a new tab, with nofollow', async () => {
    const html = await render('Veja o [Niri](https://github.com/YaLTeR/niri).');

    expect(html).toMatch(/<a href="https:\/\/github\.com\/YaLTeR\/niri"[^>]*target="_blank"/);
    expect(html).toMatch(/rel="nofollow noopener noreferrer"/);
  });

  it.each(['/lab/noctalia-daybar', 'https://nandomoreira.dev/posts', '#secao', 'mailto:x@y.z'])(
    'leaves %s as it is',
    async href => {
      const html = await render(`[link](${href})`);
      expect(html).not.toContain('target=');
      expect(html).not.toContain('nofollow');
    },
  );
});

describe('lightboxImages', () => {
  it('wraps a body image in a button that opens it in a popover lightbox', async () => {
    const html = await render('![Painel do Gistbar](/lab/noctalia-gistbar/panel.webp)');

    const id = html.match(/popovertarget="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toMatch(/<button type="button" popovertarget="[^"]+" aria-label="Ampliar imagem: Painel do Gistbar"/);
    expect(html).toContain(`id="${id}" popover="" role="dialog" aria-label="Painel do Gistbar" class="lightbox"`);
    expect(html).toMatch(/class="lightbox"><img /);
    expect(html).toMatch(/popovertargetaction="hide" aria-label="Fechar"/);
    // The page copy and the enlarged copy.
    expect(html.match(/<img\b/g)).toHaveLength(2);
  });

  it('gives each image on the page its own popover', async () => {
    const html = await render('![A](/a.webp)\n\n![B](/b.webp)');
    const ids = [...html.matchAll(/ id="([^"]+)" popover/g)].map(match => match[1]);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('starts the numbering again on every document', async () => {
    const first = await render('![A](/a.webp)');
    const second = await render('![B](/b.webp)');

    expect(first.match(/ id="([^"]+)" popover/)?.[1]).toBe(second.match(/ id="([^"]+)" popover/)?.[1]);
  });

  it('leaves an image that is already a link alone', async () => {
    const html = await render('[![Badge](/badge.svg)](https://example.com)');
    expect(html).not.toContain('popover');
  });

  it('is wired into the site markdown pipeline', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');
    expect(config).toMatch(/hastPlugins: \[lightboxImages\(\), externalLinks\(\)\]/);
  });
});
