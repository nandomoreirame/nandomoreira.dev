import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '../lib/aeo/llms-txt';
import { requireSite } from '../lib/aeo/urls';
import { getAllNotes, getAllProjects, getProfile } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [profile, projects, notes] = await Promise.all([
    getProfile(),
    getAllProjects(),
    getAllNotes(),
  ]);

  return new Response(buildLlmsTxt({ site: requireSite(site), profile, projects, notes }), {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
