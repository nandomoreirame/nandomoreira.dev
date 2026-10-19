import { describe, expect, it } from 'vitest';
import { CV_GO_PATH, caseGoPath, contactGoPath, handleOutbound, outboundTable } from '../../src/lib/analytics/outbound';
import { CV_PDF_PATH } from '../../src/lib/cv/paths';
import type { Hit } from '../../src/lib/analytics/recorder';

const table = outboundTable({
  contacts: [
    { kind: 'email', value: 'me@example.com' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
  ],
  projects: [
    { slug: 'forja', block: 'ai-tooling', repoUrl: 'https://github.com/x/forja', liveUrl: null },
  ] as never,
});

const go = async (path: string, method = 'GET') => {
  const hits: Hit[] = [];
  const response = await handleOutbound(new Request(`https://nandomoreira.dev${path}`, { method }), {
    table: async () => table,
    recorder: { record: async (_request: Request, hit: Hit) => void hits.push(hit) },
  });
  return { response, hits };
};

describe('outbound', () => {
  it('builds paths for contacts and case links', () => {
    expect(contactGoPath('github')).toBe('/go/contato/github');
    expect(caseGoPath('lab', 'forja', 'repo')).toBe('/go/lab/forja/repo');
  });

  it('redirects a known contact and records the click', async () => {
    const { response, hits } = await go('/go/contato/github');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://github.com/nandomoreirame');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(hits[0]?.conversion).toEqual({ type: 'outbound', target: 'contato/github' });
  });

  it('turns the e-mail into a mailto', async () => {
    expect((await go('/go/contato/email')).response.headers.get('location')).toBe('mailto:me@example.com');
  });

  it('redirects a case link', async () => {
    expect((await go('/go/lab/forja/repo')).response.headers.get('location')).toBe('https://github.com/x/forja');
  });

  it('answers 404 for anything outside the table, and never reads a destination from the request', async () => {
    for (const path of ['/go/lab/forja/live', '/go/contato/x', '/go/https://evil.example', '/go/contato/github?to=https://evil.example/x']) {
      const { response, hits } = await go(path);
      if (path.includes('?to=')) {
        expect(response.headers.get('location')).toBe('https://github.com/nandomoreirame');
      } else {
        expect(response.status).toBe(404);
        expect(hits).toEqual([]);
      }
    }
  });

  it('leaves out the links of a discontinued case, as the case page does', () => {
    const withGone = outboundTable({
      contacts: [],
      projects: [
        { slug: 'velho', block: 'ai-product', repoUrl: 'https://github.com/x/velho', liveUrl: 'https://velho.example', discontinued: true },
        { slug: 'vivo', block: 'ai-product', repoUrl: null, liveUrl: 'https://vivo.example' },
      ] as never,
    });

    expect([...withGone.keys()]).toEqual(['/go/portfolio/vivo/live']);
  });

  it('serves the CV through /go and records the download as a cv conversion', async () => {
    expect(CV_GO_PATH).toBe('/go/curriculo');
    const { response, hits } = await go(CV_GO_PATH);
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(CV_PDF_PATH);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ kind: 'conversion', path: CV_GO_PATH, conversion: { type: 'cv', target: 'curriculo' } });
  });

  it('keeps the CV out of the profile-built table', () => {
    expect([...table.keys()]).not.toContain(CV_GO_PATH);
  });

  it('does not record a HEAD', async () => {
    const { response, hits } = await go('/go/contato/github', 'HEAD');
    expect(response.status).toBe(302);
    expect(hits).toEqual([]);
  });
});
