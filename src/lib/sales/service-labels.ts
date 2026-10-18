import { SERVICES } from '../hire/schema';

export type Service = (typeof SERVICES)[number];

/** pt-BR labels for the API slugs; a missing key fails the type check. */
export const SERVICE_LABELS: Record<Service, string> = {
  website: 'Site institucional',
  'landing-page': 'Landing page',
  blog: 'Blog',
  'online-store': 'Loja virtual',
  'web-product': 'Produto web completo',
  automation: 'Automação e IA',
  undecided: 'Ainda não sei',
};

export const SERVICE_OPTIONS = SERVICES.map((value) => ({ value, label: SERVICE_LABELS[value] }));

export const isService = (value: unknown): value is Service =>
  typeof value === 'string' && Object.hasOwn(SERVICE_LABELS, value);
