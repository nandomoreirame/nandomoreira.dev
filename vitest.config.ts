import { getViteConfig } from 'astro/config';

/**
 * Unit suite: must pass on a fresh clone, before anything is built.
 * Assertions that read `dist/` live in `*.build-test.ts` and run from
 * `vitest.build.config.ts` via `npm run test:build`.
 *
 * Uses Astro's getViteConfig so .astro components can be rendered via
 * experimental_AstroContainer.
 */
export default getViteConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.build-test.ts'],
  },
});
