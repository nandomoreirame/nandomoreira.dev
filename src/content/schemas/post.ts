import type { SchemaContext } from 'astro:content';
import { z } from 'zod';
import { ART_MOTIFS } from '../motifs';

/**
 * Schema factory for the posts collection. Declared as a function so Astro
 * can inject `image()`, which wires cover paths into the asset pipeline.
 */
export const postSchema = ({ image }: SchemaContext) =>
  z
    .object({
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
      /**
       * Drawing shown where a post has no cover, picked by what the post is
       * about. tests/content/post-art-declared.test.ts requires it on every
       * published post without a cover.
       */
      art: z.enum(ART_MOTIFS).optional(),
      cover: z
        .object({
          src: image(),
          alt: z.string().min(1, 'A cover image is content, never decoration'),
        })
        .optional(),
    })
    .refine((post) => post.slug !== 'ia', {
      message:
        'slug "ia" is reserved: /<x>/ia is the AI view of a page, so a post cannot claim that segment',
      path: ['slug'],
    });

export type Post = z.infer<ReturnType<typeof postSchema>>;
