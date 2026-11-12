import { contactGoPath } from '../analytics/outbound';
import { getFirestoreClient } from '../hire/firestore';
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
  badge?: string;
  /** A site path or an https URL; without it the item is plain text. */
  href?: string;
  /** Opens in a new tab (set for channels). */
  external?: boolean;
}

export interface LiveBarConfig {
  enabled: boolean;
  items: LiveBarItem[];
}

const channelItems = (schedule: string): LiveBarItem[] =>
  [
    ['youtube', 'YouTube'],
    ['twitch', 'Twitch'],
  ].map(([kind, name]) => ({
    text: `${schedule}, no ${name}.`,
    badge: 'Ao vivo',
    href: contactGoPath(kind!),
    external: true,
  }));

export const DEFAULT_LIVE_BAR: LiveBarConfig = {
  enabled: true,
  items: channelItems('Live todos os dias, das 9h00 às 12h00'),
};

const safeHref = (value: unknown): string | undefined =>
  typeof value === 'string' && (/^\/(?!\/)/.test(value) || value.startsWith('https://')) ? value : undefined;

const parseItem = (raw: unknown): LiveBarItem | undefined => {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const data = raw as Record<string, unknown>;
  const text = typeof data.text === 'string' ? data.text.trim().slice(0, MAX_TEXT) : '';
  if (!text) return undefined;

  const badge = typeof data.badge === 'string' ? data.badge.trim().slice(0, MAX_BADGE) : '';
  const channel = CHANNELS.find(kind => kind === data.channel);
  const href = channel ? contactGoPath(channel) : safeHref(data.href);

  return { text, ...(badge && { badge }), ...(href && { href }), ...(channel && { external: true }) };
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

export const liveBarResponse = async (read?: Reader): Promise<Response> => {
  const { enabled, items } = await loadLiveBar(read);

  return new Response(JSON.stringify({ enabled, html: liveBarHtml(items) }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300',
    },
  });
};
