#!/usr/bin/env node
/**
 * Raw material for one day of /releases/17 (src/data/releases/<date>.md).
 *
 *   node scripts/release-draft.mjs [YYYY-MM-DD]           the day's macro commits and its version tag
 *   node scripts/release-draft.mjs [YYYY-MM-DD] --json    the same, as JSON (read by /release-day)
 *   node scripts/release-draft.mjs [YYYY-MM-DD] --write   creates the file with [[PREENCHER]] placeholders
 *   node scripts/release-draft.mjs --check                warns about days with visible commits and no release
 *
 * The date defaults to today in São Paulo. The placeholders fail the schema
 * (src/lib/releases/data.ts), so a skeleton nobody wrote never builds. The
 * check only warns: it always exits 0, since a feat lands before its release
 * is written. Days that changed nothing a visitor sees go in skipped.json.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PLACEHOLDER = '[[PREENCHER]]';
export const RELEASES_DIR = 'src/data/releases';
const SKIPPED_FILE = `${RELEASES_DIR}/skipped.json`;
/** The first commit of version 17: days before it belong to other repositories. */
const FIRST_DAY = '2026-08-08';
const SITE_VERSION = 17;
/** Commit types a visitor can notice; tests, docs, chores and styling are not a release. */
const VISIBLE_TYPES = new Set(['feat', 'fix', 'perf', 'content']);

export const dayBounds = date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`not an ISO date: ${date}`);
  return { since: `${date}T00:00:00-03:00`, until: `${date}T23:59:59-03:00` };
};

/** "✨ feat(now): subject" -> { type, scope, subject }; lines that are not Conventional Commits are dropped. */
export const parseCommits = text =>
  text
    .split('\n')
    .map(line => line.trim().match(/^(?:\S+\s+)?([a-z]+)(?:\(([^)]+)\))?!?:\s+(.+)$/))
    .filter(Boolean)
    .map(([, type, scope = '', subject]) => ({ type, scope, subject }));

/** Visible commits grouped by scope, scopes in alphabetical order. */
export const macroCommits = commits => {
  const groups = {};
  for (const { type, scope, subject } of commits) {
    if (!VISIBLE_TYPES.has(type)) continue;
    (groups[scope || 'site'] ??= []).push(`${type}: ${subject}`);
  }
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
};

export const releaseSkeleton = ({ date, version, groups }) =>
  [
    '---',
    `version: ${version}`,
    `date: "${date}"`,
    `title: "${PLACEHOLDER}"`,
    `summary: "${PLACEHOLDER}"`,
    'highlights:',
    `  - "${PLACEHOLDER}"`,
    `  - "${PLACEHOLDER}"`,
    '# Commits of the day, raw material for the text above (delete when done):',
    ...Object.entries(groups).flatMap(([scope, items]) => items.map(item => `# ${scope}: ${item}`)),
    '---',
    '',
  ].join('\n');

export const missingDays = ({ visibleDays, releaseDays, skipped }) => {
  const covered = new Set([...releaseDays, ...skipped]);
  return [...new Set(visibleDays)].filter(day => !covered.has(day)).sort();
};

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', env: { ...process.env, TZ: 'America/Sao_Paulo' } }).trim();

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

const versionAt = until => `v${SITE_VERSION}.${git('rev-list', '--count', `--before=${until}`, 'HEAD')}`;

const dayMaterial = date => {
  const { since, until } = dayBounds(date);
  const commits = parseCommits(git('log', '--no-merges', `--since=${since}`, `--until=${until}`, '--format=%s'));
  return { date, version: versionAt(until), file: `${RELEASES_DIR}/${date}.md`, groups: macroCommits(commits) };
};

const releaseDays = () =>
  readdirSync(RELEASES_DIR)
    .filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .map(name => name.slice(0, 10));

const visibleDays = () =>
  git('log', '--no-merges', `--since=${FIRST_DAY}T00:00:00-03:00`, '--format=%cd %s', '--date=format-local:%Y-%m-%d')
    .split('\n')
    .filter(line => parseCommits(line.slice(11)).some(commit => VISIBLE_TYPES.has(commit.type)))
    .map(line => line.slice(0, 10));

const main = argv => {
  if (argv.includes('--check')) {
    const skipped = existsSync(SKIPPED_FILE) ? Object.keys(JSON.parse(readFileSync(SKIPPED_FILE, 'utf8'))) : [];
    const missing = missingDays({ visibleDays: visibleDays(), releaseDays: releaseDays(), skipped });
    if (missing.length === 0) console.log('RELEASES UP TO DATE');
    else
      console.warn(`WARN: days with visible commits and no release: ${missing.join(', ')} (run /release-day <date>)`);
    return;
  }

  const date = argv.find(arg => !arg.startsWith('--')) ?? today();
  const material = dayMaterial(date);

  if (argv.includes('--json')) {
    console.log(JSON.stringify({ ...material, exists: existsSync(material.file) }, null, 2));
    return;
  }

  if (argv.includes('--write')) {
    if (existsSync(material.file)) throw new Error(`${material.file} already exists; edit it instead`);
    writeFileSync(material.file, releaseSkeleton(material));
    console.log(`wrote ${material.file} (${material.version})`);
    return;
  }

  console.log(`${material.date} ${material.version}`);
  for (const [scope, items] of Object.entries(material.groups))
    for (const item of items) console.log(`  ${scope}: ${item}`);
  if (Object.keys(material.groups).length === 0) console.log('  nothing a visitor would see');
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main(process.argv.slice(2));
