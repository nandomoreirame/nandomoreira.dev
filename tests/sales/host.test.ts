import { describe, expect, it } from 'vitest';
import { SALES_DEV_HOST, SALES_HOST, SALES_HOST_LIVE, salesPath, salesRouting, salesUrl } from '../../src/lib/sales/host';

const at = (url: string) => new URL(url);

describe('sales host constants', () => {
  it('names the chosen subdomain', () => {
    expect(SALES_HOST).toBe('contrate.nandomoreira.dev');
  });

  it('ships switched off until the domain answers', () => {
    expect(SALES_HOST_LIVE).toBe(false);
  });
});

describe('salesPath and salesUrl', () => {
  it('lives under /servicos on the main host while the flag is off', () => {
    expect(salesPath(undefined, false)).toBe('/servicos');
    expect(salesPath('site-institucional', false)).toBe('/servicos/site-institucional');
    expect(salesUrl(undefined, false)).toBe('https://nandomoreira.dev/servicos');
  });

  it('moves to the subdomain root once live', () => {
    expect(salesPath(undefined, true)).toBe('/');
    expect(salesPath('site-institucional', true)).toBe('/site-institucional');
    expect(salesUrl('site-institucional', true)).toBe('https://contrate.nandomoreira.dev/site-institucional');
  });
});

describe('salesRouting', () => {
  it('does nothing while the flag is off, whatever the host', () => {
    expect(salesRouting(at('https://contrate.nandomoreira.dev/'), false)).toBeUndefined();
    expect(salesRouting(at('https://nandomoreira.dev/servicos'), false)).toBeUndefined();
  });

  it('rewrites the subdomain root and slugs onto /servicos', () => {
    expect(salesRouting(at('https://contrate.nandomoreira.dev/'), true)).toEqual({ rewrite: '/servicos' });
    expect(salesRouting(at('https://contrate.nandomoreira.dev/site-institucional'), true)).toEqual({
      rewrite: '/servicos/site-institucional',
    });
  });

  it('lets the API, /go, the pixel and assets through on the subdomain', () => {
    for (const path of [
      '/api/hire',
      '/go/contato/whatsapp',
      '/v.gif',
      '/servicos',
      '/servicos/projetos/mousai.webp',
      '/_astro/x.css',
      '/go',
      '/api',
    ]) {
      expect(salesRouting(at(`https://contrate.nandomoreira.dev${path}`), true), path).toBeUndefined();
    }
  });

  it('sends the old main-host address to the subdomain with a 301', () => {
    expect(salesRouting(at('https://nandomoreira.dev/servicos'), true)).toEqual({
      redirect: 'https://contrate.nandomoreira.dev/',
    });
    expect(salesRouting(at('https://nandomoreira.dev/servicos/site-institucional?envio=ok'), true)).toEqual({
      redirect: 'https://contrate.nandomoreira.dev/site-institucional?envio=ok',
    });
    expect(salesRouting(at('https://www.nandomoreira.dev/servicos'), true)).toEqual({
      redirect: 'https://contrate.nandomoreira.dev/',
    });
  });

  it('keeps the screenshots on the main host reachable', () => {
    expect(salesRouting(at('https://nandomoreira.dev/servicos/projetos/mousai.webp'), true)).toBeUndefined();
  });

  it('never touches other main-host pages', () => {
    expect(salesRouting(at('https://nandomoreira.dev/contato'), true)).toBeUndefined();
    expect(salesRouting(at('https://nandomoreira.dev/servicosx'), true)).toBeUndefined();
  });

  it('scopes the redirect to the main host only (REQ-004)', () => {
    expect(salesRouting(at('http://localhost:4321/servicos'), true)).toBeUndefined();
    expect(
      salesRouting(at('https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app/servicos'), true),
    ).toBeUndefined();
  });
});

describe('local sales host', () => {
  it('is a .local name that never resolves outside this machine', () => {
    expect(SALES_DEV_HOST).toBe('contrate.nandomoreira.local');
  });

  it('rewrites like the real subdomain even with the flag off', () => {
    expect(salesRouting(at('http://contrate.nandomoreira.local:4321/'), false)).toEqual({ rewrite: '/servicos' });
    expect(salesRouting(at('http://contrate.nandomoreira.local:4321/site-institucional'), false)).toEqual({
      rewrite: '/servicos/site-institucional',
    });
  });

  it('lets the API, /go, assets and /servicos through on the local host', () => {
    for (const path of ['/api/hire', '/go/contato/whatsapp', '/v.gif', '/servicos', '/servicos/site-institucional', '/_astro/x.css']) {
      expect(salesRouting(at(`http://contrate.nandomoreira.local:4321${path}`), false), path).toBeUndefined();
    }
  });

  it('never redirects the local host to production', () => {
    expect(salesRouting(at('http://contrate.nandomoreira.local:4321/servicos'), true)).toBeUndefined();
  });
});
