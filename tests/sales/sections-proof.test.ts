import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AboutCard from '../../src/components/sales/AboutCard.astro';
import ProjectShowcase from '../../src/components/sales/ProjectShowcase.astro';
import { careerYearsLabel } from '../../src/lib/format/career-years';
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
    expect(html).toContain(`${careerYearsLabel()} construindo software`);
    expect(html).not.toContain('{anos}');
  });

  it('keeps the photo square at most 320px beside the text in the page width', async () => {
    const html = await render(AboutCard);
    const img = html.match(/<img[^>]*fernando\.webp[^>]*>/)?.[0] ?? '';
    expect(html).toContain('max-w-page');
    expect(html).not.toContain('max-w-wide');
    expect(html).toContain('sm:grid-cols-photo');
    expect(img).toContain('w-32');
    expect(img).toContain('sm:w-full');
    expect(img).toContain('sm:aspect-square');
    expect(img).toContain('sm:h-auto');
    expect(img).toContain('object-cover');
    expect(img).toContain('object-top');
    expect(img).not.toContain('sm:h-full');
    expect(img).not.toContain('sm:w-auto');
  });

  it('caps the photo column at 20rem and drops the wide container token', () => {
    const css = readFileSync(resolve('src/styles/global.css'), 'utf8');
    expect(css).toMatch(
      /@utility\s+grid-cols-photo\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*20rem\)\s+minmax\(0,\s*1fr\)/s,
    );
    expect(css).not.toContain('--container-wide');
  });

  it('links to the main-site /sobre with a 44px touch target', async () => {
    const html = await render(AboutCard);
    expect(html).toContain('href="https://nandomoreira.dev/sobre"');
    expect(html).toContain('Saiba mais sobre mim');
    expect(html).toContain('min-h-11');
  });
});
