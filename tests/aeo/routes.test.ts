import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROUTES = [
  { file: 'src/pages/llms.txt.ts', contentType: 'text/plain' },
  { file: 'src/pages/AGENTS.md.ts', contentType: 'text/markdown' },
  { file: 'src/pages/robots.txt.ts', contentType: 'text/plain' },
  { file: 'src/pages/sitemap.xml.ts', contentType: 'application/xml' },
];

describe('machine routes', () => {
  it.each(ROUTES)('$file declares $contentType', ({ file, contentType }) => {
    expect(readFileSync(file, 'utf8')).toContain(contentType);
  });

  it.each(ROUTES)('$file opts out of prerendering', ({ file }) => {
    expect(readFileSync(file, 'utf8')).toContain('prerender = false');
  });

  it.each(ROUTES)('$file reads through the access layer only', ({ file }) => {
    expect(readFileSync(file, 'utf8')).not.toContain('getCollection(');
  });
});
