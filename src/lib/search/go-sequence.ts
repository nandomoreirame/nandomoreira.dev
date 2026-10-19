import { GO_TARGETS } from './copy';

/** How long after G the second letter still counts (REQ-011). */
export const GO_WINDOW_MS = 1000;

export const goPathFor = ({ armedAt, now, key }: { armedAt: number | undefined; now: number; key: string }): string | undefined => {
  if (armedAt === undefined || now - armedAt > GO_WINDOW_MS) return undefined;
  return GO_TARGETS.find((target) => target.key === key.toLowerCase())?.path;
};

/** REQ-012: a field, a select or editable content keeps every letter. */
export const isTypingTarget = (target: { tagName: string; isContentEditable: boolean } | null): boolean =>
  target !== null && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
