import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ResumePage from '../../src/pages/curriculo.astro';
import SobrePage from '../../src/pages/sobre.astro';
import { CV_GO_PATH } from '../../src/lib/analytics/outbound';
import { CV_PAGE, CV_PDF_PATH } from '../../src/lib/cv/download';

const render = async (query = '') => {
  const container = await AstroContainer.create();
  return container.renderToString(ResumePage, { request: new Request(`https://nandomoreira.dev/curriculo${query}`) });
};

const dialogOf = (html: string) => html.match(/<dialog[\s\S]*?<\/dialog>/)?.[0] ?? '';
const FILE = /download="curriculo-fernando-moreira-senior-ai-engineer-\d{12}\.pdf"/;

describe('/curriculo', () => {
  it('is a resume sheet without the site header, footer or corner actions', async () => {
    const html = await render();

    expect(html).not.toContain('<header class="sticky');
    expect(html).not.toContain('data-corner-actions');
    expect(html).not.toContain('data-pointer-field');
    expect(html).not.toMatch(/<footer[^>]*data-site-footer/);
    expect(html).not.toContain('Pular para o conteúdo');
  });

  it('has one h1 with the name and is noindex', async () => {
    const html = await render();

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*Fernando Moreira Costa\s*<\/h1>/);
    expect(html).toContain('<meta name="robots" content="noindex"');
    expect(html).toContain('lang="pt-BR"');
  });

  it('opens with the summary section, with the career years from the clock', async () => {
    const html = await render();
    const resumo = html.indexOf('id="resumo"');

    expect(resumo).toBeGreaterThan(-1);
    expect(resumo).toBeLessThan(html.indexOf('id="stack"'));
    expect(html).toMatch(/Engenheiro de software com \d{2} anos de carreira/);
    expect(html).not.toMatch(/\+\d{2} anos/);
  });

  it('shows every bullet of the PDF, the long ones included', async () => {
    const html = await render();

    expect(html.match(/<li>/g)?.length).toBeGreaterThanOrEqual(30);
    expect(html).toContain('Orquestrei três CLIs de IA com papéis separados');
    expect(html).toContain('Implantei cultura ágil com Scrum adaptado');
  });

  it('is the address the form and the /sobre button use', async () => {
    const container = await AstroContainer.create();
    const sobre = await container.renderToString(SobrePage);
    const link = sobre.match(/<a[^>]*>(?:(?!<\/a>)[\s\S])*Baixar currículo[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(CV_PAGE).toBe('/curriculo');
    expect(link).toMatch(/href="\/curriculo"/);
    expect(link).not.toMatch(/\bdownload\b/);
  });

  it('is the only address, with no /cv alias left behind', () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).not.toContain("'/cv'");
    expect(existsSync('src/pages/cv.astro')).toBe(false);
  });

  it('serves the PDF it links to', () => {
    expect(CV_PDF_PATH).toBe('/curriculo-fernando-moreira.pdf');
    expect(existsSync(`public${CV_PDF_PATH}`)).toBe(true);
  });

  it('leaves room under the sheet so the bar never covers the last line', async () => {
    expect(await render()).toMatch(/<main[^>]*\bpb-/);
  });

  it('ships no script beyond JSON-LD', async () => {
    for (const query of ['', '?envio=ok']) {
      const scripts = [...(await render(query)).matchAll(/<script\b([^>]*)>/g)].map(match => match[1] ?? '');
      for (const attributes of scripts) expect(attributes).toContain('application/ld+json');
    }
  });
});

describe('/curriculo download bar', () => {
  it('is fixed to the bottom, hidden in print, and opens the dialog with no JavaScript', async () => {
    const html = await render();
    const bar = html.match(/<div[^>]*data-download-bar[^>]*>/)?.[0] ?? '';
    const button = html.match(/<button[^>]*commandfor="cv-dialog"[^>]*>/)?.[0] ?? '';

    expect(bar).toMatch(/\bfixed\b/);
    expect(bar).toMatch(/\bbottom-0\b/);
    expect(bar).toMatch(/\bprint:hidden\b/);
    expect(button).toMatch(/command="show-modal"/);
    expect(button).toMatch(/type="button"/);
    expect(html.slice(html.indexOf('data-download-bar'), html.indexOf('<dialog'))).not.toContain('/go/curriculo');
  });
});

