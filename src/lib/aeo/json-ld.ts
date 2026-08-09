/**
 * Escapes `<` so no content can terminate the surrounding script element.
 * `<` is valid JSON and parses back to `<`, so the payload is unchanged
 * for the consumer.
 */
export const serialiseJsonLd = (value: unknown): string =>
  JSON.stringify(value).replaceAll('<', '\\u003c');
