import type { TranslationPair } from '../content';
import { staticCounterpart } from './routes';

const OWN = /^https:\/\/(www\.)?nandomoreira\.dev/;

/** Where an internal link in an English text should point (C4). */
export const englishHref = (href: string, pairs: readonly TranslationPair[]): string => {
  if (/^https?:\/\//.test(href) && !OWN.test(href)) return href;
  const local = href.replace(OWN, '') || '/';
  const hashIndex = local.indexOf('#');
  const beforeHash = hashIndex === -1 ? local : local.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : local.slice(hashIndex);
  const queryIndex = beforeHash.indexOf('?');
  const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : beforeHash.slice(queryIndex);
  const pair = staticCounterpart(path) ?? pairs.find(item => item['pt-BR'] === path);
  return pair ? `${pair.en}${search}${hash}` : href;
};

/** Internal link targets of a markdown body, outside code and images. */
export const internalLinks = (markdown: string): string[] =>
  [
    ...markdown
      .replace(/(```|~~~)[\s\S]*?\1/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g),
  ]
    .map(match => match[1]!)
    .filter(href => href.startsWith('/') || OWN.test(href));
