import type { APIRoute } from 'astro';
import { getAllProjects, getArchivedPosts, getCurrentPosts } from '../lib/content';
import { SALES_SERVICES } from '../lib/sales/catalog';
import { salesUrl } from '../lib/sales/host';
import { buildSearchIndex } from '../lib/search/build-index';

/** The command palette index (docs/specs/command-palette, D3): fetched on first open. */
export const prerender = true;

export const GET: APIRoute = async () => {
  const [current, archived, projects] = await Promise.all([getCurrentPosts(), getArchivedPosts(), getAllProjects()]);
  const index = buildSearchIndex({
    current,
    archived,
    projects,
    services: SALES_SERVICES.map((service) => ({ title: service.title, summary: service.summary, url: salesUrl(service.slug) })),
    landingUrl: salesUrl(),
  });
  return new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
