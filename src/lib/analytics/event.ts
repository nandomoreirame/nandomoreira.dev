import { type Utm, OWN_HOSTS, channelOf } from './channel';
import { type TrafficClass, classifyAgent } from './classify';
import { MCP_TOOLS } from '../mcp/catalog';

export type EventKind = 'pageview' | 'machine' | 'conversion';
export type EventSource = 'ssr' | 'pixel' | 'api';
export type ConversionType = 'hire' | 'cv' | 'outbound' | 'mcp';

export interface Conversion {
  type: ConversionType;
  target?: string;
  refId?: string;
  tool?: string;
  client?: string;
}

/** The stored shape. docs/specs/lead-analytics/SPEC.md, Data Contract. */
export interface AnalyticsEvent {
  kind: EventKind;
  at: string;
  day: string;
  expiresAt: Date;
  visitor: string;
  class: TrafficClass;
  source: EventSource;
  path: string;
  channel: string;
  utm: Utm | null;
  country: string | null;
  conversion?: Conversion;
}

export interface EventInput {
  kind: EventKind;
  at: Date;
  day: string;
  visitor: string;
  userAgent: string | null;
  source: EventSource;
  path: string;
  referrer: string | null;
  utm: Utm | null;
  country: string | null;
  conversion?: Conversion;
}

const EVENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DAILY_TTL_MONTHS = 24;
const MAX_PATH = 256;

/** Bounded UTM sources for daily counters; unknowns fold to utm:other. */
export const KNOWN_UTM_SOURCES = [
  'linkedin',
  'github',
  'x',
  'twitter',
  'bluesky',
  'newsletter',
  'email',
  'instagram',
  'youtube',
  'reddit',
  'hackernews',
  'devto',
  'whatsapp',
  'telegram',
] as const;

/** Bounded MCP methods for daily counters; unknowns fold to other. */
export const KNOWN_MCP_METHODS = [
  'initialize',
  'notifications/initialized',
  'ping',
  'tools/list',
  'tools/call',
  'resources/list',
  'resources/templates/list',
  'prompts/list',
] as const;

/**
 * Bounded MCP clients for daily counters; unknowns fold to other. A client
 * name is lowercased and its spaces and underscores become hyphens before the
 * lookup, then MCP_CLIENT_ALIASES maps the names real clients send.
 */
export const KNOWN_MCP_CLIENTS = [
  'claude-code',
  'claude-ai',
  'claude',
  'cursor',
  'vscode',
  'visual-studio-code',
  'windsurf',
  'codex',
  'gemini-cli',
  'chatgpt',
  'mcp-inspector',
  'cline',
  'zed',
  'continue',
  'goose',
] as const;

export const MCP_CLIENT_ALIASES: Readonly<Record<string, (typeof KNOWN_MCP_CLIENTS)[number]>> = {
  'visual-studio-code': 'vscode',
  'cursor-vscode': 'cursor',
  'codex-mcp-client': 'codex',
  'openai-mcp': 'chatgpt',
  'claude-desktop': 'claude',
  'anthropic/claude': 'claude',
};

const KNOWN_UTM_SET = new Set<string>(KNOWN_UTM_SOURCES);
const KNOWN_MCP_METHOD_SET = new Set<string>(KNOWN_MCP_METHODS);
const KNOWN_MCP_TOOL_SET = new Set<string>(MCP_TOOLS.map((t) => t.name));
const KNOWN_MCP_CLIENT_SET = new Set<string>(KNOWN_MCP_CLIENTS);

