/**
 * Whether the /en pages are published (D8). Off until i18n-content has
 * translated the catalog and the blog: a push to main publishes on its own, and
 * an /en with an empty portfolio would go live. Dev and the homelab staging
 * build always show /en, like drafts (showDrafts in src/lib/content/posts.ts).
 * Flipping it back to false is the rollback.
 */
export const EN_LIVE = false;

export const enLive = (env: { DEV: boolean; MODE: string }, flag: boolean = EN_LIVE): boolean =>
  flag || (env.DEV && env.MODE === 'development') || env.MODE === 'staging';

/** The value for this build. */
export const EN_PUBLISHED = enLive(import.meta.env);
