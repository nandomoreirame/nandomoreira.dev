import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { collectionOfBlock } from '../../src/lib/catalog/groups';
import { getAllProjects } from '../../src/lib/content';
import PortfolioCase from '../../src/pages/portfolio/[slug].astro';

describe('/portfolio/[slug] availability', () => {
  it('closes every case with the availability card, after the article', async () => {
    const projects = (await getAllProjects()).filter((project) => collectionOfBlock(project.block) === 'portfolio');
    expect(projects.length).toBeGreaterThan(0);
    const container = await AstroContainer.create();
    for (const project of projects) {
      const html = await container.renderToString(PortfolioCase, { props: { project }, params: { slug: project.slug } });
      const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
      expect(main, project.slug).toContain('data-availability-card');
      expect(main.indexOf('data-availability-card')).toBeGreaterThan(main.lastIndexOf('</article>'));
    }
  });
});
