import { PAYMENT_ANSWER } from '../../src/lib/sales/payment';

/** Figures the Stitch screens invented and the sales pages must never show (RISK-004). */
export const INVENTED_NUMBERS: Array<[string, RegExp]> = [
  ['percentage', /\d+(?:[.,]\d+)?\s?%/],
  ['brl amount', /R\$\s?\d/],
  ['time metric', /\b\d+(?:[.,]\d+)?\s?(?:ms|s|segundos?)\b|horas úteis/i],
  ['uptime', /uptime/i],
];

/**
 * Visible text only: CSS and attributes legitimately carry numbers. The budget
 * field of the contact form is the one exception (decided by Fernando on
 * 2026-10-21): its ranges are answers the visitor picks, the same as on
 * /contato, not a figure the page claims. Every other text is still checked.
 */
export const visibleText = (html: string): string =>
  html
    .replace(/<select[^>]*name="orcamento"[\s\S]*?<\/select>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ');

/**
 * Real figures Fernando gave, allowed only as these exact texts: a percentage
 * anywhere else on the page still fails (payment terms, 2026-10-21).
 */
const APPROVED_TEXTS: readonly string[] = [PAYMENT_ANSWER];

export const inventedNumbersIn = (text: string): string[] => {
  const checked = APPROVED_TEXTS.reduce((rest, approved) => rest.replaceAll(approved, ' '), text);
  return INVENTED_NUMBERS.filter(([, pattern]) => pattern.test(checked)).map(([name]) => name);
};
