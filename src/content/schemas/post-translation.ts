import { z } from 'zod';

/**
 * English overlay of a post (i18n-content C1, C3). Only what is translated
 * lives here; date, draft, archived, art and the cover image come from the
 * pt-BR source in the access layer, so they cannot drift. `.strict()` makes a
 * copied structural field a build error instead of a silent duplicate.
 */
export const postTranslationSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case')
      .refine(slug => slug !== 'ia' && slug !== 'en', 'slug "ia" and "en" are reserved'),
    /** pt-BR slug of the source post. */
    translationOf: z.string().min(1),
    title: z.string().min(1),
    seoTitle: z.string().min(1).max(60).optional(),
    summary: z.string().min(1),
    markers: z.array(z.string().min(1)).min(3),
    /** Alt text of the source cover; required when the source has one (REQ-004). */
    coverAlt: z.string().min(1).optional(),
    extras: z.array(z.string().min(1).max(60)).min(1).max(2).optional(),
    keyPoints: z.array(z.string().min(1).max(140)).min(1).max(3).optional(),
    snapshot: z
      .object({
        version: z.string().min(1).max(16).optional(),
        items: z
          .array(z.object({ label: z.string().min(1).max(20), value: z.string().min(1).max(32) }))
          .min(1)
          .max(6),
      })
      .optional(),
  })
  .strict();

export type PostTranslation = z.infer<typeof postTranslationSchema>;
