import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MoreWork from '../../src/components/sales/MoreWork.astro';
import Testimonials from '../../src/components/sales/Testimonials.astro';

const render = async (component: Parameters<AstroContainer['renderToString']>[0]) =>
  (await AstroContainer.create()).renderToString(component);

describe('Testimonials', () => {
  it('marks each quote as a figure with its source', async () => {
    const html = await render(Testimonials);
    expect(html).toContain('id="depoimentos-title"');
    expect(html.match(/<figure/g)).toHaveLength(2);
    expect(html.match(/<blockquote/g)).toHaveLength(2);
    expect(html).toContain('Yara Santiago');
  });
});

describe('MoreWork', () => {
  it('shows ten works, each image with alt text and lazy loading', async () => {
    const html = await render(MoreWork);
    expect(html).toContain('id="trabalhos-title"');
    expect(html.match(/<img/g)).toHaveLength(10);
    expect(html).not.toMatch(/<img(?![^>]*alt="[^"]+")/);
    expect(html).not.toMatch(/<img(?![^>]*loading="lazy")/);
  });

  it('links only the work still online, in a new tab', async () => {
    const html = await render(MoreWork);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toMatch(/href="https:\/\/www\.coletivoinclusao\.org\.br"[^>]*rel="noopener noreferrer"/);
  });
});
