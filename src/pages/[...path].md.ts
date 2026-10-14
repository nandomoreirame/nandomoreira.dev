import type { APIRoute } from 'astro';
import { markdownForPath } from '../lib/ai-view/registry';
import { canonicalUrl, requireSite } from '../lib/aeo/urls';

export const prerender = false;

export const GET: APIRoute = async ({ params, site }) => {
  const root = requireSite(site);
  const page = await markdownForPath(root, params.path ?? '');

  if (!page) {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(page.markdown, {
    status: 200,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      // The markdown mirrors a human page; search engines should rank that one.
      link: `<${canonicalUrl(root, page.humanPath)}>; rel="canonical"`,
    },
  });
};
