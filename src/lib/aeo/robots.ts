import { absoluteUrl } from './urls';

/**
 * Named explicitly rather than relying on `User-agent: *`. The allowlist
 * documents the intent and survives a future tightening of the default.
 */
export const ANSWER_ENGINE_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
] as const;

export const buildRobotsTxt = ({ site }: { site: URL }): string => {
  const blocks = [
    'User-agent: *',
    'Allow: /',
    '',
    ...ANSWER_ENGINE_CRAWLERS.flatMap(agent => [`User-agent: ${agent}`, 'Allow: /', '']),
    `Sitemap: ${absoluteUrl(site, '/sitemap.xml')}`,
    '',
  ];

  return blocks.join('\n');
};
