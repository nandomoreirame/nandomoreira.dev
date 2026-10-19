import { gzipSync } from 'node:zlib';

export interface PageScripts {
  route: string;
  scripts: string[];
}

export const POINTER_MARKER = 'data-pointer-field';
// Raised from 1536 on 2026-10-19 (command-palette): Vite wraps the loader's import() in __vitePreload (~717 B gzip).
export const POINTER_BUDGET_BYTES = 2304;

/**
 * Every executable script of a page: inline bodies, plus external ones read
 * through `readSrc`. JSON-LD is data, not code, and is skipped. Inline matters:
 * Astro inlines a small component script, so a gate that only lists files in
 * dist/client/_astro never sees it.
 */
export const executableScripts = (html: string, readSrc?: (src: string) => string): string[] =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/type\s*=\s*["']application\/ld\+json["']/i.test(attrs))
    .map(([, attrs, body]) => {
      const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      return src && readSrc ? readSrc(src) : body.trim();
    });

/** Second named exception: the audio preview, on /now only (docs/specs/now-page, REQ-027). */
export const NOW_PREVIEW_MARKER = 'data-now-preview';
export const NOW_PREVIEW_ROUTE = '/now';
export const NOW_PREVIEW_BUDGET_BYTES = 1024;

/** The site-wide exception (docs/specs/generative-case-art, REQ-012) plus the /now one. */
export const scriptViolations = (pages: PageScripts[]): string[] =>
  pages.flatMap(({ route, scripts }) =>
    scripts.flatMap(script => {
      if (script.includes(NOW_PREVIEW_MARKER)) {
        if (route !== NOW_PREVIEW_ROUTE) return [`${route}: audio preview outside ${NOW_PREVIEW_ROUTE}`];
        const size = gzipSync(script).length;
        return size > NOW_PREVIEW_BUDGET_BYTES
          ? [`${route}: audio preview is ${size} B gzip, budget ${NOW_PREVIEW_BUDGET_BYTES}`]
          : [];
      }
      if (!script.includes(POINTER_MARKER)) return [`${route}: script outside the allowlist`];
      // The effect covers the whole site since 2026-10-08: any page may carry it.
      const problems: string[] = [];
      const size = gzipSync(script).length;
      if (size > POINTER_BUDGET_BYTES) {
        problems.push(`${route}: pointer effect is ${size} B gzip, budget ${POINTER_BUDGET_BYTES}`);
      }
      return problems;
    }),
  );

/** Third named exception (docs/specs/command-palette, D1): an on-demand chunk, never a page script. */
export const PALETTE_MARKER = 'data-command-palette';
export const PALETTE_BUDGET_BYTES = 4096;

export const paletteChunkViolations = (chunks: Array<{ file: string; body: string }>): string[] =>
  chunks
    .filter(({ body }) => body.includes(PALETTE_MARKER))
    .flatMap(({ file, body }) => {
      const size = gzipSync(body).length;
      return size > PALETTE_BUDGET_BYTES
        ? [`${file}: command palette is ${size} B gzip, budget ${PALETTE_BUDGET_BYTES}`]
        : [];
    });
