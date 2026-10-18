/** Figures the Stitch screens invented and the sales pages must never show (RISK-004). */
export const INVENTED_NUMBERS: Array<[string, RegExp]> = [
  ['percentage', /\d+(?:[.,]\d+)?\s?%/],
  ['brl amount', /R\$\s?\d/],
  ['time metric', /\b\d+(?:[.,]\d+)?\s?(?:ms|s|segundos?)\b|horas úteis/i],
  ['uptime', /uptime/i],
];

/** Visible text only: CSS and attributes legitimately carry numbers. */
export const visibleText = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ');

export const inventedNumbersIn = (text: string): string[] =>
  INVENTED_NUMBERS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
