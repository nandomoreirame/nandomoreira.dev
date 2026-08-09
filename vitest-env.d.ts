/**
 * Project-local augmentation so Astro's type-check accepts the Vitest `test`
 * key on Vite's UserConfig. Vitest ships the same merge via
 * `/// <reference types="vitest/config" />`, but with Vite 8 (Astro 7) and
 * Vitest's nested Vite 7, that reference alone does not always land in
 * `astro check`.
 */
import type { InlineConfig } from 'vitest';

declare module 'vite' {
  interface UserConfig {
    test?: InlineConfig;
  }
}
