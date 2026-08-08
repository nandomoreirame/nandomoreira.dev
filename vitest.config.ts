import { defineConfig } from 'vitest/config';

/**
 * Unit suite: must pass on a fresh clone, before anything is built.
 * Assertions that read `dist/` live in `*.build-test.ts` and run from
 * `vitest.build.config.ts` via `npm run test:build`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.build-test.ts'],
  },
});
