import type { APIRoute } from 'astro';
import { getMachinePosts, getMachineProjects } from '../../lib/content';
import { enStaticPaths } from '../../lib/i18n/guard';
import { EN_PUBLISHED } from '../../lib/i18n/live';
import { casePath, postPath } from '../../lib/i18n/paths';
import { SALES_SERVICES_EN } from '../../lib/sales/catalog-en';
import { salesUrl } from '../../lib/sales/host';
import { buildSearchIndex } from '../../lib/search/build-index';

/** English command palette index (i18n-foundation REQ-024, i18n-content REQ-014). */
export const prerender = EN_PUBLISHED;

/** Empty while English is off so the build does not publish /en/search.json (D8). */
export const enSearchIndexPaths = (live: boolean = EN_PUBLISHED) => enStaticPaths(async () => [{}], live);

export const englishSearchResponse = async (live: boolean = EN_PUBLISHED): Promise<Response> => {
  if (!live) return new Response(null, { status: 404 });

  const [machinePosts, projects] = await Promise.all([getMachinePosts(), getMachineProjects()]);
  const current = machinePosts.filter(post => !post.archived);
  const archived = machinePosts.filter(post => post.archived);
  const index = buildSearchIndex({
    locale: 'en',
    current: current.map(post => ({ ...post, path: postPath(post) })),
    archived: archived.map(post => ({ ...post, path: postPath(post) })),
    projects: projects.map(project => ({ ...project, path: casePath(project) })),
    services: SALES_SERVICES_EN.map(service => ({
      title: service.title,
      summary: service.summary,
      url: salesUrl(service.slug, undefined, 'en'),
    })),
    landingUrl: salesUrl(undefined, undefined, 'en'),
  });
  return new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};

export const GET: APIRoute = async () => englishSearchResponse();
