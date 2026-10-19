#!/usr/bin/env node
/**
 * Migrate Gatsby (and Notion) blog posts into src/content/posts + src/assets/posts.
 *
 * Usage:
 *   node scripts/migrate-blog.mjs --dry-run --source ~/dev/projects/blog-import-gatsby
 *   node scripts/migrate-blog.mjs --images-only --source ... [--assets ...]
 *   node scripts/migrate-blog.mjs --source ... [--assets ...]
 *   node scripts/migrate-blog.mjs --source ~/Downloads/posts --notion --current
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const POSTS_DIR = join(ROOT, 'src/content/posts');
const ASSETS_DIR = join(ROOT, 'src/assets/posts');
const REPORT_PATH = join(ROOT, 'MIGRATION-REPORT.md');

/** Gatsby slug to skip when importing from Gatsby (Notion revision wins). */
const SKIP_GATSBY_SLUGS = new Set(['calendario-rapido-direto-no-terminal']);

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const valueOf = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const dryRun = flag('--dry-run');
const imagesOnly = flag('--images-only');
const notionMode = flag('--notion');
const asCurrent = flag('--current');
const sourceRoot = resolve(valueOf('--source') ?? join(process.env.HOME ?? '', 'dev/projects/blog-import-gatsby'));
const assetsRoot = resolve(valueOf('--assets') ?? process.env.BLOG_ASSETS ?? '/tmp/blog-gatsby-tarball/content/assets');

const report = {
  postsWritten: 0,
  imagesCopied: 0,
  missingImages: [],
  skipped: [],
  collisions: [],
  errors: [],
};

const ensureDir = dir => {
  if (!dryRun) mkdirSync(dir, { recursive: true });
};

const yamlQuote = value => {
  const s = String(value);
  if (/[:#{}[\],&*?|>!%@`]/.test(s) || s.includes("'") || s.includes('"') || s.includes('\n')) {
    return JSON.stringify(s);
  }
  return s;
};

const parseFrontmatter = raw => {
  if (!raw.startsWith('---')) {
    return { data: {}, body: raw };
  }
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return { data: {}, body: raw };
  const fm = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, '');
  const data = {};
  let currentKey = null;
  let listMode = false;

  for (const line of fm.split('\n')) {
    if (/^\s+-\s+/.test(line) && currentKey) {
      const item = line.replace(/^\s+-\s+/, '').replace(/^['"]|['"]$/g, '');
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(item);
      listMode = true;
      continue;
    }
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    currentKey = m[1];
    listMode = false;
    let v = m[2].trim();
    if (v === '' || v === '|' || v === '>') {
      data[currentKey] = [];
      listMode = true;
      continue;
    }
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1);
    }
    data[currentKey] = v;
  }

  if (listMode) {
    // no-op: arrays already filled
  }
  return { data, body };
};

