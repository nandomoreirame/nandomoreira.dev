import { z } from 'zod';
import type { Block } from '../../content/blocks';
import { collectionOfBlock } from '../catalog/groups';
import { SourceError, fetchJson } from './http';

const DAY_MS = 24 * 60 * 60 * 1000;

const REPOS_URL =
  'https://api.github.com/users/nandomoreirame/repos?sort=pushed&per_page=30&type=owner';

const repoSchema = z.object({
  name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  pushed_at: z.string(),
  fork: z.boolean(),
  archived: z.boolean(),
  private: z.boolean(),
});

const reposSchema = z.array(repoSchema);

export interface ActiveRepo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
}

export interface RepoCaseLink {
  slug: string;
  block: Block;
  repoUrl?: string | null;
}

const repoKey = (url: string): string => url.replace(/\/+$/, '').toLowerCase();

export const parseActiveRepos = (
  json: unknown,
  {
    now,
    exclude,
    windowDays = 30,
    limit = 5,
  }: { now: Date; exclude: readonly string[]; windowDays?: number; limit?: number },
): ActiveRepo[] => {
  const parsed = reposSchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  const cutoff = now.getTime() - windowDays * DAY_MS;
  const excluded = new Set(exclude.map((name) => name.toLowerCase()));

  return parsed.data
    .filter((repo) => !repo.fork && !repo.archived && !repo.private)
    .filter((repo) => !excluded.has(repo.name.toLowerCase()))
    .filter((repo) => Date.parse(repo.pushed_at) >= cutoff)
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, limit)
    .map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      pushedAt: repo.pushed_at,
    }));
};

/** Case page when a project lists this repo; the GitHub URL otherwise (REQ-006). */
export const linkForRepo = (repo: { url: string }, projects: readonly RepoCaseLink[]): string => {
  const key = repoKey(repo.url);
  const match = projects.find((project) => project.repoUrl && repoKey(project.repoUrl) === key);
  if (!match) return repo.url;
  return `/${collectionOfBlock(match.block)}/${match.slug}`;
};

export const fetchActiveRepos = async ({
  fetch: fetchImpl,
  token,
  now,
  exclude,
}: {
  fetch: typeof fetch;
  token?: string;
  now: Date;
  exclude: readonly string[];
}): Promise<ActiveRepo[]> => {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'nandomoreira.dev',
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const json = await fetchJson(fetchImpl, REPOS_URL, { headers });
  return parseActiveRepos(json, { now, exclude });
};
