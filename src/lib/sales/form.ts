import { formToPayload } from '../hire/form';
import { detailSlugs } from './catalog';
import { salesPath } from './host';
import { SERVICE_LABELS, isService } from './service-labels';

/**
 * The page a sales form came from, read from the action's `?origem=`: it is
 * in the URL, so even a failure before the body is read (rate limit) can go
 * back to the right page. Only known values map to a path.
 */
export const salesOriginOf = (url: URL): string | undefined => {
  const origin = url.searchParams.get('origem');
  if (origin === 'landing') return salesPath();
  if (origin && detailSlugs().includes(origin)) return salesPath(origin);
  return undefined;
};

/** The message is optional on the sales form, but `brief` is required by the schema. */
export const salesFormToPayload = (params: URLSearchParams): Record<string, unknown> => {
  const payload = formToPayload(params);
  const brief = typeof payload.brief === 'string' ? payload.brief.trim() : '';

  if (brief === '') {
    const service = isService(payload.service) ? payload.service : 'undecided';
    payload.brief = `Interesse: ${SERVICE_LABELS[service]}`;
  }

  return payload;
};
