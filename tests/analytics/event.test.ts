import { describe, expect, it } from 'vitest';
import {
  buildEvent,
  counterKey,
  countryOf,
  placeOf,
  dailyExpiry,
  dailyIncrements,
  keepsRawEvent,
} from '../../src/lib/analytics/event';

const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/129.0 Safari/537.36';
const at = new Date('2026-10-14T17:02:00.000Z');

const pageview = (overrides: Partial<Parameters<typeof buildEvent>[0]> = {}) =>
  buildEvent({
    kind: 'pageview',
    at,
    day: '2026-10-14',
    visitor: 'a'.repeat(32),
    userAgent: CHROME,
    source: 'ssr',
    path: '/lab/forja',
    referrer: 'https://www.linkedin.com/',
    utm: null,
    country: 'br',
    ...overrides,
  });

describe('buildEvent', () => {
  it('fills the contract fields', () => {
    expect(pageview()).toEqual({
      kind: 'pageview',
      at: '2026-10-14T17:02:00.000Z',
      day: '2026-10-14',
      expiresAt: new Date('2026-11-13T17:02:00.000Z'),
      visitor: 'a'.repeat(32),
      class: 'human',
      source: 'ssr',
      path: '/lab/forja',
      channel: 'linkedin',
      utm: null,
      country: 'BR',
      city: null,
      region: null,
    });
  });

  it('keeps the city and state Cloudflare reports, for the 30-day raw event only', () => {
    const event = pageview({ city: 'Curitiba', region: 'Paraná' });
    expect(event).toMatchObject({ city: 'Curitiba', region: 'Paraná' });
    expect(JSON.stringify(dailyIncrements(event))).not.toContain('Curitiba');
  });

  it('never sets conversion when there is none, since Firestore rejects undefined', () => {
    expect(Object.hasOwn(pageview(), 'conversion')).toBe(false);
  });

  it('copies only defined conversion keys, since Firestore rejects undefined', () => {
    const event = pageview({
      kind: 'conversion',
      source: 'api',
      conversion: { type: 'hire', target: undefined },
    });
    expect(event.conversion).toEqual({ type: 'hire' });
    expect(Object.hasOwn(event.conversion!, 'target')).toBe(false);
  });

  it('normalises an empty path to / and truncates by code points', () => {
    expect(pageview({ path: '' }).path).toBe('/');
    expect(pageview({ path: 'x'.repeat(300) }).path).toHaveLength(256);
  });

  it('gives the pixel a UTM channel or unknown, because its referrer is the page itself', () => {
    expect(pageview({ source: 'pixel', referrer: null }).channel).toBe('unknown');
    expect(
      pageview({ source: 'pixel', referrer: null, utm: { source: 'LinkedIn', medium: null, campaign: null } }).channel,
    ).toBe('utm:linkedin');
  });

  it('keeps the raw UTM channel even when the daily counter will fold it', () => {
    expect(
      pageview({
        source: 'pixel',
        referrer: null,
        utm: { source: 'SomePodcast', medium: null, campaign: null },
      }).channel,
    ).toBe('utm:somepodcast');
  });
});

describe('placeOf', () => {
  it('cleans a city or state name and caps it', () => {
    expect(placeOf('  Embu das Artes ')).toBe('Embu das Artes');
    expect(placeOf('São\u0000 Paulo')).toBe('São Paulo');
    expect(placeOf('x'.repeat(100))).toHaveLength(64);
    expect(placeOf('')).toBeNull();
    expect(placeOf(null)).toBeNull();
  });

  it('repairs UTF-8 that arrived read as Latin-1 in a header', () => {
    expect(placeOf('SÃ£o Paulo')).toBe('São Paulo');
    expect(placeOf('ParanÃ¡')).toBe('Paraná');
  });
});

describe('countryOf', () => {
  it('keeps a two-letter code and drops Cloudflare placeholders', () => {
    expect(countryOf('br')).toBe('BR');
    expect(countryOf('XX')).toBeNull();
    expect(countryOf('T1')).toBeNull();
    expect(countryOf(null)).toBeNull();
    expect(countryOf('BRA')).toBeNull();
  });
});

describe('dailyExpiry', () => {
  it('is the end of the São Paulo day plus 24 months', () => {
    expect(dailyExpiry('2026-10-14').toISOString()).toBe('2028-10-15T02:59:59.999Z');
  });

  it('documents leap-day rollover under setUTCMonth', () => {
    // 2028-02-29T23:59:59.999-03:00 is 2028-03-01T02:59:59.999Z; +24 months stays on Mar 1.
    expect(dailyExpiry('2028-02-29').toISOString()).toBe('2030-03-01T02:59:59.999Z');
  });
});

describe('counterKey', () => {
  it('escapes slashes and dots so a path is one Firestore field', () => {
    expect(counterKey('/lab/forja.md')).toBe('%2Flab%2Fforja%2Emd');
  });

  it('follows the Data Contract (encodeURIComponent, dot as %2E) and leaves inner underscores alone', () => {
    expect(counterKey('/posts/meu_texto')).toBe('%2Fposts%2Fmeu_texto');
    expect(counterKey('contato/github')).toBe('contato%2Fgithub');
  });

  it('escapes a leading double underscore, reserved by Firestore and by object prototypes', () => {
    expect(counterKey('__proto__')).toBe('%5F_proto__');
  });

  it('rejects empty or lone-surrogate keys', () => {
    expect(() => counterKey('a\ud800')).not.toThrow();
    expect(counterKey('')).toBe('%00');
  });
});

