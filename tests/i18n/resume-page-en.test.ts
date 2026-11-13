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
    // The download attribute stamps the minute of the visit; keep the snapshot stable.
    const html = (await render('pt-BR'))
      .replaceAll(process.cwd(), '<root>')
      .replace(
        /download="curriculo-fernando-moreira-senior-ai-engineer-\d{12}\.pdf"/g,
        'download="curriculo-fernando-moreira-senior-ai-engineer-<stamp>.pdf"',
      );
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

  it('renders the English resume body, with only the PDF labeled Portuguese', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    // The sheet itself is localized; the download still points at the
    // Portuguese PDF, and the CTA says so (no English PDF exists).
    expect(ptLeftovers(html)).toEqual([]);
    expect(html).toMatch(/Software engineer with \d{2} years of career/);
    expect(html).not.toContain('Engenheiro de software');
    expect(html).not.toContain('Atuei');
    expect(html).toContain('Download résumé (Portuguese, PDF)');
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
