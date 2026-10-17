import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Pagination from '../../src/components/posts/Pagination.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(Pagination, { props });
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

describe('Pagination', () => {
  it('is a named navigation landmark with the count on the right', async () => {
    const html = await render({ page: 1, totalPages: 2, first: 1, last: 6, total: 11 });
    expect(html).toMatch(/<nav[^>]*aria-label="Paginação"/);
    expect(text(html)).toContain('Página 1 de 2 (artigos 1-6 de 11)');
    expect(html).toMatch(/<span[^>]*text-primary[^>]*>1<\/span>/);
  });

  it('on the first page, disables "Mais recentes" and links "Mais antigos" to page 2', async () => {
    const html = await render({ page: 1, totalPages: 2, first: 1, last: 6, total: 11 });
    expect(html).toMatch(/<span[^>]*aria-disabled="true"[^>]*>\s*← Mais recentes\s*<\/span>/);
    expect(html).toMatch(/<a[^>]*href="\/posts\?pagina=2"[^>]*rel="next"[^>]*>\s*Mais antigos →\s*<\/a>/);
  });

  it('on the last page, links back without ?pagina=1 and disables "Mais antigos"', async () => {
    const html = await render({ page: 2, totalPages: 2, first: 7, last: 11, total: 11 });
    expect(html).toMatch(/<a[^>]*href="\/posts"[^>]*rel="prev"[^>]*>\s*← Mais recentes\s*<\/a>/);
    expect(html).toMatch(/<span[^>]*aria-disabled="true"[^>]*>\s*Mais antigos →\s*<\/span>/);
    expect(html).not.toContain('pagina=1');
  });

  it('links a middle page both ways', async () => {
    const html = await render({ page: 2, totalPages: 3, first: 7, last: 12, total: 15 });
    expect(html).toContain('href="/posts"');
    expect(html).toContain('href="/posts?pagina=3"');
    expect(html).not.toContain('aria-disabled');
  });

  it('says "artigo" for a single post', async () => {
    const html = await render({ page: 1, totalPages: 1, first: 1, last: 1, total: 1 });
    expect(text(html)).toContain('(artigo 1 de 1)');
  });
});
