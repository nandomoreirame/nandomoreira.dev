import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = readFileSync('apphosting.yaml', 'utf8');

describe('apphosting.yaml', () => {
  it('starts the standalone entrypoint the build actually emits', () => {
    expect(manifest).toContain('node ./dist/server/entry.mjs');
  });

  it('binds on all interfaces, or Cloud Run health checks never reach the process', () => {
    expect(manifest).toContain('0.0.0.0');
  });

  it('scales to zero, so an idle personal site costs nothing', () => {
    expect(manifest).toContain('minInstances: 0');
  });
});
