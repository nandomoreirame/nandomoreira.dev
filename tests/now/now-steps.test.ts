import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Now from '../../src/pages/now.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Now);
};

describe('/now sections', () => {
  it('numbers the sections in page order', async () => {
    const html = await render();
    const ids = ['foco', 'projetos', 'escrevendo', 'estudando', 'ouvindo', 'jogando'];
    ids.forEach((id, index) => {
      const heading = html.match(new RegExp(`<h2[^>]*id="${id}"[^>]*>[\\s\\S]*?</h2>`))?.[0] ?? '';
      expect(heading).toContain(`${String(index + 1).padStart(2, '0')} //`);
    });
  });

  it('keeps the focus block as plain text like the other sections, with only the availability in a card', async () => {
    const html = await render();
    const focus = html.slice(html.indexOf('id="foco"'), html.indexOf('id="projetos"'));
    expect(focus.replace(/<(a|div)[^>]*data-availability-card[\s\S]*?<\/\1>/, '')).not.toMatch(
      /rounded-md border border-border bg-surface/,
    );
    expect(focus).toContain('data-availability-card');
    expect(focus).toMatch(/Disponível para novos projetos|Disponibilidade limitada|Indisponível no momento/);
  });

  it('opens the focus section with the availability card, right under the heading', async () => {
    const html = await render();
    const focus = html.slice(html.indexOf('id="foco"'), html.indexOf('id="projetos"'));
    expect(focus.indexOf('data-availability-card')).toBeGreaterThan(-1);
    expect(focus.indexOf('data-availability-card')).toBeLessThan(focus.indexOf('<ul'));
  });

  it('closes with what a now page is, linking nownownow.com', async () => {
    const html = await render();
    expect(html).toContain('O que é uma página Agora?');
    expect(html).toContain('A ideia é do Derek Sivers');
    expect(html).toMatch(/<a[^>]*href="https:\/\/nownownow\.com"[^>]*rel="[^"]*noopener/);
  });
});
