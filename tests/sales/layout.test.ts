import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesLayout from '../../src/layouts/SalesLayout.astro';
import { serviceLd } from '../../src/lib/sales/service-ld';

type RenderProps = {
  title?: string;
  description?: string;
  slug?: string;
  serviceName?: string;
};

const render = async (props: RenderProps = {}) => {
  const {
    title = 'Serviços | Fernando Moreira',
    description = 'Sites e sistemas.',
    slug,
    serviceName,
  } = props;
  const path = slug ? `/servicos/${slug}` : '/servicos';
  const container = await AstroContainer.create();
  return container.renderToString(SalesLayout, {
    props: { title, description, ...(slug !== undefined ? { slug } : {}), ...(serviceName !== undefined ? { serviceName } : {}) },
    slots: { default: '<h1>Teste</h1>' },
    request: new Request(`https://nandomoreira.dev${path}`),
  });
};

const serviceFromHtml = (html: string) => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1]!) as Record<string, unknown>,
  );
  const service = blocks.find((block) => block['@type'] === 'Service');
  expect(service).toBeDefined();
  return service!;
};

describe('serviceLd', () => {
  it('describes a Service provided by the person', () => {
    const ld = serviceLd({ name: 'Site institucional', description: 'd', url: 'https://x/servicos' });
    expect(ld['@type']).toBe('Service');
    expect(ld.provider).toMatchObject({ '@type': 'Person', name: 'Fernando Moreira' });
    expect(ld.areaServed).toMatchObject({ name: 'Brasil' });
  });
});

describe('SalesLayout', () => {
  it('points the canonical at the main host while the subdomain is off', async () => {
    expect(await render({ slug: 'site-institucional' })).toContain(
      '<link rel="canonical" href="https://nandomoreira.dev/servicos/site-institucional"',
    );
  });

  it('points the landing canonical and og:image without a slug', async () => {
    const html = await render();
    expect(html).toContain('<link rel="canonical" href="https://nandomoreira.dev/servicos"');
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
    const links = headerAndFooter
      .flatMap((chunk) => [...chunk.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]!));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toContain('min-h-11');
    }
  });

  it('does not reuse the main site frame or its script', async () => {
    const html = await render({ slug: 'site-institucional' });
    expect(html).not.toContain('data-pointer-field');
    expect(html).not.toMatch(/<script(?![^>]*application\/ld\+json)/);
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
    expect(service.url).toBe('https://nandomoreira.dev/servicos/site-institucional');
    expect(service.description).toBe(description);
  });

  it('uses the title as Service name without serviceName', async () => {
    const title = 'Serviços | Fernando Moreira';
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
