import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { postReview } from '../../src/integrations/post-review';

type Handler = (data: unknown) => void;

const setup = (command: 'dev' | 'build' | 'preview' | 'sync', root = '/tmp/x/') => {
  const apps: { id: string; name: string; entrypoint: string | URL }[] = [];
  const integration = postReview();
  integration.hooks['astro:config:setup']?.({
    command,
    config: { root: pathToFileURL(root.endsWith('/') ? root : `${root}/`) },
    addDevToolbarApp: (app: (typeof apps)[number]) => apps.push(app),
  } as never);
  return { integration, apps };
};

describe('post-review integration', () => {
  it('adds the toolbar app on astro dev only', () => {
    expect(setup('dev').apps.map(app => [app.id, app.name])).toEqual([['post-review', 'Revisar texto']]);
    expect(setup('build').apps).toEqual([]);
    expect(setup('preview').apps).toEqual([]);
    expect(setup('sync').apps).toEqual([]);
  });

  it('saves on post-review:save and answers saved or failed', () => {
    const root = mkdtempSync(join(tmpdir(), 'post-review-int-'));
    mkdirSync(join(root, 'src/content/posts'), { recursive: true });
    writeFileSync(join(root, 'src/content/posts/meu-post.md'), '---\ntitle: Meu post\n---\n\nUma frase.\n');
    const { integration } = setup('dev', root);

    const handlers = new Map<string, Handler>();
    const sent: [string, unknown][] = [];
    integration.hooks['astro:server:setup']?.({
      toolbar: {
        on: (event: string, handler: Handler) => handlers.set(event, handler),
        send: (event: string, payload: unknown) => sent.push([event, payload]),
      },
    } as never);

    const annotation = {
      quote: 'Uma frase',
      prefix: '',
      suffix: '.',
      section: null,
      request: 'troca',
      replacement: '',
      start: 0,
      end: 9,
    };
    handlers.get('post-review:save')?.({ slug: 'meu-post', annotations: [annotation] });
    handlers.get('post-review:save')?.({ slug: 'meu-post', annotations: [] });

    expect(sent[0]).toEqual(['post-review:saved', { path: 'docs/post-reviews/meu-post.md' }]);
    expect(sent[1]?.[0]).toBe('post-review:failed');
    expect(readFileSync(join(root, 'docs/post-reviews/meu-post.md'), 'utf8')).toContain('Uma frase');
  });

  it('is registered in astro.config.mjs', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');
    expect(config).toContain("import { postReview } from './src/integrations/post-review.ts';");
    expect(config).toMatch(/integrations: \[icon\(\), postReview\(\)\]/);
  });

  it('keeps the reviews out of git', () => {
    expect(readFileSync('.gitignore', 'utf8').split('\n')).toContain('docs/post-reviews/');
  });
});
