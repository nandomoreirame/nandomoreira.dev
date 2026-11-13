import { z } from 'zod';

/**
 * English overlay of a case (C1, C3). The slug, links, tech, images and every
 * flag come from the pt-BR source; the client name never leaves it.
 */
export const projectTranslationSchema = z
  .object({
    translationOf: z.string().min(1),
    /** Absent when the title is a product name that reads the same in English. */
    title: z.string().min(1).optional(),
    summary: z.string().min(1),
    problem: z.string().min(1),
    decisions: z.string().min(1),
    outcome: z.string().min(1),
    /** One per source image, in the same order (REQ-004). */
    imageAlts: z.array(z.string().min(1)).optional(),
    /** One per source shortcut, in the same order (REQ-004). */
    shortcutActions: z.array(z.string().min(1)).optional(),
    /** Translated, and still stripped on public read when confidential. */
    confidentialMetrics: z.array(z.string().min(1)).optional(),
  })
  .strict();

export type ProjectTranslation = z.infer<typeof projectTranslationSchema>;