describe('keepsRawEvent', () => {
  it('keeps people and AI agents only', () => {
    expect(keepsRawEvent(pageview())).toBe(true);
    expect(keepsRawEvent(pageview({ userAgent: 'ClaudeBot/1.0' }))).toBe(true);
    expect(keepsRawEvent(pageview({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }))).toBe(false);
    expect(keepsRawEvent(pageview({ userAgent: 'curl/8' }))).toBe(false);
  });
});

describe('dailyIncrements', () => {
  it('counts a human pageview by class, page, channel and country', () => {
    expect(dailyIncrements(pageview())).toEqual([
      ['traffic', 'human'],
      ['pages', '%2Flab%2Fforja'],
      ['countries', 'BR'],
      ['channels', 'linkedin'],
    ]);
  });

  it('counts an unknown country as unknown', () => {
    expect(dailyIncrements(pageview({ country: null }))).toContainEqual(['countries', 'unknown']);
  });

  it('leaves internal navigation out of the channels', () => {
    expect(dailyIncrements(pageview({ referrer: 'https://nandomoreira.dev/' }))).not.toContainEqual(['channels', 'internal']);
  });

  it('folds unknown UTM sources to utm:other in the daily key only', () => {
    const event = pageview({
      source: 'pixel',
      referrer: null,
      utm: { source: 'SomePodcast', medium: null, campaign: null },
    });
    expect(event.channel).toBe('utm:somepodcast');
    expect(dailyIncrements(event)).toContainEqual(['channels', 'utm:other']);
    expect(dailyIncrements(event)).not.toContainEqual(['channels', 'utm:somepodcast']);
  });

  it('counts a crawler only in traffic', () => {
    expect(dailyIncrements(pageview({ userAgent: 'curl/8' }))).toEqual([['traffic', 'other_bot']]);
  });

  it('counts machine surfaces by class', () => {
    expect(dailyIncrements(pageview({ kind: 'machine', userAgent: 'ClaudeBot/1.0' }))).toEqual([['machine', 'ai_agent']]);
  });

  it('counts an mcp call by method, tool and client', () => {
    const event = pageview({
      kind: 'conversion',
      source: 'api',
      userAgent: 'node',
      conversion: { type: 'mcp', target: 'tools/call', tool: 'get_profile', client: 'claude-code' },
    });
    expect(dailyIncrements(event)).toEqual([
      ['conversions', 'mcp'],
      ['mcp', 'methods', 'tools/call'],
      ['mcp', 'tools', 'get_profile'],
      ['mcp', 'clients', 'claude-code'],
    ]);
  });

  it('folds unknown mcp method, tool and client to other', () => {
    const event = pageview({
      kind: 'conversion',
      source: 'api',
      userAgent: 'node',
      conversion: { type: 'mcp', target: 'custom/explode', tool: 'invented_tool', client: 'WeirdClient' },
    });
    expect(event.conversion).toEqual({
      type: 'mcp',
      target: 'custom/explode',
      tool: 'invented_tool',
      client: 'WeirdClient',
    });
    expect(dailyIncrements(event)).toEqual([
      ['mcp', 'methods', 'other'],
      ['mcp', 'tools', 'other'],
      ['mcp', 'clients', 'other'],
    ]);
  });

  it('counts protocol chatter by method but never as a conversion: only tools/call is one', () => {
    const event = pageview({
      kind: 'conversion',
      source: 'api',
      userAgent: 'node',
      conversion: { type: 'mcp', target: 'tools/list' },
    });
    expect(dailyIncrements(event)).toEqual([['mcp', 'methods', 'tools/list']]);
  });

  it('keys bounded vocabularies literally, as the Data Contract names them', () => {
    const event = pageview({ source: 'pixel', referrer: null, utm: { source: 'LinkedIn', medium: null, campaign: null } });
    expect(dailyIncrements(event)).toContainEqual(['channels', 'utm:linkedin']);
  });

  it('recognises the names real MCP clients send', () => {
    const clientOf = (client: string) =>
      dailyIncrements(
        pageview({ kind: 'conversion', source: 'api', userAgent: 'node', conversion: { type: 'mcp', target: 'initialize', client } }),
      ).find((path) => path[1] === 'clients')?.[2];

    expect(clientOf('Visual Studio Code')).toBe('vscode');
    expect(clientOf('cursor-vscode')).toBe('cursor');
    expect(clientOf('codex-mcp-client')).toBe('codex');
    expect(clientOf('openai-mcp')).toBe('chatgpt');
    expect(clientOf('Claude Code')).toBe('claude-code');
    expect(clientOf('claude-ai')).toBe('claude-ai');
  });

  it('counts hire and cv conversions even from a bot', () => {
    expect(
      dailyIncrements(
        pageview({
          kind: 'conversion',
          source: 'api',
          userAgent: 'curl/8',
          conversion: { type: 'hire' },
        }),
      ),
    ).toEqual([['conversions', 'hire']]);
    expect(
      dailyIncrements(
        pageview({
          kind: 'conversion',
          source: 'api',
          userAgent: 'curl/8',
          conversion: { type: 'cv' },
        }),
      ),
    ).toEqual([['conversions', 'cv']]);
  });

  it('counts an outbound click only when a person made it', () => {
    const click = (userAgent: string) =>
      dailyIncrements(pageview({ kind: 'conversion', source: 'api', userAgent, conversion: { type: 'outbound', target: 'contato/github' } }));
    expect(click(CHROME)).toEqual([['conversions', 'outbound'], ['outbound', 'contato%2Fgithub']]);
    expect(click('LinkedInBot/1.0')).toEqual([]);
  });

  it('counts an outbound conversion without a target as the type alone', () => {
    expect(
      dailyIncrements(
        pageview({
          kind: 'conversion',
          source: 'api',
          conversion: { type: 'outbound' },
        }),
      ),
    ).toEqual([['conversions', 'outbound']]);
  });
});
