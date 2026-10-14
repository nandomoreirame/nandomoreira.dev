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

/** Bounded MCP clients for daily counters; unknowns fold to other. */
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
 * Safe Firestore map key from attacker-controlled input.
 * Empty keys are forbidden; dots and underscores would nest or collide with reserved names.
 */
export const counterKey = (value: string): string => {
  if (value === '') return '%00';
  return encodeURIComponent(value.toWellFormed()).replaceAll('.', '%2E').replaceAll('_', '%5F');
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

const mcpClientCounter = (client: string): string =>
  KNOWN_MCP_CLIENT_SET.has(client.toLowerCase()) ? client.toLowerCase() : 'other';

export const dailyIncrements = (event: AnalyticsEvent): Increment[] => {
  const paths: Increment[] = [];

  if (event.kind === 'pageview') {
    paths.push(['traffic', event.class]);
    if (event.class === 'human') {
      paths.push(['pages', counterKey(event.path)], ['countries', event.country ?? 'unknown']);
      if (event.channel !== 'internal') {
        paths.push(['channels', counterKey(channelCounter(event.channel))]);
      }
    }
  }

  if (event.kind === 'machine') paths.push(['machine', event.class]);

  if (event.kind === 'conversion' && event.conversion) {
    const { type, target, tool, client } = event.conversion;
    // A link preview following /go/... is not interest in the destination.
    if (type === 'outbound' && event.class !== 'human') return paths;

    paths.push(['conversions', type]);
    if (type === 'outbound' && target) paths.push(['outbound', counterKey(target)]);
    if (type === 'mcp') {
      if (target) paths.push(['mcp', 'methods', counterKey(mcpMethodCounter(target))]);
      if (tool) paths.push(['mcp', 'tools', counterKey(mcpToolCounter(tool))]);
      if (client) paths.push(['mcp', 'clients', counterKey(mcpClientCounter(client))]);
    }
  }

  return paths;
};
