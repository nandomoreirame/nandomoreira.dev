import type { APIRoute } from 'astro';
import { servePreview } from '../../../../lib/now/preview';

export const prerender = false;

export const GET: APIRoute = ({ params }) =>
  servePreview({
    isrc: params.isrc ?? '',
    fetch: globalThis.fetch,
  });