const pathFromImageField = image => {
  if (!image) return null;
  return String(image)
    .replace(/^['"]|['"]$/g, '')
    .trim();
};

/**
 * Resolve a source image path referenced from a post file.
 * Tries: absolute resolve from post dir, then assets root for ../../../assets/… tails.
 */
const resolveSourceImage = (postDir, ref) => {
  let cleaned = ref.replace(/^['"]|['"]$/g, '').trim();
  if (!cleaned || cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return { path: null, reason: 'remote-or-empty' };
  }

  // Notion export encodes spaces and accents in markdown links.
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // keep original
  }

  const fromPost = resolve(postDir, cleaned);
  if (existsSync(fromPost)) return { path: fromPost };

  // Notion sometimes truncates the folder name in the link; search by basename.
  const base = basename(cleaned);
  if (base && base !== cleaned) {
    const walkFind = (dir, depth = 0) => {
      if (depth > 4 || !existsSync(dir)) return null;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isFile() && entry.name === base) return p;
        if (entry.isDirectory()) {
          const hit = walkFind(p, depth + 1);
          if (hit) return hit;
        }
      }
      return null;
    };
    const found = walkFind(postDir);
    if (found) return { path: found };
  }

  // ../../../assets/<rest> or ./foo when assets live in the Gatsby tree
  const assetsTail = cleaned.match(/(?:^|\/)assets\/(.+)$/);
  if (assetsTail) {
    const candidate = join(assetsRoot, assetsTail[1]);
    if (existsSync(candidate)) return { path: candidate };
  }

  // Bare ../../../assets/foo.png → assetsRoot/foo.png
  if (cleaned.includes('assets/')) {
    const after = cleaned.split('assets/').pop();
    const candidate = join(assetsRoot, after);
    if (existsSync(candidate)) return { path: candidate };
  }

  // Sibling relative like ../other-post/img.jpg
  if (existsSync(fromPost)) return { path: fromPost };

  return { path: null, reason: 'missing', attempted: fromPost };
};

/** Destination filename under src/assets/posts/<year>/, with month prefix on collision. */
const destNameFor = (_year, sourcePath, monthHint, usedNames) => {
  let name = basename(sourcePath);
  const key = name.toLowerCase();
  if (usedNames.has(key)) {
    const month = monthHint ?? 'xx';
    const prefixed = `${month}-${name}`;
    if (!usedNames.has(prefixed.toLowerCase())) {
      name = prefixed;
    } else {
      const ext = extname(name);
      const base = basename(name, ext);
      let i = 2;
      while (usedNames.has(`${base}-${i}${ext}`.toLowerCase())) i += 1;
      name = `${base}-${i}${ext}`;
    }
  }
  usedNames.add(name.toLowerCase());
  return name;
};

const yearUsedNames = new Map();
/** source absolute path → relative cover path already copied */
const copiedSources = new Map();
const usedNamesForYear = year => {
  if (!yearUsedNames.has(year)) yearUsedNames.set(year, new Set());
  return yearUsedNames.get(year);
};

const copyImage = (sourcePath, year, monthHint) => {
  const cacheKey = resolve(sourcePath);
  if (copiedSources.has(cacheKey)) return copiedSources.get(cacheKey);

  const used = usedNamesForYear(year);
  const destName = destNameFor(year, sourcePath, monthHint, used);
  const destDir = join(ASSETS_DIR, year);
  const destPath = join(destDir, destName);
  ensureDir(destDir);
  if (!dryRun) copyFileSync(sourcePath, destPath);
  report.imagesCopied += 1;
  // Frontmatter cover path relative to src/content/posts/<file>.md
  const rel = `../../assets/posts/${year}/${destName}`;
  copiedSources.set(cacheKey, rel);
  return rel;
};

const rewriteBodyImages = (body, postDir, year, title) => {
  // ![alt](path): rewrite local image refs, drop missing ones
  return body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, rawPath) => {
    const path = rawPath.trim();
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Drop broken Notion/app.notion.com hybrid URLs
      if (path.includes('app.notion.com') || path.includes('../../../assets/')) {
        report.missingImages.push({ post: title, ref: path, action: 'removed-remote-junk' });
        return '';
      }
      return full;
    }

    const resolved = resolveSourceImage(postDir, path);
    if (!resolved.path) {
      report.missingImages.push({ post: title, ref: path, action: 'removed' });
      return '';
    }

    const month = path.match(/\/(\d{2})\//)?.[1] ?? null;
    const destRel = copyImage(resolved.path, year, month);
    const finalAlt = alt.trim() || title;
    return `![${finalAlt}](${destRel})`;
  });
};

