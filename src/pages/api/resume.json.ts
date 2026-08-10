import type { APIRoute } from 'astro';
import { buildResume } from '../../lib/aeo/resume';
import { requireSite } from '../../lib/aeo/urls';
import { getAllProjects, getProfile } from '../../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [profile, projects] = await Promise.all([getProfile(), getAllProjects()]);

  const resume = buildResume({ site: requireSite(site), profile, projects });

  return new Response(JSON.stringify(resume, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
