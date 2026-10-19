import type { Project } from '../../content/schemas/project';
import { CV_PDF_PATH } from '../cv/paths';
import { collectionOfBlock } from '../catalog/groups';
import type { Recorder } from './recorder';

export interface ContactLink {
  kind: string;
  value: string;
}

export const contactUrl = (contact: ContactLink): string =>
  contact.kind === 'email' ? `mailto:${contact.value}` : contact.value;

export const contactGoPath = (kind: string): string => `/go/contato/${kind}`;

/**
 * The CV download. A static file is served before the middleware, so a direct
 * link is never measured; through /go every download, filled form or not, is a
 * cv conversion. It has no refId: the contact a form left is its own cv event
 * from /api/cv, which is what the stats leads list reads.
 */
export const CV_GO_PATH = '/go/curriculo';

export const caseGoPath = (collection: string, slug: string, link: 'repo' | 'live'): string =>
  `/go/${collection}/${slug}/${link}`;

/**
 * Every destination /go can reach, built from the profile and the projects
 * only. Nothing from the request ever becomes a Location, which is what keeps
 * this from being an open redirect (REQ-010). A discontinued case gets no
 * entry, as its page shows no links: a URL left behind in the frontmatter may
 * point at a domain someone else now owns.
 */
export const outboundTable = ({
  contacts,
  projects,
}: {
  contacts: readonly ContactLink[];
  projects: ReadonlyArray<Pick<Project, 'slug' | 'block' | 'repoUrl' | 'liveUrl' | 'discontinued'>>;
}): Map<string, string> => {
  const table = new Map<string, string>();

  for (const contact of contacts) table.set(contactGoPath(contact.kind), contactUrl(contact));

  for (const project of projects) {
    if (project.discontinued === true) continue;
    const collection = collectionOfBlock(project.block);
    if (project.repoUrl) table.set(caseGoPath(collection, project.slug, 'repo'), project.repoUrl);
    if (project.liveUrl) table.set(caseGoPath(collection, project.slug, 'live'), project.liveUrl);
  }

  return table;
};

const notFound = (): Response =>
  new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

export const handleOutbound = async (
  request: Request,
  { table, recorder }: { table: () => Promise<ReadonlyMap<string, string>>; recorder: Pick<Recorder, 'record'> },
): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return notFound();

  const path = new URL(request.url).pathname.replace(/\/+$/, '');
  const cv = path === CV_GO_PATH;
  const destination = cv ? CV_PDF_PATH : (await table()).get(path);
  if (!destination) return notFound();

  if (request.method === 'GET') {
    const target = path.slice('/go/'.length);
    await recorder.record(request, {
      kind: 'conversion',
      path,
      source: 'api',
      referrer: request.headers.get('referer'),
      conversion: { type: cv ? 'cv' : 'outbound', target },
    });
  }

  return new Response(null, { status: 302, headers: { location: destination, 'cache-control': 'no-store' } });
};
