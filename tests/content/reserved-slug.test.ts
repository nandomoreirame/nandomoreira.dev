import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';
import { projectSchema } from '../../src/content/schemas/project';

const post = postSchema({
  image: (() => z.string()) as unknown as SchemaContext['image'],
});

const projectBase = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling' as const,
  summary: 's',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  tech: ['Rust'],
  repoUrl: 'https://github.com/nandomoreirame/forja',
  featured: false,
  confidential: false,
  date: '2026-05-01',
};

const postBase = {
  slug: 'exemplo',
  title: 'Exemplo',
  summary: 's',
  date: '2015-09-30',
  markers: ['um', 'dois', 'tres'],
};

describe('reserved slug ia', () => {
  it('rejects slug ia on a project, because /<x>/ia is the AI view', () => {
    const result = projectSchema.safeParse({ ...projectBase, slug: 'ia' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => /\/<x>\/ia|visão IA|AI view/i.test(issue.message))).toBe(
        true,
      );
    }
  });

  it('rejects slug ia on a post, because /<x>/ia is the AI view', () => {
    const result = post.safeParse({ ...postBase, slug: 'ia' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => /\/<x>\/ia|visão IA|AI view/i.test(issue.message))).toBe(
        true,
      );
    }
  });

  it('accepts slug iaas on a project', () => {
    expect(projectSchema.safeParse({ ...projectBase, slug: 'iaas' }).success).toBe(true);
  });

  it('accepts slug iaas on a post', () => {
    expect(post.safeParse({ ...postBase, slug: 'iaas' }).success).toBe(true);
  });
});
