import { z } from 'zod';
import { BLOCKS } from '../blocks';

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
  .refine((project) => Boolean(project.repoUrl) || Boolean(project.liveUrl), {
    message:
      'A case needs at least one of repoUrl or liveUrl: without a link there is no verifiable evidence',
    path: ['repoUrl'],
  })
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
