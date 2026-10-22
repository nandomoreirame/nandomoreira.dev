import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reviewerLeaks } from '../helpers/reviewer-leaks';

// Requires `npm run build`. The reviewer is a Dev Toolbar app (spec post-review):
// nothing of it may reach the production build.
describe('post reviewer stays out of the build', () => {
  it('leaves no trace of the reviewer in dist/', () => {
    expect(existsSync('dist/client')).toBe(true);
    expect(reviewerLeaks('dist')).toEqual([]);
  });
});