/** Cloudflare sends XX when unknown and T1 for Tor; neither is a country. */
export const countryOf = (raw: string | null): string | null => {
  const code = (raw ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1' ? code : null;
};

/** São Paulo has had no daylight saving since 2019, so the offset is fixed. */
export const dailyExpiry = (day: string): Date => {
  const end = new Date(`${day}T23:59:59.999-03:00`);
  end.setUTCMonth(end.getUTCMonth() + DAILY_TTL_MONTHS);
  return end;
};

/**
 * `pathKey`/`targetKey` of the Data Contract: a map key from request-derived
 * text. encodeURIComponent with `.` as `%2E` (a dot would nest the field). A
 * leading `__` is escaped too: Firestore reserves `__name__`-like keys and a
 * `__proto__` key would poison the object built for the write. Empty keys are
 * forbidden, so the empty string gets a key of its own.
 */
export const counterKey = (value: string): string => {
  if (value === '') return '%00';
  return encodeURIComponent(value.toWellFormed()).replaceAll('.', '%2E').replace(/^__/, '%5F_');
};

const definedConversion = (conversion: Conversion): Conversion => {
  const out: Conversion = { type: conversion.type };
  if (conversion.target !== undefined) out.target = conversion.target;
  if (conversion.refId !== undefined) out.refId = conversion.refId;
  if (conversion.tool !== undefined) out.tool = conversion.tool;
  if (conversion.client !== undefined) out.client = conversion.client;
  return out;
};

const pathOf = (path: string): string => {
  const truncated = Array.from(path).slice(0, MAX_PATH).join('');
  return truncated === '' ? '/' : truncated;
};

export const buildEvent = (input: EventInput): AnalyticsEvent => ({
  kind: input.kind,
  at: input.at.toISOString(),
  day: input.day,
  expiresAt: new Date(input.at.getTime() + EVENT_TTL_MS),
  visitor: input.visitor,
  class: classifyAgent(input.userAgent),
  source: input.source,
  path: pathOf(input.path),
  // The pixel's referrer is the page it sits on, so only a UTM can name a channel.
  channel:
    input.source === 'pixel'
      ? input.utm
        ? `utm:${input.utm.source.toLowerCase()}`
        : 'unknown'
      : channelOf({ referrer: input.referrer, utm: input.utm, ownHosts: OWN_HOSTS }),
  utm: input.utm,
  country: countryOf(input.country),
  ...(input.conversion ? { conversion: definedConversion(input.conversion) } : {}),
});

/** Crawlers only feed the per-class totals; their raw events would just burn the write quota. */
export const keepsRawEvent = (event: AnalyticsEvent): boolean =>
  event.class === 'human' || event.class === 'ai_agent';

/** A field path in `analytics_daily/<day>`, each one incremented by 1. */
export type Increment = readonly string[];

const channelCounter = (channel: string): string => {
  if (channel.startsWith('utm:')) {
    const source = channel.slice(4);
    return KNOWN_UTM_SET.has(source) ? channel : 'utm:other';
  }
  return channel;
};

const mcpMethodCounter = (target: string): string =>
  KNOWN_MCP_METHOD_SET.has(target) ? target : 'other';

const mcpToolCounter = (tool: string): string => (KNOWN_MCP_TOOL_SET.has(tool) ? tool : 'other');

const mcpClientCounter = (client: string): string => {
  const slug = client.trim().toLowerCase().replace(/[\s_]+/g, '-');
  const name = MCP_CLIENT_ALIASES[slug] ?? slug;
  return KNOWN_MCP_CLIENT_SET.has(name) ? name : 'other';
};

export const dailyIncrements = (event: AnalyticsEvent): Increment[] => {
  const paths: Increment[] = [];

  if (event.kind === 'pageview') {
    paths.push(['traffic', event.class]);
    if (event.class === 'human') {
      paths.push(['pages', counterKey(event.path)], ['countries', event.country ?? 'unknown']);
      if (event.channel !== 'internal') {
        // Channels come from a closed list (utm:<source> folds to utm:other), so
        // the key is the literal value the Data Contract names.
        paths.push(['channels', channelCounter(event.channel)]);
      }
    }
  }

  if (event.kind === 'machine') paths.push(['machine', event.class]);

  if (event.kind === 'conversion' && event.conversion) {
    const { type, target, tool, client } = event.conversion;
    // A link preview following /go/... is not interest in the destination.
    if (type === 'outbound' && event.class !== 'human') return paths;

    // An MCP session sends initialize, tools/list and pings around each use;
    // only an actual tool call is a conversion. The rest still counts by method.
    if (type !== 'mcp' || target === 'tools/call') paths.push(['conversions', type]);
    if (type === 'outbound' && target) paths.push(['outbound', counterKey(target)]);
    if (type === 'mcp') {
      // Methods, tools and clients fold into closed lists: literal keys.
      if (target) paths.push(['mcp', 'methods', mcpMethodCounter(target)]);
      if (tool) paths.push(['mcp', 'tools', mcpToolCounter(tool)]);
      if (client) paths.push(['mcp', 'clients', mcpClientCounter(client)]);
    }
  }

  return paths;
};
