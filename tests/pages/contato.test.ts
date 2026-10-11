import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import Contato from '../../src/pages/contato.astro';

const render = async (query = '') => {
  const container = await AstroContainer.create();
  return container.renderToString(Contato, {
    request: new Request(`https://nandomoreira.dev/contato${query}`),
  });
};

describe('/contato', () => {
  it('renders a form', async () => {
    expect(await render()).toContain('<form');
  });

  it('asks for name, email and message', async () => {
    const html = await render();

    for (const field of ['nome', 'email', 'mensagem']) {
      expect(html, `missing field ${field}`).toContain(`name="${field}"`);
    }
  });

  it('labels every control, since a placeholder is not an accessible name', async () => {
    const html = await render();
    const ids = [...html.matchAll(/<(?:input|textarea)[^>]*\bid="([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(html, `no <label for="${id}">`).toMatch(
        new RegExp(`<label[^>]*for="${id}"`),
      );
    }
  });

  it('types the email control so mobile keyboards and the browser help', async () => {
    expect(await render()).toMatch(/<input[^>]*type="email"/);
  });

  it('bounds every free-text field, so the future endpoint never meets an unbounded payload', async () => {
    const html = await render();
    const controls = (html.match(/<(?:input|textarea)\b[^>]*>/g) ?? []).filter(
      (control) => !/type="(checkbox|radio)"/.test(control),
    );

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control, `unbounded control: ${control}`).toMatch(/\bmaxlength="\d+"/);
    }
  });

  it('posts to /api/hire without JavaScript', async () => {
    const html = await render();

    expect(html).toMatch(/<form[^>]*\baction="\/api\/hire"/);
    expect(html).toMatch(/<form[^>]*\bmethod="post"/);
    expect(html).not.toMatch(/<button[^>]*type="submit"[^>]*\bdisabled/);
  });

  it('asks for company, budget and interests, all optional', async () => {
    const html = await render();

    expect(html).toMatch(/<input[^>]*name="empresa"/);
    expect(html).not.toMatch(/<input[^>]*name="empresa"[^>]*required/);
    expect(html).toMatch(/<select[^>]*name="orcamento"/);
    for (const value of ['undecided', 'up-to-10k', '10k-30k', '30k-60k', '60k-plus']) {
      expect(html).toContain(`value="${value}"`);
    }
    for (const value of ['job', 'freelance', 'ai-product', 'agents-mcp', 'consulting']) {
      expect(html).toMatch(new RegExp(`<input[^>]*type="checkbox"[^>]*name="interesse"[^>]*value="${value}"`));
    }
  });

  it('swaps the interest chips for a multiple select on phones', async () => {
    const html = await render();
    const select = html.match(/<select[^>]*name="interesse"[^>]*>[\s\S]*?<\/select>/)?.[0] ?? '';
    const open = select.match(/<select[^>]*>/)?.[0] ?? '';

    expect(open).toMatch(/\bmultiple\b/);
    expect(open).toMatch(/\bsm:hidden\b/);
    expect(open).toMatch(/aria-labelledby="contato-interesse-legenda"/);
    for (const value of ['job', 'freelance', 'ai-product', 'agents-mcp', 'consulting']) {
      expect(select).toContain(`value="${value}"`);
    }
    // The chips are the same choice for wider screens, hidden on phones.
    expect(html).toMatch(/<div class="hidden flex-wrap gap-sm sm:flex">/);
    expect(html).toMatch(/<legend[^>]*id="contato-interesse-legenda"/);
  });

  it('groups the interest chips under a legend', async () => {
    expect(await render()).toMatch(/<fieldset[\s\S]*?<legend[\s\S]*?Tenho interesse em/);
  });

  it('labels the budget select', async () => {
    expect(await render()).toMatch(/<label[^>]*for="contato-orcamento"/);
  });

  it('hides the honeypot from people, screen readers and password managers', async () => {
    const html = await render();
    const trap = html.match(new RegExp(`<input[^>]*name="${FORM_HONEYPOT}"[^>]*>`))?.[0] ?? '';

    expect(trap).toContain('tabindex="-1"');
    expect(trap).toContain('autocomplete="off"');
    // A name autofill recognises (website, url, email...) gets filled by a
    // password manager, and the real message is then silently dropped.
    expect(FORM_HONEYPOT).not.toMatch(/website|url|site|email|mail|name|nome|phone|tel|company|empresa/i);
    // display:none: bots reading the HTML still fill it; autofill skips it.
    expect(html).toMatch(new RegExp(`<div[^>]*\\bhidden\\b[^>]*>[\\s\\S]*?name="${FORM_HONEYPOT}"`));
  });

  it.each([
    ['invalido', 'Faltou'],
    ['limite', 'Muitas tentativas'],
    ['erro', 'Não consegui'],
  ])('keeps the form and announces "%s" as an alert', async (outcome, text) => {
    const html = await render(`?envio=${outcome}`);
    const region = html.match(/<p[^>]*id="envio"[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';

    expect(region).toContain('role="alert"');
    expect(region).toContain(text);
    expect(html).toContain('<form');
  });

  it('replaces the form with a centred success state', async () => {
    const html = await render('?envio=ok');
    const state = html.match(/<div[^>]*id="envio"[^>]*>[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? html;

    expect(html).not.toContain('<form');
    expect(html).toMatch(/<div[^>]*id="envio"[^>]*role="status"|<div[^>]*role="status"[^>]*id="envio"/);
    expect(state).toContain('Mensagem enviada');
    expect(state).toContain('data-icon="lucide:mail-check"');
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>[\s\S]*?Enviar outra mensagem/);
  });

  it('shows no outcome on a plain visit, or for an unknown value', async () => {
    expect(await render()).not.toContain('id="envio"');
    expect(await render('?envio=<script>')).not.toContain('id="envio"');
  });

  it('keeps a direct channel on the page, per the PRD rule against a mandatory form', async () => {
    expect(await render()).toContain('mailto:');
  });

  it('ships no client JavaScript besides the pointer effect', async () => {
    const html = await render();
    const scripts = html.match(/<script\b[^>]*>/g) ?? [];

    // JSON-LD is data the browser never executes. The pointer effect is the
    // one named exception (generative-case-art); anything else is an island.
    for (const tag of scripts) {
      expect(tag, `executable script on the page: ${tag}`).toMatch(
        /application\/ld\+json|PointerField\.astro/,
      );
    }

    expect(html).not.toContain('client:');
  });
});
