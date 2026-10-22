/**
 * Public Giscus configuration (docs/specs/giscus-comments).
 * `repoId` is the GitHub node id of nandomoreirame/nandomoreira.dev.
 * `categoryId` is the public node id of the Blog discussion category.
 * Neither value is a secret. The loader must not inject the widget without both.
 */
export const GISCUS_FAILURE_MESSAGE = 'Oops, erro ao carregar os comentários, volte aqui mais tarde.';

/** Shown when Giscus loaded and the post has no comments yet. Not an error. */
export const GISCUS_EMPTY_MESSAGE = 'Nenhum comentário ainda. Seja o primeiro a escrever.';

/** Giscus uses this 404 when the page has no discussion. The comment box still renders. */
export const GISCUS_EMPTY_DISCUSSION_ERROR = 'Discussion not found';

/** Current published posts only. Archived posts and drafts stay without the widget. */
export const isCommentsPost = (post: { archived?: boolean; draft?: boolean }): boolean =>
  post.archived !== true && post.draft !== true;

export const giscusConfig = {
  repo: 'nandomoreirame/nandomoreira.dev',
  repoId: 'R_kgDOTyj5uQ',
  category: 'Blog',
  categoryId: 'DIC_kwDOTyj5uc4DJVid',
  mapping: 'pathname',
  strict: '1',
  reactionsEnabled: '0',
  lang: 'pt',
  failureMessage: GISCUS_FAILURE_MESSAGE,
  emptyMessage: GISCUS_EMPTY_MESSAGE,
} as const;
