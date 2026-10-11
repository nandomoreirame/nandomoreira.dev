import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  POINTER_MARKER,
  executableScripts,
  scriptViolations,
  type PageScripts,
} from '../helpers/client-scripts';

const PORT = Number(process.env.GATE_PORT ?? 4931);
const BASE = `http://127.0.0.1:${PORT}`;
const CLIENT = 'dist/client';
// /404 is SSR too (no prerender) and renders the full BaseLayout; /projetos* only redirect.
const SSR_ROUTES = ['/', '/sobre', '/contato', '/posts', '/posts/arquivo', '/portfolio', '/lab', '/now', '/404'];

const readSrc = (src: string): string => readFileSync(join(CLIENT, src.replace(/^\//, '')), 'utf8');

/** Every pre-rendered page: case pages, posts, the yearly archive. */
const prerendered = (dir = CLIENT, route = ''): PageScripts[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === '_astro' ? [] : prerendered(path, `${route}/${entry}`);
    }
    if (entry !== 'index.html') return [];
    return [{ route: route || '/', scripts: executableScripts(readFileSync(path, 'utf8'), readSrc) }];
  });

const served = async (route: string): Promise<PageScripts> => {
  const response = await fetch(`${BASE}${route}`);
  // A 500 or a renamed route would return a page with no scripts and pass vacuously.
  const expected = route === '/404' ? 404 : 200;
  if (response.status !== expected) throw new Error(`${route} answered ${response.status}, expected ${expected}`);
  return { route, scripts: executableScripts(await response.text(), readSrc) };
};

const answers = async (): Promise<boolean> => {
  try {
    return (await fetch(`${BASE}/api/health`)).ok;
  } catch {
    return false;
  }
};

let server: ChildProcess | undefined;

beforeAll(async () => {
  // A stale server left on the port would be gated instead of the current dist.
  if (await answers()) throw new Error(`${BASE} already answers; free the port or set GATE_PORT`);
  // Placeholders: /api/hire refuses to boot without them (REQ-010 of hire-endpoint).
  server = spawn('node', ['dist/server/entry.mjs'], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(PORT),
      RESEND_API_KEY: 're_placeholder_not_a_real_key',
      HIRE_NOTIFY_TO: 'gate@example.com',
      HIRE_NOTIFY_FROM: 'gate@example.com',
    },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`the built server exited with ${server.exitCode}`);
    if (await answers()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`the built server never answered on ${BASE}; is the port free?`);
}, 20_000);

afterAll(() => {
  server?.kill();
});

describe('client JavaScript', () => {
  it('requires a build to have run', () => {
    expect(existsSync('dist/server/entry.mjs')).toBe(true);
  });

  it('ships only the pointer effect, only where allowed, within budget', async () => {
    const pages = [...(await Promise.all(SSR_ROUTES.map(served))), ...prerendered()];
    expect(scriptViolations(pages)).toEqual([]);
  });

  it.each(['/', '/lab', '/sobre'])('actually ships the effect on %s, so the gate is not vacuous', async (route) => {
    const { scripts } = await served(route);
    expect(scripts.some((script) => script.includes(POINTER_MARKER))).toBe(true);
  });

  it('leaves no stray script file in the client asset dir', () => {
    const dir = join(CLIENT, '_astro');
    const files = existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith('.js')) : [];
    for (const file of files) expect(readFileSync(join(dir, file), 'utf8')).toContain(POINTER_MARKER);
  });
});