describe('/curriculo dialog', () => {
  it('holds the form, closed until the button is pressed', async () => {
    const html = await render();
    const dialog = dialogOf(html);

    expect(dialog).toMatch(/^<dialog[^>]*id="cv-dialog"/);
    expect(dialog).not.toMatch(/^<dialog[^>]*\sopen(?=[\s>])/);
    expect(dialog).toMatch(/aria-labelledby="cv-dialog-title"/);
    expect(dialog).toMatch(/<h2[^>]*id="cv-dialog-title"/);
    expect(html.indexOf('<form')).toBeGreaterThan(html.indexOf('<dialog'));
    expect(html.match(/<form[^>]*action="\/api\/cv"/g)).toHaveLength(1);
  });

  it('asks for an optional name, company and e-mail, in that order, posting to /api/cv', async () => {
    const dialog = dialogOf(await render());
    const form = dialog.match(/<form[^>]*action="\/api\/cv"[^>]*>/)?.[0] ?? '';

    expect(form).toMatch(/method="post"/);
    expect(dialog).toMatch(/<input[^>]*name="nome"[^>]*autocomplete="name"/);
    expect(dialog).toMatch(/<input[^>]*name="empresa"[^>]*autocomplete="organization"[^>]*maxlength="200"/);
    expect(dialog).toMatch(/<input[^>]*name="email"[^>]*type="email"/);
    expect(dialog).not.toMatch(/\brequired\b/);
    expect(dialog).not.toMatch(/\(opcional\)/i);
    expect(dialog.indexOf('name="nome"')).toBeLessThan(dialog.indexOf('name="empresa"'));
    expect(dialog.indexOf('name="empresa"')).toBeLessThan(dialog.indexOf('name="email"'));
    for (const id of ['cv-nome', 'cv-empresa', 'cv-email']) {
      expect(dialog).toMatch(new RegExp(`<label[^>]*for="${id}"`));
    }
  });

  it('says why it asks, that it is optional, and links the privacy policy', async () => {
    const dialog = dialogOf(await render());

    expect(dialog).toContain('só para eu saber quem está baixando');
    expect(dialog).toContain('Todos são opcionais');
    expect(dialog).toMatch(/href="\/privacidade#curriculo"/);
  });

  it('lets the visitor skip straight to the PDF through /go, so the download counts', async () => {
    const dialog = dialogOf(await render());
    const skip = dialog.match(/<a[^>]*href="\/go\/curriculo"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(skip).toContain(`href="${CV_GO_PATH}"`);
    expect(skip).toMatch(FILE);
    expect(skip).toMatch(/Pular/);
    expect(dialog).not.toContain('href="/curriculo-fernando-moreira.pdf"');
  });

  it('closes without JavaScript', async () => {
    const dialog = dialogOf(await render());

    expect(dialog).toMatch(/<form[^>]*method="dialog"[\s\S]*?Fechar/);
  });

  it('opens on its own, with the download, once the form was sent', async () => {
    const dialog = dialogOf(await render('?envio=ok'));

    expect(dialog).toMatch(/^<dialog[^>]*\sopen(?=[\s>])/);
    expect(dialog).toMatch(/role="status"/);
    expect(dialog).toMatch(/<a[^>]*href="\/go\/curriculo"[^>]*download=/);
    expect(dialog).not.toMatch(/<form[^>]*action=/);
  });

  it('opens on its own, keeping the form with an alert, when the e-mail is invalid', async () => {
    for (const envio of ['invalido', 'limite']) {
      const dialog = dialogOf(await render(`?envio=${envio}`));

      expect(dialog).toMatch(/^<dialog[^>]*\sopen(?=[\s>])/);
      expect(dialog).toMatch(/role="alert"/);
      expect(dialog).toMatch(/<form[^>]*action="\/api\/cv"/);
    }
  });
});
