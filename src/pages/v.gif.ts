import type { APIRoute } from 'astro';
import { sitemapEntries } from '../lib/aeo/sitemap';
import { OWN_HOSTS } from '../lib/analytics/channel';
import { cachedUnlessRejected } from '../lib/analytics/memo';
import { handlePixel } from '../lib/analytics/pixel';
import { recorder } from '../lib/analytics/runtime';
import { getAllPosts, getAllProjects } from '../lib/content';
import { createLimiter } from '../lib/hire/rate-limit';

export const prerender = false;

/** 30 recorded visits per 10 minutes per IP, per instance (REQ-003). */
const limiter = createLimiter({ max: 30, windowMs: 10 * 60 * 1000 });

/** The sitemap's pages, computed once per process: content only changes with a deploy. */
const knownPaths = cachedUnlessRejected(() =>
  Promise.all([getAllProjects(), getAllPosts()]).then(
    ([projects, posts]): ReadonlySet<string> => new Set(sitemapEntries({ projects, posts }).map(entry => entry.path)),
  ),
);

export const ALL: APIRoute = ({ request }) =>
  handlePixel(request, { recorder, limiter, knownPaths, ownHosts: OWN_HOSTS });
