import type { APIRoute } from 'astro';
import { outboundTable, handleOutbound } from '../../lib/analytics/outbound';
import { cachedUnlessRejected } from '../../lib/analytics/memo';
import { recorder } from '../../lib/analytics/runtime';
import { getAllProjects, getProfile } from '../../lib/content';

export const prerender = false;

/** Built once per process: contacts and projects only change with a deploy. */
const table = cachedUnlessRejected(() =>
  Promise.all([getProfile(), getAllProjects()]).then(([profile, projects]): ReadonlyMap<string, string> =>
    outboundTable({ contacts: profile.contacts, projects }),
  ),
);

export const ALL: APIRoute = ({ request }) => handleOutbound(request, { table, recorder });
