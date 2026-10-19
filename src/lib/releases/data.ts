import { z } from 'zod';

/**
 * One file per day in src/data/releases/<date>.md, frontmatter only. Not a
 * content collection on purpose: a new collection reaches the unit suite only
 * after `astro dev` rewrites .astro/data-store.json, so these are read with
 * import.meta.glob and validated here. An invalid file fails the build.
 */
export const PLACEHOLDER = '[[PREENCHER]]';

const prose = z
  .string()
  .trim()
  .min(1)
  .refine(text => !/[—–]/.test(text), 'no em or en dash as an aside')
  .refine(text => !text.includes(PLACEHOLDER), `${PLACEHOLDER} left by scripts/release-draft.mjs`);

export const releaseSchema = z.object({
  /** v<site version>.<commits in the repository at the end of the day>. */
  version: z.string().regex(/^v\d+\.\d+$/),
  /** ISO date of the day (YYYY-MM-DD), São Paulo time. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: prose,
  summary: prose,
  /** The macro features of the day, two to six. */
  highlights: z.array(prose).min(2).max(6),
});

export type Release = z.infer<typeof releaseSchema>;

export const parseReleases = (modules: Record<string, { frontmatter: unknown }>): Release[] =>
  Object.entries(modules)
    .map(([path, module]) => {
      const file = path.split('/').at(-1) ?? path;
      const parsed = releaseSchema.safeParse(module.frontmatter);
      if (!parsed.success)
        throw new Error(`release ${file}: ${parsed.error.issues.map(issue => issue.message).join('; ')}`);
      if (file !== `${parsed.data.date}.md`) throw new Error(`release ${file}: named after ${parsed.data.date}`);
      return parsed.data;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
