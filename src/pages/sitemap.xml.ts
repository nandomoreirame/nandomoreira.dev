import type { APIRoute } from 'astro';
import { buildSitemap } from '../lib/aeo/sitemap';
import { requireSite } from '../lib/aeo/urls';
import { getAllPosts, getAllProjects } from '../lib/content';
import { SETUP_UPDATED_AT } from '../lib/setup/setup';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [projects, posts] = await Promise.all([getAllProjects(), getAllPosts()]);

  return new Response(buildSitemap({ site: requireSite(site), projects, posts, setupUpdatedAt: SETUP_UPDATED_AT }), {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
