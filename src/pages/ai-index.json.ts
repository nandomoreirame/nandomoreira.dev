import type { APIRoute } from 'astro';
import { buildAiIndex } from '../lib/aeo/ai-index';
import { requireSite } from '../lib/aeo/urls';
import { getAllPosts, getAllProjects, getProfile } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [profile, projects, posts] = await Promise.all([getProfile(), getAllProjects(), getAllPosts()]);

  return new Response(JSON.stringify(buildAiIndex({ site: requireSite(site), profile, projects, posts })), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
