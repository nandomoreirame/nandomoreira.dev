import { existsSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CurriculoPage from '../../src/pages/curriculo.astro';
import SobrePage from '../../src/pages/sobre.astro';
import { CV_PDF_PATH } from '../../src/lib/cv/download';

const render = async (query = '') => {
  const container = await AstroContainer.create();
  return container.renderToString(CurriculoPage, {
    request: new Request(`https://nandomoreira.dev/curriculo${query}`),
  });
};

const main = (html: string) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

describe('/curriculo', () => {
  it('asks for an optional name too', async () => {
    const html = main(await render());
    const input = html.match(/<input[^>]*name="nome"[^>]*>/)?.[0] ?? '';

    expect(input).toMatch(/type="text"/);
    expect(input).toMatch(/autocomplete="name"/);
    expect(input).not.toMatch(/\brequired\b/);
    expect(html).toMatch(/<label[^>]*for="cv-nome"[^>]*>\s*Nome \(opcional\)/);
    expect(html.indexOf('name="nome"')).toBeLessThan(html.indexOf('name="email"'));
  });

  it('asks for an optional e-mail, posting to /api/cv without JavaScript', async () => {
    const html = main(await render());
    const form = html.match(/<form[^>]*>/)?.[0] ?? '';
    const input = html.match(/<input[^>]*name="email"[^>]*>/)?.[0] ?? '';

    expect(form).toMatch(/action="\/api\/cv"/);
    expect(form).toMatch(/method="post"/);
    expect(input).toMatch(/type="email"/);
    expect(input).not.toMatch(/\brequired\b/);
    expect(html).toMatch(/<label[^>]*for="cv-email"/);
  });

  it('says why it asks and that it is optional', async () => {
    const html = main(await render());

    expect(html).toContain('só para eu saber quem está baixando');
    expect(html).toMatch(/opcional/i);
    expect(html).toMatch(/href="\/privacidade#curriculo"/);
  });

  it('lets the visitor skip straight to the PDF', async () => {
    const html = main(await render());
    const skip = html.match(/<a[^>]*href="\/curriculo-fernando-moreira\.pdf"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(skip).toMatch(/\bdownload="curriculo-fernando-moreira-senior-ai-engineer-\d{12}\.pdf"/);
    expect(skip).toMatch(/Pular/);
  });

  it('offers the download once the e-mail was sent', async () => {
    const html = main(await render('?envio=ok'));

    expect(html).toMatch(/role="status"/);
    expect(html).toMatch(/<a[^>]*href="\/curriculo-fernando-moreira\.pdf"[^>]*download=/);
    expect(html).not.toMatch(/<form/);
  });

  it('keeps the form with an alert when the e-mail is invalid', async () => {
    const html = main(await render('?envio=invalido'));

    expect(html).toMatch(/role="alert"/);
    expect(html).toMatch(/<form/);
  });

  it('stays out of search results', async () => {
    expect(await render()).toMatch(/<meta name="robots" content="noindex"/);
  });

  it('serves the PDF it links to', () => {
    expect(CV_PDF_PATH).toBe('/curriculo-fernando-moreira.pdf');
    expect(existsSync(`public${CV_PDF_PATH}`)).toBe(true);
  });

  it('is where the /sobre button leads, instead of the file itself', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const link = html.match(/<a[^>]*>(?:(?!<\/a>)[\s\S])*Baixar currículo[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(link).toMatch(/href="\/curriculo"/);
    expect(link).not.toMatch(/\bdownload\b/);
  });
});
