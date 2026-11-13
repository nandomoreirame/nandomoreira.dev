import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
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

  it('renders the English resume chrome', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    // The sheet body stays Portuguese (same content as the PDF); this task owns
    // the download bar and the dialog. The English download label names the
    // language of the file so it does not promise an English PDF.
    const bar = html.slice(html.indexOf('data-download-bar'), html.indexOf('<dialog'));
    const dialog = html.match(/<dialog[\s\S]*?<\/dialog>/)?.[0] ?? '';
    expect(ptLeftovers(bar + dialog)).toEqual([]);
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
