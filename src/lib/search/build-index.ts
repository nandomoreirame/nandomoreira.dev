import { collectionOfBlock } from '../catalog/groups';
import type { Locale } from '../i18n/locale';
import { palettePages } from './copy';

export type SearchKind = 'page' | 'post' | 'archive' | 'case' | 'service';

export interface SearchItem {
  kind: SearchKind;
  title: string;
  path: string;
  summary?: string;
  keywords?: string[];
}

interface PostLike {
  slug: string;
  title: string;
  summary: string;
  markers: string[];
  draft?: boolean;
  /** When set, used as the index path (mixed-locale English index). */
  path?: string;
}

interface Input {
  current: readonly PostLike[];
  archived: readonly PostLike[];
  projects: ReadonlyArray<{
    slug: string;
    title: string;
    summary: string;
    tech: string[];
    block: Parameters<typeof collectionOfBlock>[0];
    path?: string;
  }>;
  services: ReadonlyArray<{ title: string; summary: string; url: string }>;
  landingUrl: string;
  locale?: Locale;
}

const postItem =
  (kind: 'post' | 'archive') =>
  (post: PostLike): SearchItem => ({
    kind,
    title: post.title,
    path: post.path ?? `/${post.slug}`,
    summary: post.summary,
    keywords: post.markers,
  });

/** The /search.json body (REQ-005). Drafts never enter, even on dev. */
export const buildSearchIndex = ({
  current,
  archived,
  projects,
  services,
  landingUrl,
  locale = 'pt-BR',
}: Input): SearchItem[] => [
  ...palettePages(locale).map(page => ({ kind: 'page' as const, title: page.title, path: page.path })),
  ...current.filter(post => !post.draft).map(postItem('post')),
  ...projects.map(project => ({
    kind: 'case' as const,
    title: project.title,
    path: project.path ?? `/${collectionOfBlock(project.block)}/${project.slug}`,
    summary: project.summary,
    keywords: project.tech,
  })),
  {
    kind: 'service',
    title: locale === 'en' ? 'Services' : 'Serviços',
    path: landingUrl,
    summary:
      locale === 'en' ? 'Websites, stores and systems for your business' : 'Sites, lojas e sistemas para o seu negócio',
  },
  ...services.map(service => ({
    kind: 'service' as const,
    title: service.title,
    path: service.url,
    summary: service.summary,
  })),
  ...archived.filter(post => !post.draft).map(postItem('archive')),
];
