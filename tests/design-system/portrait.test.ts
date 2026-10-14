import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Portrait from '../../src/components/ui/Portrait.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(Portrait, { props });
};

describe('Portrait', () => {
  it('names the person in the alt text', async () => {
    const html = await render({ name: 'Fernando Moreira' });

    expect(html).toMatch(/alt="Ilustração de Fernando Moreira: [^"]+"/);
  });

  it('declares dimensions and offers AVIF and WebP before the JPEG', async () => {
    const html = await render({ name: 'Fernando Moreira' });

    expect(html).toMatch(/<img[^>]*width="960"[^>]*height="960"/);
    expect(html.indexOf('image/avif')).toBeLessThan(html.indexOf('image/webp'));
    expect(html).toContain('sizes="');
  });

  it('never catches clicks meant for the content around it', async () => {
    expect(await render({ name: 'Fernando Moreira' })).toContain('pointer-events-none');
  });

  it('sits behind the copy as a backdrop, pushed past the right edge on phones', async () => {
    const html = await render({ name: 'F' });
    const picture = html.match(/<picture[^>]*class="([^"]*)"/)?.[1] ?? '';

    expect(picture).toContain('absolute');
    expect(picture).toContain('-z-10');
    expect(picture).toMatch(/\bopacity-\d+/);
  });

  it('takes the vertical offset from the page', async () => {
    expect(await render({ name: 'F', class: '-top-2xl' })).toMatch(/<picture[^>]*class="[^"]*-top-2xl/);
  });
});
