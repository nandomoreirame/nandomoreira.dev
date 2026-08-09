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

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  bio: z.string().min(1),
  positioning: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  trajectory: z.array(statSchema).min(1),
  services: z.array(serviceSchema).min(1),
  availability: availabilitySchema,
  contacts: z.array(contactSchema).min(1),
});

export type Profile = z.infer<typeof profileSchema>;
