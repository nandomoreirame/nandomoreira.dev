import type { APIRoute } from 'astro';
import { outboundTable, handleOutbound } from '../../lib/analytics/outbound';
import { recorder } from '../../lib/analytics/runtime';
import { getAllProjects, getProfile } from '../../lib/content';

export const prerender = false;

/** Built once per process: contacts and projects only change with a deploy. */
let cached: Promise<ReadonlyMap<string, string>> | undefined;
const table = () =>
  (cached ??= Promise.all([getProfile(), getAllProjects()]).then(([profile, projects]) =>
    outboundTable({ contacts: profile.contacts, projects }),
  ));

export const ALL: APIRoute = ({ request }) => handleOutbound(request, { table, recorder });
