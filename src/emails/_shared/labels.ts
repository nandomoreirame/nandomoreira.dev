import { budgetLabelOf, interestLabelOf } from '../../lib/contact/form-options';
import { isService, SERVICE_LABELS } from '../../lib/sales/service-labels';

/** Budget slug → form label, or null when absent. */
export const budgetDisplay = (budget: string | null): string | null =>
  budget === null ? null : budgetLabelOf(budget);

/** Interest slugs → form labels joined, or null when empty. */
export const interestsDisplay = (interests: readonly string[]): string | null =>
  interests.length === 0 ? null : interests.map(interestLabelOf).join(', ');

/** Service slug → form label, or null when absent/unknown. */
export const serviceDisplay = (service: string | null): string | null =>
  service !== null && isService(service) ? SERVICE_LABELS[service] : service;
