import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AiSummaryLink from '../../src/components/posts/AiSummaryLink.astro';
import { AI_SUMMARY_TARGETS, aiSummaryPrompt, aiSummaryUrl } from '../../src/lib/posts/ai-summary';

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

const target = (id: string) => AI_SUMMARY_TARGETS.find((item) => item.id === id)!;

describe('aiSummaryUrl', () => {
  it('offers Claude, Gemini and ChatGPT, in that order', () => {
    expect(AI_SUMMARY_TARGETS.map((item) => item.name)).toEqual(['Claude', 'Gemini', 'ChatGPT']);
  });

  it('labels Gemini by where it lands, the Google AI', () => {
    expect(AI_SUMMARY_TARGETS.map((item) => item.label)).toEqual([
      'Resumir com Claude',
      'Resumir com a IA do Google',
      'Resumir com ChatGPT',
    ]);
  });

  it('opens Gemini through the Google AI Mode, the one that takes the prompt in q', () => {
    // gemini.google.com ignores q without a browser extension (2026-10-16).
    const url = new URL(aiSummaryUrl(target('gemini'), MARKDOWN));
    expect(url.origin).toBe('https://www.google.com');
    expect(url.pathname).toBe('/search');
    expect(url.searchParams.get('udm')).toBe('50');
    expect(url.searchParams.get('q')).toBe(aiSummaryPrompt(MARKDOWN));
  });

  it('opens a new Claude chat with the prompt in q, encoded', () => {
    const url = new URL(aiSummaryUrl(target('claude'), MARKDOWN));
    expect(url.origin).toBe('https://claude.ai');
    expect(url.pathname).toBe('/new');
    expect(url.searchParams.get('q')).toBe(aiSummaryPrompt(MARKDOWN));
  });

  it('opens ChatGPT with web search on and the prompt in q', () => {
    const url = new URL(aiSummaryUrl(target('chatgpt'), MARKDOWN));
    expect(url.origin).toBe('https://chatgpt.com');
    expect(url.searchParams.get('hints')).toBe('search');
    expect(url.searchParams.get('q')).toBe(aiSummaryPrompt(MARKDOWN));
  });
});

describe('AiSummaryLink', () => {
  const render = async () =>
    (await AstroContainer.create()).renderToString(AiSummaryLink, { props: { markdownUrl: MARKDOWN } });

  it('renders one icon link per assistant, opening in a new tab, no script', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="https:\/\/claude\.ai\/new\?q=/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/chatgpt\.com\/\?hints=search&amp;q=/);
    expect(html).toMatch(/<a[^>]*href="https:\/\/www\.google\.com\/search\?udm=50&amp;q=/);
    expect(html.match(/target="_blank"/g)?.length).toBe(AI_SUMMARY_TARGETS.length);
    expect(html.match(/rel="noopener noreferrer"/g)?.length).toBe(AI_SUMMARY_TARGETS.length);
    expect(html).not.toContain('<script');
  });

  it('names each link for screen readers, new tab included', async () => {
    const html = await render();
    for (const { label } of AI_SUMMARY_TARGETS) {
      expect(html).toContain(`aria-label="${label}, abre em nova aba"`);
    }
  });

  it('shows the label as a tooltip, after the AI sparkle, with no arrow', async () => {
    const html = await render();
    expect(html).not.toContain('→');
    for (const { label } of AI_SUMMARY_TARGETS) {
      expect(html).toMatch(new RegExp(`<span[^>]*aria-hidden="true"[^>]*>\\s*✨ ${label}\\s*</span>`));
    }
    expect(html).toContain('group-hover/ai:opacity-100');
    expect(html).toContain('group-focus-visible/ai:opacity-100');
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