const slugFromPath = (pathField, fallbackDir) => {
  if (pathField) {
    return String(pathField)
      .replace(/^\/+|\/+$/g, '')
      .replace(/^['"]|['"]$/g, '');
  }
  return fallbackDir;
};

const toIsoDate = value => {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Notion: "17 de janeiro de 2018"
  const pt = /^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/i.exec(s);
  if (pt) {
    const months = {
      janeiro: '01',
      fevereiro: '02',
      marco: '03',
      março: '03',
      abril: '04',
      maio: '05',
      junho: '06',
      julho: '07',
      agosto: '08',
      setembro: '09',
      outubro: '10',
      novembro: '11',
      dezembro: '12',
    };
    const m = months[pt[2].toLowerCase()];
    if (m) return `${pt[3]}-${m}-${pt[1].padStart(2, '0')}`;
  }
  return null;
};

const markersFromTags = tags => {
  if (!tags) return undefined;
  const list = Array.isArray(tags) ? tags : [tags];
  const cleaned = list
    .map(t => String(t).trim())
    .filter(Boolean)
    .slice(0, 3);
  return cleaned.length ? cleaned : undefined;
};

const writePost = ({ slug, title, summary, date, markers, archived, body, cover }) => {
  const lines = [
    '---',
    `slug: ${slug}`,
    `title: ${yamlQuote(title)}`,
    `summary: ${yamlQuote(summary)}`,
    `date: "${date}"`,
  ];
  if (markers?.length) {
    lines.push('markers:');
    for (const m of markers) lines.push(`  - ${yamlQuote(m)}`);
  }
  lines.push(`archived: ${archived ? 'true' : 'false'}`);
  if (cover) {
    lines.push('cover:');
    lines.push(`  src: ${yamlQuote(cover.src)}`);
    lines.push(`  alt: ${yamlQuote(cover.alt)}`);
  }
  lines.push('---', '', body.replace(/^\n+/, '').replace(/\n+$/, ''), '');
  const outPath = join(POSTS_DIR, `${slug}.md`);
  ensureDir(POSTS_DIR);
  if (!dryRun) writeFileSync(outPath, lines.join('\n'), 'utf8');
  report.postsWritten += 1;
  return outPath;
};

const findGatsbyPosts = root => {
  const posts = [];
  for (const year of readdirSync(root, { withFileTypes: true })) {
    if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue;
    const yearDir = join(root, year.name);
    for (const slugDir of readdirSync(yearDir, { withFileTypes: true })) {
      if (!slugDir.isDirectory()) continue;
      const index = join(yearDir, slugDir.name, 'index.md');
      if (existsSync(index)) {
        posts.push({ year: year.name, dirName: slugDir.name, file: index });
      }
    }
  }
  return posts;
};

const migrateGatsbyPost = ({ year, dirName, file }) => {
  const raw = readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const slug = slugFromPath(data.path, dirName);

  if (SKIP_GATSBY_SLUGS.has(slug) || SKIP_GATSBY_SLUGS.has(dirName)) {
    report.skipped.push({ slug, reason: 'superseded-by-notion' });
    return;
  }

  const title = data.title ?? dirName;
  const summary = data.description ?? data.summary ?? title;
  const date = toIsoDate(data.date) ?? `${year}-01-01`;
  const markers = markersFromTags(data.tags);
  const postDir = dirname(file);

  let cover;
  const imageRef = pathFromImageField(data.image);
  if (imageRef) {
    const resolved = resolveSourceImage(postDir, imageRef);
    if (resolved.path) {
      const month = imageRef.match(/\/(\d{2})\//)?.[1] ?? null;
      const src = copyImage(resolved.path, year, month);
      cover = { src, alt: title };
    } else {
      report.missingImages.push({ post: slug, ref: imageRef, action: 'cover-omitted' });
    }
  }

  if (imagesOnly) {
    // Still rewrite body images so they get copied
    rewriteBodyImages(body, postDir, year, title);
    return;
  }

  const newBody = rewriteBodyImages(body, postDir, year, title);
  writePost({
    slug,
    title,
    summary,
    date,
    markers,
    archived: !asCurrent,
    body: newBody,
    cover,
  });
};

const findNotionMarkdown = root => {
  const files = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(p);
    }
  };
  walk(root);
  return files;
};

const slugify = text =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const migrateNotionPost = file => {
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split('\n');
  let title = basename(file, '.md').replace(/\s+[0-9a-f]{32}$/i, '');
  if (lines[0]?.startsWith('# ')) {
    title = lines[0].slice(2).trim();
  }

  // Notion export: metadata as key: value lines before body (no --- fence)
  let slug;
  let summary = title;
  let date;
  let bodyStart = 0;
  for (let i = 0; i < Math.min(lines.length, 30); i += 1) {
    const m = /^(slug|description|date|status|category):\s*(.*)$/i.exec(lines[i]);
    if (m) {
      const key = m[1].toLowerCase();
      const val = m[2].trim();
      if (key === 'slug') slug = val;
      if (key === 'description') summary = val;
      if (key === 'date') date = toIsoDate(val) ?? date;
      bodyStart = i + 1;
      continue;
    }
    if (i > 0 && lines[i].trim() === '' && bodyStart > 0) {
      bodyStart = i + 1;
      break;
    }
  }

  slug = slug ?? slugify(title);
  date = date ?? '2024-01-01';
  const year = date.slice(0, 4);
  const postDir = dirname(file);
  let body = lines.slice(bodyStart).join('\n');
  // Drop the H1 if it duplicates title
  body = body.replace(/^#\s+.+\n+/, '');

  // Strip Notion caption duplicates and junk image lines
  body = body.replace(/^Comando .+$/gm, '');
  body = body.replace(/!\[\]\(https:\/\/app\.notion\.com[^)]*\)/g, '');

  if (imagesOnly) {
    rewriteBodyImages(body, postDir, year, title);
    return;
  }

  // Copy local Notion assets referenced as Folder/Untitled.png
  body = rewriteBodyImages(body, postDir, year, title);

  // Prefer first local image as cover if any was rewritten
  const coverMatch = /!\[([^\]]*)\]\((\.\.\/\.\.\/assets\/posts\/[^)]+)\)/.exec(body);
  const cover = coverMatch ? { src: coverMatch[2], alt: coverMatch[1] || title } : undefined;

  writePost({
    slug,
    title,
    summary,
    date,
    markers: undefined,
    archived: !asCurrent,
    body,
    cover,
  });
};

