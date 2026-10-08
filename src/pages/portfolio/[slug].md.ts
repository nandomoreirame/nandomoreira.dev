import type { APIRoute } from 'astro';
import { buildCaseMarkdown } from '../../lib/aeo/case-markdown';
import { requireSite } from '../../lib/aeo/urls';
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
  if (!project || collectionOfBlock(project.block) !== 'portfolio') {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(buildCaseMarkdown({ site: requireSite(site), project }), {
    status: 200,
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
};
