export interface Utm {
  source: string;
  medium: string | null;
  campaign: string | null;
}

/** Hosts that serve this site: a referrer from any of them is navigation, not arrival. */
export const OWN_HOSTS = [
  'nandomoreira.dev',
  'www.nandomoreira.dev',
  'nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app',
  'localhost',
  '127.0.0.1',
] as const;

const MAX_UTM = 64;

const clean = (value: string | null): string | null => {
  if (value === null) return null;
  const text = Array.from(value.replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu, '').trim())
    .slice(0, MAX_UTM)
    .join('');
  return text === '' ? null : text;
};

/** Only the three fields that say where a link was shared; the rest of the query is dropped. */
export const utmOf = (params: URLSearchParams): Utm | null => {
  const source = clean(params.get('utm_source'));
  if (!source) return null;

  return { source, medium: clean(params.get('utm_medium')), campaign: clean(params.get('utm_campaign')) };
};

const CHANNELS: ReadonlyArray<readonly [string, RegExp]> = [
  ['google', /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/],
  ['bing', /(^|\.)bing\.com$/],
  ['duckduckgo', /(^|\.)duckduckgo\.com$/],
  ['linkedin', /(^|\.)(linkedin\.com|lnkd\.in)$/],
  ['github', /(^|\.)github\.com$/],
  ['x', /(^|\.)(x\.com|twitter\.com|t\.co)$/],
  ['bluesky', /(^|\.)bsky\.app$/],
];

/** Android in-app browsers report package names as the URL hostname. */
const ANDROID_PACKAGES: Readonly<Record<string, string>> = {
  'com.linkedin.android': 'linkedin',
  'com.google.android.googlequicksearchbox': 'google',
  'com.google.android.gm': 'google',
  'com.twitter.android': 'x',
  'xyz.blueskyweb.app': 'bluesky',
  'com.github.android': 'github',
};

/**
 * A tagged link says where it was shared more precisely than any referrer, so
 * the UTM wins. Only the host of the referrer is ever looked at (REQ-006).
 */
export const channelOf = ({
  referrer,
  utm,
  ownHosts,
}: {
  referrer: string | null;
  utm: Utm | null;
  ownHosts: readonly string[];
}): string => {
  if (utm) return `utm:${utm.source.toLowerCase()}`;
  if (!referrer) return 'direct';

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return 'direct';
  }

  if (ownHosts.includes(host)) return 'internal';

  const android = ANDROID_PACKAGES[host];
  if (android) return android;

  return CHANNELS.find(([, pattern]) => pattern.test(host))?.[0] ?? 'other';
};
