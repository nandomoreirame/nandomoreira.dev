import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import ResumePage from '../../src/components/pages/ResumePage.astro';
import { handleCvDownload, resumeOriginOf } from '../../src/lib/cv/download';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string, query = '') =>
  (await AstroContainer.create()).renderToString(ResumePage, {
    props: { locale },
    request: new Request(
      locale === 'en' ? `https://nandomoreira.dev/en/resume${query}` : `https://nandomoreira.dev/curriculo${query}`,
    ),
  });

describe('ResumePage', () => {
  it('keeps the pt-BR resume page byte for byte', async () => {
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/resume.pt.html');
  });

  it('emits reciprocal hreflang and og:locale on both resume heads (REQ-011/012)', async () => {
    const [pt, en] = await Promise.all([render('pt-BR'), render('en')]);
    for (const html of [pt, en]) {
      expect(html).toContain('rel="alternate" hreflang="pt-BR" href="https://nandomoreira.dev/curriculo"');
      expect(html).toContain('rel="alternate" hreflang="en" href="https://nandomoreira.dev/en/resume"');
      expect(html).toContain('rel="alternate" hreflang="x-default" href="https://nandomoreira.dev/curriculo"');
    }
    expect(pt).toContain('property="og:locale" content="pt_BR"');
    expect(pt).toContain('property="og:locale:alternate" content="en_US"');
    expect(en).toContain('property="og:locale" content="en_US"');
    expect(en).toContain('property="og:locale:alternate" content="pt_BR"');
  });

  it('announces no English pair while English is unpublished (REQ-005, D8)', async () => {
    vi.resetModules();
    vi.doMock('../../src/lib/i18n/live', async importOriginal => ({
      ...(await importOriginal<typeof import('../../src/lib/i18n/live')>()),
      EN_PUBLISHED: false,
    }));
    try {
      const { default: OffResumePage } = await import('../../src/components/pages/ResumePage.astro');
      const html = await (
        await AstroContainer.create()
      ).renderToString(OffResumePage, {
        props: { locale: 'pt-BR' },
        request: new Request('https://nandomoreira.dev/curriculo'),
      });
      expect(html).not.toContain('hreflang=');
      expect(html).not.toContain('og:locale:alternate');
      expect(html).toContain('property="og:locale" content="pt_BR"');
    } finally {
      vi.doUnmock('../../src/lib/i18n/live');
      vi.resetModules();
    }
  });

  it('renders the English resume body and offers the English PDF', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(ptLeftovers(html)).toEqual([]);
    expect(html).toMatch(/Senior Fullstack Software Engineer with \d{2}\+ years of experience/);
    expect(html).not.toContain('Engenheiro de software');
    expect(html).not.toContain('Atuei');
    expect(html).toContain('Download résumé (PDF)');
    expect(html).not.toContain('Portuguese, PDF');
  });

  it('posts the English form with its own origin and shows outcomes in English', async () => {
    const html = await render('en', '?envio=invalido');
    expect(html).toContain('action="/api/cv?origem=resume-en"');
    expect(html).toMatch(/role="alert"/);
    const dialog = html.match(/<dialog[\s\S]*?<\/dialog>/)?.[0] ?? '';
    expect(ptLeftovers(dialog)).toEqual([]);
  });
});

describe('CV form return path', () => {
  it('goes back to the English resume page only for the English form', () => {
    expect(resumeOriginOf(new URL('https://nandomoreira.dev/api/cv?origem=resume-en'))).toBe('/en/resume');
    expect(resumeOriginOf(new URL('https://nandomoreira.dev/api/cv'))).toBe('/curriculo');
  });

  it('never redirects to an arbitrary origin', () => {
    expect(resumeOriginOf(new URL('https://nandomoreira.dev/api/cv?origem=https://evil.example'))).toBe('/curriculo');
    expect(resumeOriginOf(new URL('https://nandomoreira.dev/api/cv?origem=/en/resume'))).toBe('/curriculo');
  });

  it('ignores inherited Object keys as origem', () => {
    for (const key of ['__proto__', 'constructor', 'toString']) {
      expect(resumeOriginOf(new URL(`https://nandomoreira.dev/api/cv?origem=${key}`))).toBe('/curriculo');
    }
  });

  it('redirects the English form outcome to /en/resume', async () => {
    const response = await handleCvDownload(
      new Request('https://nandomoreira.dev/api/cv?origem=resume-en', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: 'not-an-email' }).toString(),
      }),
      {
        store: { save: async () => 'x', markNotified: async () => undefined },
        notifier: { send: async () => undefined },
        limiter: { check: () => true, size: () => 0 },
        now: () => new Date('2026-10-11T12:00:00.000Z'),
      },
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/en/resume?envio=invalido#email');
  });
});

describe('English resume download', () => {
  it('points the download at the English full-stack PDF, saved under its career-folder name', async () => {
    const html = await render('en', '?envio=ok');
    expect(html).toContain('href="/go/curriculo?locale=en"');
    expect(html).toContain('download="CV-senior-fullstack-software-engineer-en-Fernando-Moreira-20261114.pdf"');
    expect(html).not.toContain('profile=');
  });
});

describe('/en/resume matches the English PDF', () => {
  it('names the sections as the PDF does and prints each job key technologies', async () => {
    const html = await render('en');
    expect(html).toContain('>Skills</h2>');
    expect(html).toContain('>Earlier experience (2010 - 2020)</h2>');
    expect(html).toMatch(/<span class="font-semibold">Key technologies:<\/span> TypeScript, React 19, Hono, Firebase/);
  });
});

describe('/en/resume language switch', () => {
  it('links to the Portuguese resume by name and back to the English site', async () => {
    const html = await render('en');
    const link = html.match(/<a[^>]*data-language-switch[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(link).toContain('href="/curriculo"');
    expect(link).toContain('hreflang="pt-BR"');
    expect(link.replace(/<[^>]+>/g, '').trim()).toBe('Portuguese version');
    const back = html.match(/<a[^>]*data-resume-back[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(back).toContain('href="/en"');
    expect(back.replace(/<[^>]+>/g, '').trim()).toMatch(/^←\s*Back to site$/);
  });
});
