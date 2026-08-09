import { z } from 'zod';

export const noteSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: z.string().min(1),
  summary: z.string().min(1),
  /**
   * Never rendered on a human surface (REQ-002). It exists so notes have a
   * stable order, and so RSS has a pubDate and the sitemap a lastmod.
   */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be an ISO-8601 date (YYYY-MM-DD)'),
  markers: z.array(z.string().min(1)).optional(),
  draft: z.boolean().default(false),
});

export type Note = z.infer<typeof noteSchema>;
