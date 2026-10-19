import { pagePath } from '../aeo/urls';
import type { Recorder } from './recorder';
import { measurementFor } from './surface';

export const measureRequest = async (
  recorder: Pick<Recorder, 'record'>,
  {
    request,
    url,
    isPrerendered,
    response,
    rewrite,
  }: {
    request: Request;
    url: URL;
    isPrerendered: boolean;
    response: Response;
    /** The path the middleware served instead (the sales host's `/` is `/servicos`). */
    rewrite?: string;
  },
): Promise<void> => {
  // In production the adapter serves prerendered files before middleware runs;
  // in dev it does not, and the pixel already counts them (REQ-002).
  if (isPrerendered) return;

  // A rewritten page counts under the page it is, so the sales landing on its
  // own host never merges with the home that shares its `/`.
  const path = rewrite ?? url.pathname;
  const kind = measurementFor({
    method: request.method,
    path,
    status: response.status,
    contentType: response.headers.get('content-type'),
    headers: request.headers,
  });
  if (!kind) return;

  await recorder.record(request, {
    kind,
    path: kind === 'pageview' ? pagePath(path) : path,
    source: 'ssr',
    referrer: request.headers.get('referer'),
    search: url.searchParams,
  });
};
