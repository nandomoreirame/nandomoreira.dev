import { defineConfig } from 'vitest/config';

/**
 * Build suite: assertions about build output. Requires `npm run build` first,
 * so it is kept out of `npm test` — otherwise a fresh clone fails on a missing
 * `dist/`, which is gitignored.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.build-test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
