import { z } from 'zod';
import { SERVICES } from '../hire/schema';

const item = z.object({ title: z.string().min(1), text: z.string().min(1) });

const detailSchema = z.object({
  hero: z.object({ title: z.string().min(1), lead: z.string().min(1), cta: z.string().min(1) }),
  anatomy: z.array(item.extend({ note: z.string().min(1) })).length(4),
  fit: z.array(item).length(4),
  included: z.array(item).min(1),
  addons: z.array(item).min(1),
  underTheHood: z.array(z.string().min(1)).min(1),
  comparison: z.object({
    caption: z.string().min(1),
    columns: z.array(z.string()).length(3),
    rows: z.array(z.object({ criterion: z.string(), values: z.array(z.string()).length(3) })).min(1),
  }),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
});

export const serviceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  service: z.enum(SERVICES),
  icon: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  audience: z.string().min(1),
  receives: z.array(z.string().min(1)).min(3).max(4),
  detail: detailSchema.optional(),
});

export type SalesService = z.infer<typeof serviceSchema>;
export type ServiceDetail = z.infer<typeof detailSchema>;
