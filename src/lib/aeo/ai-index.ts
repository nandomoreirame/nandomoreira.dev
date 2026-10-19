import type { Post } from '../../content/schemas/post';
import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock, type CatalogCollection } from '../catalog/groups';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  profile: Profile;
  projects: readonly Project[];
  posts?: readonly Post[];
}

interface PageEntry {
  type: 'page';
  url: string;
  title: string;
}

interface CaseEntry {
  type: 'case';
  url: string;
  title: string;
  summary: string;
  collection: CatalogCollection;
  tech: string[];
  markdown: string;
}

interface PostEntry {
  type: 'post';
  url: string;
  title: string;
  summary: string;
  date: string;
}

export type AiIndexEntry = PageEntry | CaseEntry | PostEntry;

interface MachineRoute {
  path: string;
  url: string;
  description: string;
}

export interface AiIndex {
  name: string;
  headline: string;
  url: string;
  updatedAt: string;
  language: { human: 'pt-BR'; machine: 'en' };
  availability: { status: Profile['availability']['status']; updatedAt: string };
  entries: AiIndexEntry[];
  machineRoutes: MachineRoute[];
}

const PAGES: ReadonlyArray<{ path: string; title: string }> = [
  { path: '/', title: 'Home' },
  { path: '/sobre', title: 'About' },
  { path: '/portfolio', title: 'Portfolio' },
  { path: '/lab', title: 'Lab' },
  { path: '/posts', title: 'Posts' },
  { path: '/mcp', title: 'MCP' },
  { path: '/setup', title: 'Setup' },
  { path: '/now', title: 'Now' },
];

const MACHINE_ROUTE_DESCRIPTIONS: ReadonlyArray<{ path: string; description: string }> = [
  { path: '/llms.txt', description: 'LLM summary index of the site' },
  { path: '/llms-full.txt', description: 'Full LLM-oriented dump of profile, cases and posts' },
  { path: '/ai-index.json', description: 'Machine-readable index of pages, cases and posts' },
  { path: '/AGENTS.md', description: 'Hiring brief for agents: services, availability, endpoints' },
  { path: '/sitemap.xml', description: 'XML sitemap of indexable public URLs' },
  { path: '/api/resume.json', description: 'Résumé in JSON Resume schema' },
  { path: '/api/resume.txt', description: 'Plain-text résumé, LLM friendly' },
  { path: '/api/mcp', description: 'MCP server for profile, projects, resume and availability' },
  { path: '/api/hire', description: 'POST a project brief on behalf of your user' },
];

export const buildAiIndex = ({ site, profile, projects, posts = [] }: Input): AiIndex => {
  const entries: AiIndexEntry[] = [
    ...PAGES.map((page): PageEntry => ({
      type: 'page',
      url: absoluteUrl(site, page.path),
      title: page.title,
    })),
    ...projects.map((project): CaseEntry => {
      const collection = collectionOfBlock(project.block);
      const path = `/${collection}/${project.slug}`;

      return {
        type: 'case',
        url: absoluteUrl(site, path),
        title: project.title,
        summary: project.summary,
        collection,
        tech: [...project.tech],
        markdown: absoluteUrl(site, `${path}.md`),
      };
    }),
    ...posts.map((post): PostEntry => ({
      type: 'post',
      url: absoluteUrl(site, `/${post.slug}`),
      title: post.title,
      summary: post.summary,
      date: post.date,
    })),
  ];

  return {
    name: profile.name,
    headline: profile.headline,
    url: absoluteUrl(site, '/'),
    updatedAt: profile.availability.updatedAt,
    language: { human: 'pt-BR', machine: 'en' },
    availability: {
      status: profile.availability.status,
      updatedAt: profile.availability.updatedAt,
    },
    entries,
    machineRoutes: MACHINE_ROUTE_DESCRIPTIONS.map(route => ({
      path: route.path,
      url: absoluteUrl(site, route.path),
      description: route.description,
    })),
  };
};
