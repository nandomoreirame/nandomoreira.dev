import { z } from 'zod';

/**
 * Named after a field a legitimate agent has no reason to fill. It is optional
 * on purpose: an honest client that never sends it must not be rejected
 * (EC of REQ-004).
 */
export const HONEYPOT_FIELD = 'website';

/** Long enough for a real briefing, short enough that the field is not a channel. */
const LIMITS = { from: 200, contact: 320, brief: 8_000 } as const;

const required = (max: number) => z.string().trim().min(1).max(max);

/**
 * `.strict()` so an unknown key is refused rather than quietly stored: this
 * payload comes from a stranger and lands in a database.
 */
export const hireSchema = z
  .object({
    from: required(LIMITS.from),
    contact: required(LIMITS.contact),
    brief: required(LIMITS.brief),
    [HONEYPOT_FIELD]: z.string().max(LIMITS.from).optional(),
  })
  .strict();

export type HireRequest = z.infer<typeof hireSchema>;

export const isHoneypotFilled = (payload: HireRequest): boolean =>
  (payload[HONEYPOT_FIELD] ?? '').trim().length > 0;
