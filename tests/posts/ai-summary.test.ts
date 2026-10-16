import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AiSummaryLink from '../../src/components/posts/AiSummaryLink.astro';
import { aiSummaryPrompt, aiSummaryUrl } from '../../src/lib/posts/ai-summary';

const MARKDOWN = 'https://nandomoreira.dev/o-post.md';

describe('aiSummaryPrompt', () => {
  it('points the model at the markdown of the post and asks it to read it first', () => {
    const prompt = aiSummaryPrompt(MARKDOWN);
    expect(prompt).toContain(MARKDOWN);
    expect(prompt).toMatch(/leia o artigo completo/i);
  });

  it('asks for the summary, what the reader is missing and a follow-up question', () => {
    const prompt = aiSummaryPrompt(MARKDOWN);
    expect(prompt).toMatch(/resuma/i);
    expect(prompt).toMatch(/perdendo/i);
    expect(prompt).toMatch(/pergunta/i);
  });
});

describe('aiSummaryUrl', () => {
  it('opens a new Claude chat with the prompt in q, encoded', () => {
    const url = new URL(aiSummaryUrl(MARKDOWN));
    expect(url.origin).toBe('https://claude.ai');
    expect(url.pathname).toBe('/new');
    expect(url.searchParams.get('q')).toBe(aiSummaryPrompt(MARKDOWN));
  });
});

describe('AiSummaryLink', () => {
  const render = async () =>
    (await AstroContainer.create()).renderToString(AiSummaryLink, { props: { markdownUrl: MARKDOWN } });

  it('is a plain link to claude.ai, opening in a new tab, no script', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="https:\/\/claude\.ai\/new\?q=/);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('<script');
  });

  it('says it opens in a new tab, for screen readers too', async () => {
    expect(await render()).toMatch(/abre o Claude em nova aba/);
  });

  it('leaves the page in reading mode', async () => {
    expect(await render()).toContain('data-reader-hide');
  });
});

describe('post page', () => {
  it('puts the link beside the reading mode switch, with the post markdown', () => {
    const page = readFileSync('src/pages/[slug].astro', 'utf8');
    expect(page).toMatch(/<ReaderMode \/>\s*<AiSummaryLink markdownUrl=\{/);
  });
});
