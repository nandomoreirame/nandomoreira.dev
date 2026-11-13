import type { Locale } from '../i18n/locale';
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

export const SERVICE_OPTIONS = SERVICES.map(value => ({ value, label: SERVICE_LABELS[value] }));

export const isService = (value: unknown): value is Service =>
  typeof value === 'string' && Object.hasOwn(SERVICE_LABELS, value);

const SERVICE_LABELS_EN: Record<Service, string> = {
  website: 'Website',
  'landing-page': 'Landing page',
  blog: 'Blog',
  'online-store': 'Online store',
  'web-product': 'Complete web product',
  automation: 'Automation and AI',
  undecided: 'Not sure yet',
};
export const serviceLabelsFor = (locale: Locale = 'pt-BR'): Record<Service, string> =>
  locale === 'en' ? SERVICE_LABELS_EN : SERVICE_LABELS;
export const serviceOptionsFor = (locale: Locale = 'pt-BR') =>
  SERVICES.map(value => ({ value, label: serviceLabelsFor(locale)[value] }));
