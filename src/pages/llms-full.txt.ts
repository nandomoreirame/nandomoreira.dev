import type { APIRoute } from 'astro';
import { buildLlmsFullTxt } from '../lib/aeo/llms-full-txt';
import { requireSite } from '../lib/aeo/urls';
import { getAllPosts, getAllProjects, getProfile } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [profile, projects, posts] = await Promise.all([
    getProfile(),
    getAllProjects(),
    getAllPosts(),
  ]);

  return new Response(
    buildLlmsFullTxt({ site: requireSite(site), profile, projects, posts }),
    {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    },
  );
};
