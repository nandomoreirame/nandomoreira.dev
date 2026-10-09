import { z } from 'zod';

/**
 * Named after a field a legitimate agent has no reason to fill. It is optional
 * on purpose: an honest client that never sends it must not be rejected
 * (EC of REQ-004).
 */
export const HONEYPOT_FIELD = 'website';

/** Long enough for a real briefing, short enough that the field is not a channel. */
const LIMITS = { from: 200, contact: 320, brief: 8_000, company: 200 } as const;

/** Budget ranges in BRL. The labels live on the form; the API speaks the slugs. */
export const BUDGETS = ['undecided', 'up-to-10k', '10k-30k', '30k-60k', '60k-plus'] as const;

export const INTERESTS = ['job', 'freelance', 'ai-product', 'agents-mcp', 'aeo'] as const;

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
    company: required(LIMITS.company).optional(),
    budget: z.enum(BUDGETS).optional(),
    interests: z
      .array(z.enum(INTERESTS))
      .min(1)
      .max(INTERESTS.length)
      .refine((list) => new Set(list).size === list.length, 'Interests must not repeat.')
      .optional(),
    [HONEYPOT_FIELD]: z.string().max(LIMITS.from).optional(),
  })
  .strict();

export type HireRequest = z.infer<typeof hireSchema>;

export const isHoneypotFilled = (payload: HireRequest): boolean =>
  (payload[HONEYPOT_FIELD] ?? '').trim().length > 0;
