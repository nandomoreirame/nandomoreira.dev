import type { APIRoute } from 'astro';
import { buildCaseMarkdown } from '../../lib/aeo/case-markdown';
import { canonicalUrl, requireSite } from '../../lib/aeo/urls';
import { collectionOfBlock } from '../../lib/catalog/groups';
import { getProject } from '../../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ params, site }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const project = await getProject(slug);
  if (!project || collectionOfBlock(project.block) !== 'lab') {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const root = requireSite(site);
  return new Response(buildCaseMarkdown({ site: root, project }), {
    status: 200,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      link: `<${canonicalUrl(root, `/lab/${project.slug}`)}>; rel="canonical"`,
    },
  });
};
