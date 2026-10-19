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
    expect(html.match(/<img[^>]*src="\/servicos\/trabalhos\/[a-z0-9-]+(?<!-ampliada)\.webp"/g)).toHaveLength(9);
    expect(html).not.toMatch(/<img(?![^>]*alt="[^"]+")/);
    expect(html).not.toMatch(/<img(?![^>]*loading="lazy")/);
  });

  it('links nowhere', async () => {
    expect((await render(MoreWork)).match(/<a /g)).toBeNull();
  });

  it('opens each image in a script-free lightbox (Popover API)', async () => {
    const html = await render(MoreWork);
    expect(html).not.toContain('<script');
    expect(html.match(/<button[^>]*popovertarget="trabalho-[a-z0-9-]+"(?![^>]*popovertargetaction)/g)).toHaveLength(9);
    expect(html.match(/id="trabalho-[a-z0-9-]+"[^>]*popover/g)).toHaveLength(9);
    expect(html).toMatch(/aria-label="Ampliar imagem: Ateliê éh Pique"/);
    expect(html).toMatch(/role="dialog"/);
    expect(
      html.match(
        /popovertargetaction="hide"[^>]*aria-label="Fechar"|aria-label="Fechar"[^>]*popovertargetaction="hide"/g,
      ),
    ).toHaveLength(9);
    expect(html).toContain('src="/servicos/trabalhos/atelie-eh-pique-ampliada.webp"');
  });
});
