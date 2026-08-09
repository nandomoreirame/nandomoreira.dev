import type { Post } from '../../content/schemas/post';
import { absoluteUrl } from '../aeo/urls';

interface Input {
  site: URL;
  posts: readonly Post[];
  title: string;
  description: string;
}

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

/** RFC-822 from an ISO-8601 date string, always UTC to keep the feed stable. */
const toRfc822 = (iso: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`Expected ISO-8601 date, received "${iso}"`);
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return date.toUTCString();
};

export const buildRss = ({ site, posts, title, description }: Input): string => {
  const channelLink = absoluteUrl(site, '/posts');
  const items = posts
    .map((post) => {
      const link = absoluteUrl(site, `/${post.slug}`);

      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        `      <pubDate>${escapeXml(toRfc822(post.date))}</pubDate>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(channelLink)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    '    <language>pt-BR</language>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
};
