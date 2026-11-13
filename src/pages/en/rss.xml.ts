import type { APIRoute } from 'astro';
import { requireSite } from '../../lib/aeo/urls';
import { getCurrentPosts } from '../../lib/content';
import { EN_PUBLISHED } from '../../lib/i18n/live';
import { buildRss } from '../../lib/posts/rss';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  if (!EN_PUBLISHED) return new Response(null, { status: 404 });

  const posts = await getCurrentPosts('en');

  const body = buildRss({
    site: requireSite(site),
    posts,
    title: 'Posts | nandomoreira.dev',
    description: 'Writing on engineering, tooling and agents.',
    locale: 'en',
  });

  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