const writeReport = () => {
  const mode = dryRun ? 'dry-run' : imagesOnly ? 'images-only' : 'full';
  const sourceKind = notionMode ? 'notion' : 'gatsby';
  const runId = new Date().toISOString();

  // One section per run so a later batch never erases an earlier record (REQ-017).
  const lines = [
    `## Run ${runId}, mode=${mode}, source=${sourceKind}`,
    '',
    `- Mode: ${mode}`,
    `- Source kind: ${sourceKind}`,
    `- Source: \`${sourceRoot}\``,
    `- Assets: \`${assetsRoot}\``,
    `- Posts written: ${report.postsWritten}`,
    `- Images copied: ${report.imagesCopied}`,
    `- Missing images: ${report.missingImages.length}`,
    `- Skipped: ${report.skipped.length}`,
    '',
    '### Missing images',
    '',
  ];
  if (report.missingImages.length === 0) {
    lines.push('_None._', '');
  } else {
    for (const m of report.missingImages) {
      lines.push(`- \`${m.post}\`: \`${m.ref}\` → ${m.action}`);
    }
    lines.push('');
  }
  lines.push('### Skipped', '');
  if (report.skipped.length === 0) {
    lines.push('_None._', '');
  } else {
    for (const s of report.skipped) {
      lines.push(`- \`${s.slug}\`: ${s.reason}`);
    }
    lines.push('');
  }

  const section = lines.join('\n');

  if (dryRun) {
    console.log(section);
    return;
  }

  const previous = existsSync(REPORT_PATH) ? readFileSync(REPORT_PATH, 'utf8').trimEnd() : '';
  const header = '# Blog migration report';
  const body = previous
    ? previous.startsWith(header)
      ? `${previous}\n\n${section}\n`
      : `${header}\n\n${previous}\n\n${section}\n`
    : `${header}\n\n${section}\n`;

  writeFileSync(REPORT_PATH, body, 'utf8');
};

// --- main ---
if (!existsSync(sourceRoot)) {
  console.error(`Source not found: ${sourceRoot}`);
  process.exit(1);
}

console.log(`migrate-blog: source=${sourceRoot}`);
console.log(`migrate-blog: assets=${assetsRoot} (exists=${existsSync(assetsRoot)})`);
console.log(`migrate-blog: dryRun=${dryRun} imagesOnly=${imagesOnly} notion=${notionMode} current=${asCurrent}`);

if (notionMode) {
  const files = findNotionMarkdown(sourceRoot);
  for (const file of files) migrateNotionPost(file);
} else {
  const posts = findGatsbyPosts(sourceRoot);
  console.log(`migrate-blog: found ${posts.length} Gatsby posts`);
  for (const post of posts) migrateGatsbyPost(post);
}

writeReport();
console.log(
  `Done. posts=${report.postsWritten} images=${report.imagesCopied} missing=${report.missingImages.length} skipped=${report.skipped.length}`,
);
if (report.missingImages.length) {
  console.log('Missing:');
  for (const m of report.missingImages) console.log(`  - ${m.post}: ${m.ref} (${m.action})`);
}
