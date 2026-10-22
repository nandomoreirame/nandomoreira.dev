import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { postFileFor, reviewFileFor, titleOf } from './files';
import { locateLine } from './locate';
import { renderReview } from './render';
import { reviewPayloadSchema } from './schema';

export type SaveResult = { ok: true; path: string } | { ok: false; reason: string };

/**
 * Validates what the toolbar app sent and writes docs/post-reviews/<slug>.md.
 * The path comes from the validated slug only, never from the client.
 */
export const saveReview = (payload: unknown, root: string, now: () => Date): SaveResult => {
  const parsed = reviewPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue && issue.path.length > 0 && issue.code !== 'custom' ? ` (${issue.path.join('.')})` : '';
    return { ok: false, reason: `${issue?.message ?? 'Revisão inválida'}${where}` };
  }

  const { slug, annotations } = parsed.data;
  const postFile = postFileFor(root, slug);
  if (!postFile) return { ok: false, reason: `Post não encontrado: ${slug}` };

  const source = readFileSync(join(root, postFile), 'utf8');
  const path = reviewFileFor(slug);
  const markdown = renderReview({
    title: titleOf(source, slug),
    slug,
    generatedAt: now().toISOString(),
    annotations: [...annotations]
      .sort((a, b) => a.start - b.start)
      .map(annotation => ({ ...annotation, line: locateLine(source, annotation.quote) })),
  });

  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), markdown);
  return { ok: true, path };
};
