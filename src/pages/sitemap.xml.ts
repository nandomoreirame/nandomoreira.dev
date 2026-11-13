import type { APIRoute } from 'astro';
import { buildSitemap } from '../lib/aeo/sitemap';
import { requireSite } from '../lib/aeo/urls';
import { getAllPosts, getAllProjects, translationPairs } from '../lib/content';
import { EN_PUBLISHED } from '../lib/i18n/live';
import { SETUP_UPDATED_AT } from '../lib/setup/setup';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [projects, posts, pairs] = await Promise.all([getAllProjects(), getAllPosts(), translationPairs()]);

  return new Response(
    buildSitemap({
      site: requireSite(site),
      projects,
      posts,
      setupUpdatedAt: SETUP_UPDATED_AT,
      enLive: EN_PUBLISHED,
      pairs,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/xml; charset=utf-8' },
    },
  );
};
