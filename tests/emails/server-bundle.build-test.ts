import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The templates are .tsx under an Astro project whose tsconfig says
 * "jsx": "preserve". Vitest (esbuild) honours the per-file pragma, the Astro
 * build did not and failed with "Unexpected JSX expression" (2026-10-19), so
 * only the real build proves the server bundle carries them.
 */
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.mjs') ? [path] : [];
  });

describe('e-mail templates in the server build', () => {
  it('requires a build to have run', () => {
    expect(existsSync('dist/server/entry.mjs')).toBe(true);
  });

  it('bundles the rendered templates, with JSX compiled away', () => {
    const bundle = files('dist/server')
      .map(file => readFileSync(file, 'utf8'))
      .join('\n');
    for (const text of ['quer conversar', 'baixou seu currículo', 'mensagem automática']) {
      expect(bundle).toContain(text);
    }
  });
});
