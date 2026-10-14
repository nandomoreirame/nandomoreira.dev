import type { APIRoute, GetStaticPaths } from 'astro';
import { ogPages, type OgPage } from '../../lib/og/pages';
import { renderOgPng } from '../../lib/og/render';

// One PNG per page, drawn at build time: nothing renders on request.
export const prerender = true;

export const getStaticPaths = (async () =>
  (await ogPages()).map((page) => ({ params: { key: page.key }, props: { page } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await renderOgPng((props as { page: OgPage }).page)), {
    headers: { 'content-type': 'image/png' },
  });
