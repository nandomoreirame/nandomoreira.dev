import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const render = async (props: {
  title?: string;
  description?: string;
  markdownAlternate?: string;
  canonicalPath?: string;
  pageType?: string;
  pageItems?: string[];
} = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: {
      title: props.title ?? 'Título',
      description: props.description ?? 'Descrição da página',
      markdownAlternate: props.markdownAlternate,
      canonicalPath: props.canonicalPath,
      pageType: props.pageType,
      pageItems: props.pageItems,
    },
    slots: { default: '<p>conteúdo</p>' },
  });
};

describe('BaseLayout head discovery tags', () => {
  it('declares Twitter Card metadata mirroring the Open Graph title and description', async () => {
    const html = await render({
      title: 'Case title',
      description: 'Case summary',
    });

    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:title" content="Case title">');
    expect(html).toContain('<meta name="twitter:description" content="Case summary">');
  });

  it('advertises the machine discovery alternates', async () => {
    const html = await render();

    expect(html).toContain(
      '<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM summary">',
    );
    expect(html).toContain(
      '<link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM full content">',
    );
    expect(html).toContain(
      '<link rel="alternate" type="application/json" href="/ai-index.json" title="AI index">',
    );
  });

  it('renders a markdown alternate only when the page opts in', async () => {
    const without = await render();
    expect(without).not.toContain('type="text/markdown"');

    const withMd = await render({ markdownAlternate: '/lab/forja.md' });
    expect(withMd).toContain(
      '<link rel="alternate" type="text/markdown" href="/lab/forja.md">',
    );
  });
});

describe('BaseLayout canonical', () => {
  it('declares the canonical and og:url without a trailing slash', async () => {
    const html = await render({ canonicalPath: '/portfolio/abracce/' });

    expect(html).toContain('<link rel="canonical" href="https://nandomoreira.dev/portfolio/abracce">');
    expect(html).toContain('<meta property="og:url" content="https://nandomoreira.dev/portfolio/abracce">');
  });
});

describe('BaseLayout description', () => {
  it('keeps the meta description within 160 characters, cut at a sentence', async () => {
    const first =
      'Uma frase inteira que cabe sozinha e diz o que a página tem para quem chega pela busca, longa o bastante para não sobrar espaço depois.';
    const html = await render({ description: `${first} ${'Mais texto que não cabe. '.repeat(6)}` });

    expect(html).toContain(`<meta name="description" content="${first}">`);
  });
});

describe('BaseLayout Open Graph image', () => {
  it('points og:image and twitter:image at the generated card of the page', async () => {
    const html = await render({ canonicalPath: '/portfolio/abracce' });

    expect(html).toContain('<meta property="og:image" content="https://nandomoreira.dev/og/portfolio/abracce.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(html).toContain('<meta name="twitter:image" content="https://nandomoreira.dev/og/portfolio/abracce.png">');
  });
});

describe('BaseLayout page type', () => {
  it('passes the page type and the listed items to the WebPage JSON-LD', async () => {
    const html = await render({ canonicalPath: '/lab', pageType: 'CollectionPage', pageItems: ['/lab/forja'] });

    expect(html).toContain('"@type":"CollectionPage"');
    expect(html).toContain('"url":"https://nandomoreira.dev/lab/forja"');
  });
});

describe('BaseLayout feed discovery', () => {
  it('announces the RSS feed', async () => {
    expect(await render()).toContain('<link rel="alternate" type="application/rss+xml" href="/rss.xml"');
  });
});
