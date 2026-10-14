import { describe, expect, it } from 'vitest';
import { classifyAgent } from '../../src/lib/analytics/classify';

const CHROME =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

describe('classifyAgent', () => {
  it.each([
    [CHROME, 'human'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', 'human'],
    [`  ${CHROME}  `, 'human'],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', 'ai_agent'],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot', 'ai_agent'],
    ['Mozilla/5.0 (compatible; Applebot-Extended/0.1)', 'ai_agent'],
    ['Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.0; +https://openai.com/gptbot)', 'ai_agent'],
    ['Mozilla/5.0 AppleWebKit/537.36 (compatible; Claude-User/1.0; +claude-user@anthropic.com)', 'ai_agent'],
    ['Mozilla/5.0 AppleWebKit/537.36 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)', 'ai_agent'],
    ['claude-code/1.0', 'ai_agent'],
    ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'search_crawler'],
    ['LinkedInBot/1.0 (compatible; Mozilla/5.0)', 'search_crawler'],
    ['Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', 'search_crawler'],
    ['Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 'search_crawler'],
    ['googlebot/2.1', 'search_crawler'],
    ['curl/8.9.1', 'other_bot'],
    ['python-httpx/0.27.0', 'other_bot'],
    ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/129.0', 'other_bot'],
    ['SomeUnknownClient/1.0', 'other_bot'],
    ['', 'other_bot'],
    ['   ', 'other_bot'],
  ])('classifies %s as %s', (userAgent, expected) => {
    expect(classifyAgent(userAgent)).toBe(expected);
  });

  it('treats a missing user agent as a bot', () => {
    expect(classifyAgent(null)).toBe('other_bot');
  });
});
