import { describe, expect, it } from 'vitest';
import { postTranslationSchema } from '../../src/content/schemas/post-translation';
import { projectTranslationSchema } from '../../src/content/schemas/project-translation';

const post = {
  slug: 'the-false-green',
  translationOf: 'o-falso-verde',
  title: 'The false green',
  summary: 'S',
  markers: ['testing', 'agents', 'quality'],
};

describe('postTranslationSchema', () => {
  it('accepts the translatable fields only', () => {
    expect(postTranslationSchema.parse(post)).toMatchObject(post);
  });

  it('rejects structural fields: they come from the source (C1)', () => {
    expect(postTranslationSchema.safeParse({ ...post, date: '2026-10-09' }).success).toBe(false);
    expect(postTranslationSchema.safeParse({ ...post, draft: true }).success).toBe(false);
    expect(postTranslationSchema.safeParse({ ...post, art: 'wave' }).success).toBe(false);
  });

  it.each(['ia', 'en', 'Not-Kebab', ''])('rejects the slug %j (REQ-006)', (slug) => {
    expect(postTranslationSchema.safeParse({ ...post, slug }).success).toBe(false);
  });

  it('keeps the pt-BR field limits', () => {
    expect(postTranslationSchema.safeParse({ ...post, markers: ['a', 'b'] }).success).toBe(false);
    expect(postTranslationSchema.safeParse({ ...post, seoTitle: 'x'.repeat(61) }).success).toBe(false);
    expect(postTranslationSchema.safeParse({ ...post, extras: ['x'.repeat(61)] }).success).toBe(false);
    expect(postTranslationSchema.safeParse({ ...post, keyPoints: ['x'.repeat(141)] }).success).toBe(false);
  });
});

describe('projectTranslationSchema', () => {
  const project = { translationOf: 'forja', summary: 's', problem: 'p', decisions: 'd', outcome: 'o' };

  it('accepts text fields, ordered alts and shortcut actions', () => {
    expect(projectTranslationSchema.parse({ ...project, imageAlts: ['a'], shortcutActions: ['b'] })).toMatchObject(project);
  });

  it('rejects structural and confidential-identity fields', () => {
    expect(projectTranslationSchema.safeParse({ ...project, tech: ['Rust'] }).success).toBe(false);
    expect(projectTranslationSchema.safeParse({ ...project, clientName: 'X' }).success).toBe(false);
    expect(projectTranslationSchema.safeParse({ ...project, repoUrl: 'https://x.dev' }).success).toBe(false);
  });
});
