import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECTS_DIR = 'src/content/projects';

/**
 * Client names that the source keeps for confidential cases, read straight
 * from the frontmatter. The leak gates scan for these instead of a hardcoded
 * name: the employer is public, the clients behind a confidential case are not,
 * and the list follows the content instead of drifting from it.
 */
export const confidentialClientNames = (dir = PROJECTS_DIR): string[] =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .flatMap((file) => {
      const source = readFileSync(join(dir, file), 'utf8');
      const frontmatter = source.split(/^---$/m)[1] ?? '';
      if (!/^confidential:\s*true\s*$/m.test(frontmatter)) return [];
      const client = frontmatter.match(/^clientName:\s*["']?(.+?)["']?\s*$/m)?.[1];
      return client ? [client] : [];
    });

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const clientPattern = (name: string): RegExp =>
  new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
