import { contactGoPath } from '../analytics/outbound';
import { getFirestoreClient } from '../hire/firestore';
import type { Locale } from '../i18n/locale';
import { liveBarHtml } from './render';

export const LIVE_BAR_COLLECTION = 'site_config';
export const LIVE_BAR_DOC = 'live_bar';

const MAX_TEXT = 160;
const MAX_BADGE = 24;
const MAX_ITEMS = 8;

/** Channels go through /go, like the footer, so the click is measured. */
const CHANNELS = ['youtube', 'twitch'] as const;

export interface LiveBarItem {
  text: string;
  /** English copy; without it the item is dropped on /en. */
  textEn?: string;
  badge?: string;
  badgeEn?: string;
  /** A site path or an https URL; without it the item is plain text. */
  href?: string;
  /** Opens in a new tab (set for channels). */
  external?: boolean;
}

export interface LiveBarConfig {
  enabled: boolean;
  items: LiveBarItem[];
}

const channelItems = (schedule: string, scheduleEn?: string): LiveBarItem[] =>
  [
    ['youtube', 'YouTube'],
    ['twitch', 'Twitch'],
  ].map(([kind, name]) => ({
    text: `${schedule}, no ${name}.`,
    ...(scheduleEn && { textEn: `${scheduleEn}, on ${name}.` }),
    badge: 'Ao vivo',
    ...(scheduleEn && { badgeEn: 'Live' }),
    href: contactGoPath(kind!),
    external: true,
  }));

export const DEFAULT_LIVE_BAR: LiveBarConfig = {
  enabled: true,
  items: channelItems(
    'Live todos os dias, das 9h00 às 12h00',
    'Live every day, 9:00 AM to 12:00 PM (Brasília time)',
  ),
};

const safeHref = (value: unknown): string | undefined =>
  typeof value === 'string' && (/^\/(?!\/)/.test(value) || value.startsWith('https://')) ? value : undefined;

const optionalText = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const parseItem = (raw: unknown): LiveBarItem | undefined => {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const data = raw as Record<string, unknown>;
  const text = optionalText(data.text, MAX_TEXT);
  if (!text) return undefined;

  const textEn = optionalText(data.textEn, MAX_TEXT);
  const badge = optionalText(data.badge, MAX_BADGE);
  const badgeEn = optionalText(data.badgeEn, MAX_BADGE);
  const channel = CHANNELS.find(kind => kind === data.channel);
  const href = channel ? contactGoPath(channel) : safeHref(data.href);

  return {
    text,
    ...(textEn && { textEn }),
    ...(badge && { badge }),
    ...(badgeEn && { badgeEn }),
    ...(href && { href }),
    ...(channel && { external: true }),
  };
};

type Reader = () => Promise<Record<string, unknown> | undefined>;

/** Anything off-schema is dropped; only an explicit `false` hides the bar. */
export const parseLiveBar = (data: Record<string, unknown>): LiveBarConfig => {
  const listed = Array.isArray(data.items) ? data.items.map(parseItem).filter(item => item !== undefined) : [];
  const legacy =
    typeof data.schedule === 'string' && data.schedule.trim()
      ? channelItems(data.schedule.trim().slice(0, MAX_TEXT))
      : [];
  const items = (listed.length > 0 ? listed : legacy).slice(0, MAX_ITEMS);

  return { enabled: data.enabled !== false, items: items.length > 0 ? items : DEFAULT_LIVE_BAR.items };
};

const readFromFirestore: Reader = async () => {
  const snapshot = await getFirestoreClient().collection(LIVE_BAR_COLLECTION).doc(LIVE_BAR_DOC).get();

  return snapshot.exists ? snapshot.data() : undefined;
};

/** A missing document or an outage must never take the header down with it. */
export const loadLiveBar = async (read: Reader = readFromFirestore): Promise<LiveBarConfig> => {
  try {
    const data = await read();

    return data ? parseLiveBar(data) : DEFAULT_LIVE_BAR;
  } catch {
    return DEFAULT_LIVE_BAR;
  }
};

export const liveBarResponse = async (read?: Reader, locale: Locale = 'pt-BR'): Promise<Response> => {
  const { enabled, items } = await loadLiveBar(read);
  const forLocale =
    locale === 'en' ? { enabled: enabled && items.some(item => item.textEn), items } : { enabled, items };

  return new Response(JSON.stringify({ enabled: forLocale.enabled, html: liveBarHtml(forLocale.items, locale) }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300',
    },
  });
};
