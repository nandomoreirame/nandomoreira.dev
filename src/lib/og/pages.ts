import type { ArtMotif } from '../../content/motifs';
import type { Block } from '../../content/blocks';
import { collectionOfBlock } from '../catalog/groups';
import { COLLECTION_COPY } from '../catalog/collection-copy';
import { getAllPosts, getAllProjects, getProfile } from '../content';
import { toLongDate } from '../format/date';
import { BLOG_COPY } from '../posts/blog-copy';

/** What the share card of one page shows. */
export interface OgPage {
  /** `index` for the home, else the page path without the leading slash. */
  key: string;
  title: string;
  eyebrow: string;
  art: { slug: string; block: Block; art?: ArtMotif } | { slug: string; block?: undefined; art: ArtMotif };
}

export const ogKey = (path: string): string => (path === '/' ? 'index' : path.replace(/^\/+/, ''));

/** Root-relative URL of the generated card for a page path. */
export const ogImagePath = (path: string): string => `/og/${ogKey(path)}.png`;

/** Posts without a declared drawing (covers, the archive) still get one, stable per slug. */
const FALLBACK_MOTIFS: ArtMotif[] = ['terminal', 'wave', 'orbit', 'mosaic', 'timeline'];
const motifFor = (slug: string): ArtMotif =>
  FALLBACK_MOTIFS[[...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACK_MOTIFS.length]!;

const staticPage = (path: string, title: string, eyebrow: string, art: ArtMotif): OgPage => ({
  key: ogKey(path),
  title,
  eyebrow,
  art: { slug: ogKey(path), art },
});

/**
 * Every page that gets a share card: each HTML page of the sitemap plus the
 * résumé. Noindex pages (the AI view, the 404) reuse the home card.
 */
export const ogPages = async (): Promise<OgPage[]> => {
  const [profile, projects, posts] = await Promise.all([getProfile(), getAllProjects(), getAllPosts()]);
  const years = [...new Set(posts.filter((post) => post.archived).map((post) => post.date.slice(0, 4)))];

  return [
    staticPage('/', profile.headline, 'Portfólio, lab e blog', 'orbit'),
    staticPage('/portfolio', COLLECTION_COPY.portfolio.title, 'Portfólio', 'storefront'),
    staticPage('/lab', COLLECTION_COPY.lab.title, 'Lab', 'wireframe'),
    staticPage('/sobre', profile.headline, 'Sobre', 'mosaic'),
    staticPage('/contato', 'Fale comigo sobre um projeto, uma vaga ou uma proposta', 'Contato', 'wave'),
    staticPage('/mcp', 'Este site fala com Agentes de IA', 'MCP', 'terminal'),
    staticPage('/setup', 'O que eu uso', 'Setup', 'windows'),
    staticPage('/now', 'O que estou fazendo agora', 'Agora', 'timeline'),
    staticPage('/privacidade', 'Política de privacidade', 'Privacidade', 'panels'),
    staticPage('/curriculo', profile.headline, 'Currículo', 'ascent'),
    staticPage('/posts', BLOG_COPY.title, 'Blog', 'calendar'),
    staticPage('/posts/arquivo', 'Textos de 2015 a 2019, mantidos como registro', 'Arquivo', 'gantt'),
    ...years.map((year) => staticPage(`/posts/arquivo/${year}`, `Textos de ${year}`, 'Arquivo', 'calendar')),
    ...projects.map((project) => {
      const collection = collectionOfBlock(project.block);
      return {
        key: `${collection}/${project.slug}`,
        title: project.title,
        eyebrow: collection === 'lab' ? 'Lab' : 'Portfólio',
        art: { slug: project.slug, block: project.block, art: project.art },
      };
    }),
    ...posts.map((post) => ({
      key: post.slug,
      title: post.title,
      eyebrow: `${post.archived ? 'Arquivo' : 'Blog'} · ${toLongDate(post.date)}`,
      art: { slug: post.slug, art: post.art ?? motifFor(post.slug) },
    })),
  ];
};
