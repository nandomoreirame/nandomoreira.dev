import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '../lib/aeo/robots';
import { requireSite } from '../lib/aeo/urls';

export const prerender = false;

export const GET: APIRoute = ({ site }) =>
  new Response(buildRobotsTxt({ site: requireSite(site) }), {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
