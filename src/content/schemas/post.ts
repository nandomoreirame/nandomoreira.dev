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
      /** Shorter title for the browser tab and the SERP, when `title` is long. */
      seoTitle: z.string().min(1).max(60, 'seoTitle must fit the 60 characters a SERP shows').optional(),
      summary: z.string().min(1),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be an ISO-8601 date (YYYY-MM-DD)'),
      /**
       * Optional full timestamp (ISO 8601 with seconds and offset), so posts of
       * the same day order by when they were written. A field, not the file's
       * mtime: on the build server every file carries the checkout time.
       */
      publishedAt: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(Z|[+-]\d{2}:\d{2})$/,
          'publishedAt must be YYYY-MM-DDTHH:MM:SS with an offset, e.g. 2026-10-10T12:08:11-03:00',
        )
        .optional(),
      /** Tags, shown as hashtags. At least three: they key tag search and grouping. */
      markers: z.array(z.string().min(1)).min(3, 'a post needs at least three markers (tags)'),
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
      /**
       * Up to two short lines shown under the summary in the blog listing
       * (REQ-010): a measured result first, then a detail. Written by the
       * author per post; absent means no line.
       */
      extras: z.array(z.string().min(1).max(60)).min(1).max(2).optional(),
      /**
       * Up to three short takeaways for the "Preview rápido" of the home card
       * (home-latest-post REQ-005). Written by the author per post; absent
       * means the card has no preview.
       */
      keyPoints: z.array(z.string().min(1).max(140)).min(1).max(3).optional(),
      /**
       * The "// stack snapshot" card beside the post index (post-detail-redesign
       * REQ-004): what the post ran on, taken from its own text. Absent means
       * no card.
       */
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
    .refine((post) => !post.publishedAt || post.publishedAt.slice(0, 10) === post.date, {
      message: 'publishedAt must fall on the post date',
      path: ['publishedAt'],
    })
    .refine((post) => post.slug !== 'ia', {
      message:
        'slug "ia" is reserved: /<x>/ia is the AI view of a page, so a post cannot claim that segment',
      path: ['slug'],
    });

export type Post = z.infer<ReturnType<typeof postSchema>>;
