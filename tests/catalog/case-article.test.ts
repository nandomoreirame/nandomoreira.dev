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
        { src: '/a.png', alt: 'Tela A' },
        { src: '/b.png', alt: 'Tela B' },
      ],
    });

    expect(html.match(/<img/g)).toHaveLength(2);
    expect(html).not.toContain('carousel');
    expect(html).not.toContain('client:');
  });

  it('lazy-loads images and declares dimensions, to protect CLS', async () => {
    const html = await render({ images: [{ src: '/a.png', alt: 'Tela A' }] });

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width=');
    expect(html).toContain('height=');
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
