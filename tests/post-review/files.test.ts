import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { POSTS_DIR, REVIEW_DIR, postFileFor, reviewFileFor, titleOf } from '../../src/lib/post-review/files';

let root = '';

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'post-review-'));
  mkdirSync(join(root, POSTS_DIR), { recursive: true });
  writeFileSync(join(root, POSTS_DIR, 'meu-post.md'), '---\ntitle: x\n---\n');
});

describe('post-review files', () => {
  it('resolves an existing post to its relative path', () => {
    expect(postFileFor(root, 'meu-post')).toBe('src/content/posts/meu-post.md');
  });

  it('is null for a missing post or a malformed slug', () => {
    expect(postFileFor(root, 'outro-post')).toBeNull();
    expect(postFileFor(root, '../meu-post')).toBeNull();
  });

  it('puts the review under docs/post-reviews', () => {
    expect(REVIEW_DIR).toBe('docs/post-reviews');
    expect(reviewFileFor('meu-post')).toBe('docs/post-reviews/meu-post.md');
  });

  it('reads the frontmatter title, quoted or not', () => {
    expect(titleOf('---\ntitle: "Com aspas: sim"\nslug: x\n---\nCorpo', 'x')).toBe('Com aspas: sim');
    expect(titleOf("---\ntitle: 'Simples'\n---\n", 'x')).toBe('Simples');
    expect(titleOf('---\ntitle: Sem aspas\n---\n', 'x')).toBe('Sem aspas');
  });

  it('falls back to the slug without a title', () => {
    expect(titleOf('Sem frontmatter\ntitle: falso', 'meu-post')).toBe('meu-post');
  });
});
