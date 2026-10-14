import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LinkList from '../../src/components/catalog/LinkList.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(LinkList, { props });
};

describe('LinkList', () => {
  it('renders nothing at all when the project has no visible link', async () => {
    const html = await render({ repoUrl: null, liveUrl: null });
    expect(html).not.toContain('<a');
  });

  it('renders only the live link for a private repository', async () => {
    const html = await render({ repoUrl: null, liveUrl: 'https://y.app' });

    expect(html).toContain('https://y.app');
    expect(html).not.toContain('github.com');
  });

  it('marks external links as such for screen readers and browsers', async () => {
    const html = await render({ repoUrl: 'https://github.com/x/y', liveUrl: null });

    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('keeps the referrer on links through /go, so the click is tied to the case page', async () => {
    const html = await render({ repoUrl: 'https://github.com/x/y', liveUrl: null, goBase: '/go/lab/y' });

    expect(html).toContain('href="/go/lab/y/repo"');
    expect(html).toContain('rel="noopener"');
    expect(html).not.toContain('noreferrer');
  });

  it('uses meaningful link text', async () => {
    const html = await render({ repoUrl: 'https://github.com/x/y', liveUrl: null });

    expect(html).toContain('Código fonte');
    expect(html).not.toContain('clique aqui');
  });
});
