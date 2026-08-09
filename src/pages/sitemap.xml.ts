import type { APIRoute } from 'astro';
import { buildSitemap } from '../lib/aeo/sitemap';
import { requireSite } from '../lib/aeo/urls';
import { getAllNotes, getAllProjects } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [projects, notes] = await Promise.all([getAllProjects(), getAllNotes()]);

  return new Response(buildSitemap({ site: requireSite(site), projects, notes }), {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
