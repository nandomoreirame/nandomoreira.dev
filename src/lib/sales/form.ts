import { formToPayload } from '../hire/form';
import { detailSlugs } from './catalog';
import { salesPath } from './host';
import { SERVICE_LABELS, type Service, isService } from './service-labels';

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

/** A visit to /contato that a sales page sent, read from its query. */
export interface SalesVisit {
  /** `landing` or a detail slug. */
  origin?: string;
  service?: Service;
}

/**
 * Only known values count: the origin is the landing or a detail page, the
 * service one of the API slugs. Anything else is a plain visit.
 */
export const salesVisitOf = (params: URLSearchParams): SalesVisit | undefined => {
  const raw = params.get('origem');
  const origin = raw === 'landing' || (raw !== null && detailSlugs().includes(raw)) ? raw : undefined;
  const value = params.get('servico');
  const service = isService(value) ? value : undefined;
  return origin || service ? { origin, service } : undefined;
};
