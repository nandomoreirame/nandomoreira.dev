import { gzipSync } from 'node:zlib';

export interface PageScripts {
  route: string;
  scripts: string[];
}

export const POINTER_MARKER = 'data-pointer-field';
export const POINTER_BUDGET_BYTES = 1536;

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

/** The single exception (docs/specs/generative-case-art, REQ-012). */
export const scriptViolations = (pages: PageScripts[]): string[] =>
  pages.flatMap(({ route, scripts }) =>
    scripts.flatMap((script) => {
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
