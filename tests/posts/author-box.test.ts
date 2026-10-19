import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AuthorBox from '../../src/components/posts/AuthorBox.astro';

const render = async () => (await AstroContainer.create()).renderToString(AuthorBox);

describe('AuthorBox', () => {
  it('closes the post with the author, like the sales about card', async () => {
    const html = await render();
    const aside = html.match(/<aside[\s\S]*<\/aside>/)?.[0] ?? '';
    expect(aside).toContain('O autor');
    expect(aside).not.toContain('Sobre o autor');
    expect(aside).not.toContain('Quem vai construir');
    expect(aside).toMatch(/<h2[^>]*>\s*Fernando Moreira\s*<\/h2>/);
    expect(aside).toMatch(/<img[^>]*src="\/servicos\/fernando\.webp"[^>]*alt="Foto de Fernando Moreira/);
    expect(aside).toMatch(/<a[^>]*href="\/sobre"[^>]*>[\s\S]*?Saiba mais sobre mim/);
    // The three sales facts stay on the landing only.
    expect(aside).not.toContain('<ul');
    expect(aside).not.toContain('Itaú Unibanco');
    // The blog speaks to readers, not to clients.
    expect(aside).not.toContain('atendendo todo o Brasil');
    expect(aside).toContain('Sou desenvolvedor de software sênior em São Paulo. Escrevo aqui sobre meus estudos e experimentos pra mim mesmo; se você está lendo, é um bônus :)');
    expect(html.match(/<aside/g)).toHaveLength(1);
  });

  it('has no call of its own: the author card only presents', async () => {
    const html = await render();
    expect(html).not.toContain('href="/contato"');
    expect(html).not.toContain('Fale comigo');
    expect(html).not.toContain('Conversar com o autor');
  });

  it('leaves the page in reading mode', async () => {
    expect(await render()).toContain('data-reader-hide');
  });
});
