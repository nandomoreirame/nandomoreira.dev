export type TrafficClass = 'human' | 'ai_agent' | 'search_crawler' | 'other_bot';

/** Checked first: several of these also carry "Mozilla/" and a bot-like token. */
const AI_AGENTS =
  /ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|claude-code|GPTBot|ChatGPT-User|OAI-SearchBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|meta-externalagent|MistralAI-User|DuckAssistBot|cohere-ai|CCBot|Bytespider/i;

/** Search engines and link previews: they index or unfurl, they do not read. */
const SEARCH_CRAWLERS =
  /Googlebot|bingbot|DuckDuckBot|YandexBot|Baiduspider|Applebot|Slurp|LinkedInBot|Twitterbot|facebookexternalhit|Slackbot|Discordbot|TelegramBot|WhatsApp/i;

const BOT_LIKE =
  /bot|crawl|spider|curl|wget|python|httpx|aiohttp|go-http|java\/|libwww|headless|node-fetch|undici|axios|okhttp|scrapy|postman|insomnia/i;

/**
 * By the user agent alone, so it is a label, not a verdict: anyone can claim to
 * be Chrome. Good enough to keep crawlers out of the reading numbers, which is
 * all it is used for (REQ-004).
 */
export const classifyAgent = (userAgent: string | null): TrafficClass => {
  const ua = (userAgent ?? '').trim();

  if (AI_AGENTS.test(ua)) return 'ai_agent';
  if (SEARCH_CRAWLERS.test(ua)) return 'search_crawler';
  if (ua === '' || BOT_LIKE.test(ua) || !ua.startsWith('Mozilla/')) return 'other_bot';

  return 'human';
};
