import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AboutCard from '../../src/components/sales/AboutCard.astro';
import ProjectShowcase from '../../src/components/sales/ProjectShowcase.astro';
import { salesProjects } from '../../src/lib/sales/projects';

const render = async (component: Parameters<AstroContainer['renderToString']>[0]) =>
  (await AstroContainer.create()).renderToString(component);

describe('salesProjects', () => {
  it('joins the copy to the collection: name, domain and /go link', async () => {
    const projects = await salesProjects();
    expect(projects.map((project) => project.slug)).toEqual(['encantos-brincantes', 'portfoliosnap', 'bragstack', 'mousai']);
    expect(projects.find((project) => project.slug === 'mousai')).toMatchObject({
      title: 'Mousai',
      domain: 'mousai.gallery',
      href: '/go/portfolio/mousai/live',
      image: '/servicos/projetos/mousai.webp',
    });
  });
});

describe('ProjectShowcase', () => {
  it('shows four projects with real screenshots and alt text', async () => {
    const html = await render(ProjectShowcase);
    expect(html).toContain('id="projetos"');
    expect(html.match(/<img/g)).toHaveLength(4);
    expect(html).not.toMatch(/<img(?![^>]*alt="[^"]+")/);
  });
});

describe('AboutCard', () => {
  it('uses the real photo and the approved facts', async () => {
    const html = await render(AboutCard);
    expect(html).toContain('src="/servicos/fernando.webp"');
    expect(html).toContain('Itaú Unibanco');
    expect(html).toContain('Desenvolvedor de software sênior');
  });
});
