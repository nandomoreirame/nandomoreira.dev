import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NewsletterCard from '../../src/components/posts/NewsletterCard.astro';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import Posts from '../../src/pages/posts/index.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(NewsletterCard, { props });
};

describe('NewsletterCard', () => {
  it('is a card with the Stitch copy, anchored at #novidades', async () => {
    const html = await render();
    expect(html).toMatch(/<section[^>]*id="novidades"/);
    expect(html).toContain('Novidades no terminal');
    expect(html).toContain('Assine o feed de artigos técnicos');
    expect(html).toContain('Zero marketing. Apenas novos artigos quando saem no ar.');
    expect(html).toContain('lucide:mail');
  });

  it('posts a labelled email field to /api/subscribe, with the honeypot', async () => {
    const html = await render();
    expect(html).toMatch(/<form[^>]*action="\/api\/subscribe"[^>]*method="post"/);
    expect(html).toMatch(/<label[^>]*for="novidades-email"/);
    expect(html).toMatch(/<input[^>]*id="novidades-email"[^>]*type="email"[^>]*required/);
    expect(html).toContain(`name="${FORM_HONEYPOT}"`);
    expect(html).toMatch(/<button[^>]*type="submit"[\s\S]*?Assinar/);
  });

  it('links the privacy section', async () => {
    expect(await render()).toMatch(/href="\/privacidade#novidades"/);
  });

  it.each([
    ['ok', 'status'],
    ['invalido', 'alert'],
    ['limite', 'alert'],
    ['erro', 'alert'],
  ])('shows the %s outcome with role %s', async (outcome, role) => {
    expect(await render({ outcome })).toMatch(new RegExp(`role="${role}"`));
  });

  it('closes the /posts page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Posts, {
      request: new Request('https://nandomoreira.dev/posts?assinatura=ok'),
    });
    expect(html).toContain('id="novidades"');
    expect(html).toMatch(/role="status"/);
  });

  it.each(['toString', 'constructor', '__proto__'])(
    'does not render an outcome paragraph for the inherited key %s',
    async key => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(Posts, {
        request: new Request(`https://nandomoreira.dev/posts?assinatura=${encodeURIComponent(key)}`),
      });
      const marker = html.indexOf('id="novidades"');
      const card = html.slice(html.lastIndexOf('<section', marker), html.indexOf('</section>', marker));
      expect(card).not.toMatch(/<p[^>]*class="[^"]*\btext-foreground\b/);
      expect(card).not.toMatch(/\brole="(?:status|alert)"/);
    },
  );

  it('posts back to the page it sits on when told to, the home included', async () => {
    expect(await render({ returnTo: '/' })).toMatch(/<form[^>]*action="\/api\/subscribe\?origem=\/"/);
    expect(await render()).toMatch(/<form[^>]*action="\/api\/subscribe"/);
  });

  it('turns the submit into a secondary button when quiet, keeping one primary CTA on the home', async () => {
    const quiet = await render({ quiet: true });
    const button = quiet.match(/<button[^>]*type="submit"[^>]*>/)?.[0] ?? '';
    expect(button).not.toContain('bg-primary');
    expect(button).toContain('border-border-strong');
    expect((await render()).match(/<button[^>]*type="submit"[^>]*>/)?.[0]).toContain('bg-primary');
  });

  it('leaves its outer spacing to the page', async () => {
    expect((await render()).match(/<section[^>]*id="novidades"[^>]*>/)?.[0]).not.toContain('mb-3xl');
  });
});
