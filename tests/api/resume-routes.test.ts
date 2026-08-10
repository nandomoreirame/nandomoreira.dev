import { readFileSync } from 'node:fs';
import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { GET as getResumeJson } from '../../src/pages/api/resume.json';
import { GET as getResumeTxt } from '../../src/pages/api/resume.txt';

const context = () =>
  ({ site: new URL('https://nandomoreira.dev') }) as unknown as APIContext;

describe('GET /api/resume.json', () => {
  it('responds 200 as application/json', async () => {
    const response = await getResumeJson(context());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('serves a payload an agent can read without rendering a page', async () => {
    const body = await (await getResumeJson(context())).json();

    expect(body.basics.name).toBeTruthy();
    expect(body.x_agent.availability.status).toBeTruthy();
  });

  it('reads through the access layer, never through getCollection', () => {
    const source = readFileSync('src/pages/api/resume.json.ts', 'utf8');

    expect(source).not.toContain('getCollection(');
  });
});

describe('GET /api/resume.txt', () => {
  it('responds 200 as text/plain', async () => {
    const response = await getResumeTxt(context());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/text\/plain/);
  });

  it('renders the same name as the JSON route, from the same source', async () => {
    const json = await (await getResumeJson(context())).json();
    const text = await (await getResumeTxt(context())).text();

    expect(text).toContain(json.basics.name);
  });

  it('reads through the access layer, never through getCollection', () => {
    const source = readFileSync('src/pages/api/resume.txt.ts', 'utf8');

    expect(source).not.toContain('getCollection(');
  });
});

describe('both resume routes', () => {
  it.each(['src/pages/api/resume.json.ts', 'src/pages/api/resume.txt.ts'])(
    '%s opts out of prerendering, since it is served by the node adapter',
    (file) => {
      expect(readFileSync(file, 'utf8')).toContain('prerender = false');
    },
  );
});
