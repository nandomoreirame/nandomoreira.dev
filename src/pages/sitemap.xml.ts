import type { APIRoute } from 'astro';
import { buildSitemap } from '../lib/aeo/sitemap';
import { requireSite } from '../lib/aeo/urls';
import { getAllProjects } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) =>
  new Response(buildSitemap({ site: requireSite(site), projects: await getAllProjects() }), {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
