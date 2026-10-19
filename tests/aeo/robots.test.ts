import { describe, expect, it } from 'vitest';
import { ANSWER_ENGINE_CRAWLERS, buildRobotsTxt } from '../../src/lib/aeo/robots';

const site = new URL('https://nandomoreira.dev');
const output = () => buildRobotsTxt({ site });

describe('buildRobotsTxt', () => {
  it.each(ANSWER_ENGINE_CRAWLERS)('grants %s explicit permission', agent => {
    expect(output()).toContain(`User-agent: ${agent}`);
  });

  it('names the main answer-engine crawlers', () => {
    for (const agent of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(ANSWER_ENGINE_CRAWLERS).toContain(agent);
    }
  });

  it('points at the sitemap with an absolute url', () => {
    expect(output()).toContain('Sitemap: https://nandomoreira.dev/sitemap.xml');
  });

  it('allows everything by default, since nothing sensitive is published', () => {
    expect(output()).toContain('User-agent: *');
    expect(output()).toContain('Allow: /');
  });

  it('never disallows the machine routes it wants agents to read', () => {
    const text = output();

    expect(text).not.toContain('Disallow: /api');
    expect(text).not.toContain('Disallow: /llms.txt');
  });
});
