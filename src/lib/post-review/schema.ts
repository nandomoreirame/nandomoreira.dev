import { z } from 'zod';

/** Dev toolbar app id. Also what the build gate looks for in dist/. */
export const REVIEW_APP_ID = 'post-review';

export const REVIEW_EVENTS = {
  save: 'post-review:save',
  saved: 'post-review:saved',
  failed: 'post-review:failed',
} as const;

/** Characters of context kept on each side of a quote (W3C TextQuoteSelector). */
export const CONTEXT_CHARS = 32;

export const LIMITS = { quote: 2000, request: 2000, replacement: 4000, annotations: 100 } as const;

/** Same pattern as the posts schema: the slug becomes a file name, never a path. */
export const SLUG_PATTERN = /^[a-z0-9]+([_-][a-z0-9]+)*$/;

export const annotationSchema = z
  .object({
    quote: z.string().min(1).max(LIMITS.quote),
    prefix: z.string().max(CONTEXT_CHARS),
    suffix: z.string().max(CONTEXT_CHARS),
    section: z.string().nullable(),
    request: z.string().max(LIMITS.request),
    replacement: z.string().max(LIMITS.replacement),
    /** Offsets in the article text: order in the panel and the highlight after a reload. */
    start: z.number().int().min(0),
    end: z.number().int().min(1),
  })
  .refine(a => a.end > a.start, { message: 'Trecho vazio' })
  .refine(a => a.request.trim() !== '' || a.replacement.trim() !== '', {
    message: 'Escreva o pedido ou o texto novo',
  });

export const reviewPayloadSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN),
  annotations: z.array(annotationSchema).min(1).max(LIMITS.annotations),
});

export type Annotation = z.infer<typeof annotationSchema>;
export type ReviewPayload = z.infer<typeof reviewPayloadSchema>;

export const storageKey = (slug: string): string => `${REVIEW_APP_ID}:${slug}`;
