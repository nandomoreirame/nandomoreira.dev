import type { APIRoute } from 'astro';
import { getMachinePosts, getMachineProjects } from '../../lib/content';
import { casePath, postPath } from '../../lib/i18n/paths';
import { SALES_SERVICES } from '../../lib/sales/catalog';
import { salesUrl } from '../../lib/sales/host';
import { buildSearchIndex } from '../../lib/search/build-index';

/** English command palette index (i18n-foundation REQ-024, i18n-content REQ-014). */
export const prerender = true;

export const GET: APIRoute = async () => {
  const [machinePosts, projects] = await Promise.all([getMachinePosts(), getMachineProjects()]);
  const current = machinePosts.filter(post => !post.archived);
  const archived = machinePosts.filter(post => post.archived);
  const index = buildSearchIndex({
    locale: 'en',
    current: current.map(post => ({ ...post, path: postPath(post) })),
    archived: archived.map(post => ({ ...post, path: postPath(post) })),
    projects: projects.map(project => ({ ...project, path: casePath(project) })),
    services: SALES_SERVICES.map(service => ({
      title: service.title,
      summary: service.summary,
      url: salesUrl(service.slug),
    })),
    landingUrl: salesUrl(),
  });
  return new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
