import type { APIRoute } from 'astro';
import { serveCover } from '../../../../../lib/now/cover-response';

export const prerender = false;

export const GET: APIRoute = ({ params }) =>
  serveCover({
    source: params.source ?? '',
    id: params.id ?? '',
    fetch: globalThis.fetch,
  });
