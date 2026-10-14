import { pagePath } from '../aeo/urls';
import type { Recorder } from './recorder';
import { measurementFor } from './surface';

export const measureRequest = async (
  recorder: Pick<Recorder, 'record'>,
  { request, url, isPrerendered, response }: { request: Request; url: URL; isPrerendered: boolean; response: Response },
): Promise<void> => {
  // In production the adapter serves prerendered files before middleware runs;
  // in dev it does not, and the pixel already counts them (REQ-002).
  if (isPrerendered) return;

  const kind = measurementFor({
    method: request.method,
    path: url.pathname,
    status: response.status,
    contentType: response.headers.get('content-type'),
    headers: request.headers,
  });
  if (!kind) return;

  await recorder.record(request, {
    kind,
    path: kind === 'pageview' ? pagePath(url.pathname) : url.pathname,
    source: 'ssr',
    referrer: request.headers.get('referer'),
    search: url.searchParams,
  });
};
