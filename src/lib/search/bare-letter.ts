type KeyEvent = { ctrlKey: boolean; metaKey: boolean; altKey: boolean; key: string };
type Origin = { tagName: string; isContentEditable: boolean } | null | undefined;

/**
 * A bare letter reaches the palette unless it was typed in a field.
 * The caller passes `composedPath()[0]`: a document listener's `target` is the
 * shadow host, so a textarea in the dev toolbar would look like the page.
 */
export const forwardBareLetter = (origin: Origin, event: KeyEvent, touch: boolean): boolean => {
  const field = !!origin && (origin.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(origin.tagName));
  return !event.ctrlKey && !event.metaKey && !event.altKey && /^[a-z]$/i.test(event.key) && !touch && !field;
};
