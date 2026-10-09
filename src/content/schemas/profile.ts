import { z } from 'zod';

/** A number without its narrative misleads: RISK-004 of the BRIEF. */
const statSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  context: z.string().min(1, 'A bare number without context is misleading'),
});

/** Every advertised service must point at a case that proves it (F1.4). */
const serviceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  caseSlug: z.string().min(1, 'A service with no case behind it is an unproven claim'),
});

const availabilitySchema = z.object({
  status: z.enum(['open', 'limited', 'closed']),
  detail: z.string().min(1),
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'updatedAt must be an ISO-8601 date (YYYY-MM-DD)'),
});

const contactSchema = z.object({
  kind: z.enum(['email', 'github', 'linkedin', 'site']),
  value: z.string().min(1),
});

/**
 * ISO-8601 calendar date. The résumé is unreadable when a period is fuzzy.
 *
 * `z.iso.date()` rather than a shape regex: a regex accepts `2024-99-99`, which
 * would reach the JSON Resume payload and any consumer downstream of it.
 */
const isoDate = z.iso.date('Dates must be a real ISO-8601 date (YYYY-MM-DD)');

/**
 * Career history feeding the JSON Resume payload (REQ-006).
 *
 * An absent `endDate` means the position is current: the résumé renderer says
 * so explicitly instead of leaving a blank, which a reader would misread as
 * missing data rather than as "still there".
 */
const workSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  url: z.url().optional(),
  startDate: isoDate,
  endDate: isoDate.optional(),
  summary: z.string().min(1).optional(),
  highlights: z.array(z.string().min(1)).optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1),
  area: z.string().min(1),
  studyType: z.string().min(1),
  url: z.url().optional(),
  startDate: isoDate,
  endDate: isoDate.optional(),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  /**
   * Brand shown in the header. Optional: falls back to `name`. Kept separate
   * because `name` is the legal name that feeds Person JSON-LD, the resume,
   * the machine routes and the copyright line, where a short brand is wrong.
   */
  wordmark: z.string().min(1).optional(),
  /** Shorter name for human pages; machine routes, JSON-LD and the résumé keep `name`. */
  displayName: z.string().min(1).optional(),
  headline: z.string().min(1),
  bio: z.string().min(1),
  positioning: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  trajectory: z.array(statSchema).min(1),
  services: z.array(serviceSchema).min(1),
  availability: availabilitySchema,
  contacts: z.array(contactSchema).min(1),
  /**
   * Both optional on purpose: the history is authored content, and the profile
   * must stay valid until it is written. The résumé treats them as absent
   * rather than empty (EC of REQ-006).
   */
  work: z.array(workSchema).optional(),
  education: z.array(educationSchema).optional(),
});

export type Profile = z.infer<typeof profileSchema>;
