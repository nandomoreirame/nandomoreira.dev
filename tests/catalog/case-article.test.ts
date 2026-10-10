import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const project = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling',
  summary: 'Cliente GUI multi-CLI',
  problem: 'O PROBLEMA',
  decisions: 'AS DECISOES',
  outcome: 'O RESULTADO',
  tech: ['Rust'],
  repoUrl: 'https://github.com/x/forja',
  liveUrl: null,
  featured: true,
  confidential: false,
};

const render = async (overrides: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, {
    props: { project: { ...project, ...overrides } },
  });
};

describe('CaseArticle', () => {
  it('presents problem, decisions and outcome in that order', async () => {
    const html = await render();

    expect(html.indexOf('O PROBLEMA')).toBeLessThan(html.indexOf('AS DECISOES'));
    expect(html.indexOf('AS DECISOES')).toBeLessThan(html.indexOf('O RESULTADO'));
  });

  it('starts the heading hierarchy at h1 and never skips a level', async () => {
    const html = await render();
    const levels = [...html.matchAll(/<h([1-6])/g)].map((match) => Number(match[1]));

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('omits the image section entirely when the case has no image', async () => {
    expect(await render({ images: undefined })).not.toContain('<img');
  });

  it('renders several images in sequence, with no carousel', async () => {
    const html = await render({
      images: [
        { src: '/a.png', alt: 'Tela A', width: 1200, height: 675 },
        { src: '/b.png', alt: 'Tela B', width: 1200, height: 675 },
      ],
    });

    // Each image also has a copy inside its lightbox; count the ones on the page.
    const visible = (html.match(/<img\b[^>]*>/g) ?? []).filter((tag) => !tag.includes('lightbox-image'));
    expect(visible).toHaveLength(2);
    expect(html).not.toContain('carousel');
    expect(html).not.toContain('client:');
  });

  it('lazy-loads images and declares their real dimensions, to protect CLS', async () => {
    const html = await render({ images: [{ src: '/a.png', alt: 'Tela A', width: 700, height: 364 }] });

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width="700"');
    expect(html).toContain('height="364"');
  });

  it('fills the container like the art band, keeping the aspect ratio', async () => {
    const img = (await render({ images: [{ src: '/a.png', alt: 'Tela A', width: 700, height: 364 }] })).match(
      /<img\b[^>]*>/,
    )?.[0];

    expect(img).toMatch(/\bw-full\b/);
    expect(img).toMatch(/\bh-auto\b/);
    expect(img).not.toMatch(/\bmax-w-full\b/);
  });

  describe('lightbox', () => {
    const images = [
      { src: '/a.png', alt: 'Tela A', width: 1600, height: 900 },
      { src: '/b.png', alt: 'Tela B', width: 700, height: 364 },
    ];

    it('opens each image in its own popover from a button, with no script', async () => {
      const html = await render({ images });
      const triggers = [...html.matchAll(/<button\b[^>]*popovertarget="([^"]+)"(?![^>]*popovertargetaction="hide")[^>]*>/g)];

      expect(triggers.map((match) => match[1])).toEqual(['case-image-1', 'case-image-2']);
      for (const [, id] of triggers) expect(html).toMatch(new RegExp(`<div\\b[^>]*id="${id}"[^>]*popover`));
      expect(html).not.toContain('<script');
      expect(html).not.toContain('client:');
    });

    it('names the trigger after the image, so a screen reader knows what opens', async () => {
      const html = await render({ images });
      expect(html).toMatch(/<button\b[^>]*aria-label="Ampliar imagem: Tela A"/);
    });

    it('shows the whole image inside, labelled as a dialog, with a close button', async () => {
      const html = await render({ images });
      const box = html.slice(html.indexOf('id="case-image-1"'), html.indexOf('id="case-image-2"'));

      expect(box).toMatch(/role="dialog"/);
      expect(box).toMatch(/aria-label="Tela A"/);
      expect(box).toMatch(/<img\b[^>]*src="\/a.png"[^>]*class="[^"]*\blightbox-image\b/);
      expect(box).toMatch(/<button\b[^>]*popovertarget="case-image-1"[^>]*popovertargetaction="hide"[^>]*aria-label="Fechar"/);
    });
  });

  it('opens with the generated art band, before the block label and the title', async () => {
    const html = await render();
    const band = html.indexOf('art-banner');

    expect(band).toBeGreaterThan(-1);
    expect(band).toBeLessThan(html.indexOf('<h1'));
    expect(html).toContain('viewBox="0 0 210 90"');
  });

  it('keeps the band decorative and leaves the pointer field to the layout', async () => {
    const html = await render();
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('data-pointer-field');
  });
});
