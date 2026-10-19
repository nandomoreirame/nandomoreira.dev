import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AuthorBox from '../../src/components/posts/AuthorBox.astro';

const SITE = 'https://nandomoreira.dev';
const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(AuthorBox, { props: { site: SITE, ...props } });

describe('AuthorBox', () => {
  it('asks the reader in, with the fixed copy', async () => {
    const html = await render({ email: 'oi@nandomoreira.dev' });
    expect(html).toMatch(/<h2[^>]*>\s*Conversar com o autor\s*<\/h2>/);
    expect(html).toContain(
      'Ficou alguma dúvida, achou um erro ou quer propor uma melhoria? Me chama por e-mail ou entrega este site para o seu agente.',
    );
    expect(html).toContain('data-icon="lucide:square-terminal"');
  });

  it('links the e-mail and the agent brief, both secondary', async () => {
    const html = await render({ email: 'oi@nandomoreira.dev' });
    expect(html).toMatch(/<a[^>]*href="mailto:oi@nandomoreira\.dev"[^>]*>[\s\S]*?oi@nandomoreira\.dev[\s\S]*?<\/a>/);
    expect(html).toMatch(
      /<a[^>]*href="\/AGENTS\.md"[^>]*>[\s\S]*?\$ curl https:\/\/nandomoreira\.dev\/AGENTS\.md[\s\S]*?<\/a>/,
    );
    const row = html.slice(html.indexOf('href="/contato"'));
    expect(html.match(/bg-primary/g)).toHaveLength(1);
    expect(html.indexOf('href="/contato"')).toBeLessThan(html.indexOf('mailto:'));
    expect(row).toMatch(/^href="\/contato"[^>]*>[\s\S]*?Contato/);
    expect(html.match(/<a[^>]*href="mailto:[^"]*"[^>]*>/)?.[0]).not.toContain('bg-primary');
  });

  it('starts the row with the contact button, also without an e-mail', async () => {
    const html = await render({});
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>[\s\S]*?Contato[\s\S]*?<\/a>/);
  });

  it('drops the e-mail link without an e-mail, and leaves the page in reading mode', async () => {
    const html = await render({});
    expect(html).not.toContain('mailto:');
    expect(html).toContain('href="/AGENTS.md"');
    expect(html).toContain('data-reader-hide');
  });
});
