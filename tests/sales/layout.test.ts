import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesLayout from '../../src/layouts/SalesLayout.astro';
import { serviceLd } from '../../src/lib/sales/service-ld';
import { THEME_BOOT_MARKER, THEME_BOOT_SCRIPT } from '../../src/lib/theme/boot';

type RenderProps = {
  title?: string;
  description?: string;
  slug?: string;
  serviceName?: string;
};

const render = async (props: RenderProps = {}) => {
  const { title = 'Serviços // Fernando Moreira', description = 'Sites e sistemas.', slug, serviceName } = props;
  const path = slug ? `/servicos/${slug}` : '/servicos';
  const container = await AstroContainer.create();
  return container.renderToString(SalesLayout, {
    props: {
      title,
      description,
      ...(slug !== undefined ? { slug } : {}),
      ...(serviceName !== undefined ? { serviceName } : {}),
    },
    slots: { default: '<h1>Teste</h1>' },
    request: new Request(`https://nandomoreira.dev${path}`),
  });
};

const serviceFromHtml = (html: string) => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    match => JSON.parse(match[1]!) as Record<string, unknown>,
  );
  const service = blocks.find(block => block['@type'] === 'Service');
  expect(service).toBeDefined();
  return service!;
};

describe('SalesLayout header call', () => {
  it('sends "Orçamento" to the one contact form on the main site', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="https:\/\/nandomoreira\.dev\/contato\?origem=landing"[^>]*>\s*Orçamento\s*</);
    expect(html).not.toContain('href="#contato"');
  });

  it('shrinks only the height of the header call on scroll, never its width', async () => {
    const html = await render();
    const call = html.match(/<a[^>]*href="https:\/\/nandomoreira\.dev\/contato\?origem=landing"[^>]*>/)?.[0] ?? '';
    expect(call).toMatch(/group-data-scrolled:min-h-9/);
    expect(call).not.toMatch(/group-data-scrolled:px-/);
    expect(call).not.toMatch(/transition-\[[^\]]*padding/);
  });
});

describe('serviceLd', () => {
  it('describes a Service provided by the person', () => {
    const ld = serviceLd({ name: 'Site institucional', description: 'd', url: 'https://x/servicos' });
    expect(ld['@type']).toBe('Service');
    expect(ld.provider).toMatchObject({ '@type': 'Person', name: 'Fernando Moreira' });
    expect(ld.areaServed).toMatchObject({ name: 'Brasil' });
  });
});

describe('SalesLayout', () => {
  it('runs the theme boot inside <head>, before the title (theme-modes, REQ-003)', async () => {
    const html = await render();
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain(THEME_BOOT_SCRIPT);
    expect(head.indexOf(THEME_BOOT_MARKER)).toBeLessThan(head.indexOf('<title>'));
  });

  it('declares both colour schemes, so form controls and scrollbars follow the theme', async () => {
    expect(await render()).toContain('<meta name="color-scheme" content="dark light">');
  });

  it('points the canonical at the live subdomain', async () => {
    expect(await render({ slug: 'site-institucional' })).toContain(
      '<link rel="canonical" href="https://contrate.nandomoreira.dev/site-institucional"',
    );
  });

  it('points the landing canonical and og:image without a slug', async () => {
    const html = await render();
    expect(html).toContain('<link rel="canonical" href="https://contrate.nandomoreira.dev/"');
    expect(html).toContain('property="og:image" content="https://nandomoreira.dev/og/servicos.png"');
  });

  it('has a skip link, lang, nav label, touch targets, main landmark, header and footer', async () => {
    const html = await render({ slug: 'site-institucional' });
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('href="#main"');
    expect(html).toContain('Pular para o conteúdo');
    expect(html).toMatch(/<main[^>]*id="main"/);
    expect(html).toContain('<header');
    expect(html).toContain('<footer');
    expect(html).toContain('aria-label="Seções"');

    const headerAndFooter = html.match(/<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>/g) ?? [];
    expect(headerAndFooter.length).toBeGreaterThanOrEqual(2);
    const links = headerAndFooter.flatMap(chunk => [...chunk.matchAll(/<a\b[^>]*>/g)].map(match => match[0]!));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toContain('min-h-11');
    }
  });

  it('pins the header and shrinks it once the page scrolls', async () => {
    const header = (await render()).match(/<header[^>]*>/)?.[0] ?? '';
    expect(header).toContain('data-site-header');
    expect(header).toContain('sticky');
    expect(header).toContain('top-0');
    expect(header).toContain('data-scrolled:backdrop-blur-lg');
    expect(await render()).toMatch(/group-data-scrolled:py-xs/);
    expect(await render()).toMatch(/group-data-scrolled:min-h-9/);
  });

  it('reuses only the pointer field of the main site, not its header or footer', async () => {
    const html = await render();
    expect(html).toMatch(/<body[^>]*data-pointer-field/);
    // The main site menu links the blog; the sales frame never does.
    expect(html).not.toContain('href="/posts"');
  });

  it('serialises the Service JSON-LD with the serviceName', async () => {
    const description = 'Sites e sistemas.';
    const html = await render({
      slug: 'site-institucional',
      serviceName: 'Site institucional',
      description,
    });
    const service = serviceFromHtml(html);
    expect(service.name).toBe('Site institucional');
    expect(service.url).toBe('https://contrate.nandomoreira.dev/site-institucional');
    expect(service.description).toBe(description);
  });

  it('uses the title as Service name without serviceName', async () => {
    const title = 'Serviços // Fernando Moreira';
    const html = await render({ slug: 'site-institucional', title });
    const service = serviceFromHtml(html);
    expect(service.name).toBe(title);
  });

  it('links the privacy policy on the main domain and shows no fake legal links', async () => {
    const html = await render({ slug: 'site-institucional' });
    expect(html).toContain('https://nandomoreira.dev/privacidade');
    expect(html).not.toContain('Termos de Serviço');
  });

  it('offers a share card', async () => {
    expect(await render({ slug: 'site-institucional' })).toContain(
      'property="og:image" content="https://nandomoreira.dev/og/servicos/site-institucional.png"',
    );
  });
});
