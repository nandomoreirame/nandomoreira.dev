import { z } from 'zod';

/**
 * Schema factory for the posts collection. Declared as a function so Astro
 * can inject `image()`, which wires cover paths into the asset pipeline.
 */
export const postSchema = ({ image }: { image: () => z.ZodType }) =>
  z.object({
    slug: z
      .string()
      .min(1)
      // Underscores allowed so historical Gatsby paths (e.g. wp_mail) stay intact.
      .regex(/^[a-z0-9]+([_-][a-z0-9]+)*$/, 'slug must be kebab-case (underscores allowed)'),
    title: z.string().min(1),
    summary: z.string().min(1),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be an ISO-8601 date (YYYY-MM-DD)'),
    markers: z.array(z.string().min(1)).optional(),
    draft: z.boolean().default(false),
    /** Archived posts live under /posts/arquivo/<ano>; current ones under /posts. */
    archived: z.boolean().default(false),
    cover: z
      .object({
        src: image(),
        alt: z.string().min(1, 'A cover image is content, never decoration'),
      })
      .optional(),
  });

export type Post = z.infer<ReturnType<typeof postSchema>>;
