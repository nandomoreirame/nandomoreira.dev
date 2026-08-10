import type { APIRoute } from 'astro';
import { buildResume } from '../../lib/aeo/resume';
import { renderResumeText } from '../../lib/aeo/resume-txt';
import { requireSite } from '../../lib/aeo/urls';
import { getAllProjects, getProfile } from '../../lib/content';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [profile, projects] = await Promise.all([getProfile(), getAllProjects()]);

  const resume = buildResume({ site: requireSite(site), profile, projects });

  return new Response(renderResumeText(resume), {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
