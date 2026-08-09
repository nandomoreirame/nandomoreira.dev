import { describe, expect, it } from 'vitest';
import { collections } from '../../src/content.config';

describe('posts collection', () => {
  it('is named posts, matching the route it feeds', () => {
    // A collection called `notes` feeding /posts forces every future reader to
    // translate between the two names.
    expect(Object.keys(collections)).toContain('posts');
    expect(Object.keys(collections)).not.toContain('notes');
  });
});
