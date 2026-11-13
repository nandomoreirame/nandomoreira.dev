import type { Post } from '../../content/schemas/post';
import type { PostTranslation } from '../../content/schemas/post-translation';
import type { Project } from '../../content/schemas/project';
import type { ProjectTranslation } from '../../content/schemas/project-translation';

/**
 * Validation and merge of the English overlays (i18n-content C1). Pure: the
 * access layer reads the collections and calls these, so the rules are tested
 * without Astro. A failure throws, which fails the build (REQ-001 to REQ-004).
 */

const fail = (message: string): never => {
  throw new Error(`[i18n-content] ${message}`);
};

const assertUnique = (values: readonly string[], what: (value: string) => string): void => {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) fail(what(value));
    seen.add(value);
  }
};

export const assertPostTranslations = (sources: readonly Post[], overlays: readonly PostTranslation[]): void => {
  const bySlug = new Map(sources.map((post) => [post.slug, post]));

  for (const overlay of overlays) {
    const source = bySlug.get(overlay.translationOf);
    if (!source) fail(`post ${overlay.slug} translates ${overlay.translationOf}, which does not exist`);
    if (source!.archived) fail(`post ${overlay.slug} translates ${overlay.translationOf}, which is archived`);
    if (source!.cover && !overlay.coverAlt) fail(`post ${overlay.slug} needs coverAlt: its source has a cover`);
    if (bySlug.has(overlay.slug)) fail(`post slug ${overlay.slug} collides with a pt-BR post`);
  }

  assertUnique(overlays.map((overlay) => overlay.translationOf), (slug) => `post ${slug} is translated twice`);
  assertUnique(overlays.map((overlay) => overlay.slug), (slug) => `English post slug ${slug} is used twice`);
};

export const mergePost = (source: Post, overlay: PostTranslation): Post => ({
  ...source,
  slug: overlay.slug,
  title: overlay.title,
  seoTitle: overlay.seoTitle,
  summary: overlay.summary,
  markers: overlay.markers,
  extras: overlay.extras,
  keyPoints: overlay.keyPoints,
  snapshot: overlay.snapshot,
  cover: source.cover ? { ...source.cover, alt: overlay.coverAlt ?? source.cover.alt } : undefined,
});

export const assertProjectTranslations = (
  sources: readonly Project[],
  overlays: readonly ProjectTranslation[],
): void => {
  const bySlug = new Map(sources.map((project) => [project.slug, project]));

  for (const overlay of overlays) {
    const source = bySlug.get(overlay.translationOf);
    if (!source) fail(`case translation points at ${overlay.translationOf}, which does not exist`);
    if ((source!.images?.length ?? 0) !== (overlay.imageAlts?.length ?? 0)) {
      fail(`case ${overlay.translationOf}: imageAlts must have one entry per source image`);
    }
    if ((source!.shortcuts?.length ?? 0) !== (overlay.shortcutActions?.length ?? 0)) {
      fail(`case ${overlay.translationOf}: shortcutActions must have one entry per source shortcut`);
    }
  }

  assertUnique(overlays.map((overlay) => overlay.translationOf), (slug) => `case ${slug} is translated twice`);
};

export const mergeProject = (source: Project, overlay: ProjectTranslation): Project => ({
  ...source,
  title: overlay.title ?? source.title,
  summary: overlay.summary,
  problem: overlay.problem,
  decisions: overlay.decisions,
  outcome: overlay.outcome,
  images: source.images?.map((image, index) => ({ ...image, alt: overlay.imageAlts?.[index] ?? image.alt })),
  shortcuts: source.shortcuts?.map((shortcut, index) => ({
    ...shortcut,
    action: overlay.shortcutActions?.[index] ?? shortcut.action,
  })),
  confidentialMetrics: source.confidentialMetrics ? overlay.confidentialMetrics ?? source.confidentialMetrics : undefined,
});
