import { z } from 'zod';
import { BLOCKS } from '../blocks';
import { ART_MOTIFS } from '../motifs';

const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'A case image is content, never decoration: alt is required'),
});

/** Collapse punctuation so "Acme Corp" matches slug acme-corp and host acme.example.com. */
const identityKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const fieldIdentifiesClient = (field: string | null | undefined, clientName: string): boolean => {
  if (!field) return false;
  const clientKey = identityKey(clientName);
  if (!clientKey) return false;
  return identityKey(field).includes(clientKey);
};

export const projectSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case'),
    title: z.string().min(1),
    block: z.enum(BLOCKS),
    /** Drawing for the generated art; the block's motif when absent (REQ-003, REQ-018). */
    art: z.enum(ART_MOTIFS).optional(),
    summary: z.string().min(1),
    problem: z.string().min(1),
    decisions: z.string().min(1),
    outcome: z.string().min(1),
    tech: z.array(z.string().min(1)).min(1),
    repoUrl: z.url().nullable().optional(),
    liveUrl: z.url().nullable().optional(),
    images: z.array(imageSchema).optional(),
    featured: z.boolean(),
    confidential: z.boolean(),
    /**
     * The project is shut down: no live URL exists any more. Like `confidential`,
     * it excuses the link requirement, but for the opposite reason — there is
     * nothing left to link to, rather than nothing that may be shown.
     */
    discontinued: z.boolean().default(false),
    /** Shown as MM/YYYY in the leading column of the row pattern. */
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be an ISO-8601 date (YYYY-MM-DD)'),
    /** Client name kept in source; redacted on public read when confidential. */
    clientName: z.string().min(1).optional(),
    /** Sensitive metrics kept in source; stripped on public read when confidential. */
    confidentialMetrics: z.array(z.string().min(1)).optional(),
    /** ISO-8601 date for sitemap lastmod; omit rather than inventing build time. */
    updatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'updatedAt must be an ISO-8601 date (YYYY-MM-DD)')
      .optional(),
  })
  .refine(
    (project) =>
      project.confidential ||
      project.discontinued ||
      Boolean(project.repoUrl) ||
      Boolean(project.liveUrl),
    {
      message:
        'A case needs at least one of repoUrl or liveUrl: without a link there is no verifiable evidence. Only a confidential or a discontinued case may omit both, and each must say so on the page (REQ-005, REQ-017).',
      path: ['repoUrl'],
    },
  )
  .refine(
    (project) => {
      if (!project.confidential || !project.clientName) return true;
      const client = project.clientName;
      return !(
        fieldIdentifiesClient(project.slug, client) ||
        fieldIdentifiesClient(project.liveUrl, client) ||
        fieldIdentifiesClient(project.repoUrl, client)
      );
    },
    {
      message:
        'A confidential case must not identify the client in slug, liveUrl or repoUrl: those fields cannot be redacted without breaking the case',
      path: ['slug'],
    },
  );

export type Project = z.infer<typeof projectSchema>;
