import { detailSlugs } from './catalog';
import { type Service, isService } from './service-labels';

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
