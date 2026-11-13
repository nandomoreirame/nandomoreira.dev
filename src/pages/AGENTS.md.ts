import type { APIRoute } from 'astro';
import { buildAgentsMd } from '../lib/aeo/agents-md';
import { requireSite } from '../lib/aeo/urls';
import { getMachineProjects, getProfile } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [profile, projects] = await Promise.all([getProfile('en'), getMachineProjects()]);

  return new Response(buildAgentsMd({ site: requireSite(site), profile, projects }), {
    status: 200,
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
};
