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
  it('centres the content and drops the terminal path', async () => {
    const html = main(await render());
    const article = html.match(/<article[^>]*>/)?.[0] ?? '';
    const form = html.match(/<section[^>]*>/)?.[0] ?? '';

    expect(html).not.toContain('data-page-path');
    expect(html).not.toContain('~/curriculo');
    expect(article).toMatch(/\bmx-auto\b/);
    expect(article).toMatch(/\bitems-center\b/);
    expect(html).toMatch(/<header[^>]*\btext-center\b/);
    expect(form).toMatch(/\bw-full\b/);
    // The card is about 30% narrower than the 68ch column (asked on 2026-10-19).
    expect(form).toMatch(/max-w-\[48ch\]/);
  });

  it('asks for an optional name too', async () => {
    const html = main(await render());
    const input = html.match(/<input[^>]*name="nome"[^>]*>/)?.[0] ?? '';

    expect(input).toMatch(/type="text"/);
    expect(input).toMatch(/autocomplete="name"/);
    expect(input).not.toMatch(/\brequired\b/);
    expect(html).toMatch(/<label[^>]*for="cv-nome"[^>]*>\s*Nome\s*<\/label>/);
    expect(html.indexOf('name="nome"')).toBeLessThan(html.indexOf('name="email"'));
  });

  it('asks for an optional company, between the name and the e-mail', async () => {
    const html = main(await render());
    const input = html.match(/<input[^>]*name="empresa"[^>]*>/)?.[0] ?? '';

    expect(input).toMatch(/type="text"/);
    expect(input).toMatch(/autocomplete="organization"/);
    expect(input).toMatch(/maxlength="200"/);
    expect(input).not.toMatch(/\brequired\b/);
    expect(html).toMatch(/<label[^>]*for="cv-empresa"[^>]*>\s*Empresa\s*<\/label>/);
    expect(html.indexOf('name="nome"')).toBeLessThan(html.indexOf('name="empresa"'));
    expect(html.indexOf('name="empresa"')).toBeLessThan(html.indexOf('name="email"'));
  });

  it('labels the fields without "(opcional)", saying it once in the lead', async () => {
    const html = main(await render());

    expect(html).not.toMatch(/\(opcional\)/i);
    expect(html).toMatch(/<label[^>]*for="cv-email"[^>]*>\s*E-mail\s*<\/label>/);
    expect(html).toContain('Todos são opcionais');
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
    expect(html).toMatch(/opcion(al|ais)/i);
    expect(html).toMatch(/href="\/privacidade#curriculo"/);
  });

  it('lets the visitor skip straight to the PDF, through /go so the download counts', async () => {
    const html = main(await render());
    const skip = html.match(/<a[^>]*href="\/go\/curriculo"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(skip).toMatch(/\bdownload="curriculo-fernando-moreira-senior-ai-engineer-\d{12}\.pdf"/);
    expect(skip).toMatch(/Pular/);
    expect(html).not.toContain('href="/curriculo-fernando-moreira.pdf"');
  });

  it('downloads through /go after the form too', async () => {
    const html = main(await render('?envio=ok'));
    const link = html.match(/<a[^>]*href="\/go\/curriculo"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(link).toMatch(/\bdownload="curriculo-fernando-moreira-senior-ai-engineer-\d{12}\.pdf"/);
    expect(html).not.toContain('href="/curriculo-fernando-moreira.pdf"');
  });

  it('offers the download once the e-mail was sent', async () => {
    const html = main(await render('?envio=ok'));

    expect(html).toMatch(/role="status"/);
    expect(html).toMatch(/<a[^>]*href="\/go\/curriculo"[^>]*download=/);
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
