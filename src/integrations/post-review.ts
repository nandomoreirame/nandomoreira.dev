import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { saveReview } from '../lib/post-review/save';
import { REVIEW_APP_ID, REVIEW_EVENTS } from '../lib/post-review/schema';

/**
 * Text reviewer for posts (spec post-review). A Dev Toolbar app, so it exists
 * on `astro dev` only and never reaches dist/ or the client-JS allow list.
 */
export const postReview = (): AstroIntegration => {
  let root = process.cwd();

  return {
    name: REVIEW_APP_ID,
    hooks: {
      'astro:config:setup': ({ command, config, addDevToolbarApp }) => {
        if (command !== 'dev') return;
        root = fileURLToPath(config.root);
        addDevToolbarApp({
          id: REVIEW_APP_ID,
          name: 'Revisar texto',
          icon: 'file-search',
          entrypoint: fileURLToPath(new URL('./post-review-app.ts', import.meta.url)),
        });
      },
      'astro:server:setup': ({ toolbar }) => {
        toolbar.on(REVIEW_EVENTS.save, (payload: unknown) => {
          const result = saveReview(payload, root, () => new Date());
          if (result.ok) toolbar.send(REVIEW_EVENTS.saved, { path: result.path });
          else toolbar.send(REVIEW_EVENTS.failed, { reason: result.reason });
        });
      },
    },
  };
};
