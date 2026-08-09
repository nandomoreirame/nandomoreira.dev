/**
 * The slug is the routing key, the JSON-LD identifier and the argument of the
 * MCP get_project tool. A duplicate makes all three ambiguous.
 */
export const assertUniqueSlugs = (projects: ReadonlyArray<{ slug: string }>): void => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const { slug } of projects) {
    if (seen.has(slug)) duplicates.add(slug);
    seen.add(slug);
  }

  if (duplicates.size > 0) {
    throw new Error(`Duplicate project slugs: ${[...duplicates].sort().join(', ')}`);
  }
};

/**
 * Pull the frontmatter `slug:` from a project markdown source.
 * Must not depend on Astro: this runs in the content loader before entries land
 * in the store. Glob's generateId uses data.slug as the entry id, so two files
 * with the same slug collapse to one store row and a store-only check would miss
 * the duplicate.
 */
export const extractSlugFromMarkdown = (source: string): string | undefined => {
  if (!source.startsWith('---')) return undefined;

  const end = source.indexOf('\n---', 3);
  if (end === -1) return undefined;

  const frontmatter = source.slice(3, end);
  for (const line of frontmatter.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('slug:')) continue;
    const raw = trimmed.slice('slug:'.length).trim();
    return raw.replace(/^['"]|['"]$/g, '') || undefined;
  }

  return undefined;
};

export type MarkdownSource = Readonly<{ path: string; source: string }>;

/**
 * REQ-010 at build time: scan every project file before the collection store
 * can silently overwrite same-slug entries.
 */
export const assertUniqueProjectMarkdownSlugs = (files: ReadonlyArray<MarkdownSource>): void => {
  const projects: Array<{ slug: string }> = [];

  for (const file of files) {
    const slug = extractSlugFromMarkdown(file.source);
    if (!slug) {
      throw new Error(`Project markdown is missing a slug frontmatter field: ${file.path}`);
    }
    projects.push({ slug });
  }

  assertUniqueSlugs(projects);
};
