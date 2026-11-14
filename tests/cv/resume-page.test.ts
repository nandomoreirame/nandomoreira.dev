import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ResumePage from '../../src/pages/curriculo.astro';
import SobrePage from '../../src/pages/sobre.astro';
import { CV_GO_PATH } from '../../src/lib/analytics/outbound';
import { CV_PAGE, CV_PDF_PATH, CV_PDF_PATH_EN } from '../../src/lib/cv/download';

const render = async (query = '') => {
  const container = await AstroContainer.create();
  return container.renderToString(ResumePage, { request: new Request(`https://nandomoreira.dev/curriculo${query}`) });
};

const dialogOf = (html: string) => html.match(/<dialog[\s\S]*?<\/dialog>/)?.[0] ?? '';
const FILE = /download="CV-senior-fullstack-software-engineer-Fernando-Moreira-20261110\.pdf"/;

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
    expect(html).toMatch(/Senior Fullstack Software Engineer com mais de \d{2} anos de experiência/);
  });

  it('shows every bullet of the PDF, the long ones included', async () => {
    const html = await render();

    expect(html.match(/<li>/g)?.length).toBeGreaterThanOrEqual(30);
    expect(html).toContain('Desenvolvi de ponta a ponta o Play Manager');
    expect(html).toContain('Respondi pela arquitetura das soluções e pelo desenho técnico das entregas');
  });

  it('is the address the form and the /sobre button use', async () => {
    const container = await AstroContainer.create();
    const sobre = await container.renderToString(SobrePage);
    const link = sobre.match(/<a[^>]*href="\/curriculo"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(CV_PAGE).toBe('/curriculo');
    expect(link).not.toMatch(/\bdownload\b/);
    // A plain "Currículo" with a document icon: the button opens the page, it does not download.
    expect(link.replace(/<[^>]+>/g, '').trim()).toBe('Currículo');
    expect(link).toContain('data-icon="lucide:file-text"');
    expect(link).not.toContain('lucide:file-down');
  });

  it('is the only address, with no /cv alias left behind', () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).not.toContain("'/cv'");
    expect(existsSync('src/pages/cv.astro')).toBe(false);
  });

  it('serves the PDF it links to', () => {
    expect(CV_PDF_PATH).toBe('/CV-senior-fullstack-software-engineer-Fernando-Moreira-20261110.pdf');
    expect(existsSync(`public${CV_PDF_PATH}`)).toBe(true);
  });

  it('serves the English PDF under its career-folder name', () => {
    expect(CV_PDF_PATH_EN).toBe('/CV-senior-fullstack-software-engineer-en-Fernando-Moreira-20261114.pdf');
    expect(existsSync(`public${CV_PDF_PATH_EN}`)).toBe(true);
  });

  it('keeps only the full-stack CV: the old files are gone and their address redirects', () => {
    for (const old of ['curriculo-fernando-moreira.pdf', 'resume-fernando-moreira.pdf'])
      expect(existsSync(`public/${old}`)).toBe(false);
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain(
      "'/curriculo-fernando-moreira.pdf': '/CV-senior-fullstack-software-engineer-Fernando-Moreira-20261110.pdf'",
    );
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
    expect(dialog).not.toContain('href="/CV-senior-fullstack-software-engineer-Fernando-Moreira-20261110.pdf"');
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

describe('/curriculo matches the PDF', () => {
  it('names the skills section as the PDF does and prints each job key technologies', async () => {
    const html = await render();
    expect(html).toContain('>Competências</h2>');
    expect(html).toContain('>Experiência anterior (2010 - 2020)</h2>');
    expect(html).toMatch(/<span class="font-semibold">Tecnologias-chave:<\/span> TypeScript, React 19, Hono, Firebase/);
  });
});

describe('/curriculo layout', () => {
  it('centres the sheet in a 64rem (1024px) container (max-w-container-* resolves to nothing in Tailwind 4)', async () => {
    const html = await render();
    expect(html).toMatch(/<main[^>]*class="[^"]*\bmx-auto\b[^"]*\bmax-w-sheet\b/);
    expect(readFileSync('src/styles/global.css', 'utf8')).toContain('--container-sheet: 64rem;');
    expect(html).not.toContain('max-w-container-');
  });

  it('offers the English version of the resume by name, hidden when printing', async () => {
    const html = await render();
    const link = html.match(/<a[^>]*data-language-switch[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(link).toContain('href="/en/resume"');
    expect(link).toContain('hreflang="en"');
    expect(link.replace(/<[^>]+>/g, '').trim()).toBe('Versão em inglês');
    expect(html).toMatch(/<div[^>]*data-resume-language[^>]*class="[^"]*\bprint:hidden\b/);
  });

  it('leads back to the site from the top left, in the same type as the language link', async () => {
    const html = await render();
    const bar = html.match(/<div[^>]*data-resume-language[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
    const back = bar.match(/<a[^>]*data-resume-back[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(back).toContain('href="/"');
    expect(back.replace(/<[^>]+>/g, '').trim()).toMatch(/^←\s*Voltar ao site$/);
    expect(back).toMatch(/<span aria-hidden="true">←<\/span>/);
    expect(bar.indexOf('data-resume-back')).toBeLessThan(bar.indexOf('data-language-switch'));
    expect(back).toContain('font-mono text-micro uppercase tracking-wide');
  });

  it('lines the download bar up with the sheet', async () => {
    const html = await render();
    const bar = html.match(/<div[^>]*data-download-bar[^>]*>\s*<div class="([^"]*)"/)?.[1] ?? '';
    const main = html.match(/<main[^>]*class="([^"]*)"/)?.[1] ?? '';
    for (const token of ['mx-auto', 'max-w-sheet', 'px-sm', 'sm:px-lg']) {
      expect(bar.split(' ')).toContain(token);
      expect(main.split(' ')).toContain(token);
    }
  });
});
