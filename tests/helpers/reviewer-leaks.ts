import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

/** What only the dev-only reviewer would put in a build (spec post-review, REQ-001). */
const MARKERS = ['post-review:', 'Revisar texto', 'data-post-review'];
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.txt', '.md']);

const filesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

export const reviewerLeaks = (dir: string): string[] =>
  filesUnder(dir).filter(
    file => TEXT.has(extname(file)) && MARKERS.some(marker => readFileSync(file, 'utf8').includes(marker)),
  );
