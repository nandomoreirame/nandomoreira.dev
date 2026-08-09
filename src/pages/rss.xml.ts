import type { APIRoute } from 'astro';
import { requireSite } from '../lib/aeo/urls';
import { getAllPosts } from '../lib/content';
import { buildRss } from '../lib/notes/rss';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const notes = await getAllPosts();

  const body = buildRss({
    site: requireSite(site),
    notes,
    title: 'Notas — nandomoreira.dev',
    description: 'Notas curtas sobre engenharia, tooling e agentes.',
  });

  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
