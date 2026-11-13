/**
 * Whether the /en pages are published (D8). On since i18n-content (C7)
 * translated the catalog and the blog. Dev and the homelab staging build
 * always show /en, like drafts (showDrafts in src/lib/content/posts.ts).
 * Flipping it back to false is the rollback.
 */
export const EN_LIVE = true;

export const enLive = (env: { DEV: boolean; MODE: string }, flag: boolean = EN_LIVE): boolean =>
  flag || (env.DEV && env.MODE === 'development') || env.MODE === 'staging';

/** The value for this build. */
export const EN_PUBLISHED = enLive(import.meta.env);
