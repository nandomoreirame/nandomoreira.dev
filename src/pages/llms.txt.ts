import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '../lib/aeo/llms-txt';
import { requireSite } from '../lib/aeo/urls';
import { getMachinePosts, getMachineProjects, getProfile } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [profile, projects, posts] = await Promise.all([getProfile('en'), getMachineProjects(), getMachinePosts()]);

  return new Response(buildLlmsTxt({ site: requireSite(site), profile, projects, posts }), {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
