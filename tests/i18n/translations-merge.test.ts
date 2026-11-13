import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import type { PostTranslation } from '../../src/content/schemas/post-translation';
import type { Project } from '../../src/content/schemas/project';
import type { ProjectTranslation } from '../../src/content/schemas/project-translation';
import {
  assertPostTranslations,
  assertProjectTranslations,
  mergePost,
  mergeProject,
} from '../../src/lib/content/translations';

const source = (over: Partial<Post> = {}): Post =>
  ({
    slug: 'o-falso-verde',
    title: 'O falso verde',
    summary: 'pt',
    date: '2026-10-09',
    publishedAt: '2026-10-09T10:00:00-03:00',
    markers: ['testes', 'agentes', 'qualidade'],
    draft: false,
    archived: false,
    art: 'wave',
    ...over,
  }) as Post;

const overlay = (over: Partial<PostTranslation> = {}): PostTranslation => ({
  slug: 'the-false-green',
  translationOf: 'o-falso-verde',
  title: 'The false green',
  summary: 'en',
  markers: ['testing', 'agents', 'quality'],
  ...over,
});

describe('mergePost', () => {
  it('takes text from the overlay and structure from the source (REQ-005)', () => {
    const merged = mergePost(source({ draft: true }), overlay());
    expect(merged).toMatchObject({
      slug: 'the-false-green',
      title: 'The false green',
      summary: 'en',
      date: '2026-10-09',
      publishedAt: '2026-10-09T10:00:00-03:00',
      draft: true,
      archived: false,
      art: 'wave',
    });
  });

  it('keeps the cover image and swaps its alt', () => {
    const cover = { src: 'img', alt: 'pt' } as unknown as Post['cover'];
    expect(mergePost(source({ cover }), overlay({ coverAlt: 'en' })).cover).toEqual({ src: 'img', alt: 'en' });
  });
});

describe('assertPostTranslations', () => {
  const sources = [source(), source({ slug: 'velho', archived: true })];

  it('passes a valid set', () => {
    expect(() => assertPostTranslations(sources, [overlay()])).not.toThrow();
  });

  it('fails on an unknown source (REQ-001)', () => {
    expect(() => assertPostTranslations(sources, [overlay({ translationOf: 'nope' })])).toThrow(/the-false-green.*nope/);
  });

  it('fails on an archived source (REQ-002)', () => {
    expect(() => assertPostTranslations(sources, [overlay({ translationOf: 'velho' })])).toThrow(/archived/);
  });

  it('fails on two translations of one source or one slug twice (REQ-003)', () => {
    expect(() => assertPostTranslations(sources, [overlay(), overlay({ slug: 'other' })])).toThrow(/translated twice/);
    expect(() =>
      assertPostTranslations([...sources, source({ slug: 'b' })], [overlay(), overlay({ translationOf: 'b' })]),
    ).toThrow(/slug the-false-green/);
  });

  it('fails when a covered source has no coverAlt (REQ-004)', () => {
    const cover = { src: 'img', alt: 'pt' } as unknown as Post['cover'];
    expect(() => assertPostTranslations([source({ cover })], [overlay()])).toThrow(/coverAlt/);
  });

  it('fails when an English slug collides with a pt-BR one', () => {
    expect(() => assertPostTranslations(sources, [overlay({ slug: 'velho' })])).toThrow(/collides/);
  });
});

const project = (over: Partial<Project> = {}): Project =>
  ({
    slug: 'forja',
    title: 'Forja',
    block: 'ai-tooling',
    summary: 'pt',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Electron'],
    repoUrl: 'https://github.com/x/forja',
    featured: true,
    confidential: false,
    discontinued: false,
    date: '2026-05-01',
    images: [{ src: '/a.webp', alt: 'pt', width: 10, height: 10 }],
    shortcuts: [{ keys: 'Mod+K', action: 'abrir' }],
    ...over,
  }) as Project;

const projectOverlay = (over: Partial<ProjectTranslation> = {}): ProjectTranslation => ({
  translationOf: 'forja',
  summary: 'en',
  problem: 'P',
  decisions: 'D',
  outcome: 'O',
  imageAlts: ['en alt'],
  shortcutActions: ['open'],
  ...over,
});

describe('mergeProject', () => {
  it('keeps slug, links, tech and image files; translates text and alts', () => {
    const merged = mergeProject(project(), projectOverlay());
    expect(merged).toMatchObject({ slug: 'forja', title: 'Forja', tech: ['Electron'], summary: 'en', repoUrl: 'https://github.com/x/forja' });
    expect(merged.images).toEqual([{ src: '/a.webp', alt: 'en alt', width: 10, height: 10 }]);
    expect(merged.shortcuts).toEqual([{ keys: 'Mod+K', action: 'open' }]);
  });

  it('keeps the client name from the source, never from the overlay', () => {
    expect(mergeProject(project({ clientName: 'Acme' }), projectOverlay()).clientName).toBe('Acme');
  });
});

describe('assertProjectTranslations', () => {
  it('fails when alts or actions do not match the source length (REQ-004)', () => {
    expect(() => assertProjectTranslations([project()], [projectOverlay({ imageAlts: [] })])).toThrow(/imageAlts/);
    expect(() => assertProjectTranslations([project()], [projectOverlay({ shortcutActions: undefined })])).toThrow(/shortcutActions/);
  });

  it('fails on an unknown source and on a duplicate (REQ-001, REQ-003)', () => {
    expect(() => assertProjectTranslations([project()], [projectOverlay({ translationOf: 'x' })])).toThrow(/x/);
    expect(() => assertProjectTranslations([project()], [projectOverlay(), projectOverlay()])).toThrow(/translated twice/);
  });
});
