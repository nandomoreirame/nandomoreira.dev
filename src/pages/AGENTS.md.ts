import type { APIRoute } from 'astro';
import { buildAgentsMd } from '../lib/aeo/agents-md';
import { requireSite } from '../lib/aeo/urls';
import { getProfile } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) =>
  new Response(buildAgentsMd({ site: requireSite(site), profile: await getProfile() }), {
    status: 200,
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
