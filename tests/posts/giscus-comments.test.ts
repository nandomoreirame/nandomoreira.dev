import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import GiscusComments from '../../src/components/posts/GiscusComments.astro';
import { GISCUS_FAILURE_MESSAGE, giscusConfig } from '../../src/lib/posts/giscus-config';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(GiscusComments);
};

describe('Giscus comments section', () => {
  it('names the section for assistive tech', async () => {
    const html = await render();
    expect(html).toMatch(/<section[^>]*aria-labelledby="giscus-heading"/);
    expect(html).toMatch(
      /<h2[^>]*id="giscus-heading"[^>]*>\s*Deixe seu comentário e vamos discutir sobre esse artigo\s*<\/h2>/,
    );
  });

  it('starts without the external script or iframe, and keeps the failure copy in Portuguese', async () => {
    const html = await render();
    expect(GISCUS_FAILURE_MESSAGE).toBe('Oops, erro ao carregar os comentários, volte aqui mais tarde.');
    expect(html).toContain(GISCUS_FAILURE_MESSAGE);
    expect(html).toContain('Nenhum comentário ainda. Seja o primeiro a escrever.');
    expect(html).toMatch(/data-giscus-fallback[^>]*hidden/);
    expect(html).toMatch(/data-giscus-empty[^>]*\bitalic\b[^>]*hidden|data-giscus-empty[^>]*hidden[^>]*\bitalic\b/);
    expect(html).not.toMatch(/src=["']https:\/\/giscus\.app/);
    expect(html).not.toMatch(/<iframe\b/i);
  });

  it('publishes the repository and the Blog category, and no credential', async () => {
    const html = await render();
    const source = readFileSync('src/lib/posts/giscus-config.ts', 'utf8');

    expect(giscusConfig.repo).toBe('nandomoreirame/nandomoreira.dev');
    expect(giscusConfig.repoId).toBe('R_kgDOTyj5uQ');
    expect(giscusConfig.category).toBe('Blog');
    expect(giscusConfig.categoryId).toBe('DIC_kwDOTyj5uc4DJVid');
    expect(html).toContain('data-repo="nandomoreirame/nandomoreira.dev"');
    expect(html).toContain('data-repo-id="R_kgDOTyj5uQ"');
    expect(html).toContain('data-category="Blog"');
    expect(html).toContain('data-category-id="DIC_kwDOTyj5uc4DJVid"');
    expect(html).toContain('data-mapping="pathname"');
    expect(html).toContain('data-strict="1"');
    expect(html).toContain('data-reactions-enabled="0"');
    expect(html).toContain('data-lang="pt"');

    for (const text of [html, source]) {
      expect(text).not.toMatch(/AKIA[0-9A-Z]{16}|ghp_|github_pat_|client_secret|api_key|BEGIN [A-Z ]*PRIVATE KEY/);
    }
  });
});
