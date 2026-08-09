import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Contato from '../../src/pages/contato.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Contato, {});
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
    const controls = html.match(/<(?:input|textarea)\b[^>]*>/g) ?? [];

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control, `unbounded control: ${control}`).toMatch(/\bmaxlength="\d+"/);
    }
  });

  it('does not submit anywhere yet, and says so instead of pretending', async () => {
    const html = await render();

    // No action and no method: nothing is wired, so nothing must look wired.
    expect(html).not.toMatch(/<form[^>]*\baction=/);
    expect(html).not.toMatch(/<form[^>]*\bmethod=/);
    expect(html).toMatch(/<button[^>]*\bdisabled/);
  });

  it('keeps a direct channel on the page, per the PRD rule against a mandatory form', async () => {
    expect(await render()).toContain('mailto:');
  });

  it('ships no client JavaScript', async () => {
    const html = await render();
    const scripts = html.match(/<script\b[^>]*>/g) ?? [];

    // The layout emits <script type="application/ld+json">, which is data the
    // browser never executes. Anything else is a real island.
    for (const tag of scripts) {
      expect(tag, `executable script on the page: ${tag}`).toContain(
        'application/ld+json',
      );
    }

    expect(html).not.toContain('client:');
  });
});
