# Plano: medição de leads e conversão (`lead-analytics`)

> **Spec:** `docs/specs/lead-analytics/SPEC.md`
> **Slug:** `lead-analytics` · **Criado:** 2026-10-14
> **Profundidade:** Deep · **Tarefas:** 20 em 5 lotes · commit por tarefa, **nunca push**

**Objetivo:** medir visitas, conversões e uso por agentes sem JavaScript de cliente e sem
cookie de visitante, e levar o percurso do dia para o aviso de cada lead.

**Arquitetura:** toda a lógica mora em funções puras em `src/lib/analytics/`
(classificação, canal, hash, evento, incrementos, percurso, tabela do `/go`). Um
`Recorder` único (`src/lib/analytics/runtime.ts`) junta essas peças com um
`AnalyticsStore` (Firestore em produção, memória nos testes) e nunca lança. Middleware,
`/v.gif`, `/go/...`, `/eu`, `/api/hire`, `/api/cv` e `/api/mcp` são cascas que chamam o
recorder.

**Stack:** Astro 7.2 SSR, `firebase-admin` (Firestore, `FieldValue.increment`, batch),
`node:crypto` (HMAC, `timingSafeEqual`), Vitest com `experimental_AstroContainer`.

**Regras desta rodada:**

- Cada tarefa começa pelo teste vermelho e roda `npx vitest run <arquivo>` antes e depois.
- Nenhum teste toca o Firestore real: o store de memória fica em `tests/helpers/analytics-store.ts`.
- Nenhum portão existente é relaxado. Testes que fixam a URL real de contato ou de case
  mudam na Task 14 porque a decisão mudou (REQ-010), não para ficar verde.
- **Não fazer push.** Os segredos da Task 19 precisam existir antes do `apphosting.yaml` ir para `main`.
- Caminho com colchetes vai entre aspas no shell.

## Fatos verificados

| Fato | Evidência |
|---|---|
| Middleware só põe `x-robots-tag` | `src/middleware.ts:4` |
| Páginas pré-renderizadas: posts, cases, anos do arquivo | `src/pages/[slug].astro:17`, `src/pages/lab/[slug].astro:11`, `src/pages/portfolio/[slug].astro:11`, `src/pages/posts/arquivo/[year].astro:10` |
| `isPrerendered` existe no contexto (página e middleware) | `node_modules/astro/dist/types/public/context.d.ts:474` |
| Dia de São Paulo já existe | `src/lib/now/day.ts:2` (`saoPauloDay`) |
| IP do cliente atrás da Cloudflare e do balanceador | `src/lib/hire/rate-limit.ts:88` (`clientIpOf`) |
| Limiter em memória reaproveitável | `src/lib/hire/rate-limit.ts` (`createLimiter`) |
| Leitura de corpo com teto de tamanho e tempo | `src/lib/hire/read-body.ts:33` (`readLimitedText`) |
| Cliente Firestore memoizado | `src/lib/hire/firestore.ts` (`getFirestoreClient`) |
| Envio do aviso de briefing | `src/lib/hire/handler.ts:142` (`notifier.send(briefing, id)`) |
| Texto do aviso de briefing (inglês) | `src/lib/hire/notify.ts` (`renderNotification`) |
| Handler e aviso do currículo | `src/lib/cv/download.ts:101` (`handleCvDownload`), `renderCvNotification` |
| Rota MCP repassa o `Request` cru ao transport | `src/pages/api/mcp.ts` (`handle`) |
| Lista de páginas do sitemap montada inline | `src/lib/aeo/sitemap.ts:38` (`buildSitemap`) |
| Links de case montados por `visibleLinks` | `src/lib/catalog/links.ts` |
| Contatos com URL real em 4 lugares | `src/components/home/Contact.astro:18`, `src/components/layout/SiteFooter.astro:41`, `src/pages/sobre.astro:72`, `src/pages/contato.astro:208` |
| `LinkList` usado pelo case | `src/components/catalog/CaseArticle.astro:164` |
| Política diz que agentes e visitas não são medidos | `src/lib/privacy/policy.ts:29`, seção `agentes` |
| Teste da política fixa ids das seções e a data | `tests/privacy/policy.test.ts` |
| Fim do `body` no layout | `src/layouts/BaseLayout.astro:164` |

## Ordem

```
Lote 1 (lógica pura)        T1 → T2 → T3 → T4 → T5 → T6
Lote 2 (store e recorder)   T7 → T8
Lote 3 (coleta)             T9 → T10 → T11 → T12
Lote 4 (conversões)         T13 → T14 → T15 → T16
Lote 5 (política e operação) T17 → T18 → T19 → T20
```

T8 depende de T1 a T7. Do lote 3 em diante, toda tarefa depende de T8.

---

## Lote 1: lógica pura

### Task 1: classificação do user agent

**Requirement:** REQ-004
**Files:** Create `src/lib/analytics/classify.ts`; Test `tests/analytics/classify.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend) · reviewers business-logic-reviewer, test-reviewer

**Step 1 (Red), `tests/analytics/classify.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { classifyAgent } from '../../src/lib/analytics/classify';

const CHROME =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

describe('classifyAgent', () => {
  it.each([
    [CHROME, 'human'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', 'human'],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', 'ai_agent'],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot', 'ai_agent'],
    ['Mozilla/5.0 (compatible; Applebot-Extended/0.1)', 'ai_agent'],
    ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'search_crawler'],
    ['LinkedInBot/1.0 (compatible; Mozilla/5.0)', 'search_crawler'],
    ['curl/8.9.1', 'other_bot'],
    ['python-httpx/0.27.0', 'other_bot'],
    ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/129.0', 'other_bot'],
    ['', 'other_bot'],
  ])('classifies %s as %s', (userAgent, expected) => {
    expect(classifyAgent(userAgent)).toBe(expected);
  });

  it('treats a missing user agent as a bot', () => {
    expect(classifyAgent(null)).toBe('other_bot');
  });
});
```

**Step 2:** `npx vitest run tests/analytics/classify.test.ts` → FAIL: `Failed to resolve import "../../src/lib/analytics/classify"`.

**Step 3 (Green), `src/lib/analytics/classify.ts`:**

```ts
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
```

**Step 4:** mesmo comando → PASS.
**Step 5:** `/git commit`.

---

### Task 2: canal e UTMs

**Requirement:** REQ-006
**Files:** Create `src/lib/analytics/channel.ts`; Test `tests/analytics/channel.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers business-logic-reviewer, security-reviewer, test-reviewer

**Step 1 (Red), `tests/analytics/channel.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { OWN_HOSTS, channelOf, utmOf } from '../../src/lib/analytics/channel';

const channel = (referrer: string | null, search = '') =>
  channelOf({ referrer, utm: utmOf(new URLSearchParams(search)), ownHosts: OWN_HOSTS });

describe('channelOf', () => {
  it.each([
    ['https://www.google.com/', 'google'],
    ['https://www.google.com.br/', 'google'],
    ['https://www.bing.com/search?q=x', 'bing'],
    ['https://duckduckgo.com/', 'duckduckgo'],
    ['https://www.linkedin.com/feed/', 'linkedin'],
    ['https://lnkd.in/abc', 'linkedin'],
    ['https://github.com/nandomoreirame', 'github'],
    ['https://t.co/xyz', 'x'],
    ['https://x.com/someone', 'x'],
    ['https://bsky.app/profile/x', 'bluesky'],
    ['https://news.ycombinator.com/', 'other'],
  ])('maps %s to %s', (referrer, expected) => {
    expect(channel(referrer)).toBe(expected);
  });

  it('is direct without a referrer, and for a referrer that is not a URL', () => {
    expect(channel(null)).toBe('direct');
    expect(channel('not a url')).toBe('direct');
  });

  it('marks navigation inside the site as internal, never as a channel', () => {
    expect(channel('https://nandomoreira.dev/lab')).toBe('internal');
  });

  it('lets a UTM source win over the referrer', () => {
    expect(channel('https://www.linkedin.com/', 'utm_source=Newsletter')).toBe('utm:newsletter');
  });
});

describe('utmOf', () => {
  it('reads the three fields', () => {
    expect(utmOf(new URLSearchParams('utm_source=linkedin&utm_medium=social&utm_campaign=rdo'))).toEqual({
      source: 'linkedin',
      medium: 'social',
      campaign: 'rdo',
    });
  });

  it('is null without a source', () => {
    expect(utmOf(new URLSearchParams('utm_medium=social'))).toBeNull();
  });

  it('strips control characters and caps each field at 64', () => {
    const utm = utmOf(new URLSearchParams(`utm_source=a%00b%0A&utm_campaign=${'x'.repeat(100)}`));
    expect(utm?.source).toBe('ab');
    expect(utm?.campaign).toHaveLength(64);
    expect(utm?.medium).toBeNull();
  });
});
```

**Step 2:** `npx vitest run tests/analytics/channel.test.ts` → FAIL (módulo inexistente).

**Step 3 (Green), `src/lib/analytics/channel.ts`:**

```ts
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
  const text = value.replace(/[\p{Cc}\p{Cf}]/gu, '').trim().slice(0, MAX_UTM);
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
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return 'direct';
  }

  if (ownHosts.includes(host)) return 'internal';

  return CHANNELS.find(([, pattern]) => pattern.test(host))?.[0] ?? 'other';
};
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

### Task 3: hash diário do visitante

**Requirement:** REQ-005
**Files:** Create `src/lib/analytics/visitor.ts`; Test `tests/analytics/visitor.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers security-reviewer, test-reviewer

**Step 1 (Red), `tests/analytics/visitor.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { visitorHash } from '../../src/lib/analytics/visitor';

const base = {
  secret: 's'.repeat(32),
  day: '2026-10-14',
  ip: '203.0.113.7',
  userAgent: 'Mozilla/5.0 Chrome',
};

describe('visitorHash', () => {
  it('is stable within a day', () => {
    expect(visitorHash(base)).toBe(visitorHash({ ...base }));
  });

  it('is 16 bytes of hex', () => {
    expect(visitorHash(base)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('changes with the day, the ip, the user agent and the secret', () => {
    const hash = visitorHash(base);
    expect(visitorHash({ ...base, day: '2026-10-15' })).not.toBe(hash);
    expect(visitorHash({ ...base, ip: '203.0.113.8' })).not.toBe(hash);
    expect(visitorHash({ ...base, userAgent: 'Mozilla/5.0 Firefox' })).not.toBe(hash);
    expect(visitorHash({ ...base, secret: 't'.repeat(32) })).not.toBe(hash);
  });

  it('never carries the ip', () => {
    expect(visitorHash(base)).not.toContain('203');
  });
});
```

**Step 2:** `npx vitest run tests/analytics/visitor.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/visitor.ts`:**

```ts
import { createHmac } from 'node:crypto';

/**
 * Two HMACs, so the key of a day is derived and never stored: the hashes of one
 * day cannot be joined to the next, and the IP itself is never written
 * anywhere (REQ-005).
 */
export const visitorHash = ({
  secret,
  day,
  ip,
  userAgent,
}: {
  secret: string;
  day: string;
  ip: string;
  userAgent: string | null;
}): string => {
  const dailyKey = createHmac('sha256', secret).update(day).digest();

  return createHmac('sha256', dailyKey).update(`${ip}\n${userAgent ?? ''}`).digest('hex').slice(0, 32);
};
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

### Task 4: evento, validade e incrementos do agregado

**Requirement:** REQ-014, REQ-004, REQ-006
**Files:** Create `src/lib/analytics/event.ts`; Test `tests/analytics/event.test.ts`
**Team:** data · implementer `backend-engineer` (typescript-backend) · reviewers consequences-reviewer, business-logic-reviewer, test-reviewer
**Depende de:** T1, T2

**Step 1 (Red), `tests/analytics/event.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import {
  buildEvent,
  counterKey,
  countryOf,
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
    });
  });

  it('never sets conversion when there is none, since Firestore rejects undefined', () => {
    expect(Object.hasOwn(pageview(), 'conversion')).toBe(false);
  });

  it('gives the pixel a UTM channel or unknown, because its referrer is the page itself', () => {
    expect(pageview({ source: 'pixel', referrer: null }).channel).toBe('unknown');
    expect(
      pageview({ source: 'pixel', referrer: null, utm: { source: 'LinkedIn', medium: null, campaign: null } }).channel,
    ).toBe('utm:linkedin');
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
});

describe('counterKey', () => {
  it('escapes slashes and dots so a path is one Firestore field', () => {
    expect(counterKey('/lab/forja.md')).toBe('%2Flab%2Fforja%2Emd');
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

  it('leaves internal navigation out of the channels', () => {
    expect(dailyIncrements(pageview({ referrer: 'https://nandomoreira.dev/' }))).not.toContainEqual(['channels', 'internal']);
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
      ['mcp', 'methods', 'tools%2Fcall'],
      ['mcp', 'tools', 'get_profile'],
      ['mcp', 'clients', 'claude-code'],
    ]);
  });

  it('counts an outbound click only when a person made it', () => {
    const click = (userAgent: string) =>
      dailyIncrements(pageview({ kind: 'conversion', source: 'api', userAgent, conversion: { type: 'outbound', target: 'contato/github' } }));
    expect(click(CHROME)).toEqual([['conversions', 'outbound'], ['outbound', 'contato%2Fgithub']]);
    expect(click('LinkedInBot/1.0')).toEqual([]);
  });
});
```

**Step 2:** `npx vitest run tests/analytics/event.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/event.ts`:**

```ts
import { type Utm, OWN_HOSTS, channelOf } from './channel';
import { type TrafficClass, classifyAgent } from './classify';

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

/** A dot would split the key into nested fields in a Firestore update. */
export const counterKey = (value: string): string => encodeURIComponent(value).replaceAll('.', '%2E');

export const buildEvent = (input: EventInput): AnalyticsEvent => ({
  kind: input.kind,
  at: input.at.toISOString(),
  day: input.day,
  expiresAt: new Date(input.at.getTime() + EVENT_TTL_MS),
  visitor: input.visitor,
  class: classifyAgent(input.userAgent),
  source: input.source,
  path: input.path.slice(0, MAX_PATH),
  // The pixel's referrer is the page it sits on, so only a UTM can name a channel.
  channel:
    input.source === 'pixel'
      ? input.utm
        ? `utm:${input.utm.source.toLowerCase()}`
        : 'unknown'
      : channelOf({ referrer: input.referrer, utm: input.utm, ownHosts: OWN_HOSTS }),
  utm: input.utm,
  country: countryOf(input.country),
  ...(input.conversion ? { conversion: input.conversion } : {}),
});

/** Crawlers only feed the per-class totals; their raw events would just burn the write quota. */
export const keepsRawEvent = (event: AnalyticsEvent): boolean =>
  event.class === 'human' || event.class === 'ai_agent';

/** A field path in `analytics_daily/<day>`, each one incremented by 1. */
export type Increment = readonly string[];

export const dailyIncrements = (event: AnalyticsEvent): Increment[] => {
  const paths: Increment[] = [];

  if (event.kind === 'pageview') {
    paths.push(['traffic', event.class]);
    if (event.class === 'human') {
      paths.push(['pages', counterKey(event.path)], ['countries', event.country ?? 'unknown']);
      if (event.channel !== 'internal') paths.push(['channels', counterKey(event.channel)]);
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
      if (target) paths.push(['mcp', 'methods', counterKey(target)]);
      if (tool) paths.push(['mcp', 'tools', counterKey(tool)]);
      if (client) paths.push(['mcp', 'clients', counterKey(client)]);
    }
  }

  return paths;
};
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

### Task 5: o que é medido (visita, superfície de máquina, prefetch)

**Requirement:** REQ-001, REQ-007
**Files:** Create `src/lib/analytics/surface.ts`; Test `tests/analytics/surface.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend) · reviewers business-logic-reviewer, test-reviewer

**Step 1 (Red), `tests/analytics/surface.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { isMachineSurface, measurementFor } from '../../src/lib/analytics/surface';

const html = 'text/html; charset=utf-8';
const measure = (overrides: Partial<Parameters<typeof measurementFor>[0]> = {}) =>
  measurementFor({ method: 'GET', path: '/sobre', status: 200, contentType: html, headers: new Headers(), ...overrides });

describe('isMachineSurface', () => {
  it.each(['/llms.txt', '/llms-full.txt', '/AGENTS.md', '/ai-index.json', '/api/resume.json', '/api/resume.txt', '/index.md', '/lab/forja.md', '/ia', '/sobre/ia'])(
    '%s is a machine surface',
    (path) => expect(isMachineSurface(path)).toBe(true),
  );

  it.each(['/', '/sobre', '/lab/forja', '/media', '/api/hire'])('%s is not', (path) => {
    expect(isMachineSurface(path)).toBe(false);
  });
});

describe('measurementFor', () => {
  it('counts a 2xx HTML GET as a pageview', () => {
    expect(measure()).toBe('pageview');
  });

  it('counts a machine surface even when it answers HTML', () => {
    expect(measure({ path: '/sobre/ia' })).toBe('machine');
    expect(measure({ path: '/llms.txt', contentType: 'text/plain' })).toBe('machine');
  });

  it('ignores HEAD, errors, redirects, non-HTML and prefetches', () => {
    expect(measure({ method: 'HEAD' })).toBeNull();
    expect(measure({ status: 404 })).toBeNull();
    expect(measure({ status: 301 })).toBeNull();
    expect(measure({ path: '/api/health', contentType: 'application/json' })).toBeNull();
    expect(measure({ headers: new Headers({ 'sec-purpose': 'prefetch;prerender' }) })).toBeNull();
    expect(measure({ headers: new Headers({ purpose: 'prefetch' }) })).toBeNull();
  });
});
```

**Step 2:** `npx vitest run tests/analytics/surface.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/surface.ts`:**

```ts
const MACHINE_FILES = new Set([
  '/llms.txt',
  '/llms-full.txt',
  '/AGENTS.md',
  '/ai-index.json',
  '/api/resume.json',
  '/api/resume.txt',
]);

/** Routes written for agents (REQ-007): counted apart from reading. */
export const isMachineSurface = (path: string): boolean =>
  MACHINE_FILES.has(path) || path.endsWith('.md') || path === '/ia' || path.endsWith('/ia');

/** A browser warming a page the visitor may never open. */
const isPrefetch = (headers: Headers): boolean =>
  /prefetch/i.test(headers.get('sec-purpose') ?? '') || /prefetch/i.test(headers.get('purpose') ?? '');

export type Measurement = 'pageview' | 'machine' | null;

export const measurementFor = ({
  method,
  path,
  status,
  contentType,
  headers,
}: {
  method: string;
  path: string;
  status: number;
  contentType: string | null;
  headers: Headers;
}): Measurement => {
  if (method !== 'GET' || status < 200 || status >= 300 || isPrefetch(headers)) return null;
  if (isMachineSurface(path)) return 'machine';
  if ((contentType ?? '').startsWith('text/html')) return 'pageview';
  return null;
};
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

### Task 6: percurso do dia em texto

**Requirement:** REQ-012
**Files:** Create `src/lib/analytics/journey.ts`; Test `tests/analytics/journey.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend) · reviewers business-logic-reviewer, test-reviewer
**Depende de:** T4

O aviso de lead é em inglês (`renderNotification`), então o bloco também é. "Sem percurso"
sai como `No journey recorded today.`; a Task 20 registra isso na spec.

**Step 1 (Red), `tests/analytics/journey.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { buildEvent } from '../../src/lib/analytics/event';
import { renderJourney } from '../../src/lib/analytics/journey';

const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/129.0 Safari/537.36';
const view = (iso: string, path: string, referrer: string | null, search = '') =>
  buildEvent({
    kind: 'pageview',
    at: new Date(iso),
    day: '2026-10-14',
    visitor: 'v',
    userAgent: CHROME,
    source: 'ssr',
    path,
    referrer,
    utm: search ? { source: 'linkedin', medium: 'social', campaign: 'rdo' } : null,
    country: 'BR',
  });

describe('renderJourney', () => {
  it('says so when there is nothing', () => {
    expect(renderJourney([])).toContain('No journey recorded today.');
  });

  it('lists entry channel, UTM, country and pages in order, in São Paulo time', () => {
    const text = renderJourney([
      view('2026-10-14T17:09:00Z', '/contato', 'https://nandomoreira.dev/lab/forja'),
      view('2026-10-14T17:02:00Z', '/sessoes-do-red-dead', 'https://www.linkedin.com/', 'utm'),
      view('2026-10-14T17:05:00Z', '/lab/forja', 'https://nandomoreira.dev/sessoes-do-red-dead'),
    ]);

    expect(text).toContain('Entry:   utm:linkedin');
    expect(text).toContain('UTM:     linkedin / social / rdo');
    expect(text).toContain('Country: BR');
    expect(text).toContain('Visits:  3');
    expect(text.indexOf('14:02  /sessoes-do-red-dead')).toBeLessThan(text.indexOf('14:05  /lab/forja'));
    expect(text.indexOf('14:05  /lab/forja')).toBeLessThan(text.indexOf('14:09  /contato'));
  });

  it('ignores conversions and machine hits in the page list', () => {
    const conversion = { ...view('2026-10-14T17:10:00Z', '/api/hire', null), kind: 'conversion' as const };
    expect(renderJourney([conversion])).toContain('No journey recorded today.');
  });
});
```

**Step 2:** `npx vitest run tests/analytics/journey.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/journey.ts`:**

```ts
import type { AnalyticsEvent } from './event';

const clock = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));

/**
 * The pages one visitor saw today, for the lead notification (REQ-012). The
 * entry is the first arrival from outside; later internal clicks do not
 * overwrite where the person came from.
 */
export const renderJourney = (events: readonly AnalyticsEvent[]): string => {
  const views = events.filter((event) => event.kind === 'pageview').sort((a, b) => a.at.localeCompare(b.at));

  if (views.length === 0) return ['Journey today', '-------------', 'No journey recorded today.'].join('\n');

  const entry = views.find((event) => event.channel !== 'internal') ?? views[0]!;
  const utm = entry.utm
    ? [entry.utm.source, entry.utm.medium, entry.utm.campaign].filter(Boolean).join(' / ')
    : 'none';

  return [
    'Journey today (São Paulo time)',
    '------------------------------',
    `Entry:   ${entry.channel}`,
    `UTM:     ${utm}`,
    `Country: ${entry.country ?? 'unknown'}`,
    `Visits:  ${views.length}`,
    '',
    ...views.map((event) => `  ${clock(event.at)}  ${event.path}`),
  ].join('\n');
};
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

## Lote 2: store e recorder

### Task 7: store (Firestore e memória)

**Requirement:** REQ-014
**Files:** Create `src/lib/analytics/store.ts`, `tests/helpers/analytics-store.ts`; Test `tests/analytics/store.test.ts`
**Team:** data · implementer `backend-engineer` (typescript-backend) · reviewers consequences-reviewer, business-logic-reviewer, test-reviewer
**Depende de:** T4

O adaptador Firestore não tem teste unitário (é I/O). O que tem lógica, a montagem do
objeto aninhado de incrementos, é função pura e testada.

**Step 1 (Red), `tests/analytics/store.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { nestedIncrements } from '../../src/lib/analytics/store';

describe('nestedIncrements', () => {
  it('turns field paths into the nested object a merge set expects', () => {
    const tag = (by: number) => `+${by}`;
    expect(
      nestedIncrements(
        [
          ['traffic', 'human'],
          ['pages', '%2Flab'],
          ['mcp', 'tools', 'get_profile'],
          ['mcp', 'methods', 'tools%2Fcall'],
        ],
        tag,
      ),
    ).toEqual({
      traffic: { human: '+1' },
      pages: { '%2Flab': '+1' },
      mcp: { tools: { get_profile: '+1' }, methods: { 'tools%2Fcall': '+1' } },
    });
  });
});
```

**Step 2:** `npx vitest run tests/analytics/store.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/store.ts`:**

```ts
import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { getFirestoreClient } from '../hire/firestore';
import { type AnalyticsEvent, type Increment, dailyExpiry, dailyIncrements, keepsRawEvent } from './event';

export const EVENTS_COLLECTION = 'analytics_events';
export const DAILY_COLLECTION = 'analytics_daily';

export interface AnalyticsStore {
  record: (event: AnalyticsEvent) => Promise<void>;
  /** One visitor's events of one day, in no particular order. */
  eventsOf: (day: string, visitor: string) => Promise<AnalyticsEvent[]>;
}

/**
 * A merge `set` takes nested objects, not dotted paths: a dotted key would be
 * stored literally as a field name with dots in it.
 */
export const nestedIncrements = (
  paths: readonly Increment[],
  increment: (by: number) => unknown,
): Record<string, unknown> => {
  const root: Record<string, unknown> = {};

  for (const path of paths) {
    let node = root;
    for (const segment of path.slice(0, -1)) {
      node[segment] ??= {};
      node = node[segment] as Record<string, unknown>;
    }
    node[path.at(-1)!] = increment(1);
  }

  return root;
};

/**
 * One batch, two writes: the raw event (when kept) and the day's counters. The
 * daily document is written with merge, so the first visit of a day creates it
 * and every later one only increments (REQ-014).
 */
export const firestoreAnalyticsStore = (): AnalyticsStore => ({
  record: async (event) => {
    const db = getFirestoreClient();
    const batch = db.batch();

    if (keepsRawEvent(event)) batch.set(db.collection(EVENTS_COLLECTION).doc(), event);

    batch.set(
      db.collection(DAILY_COLLECTION).doc(event.day),
      {
        day: event.day,
        expiresAt: dailyExpiry(event.day),
        ...nestedIncrements(dailyIncrements(event), (by) => FieldValue.increment(by)),
      },
      { merge: true },
    );

    await batch.commit();
  },

  /**
   * Two equality filters and no orderBy: Firestore serves that from its
   * single-field indexes, so no composite index has to be deployed. The few
   * events of a visitor are sorted in memory by the caller.
   */
  eventsOf: async (day, visitor) => {
    const snapshot = await getFirestoreClient()
      .collection(EVENTS_COLLECTION)
      .where('day', '==', day)
      .where('visitor', '==', visitor)
      .limit(200)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<AnalyticsEvent, 'expiresAt'> & { expiresAt: Timestamp };
      return { ...data, expiresAt: data.expiresAt.toDate() };
    });
  },
});
```

**`tests/helpers/analytics-store.ts`** (usado da Task 8 em diante):

```ts
import { type AnalyticsEvent, dailyIncrements, keepsRawEvent } from '../../src/lib/analytics/event';
import type { AnalyticsStore } from '../../src/lib/analytics/store';

/** Same rules as the Firestore store, kept in memory. Counters keyed by dotted path. */
export const memoryAnalyticsStore = () => {
  const events: AnalyticsEvent[] = [];
  const daily = new Map<string, Record<string, number>>();

  const store: AnalyticsStore = {
    record: async (event) => {
      if (keepsRawEvent(event)) events.push(event);
      const counters = daily.get(event.day) ?? {};
      for (const path of dailyIncrements(event)) {
        const key = path.join('.');
        counters[key] = (counters[key] ?? 0) + 1;
      }
      daily.set(event.day, counters);
    },
    eventsOf: async (day, visitor) => events.filter((event) => event.day === day && event.visitor === visitor),
  };

  return { store, events, daily };
};
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

### Task 8: configuração e recorder

**Requirement:** REQ-001, REQ-005, REQ-008
**Files:** Create `src/lib/analytics/config.ts`, `src/lib/analytics/recorder.ts`; Test `tests/analytics/recorder.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers security-reviewer, business-logic-reviewer, test-reviewer
**Depende de:** T1 a T7

**Step 1 (Red), `tests/analytics/recorder.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { readAnalyticsConfig } from '../../src/lib/analytics/config';
import { createRecorder } from '../../src/lib/analytics/recorder';
import type { AnalyticsStore } from '../../src/lib/analytics/store';
import { memoryAnalyticsStore } from '../helpers/analytics-store';

const SECRET = 's'.repeat(32);
const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/129.0 Safari/537.36';
const now = () => new Date('2026-10-14T17:02:00.000Z');

const request = (headers: Record<string, string> = {}) =>
  new Request('https://nandomoreira.dev/sobre', {
    headers: { 'user-agent': CHROME, 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'cf-ipcountry': 'BR', ...headers },
  });

const hit = { kind: 'pageview' as const, path: '/sobre', source: 'ssr' as const, referrer: 'https://www.google.com/' };

describe('readAnalyticsConfig', () => {
  it('accepts secrets of at least 32 characters and nothing shorter', () => {
    expect(readAnalyticsConfig({ ANALYTICS_HASH_SECRET: SECRET, ANALYTICS_SELF_TOKEN: ` ${SECRET} ` })).toEqual({
      hashSecret: SECRET,
      selfToken: SECRET,
    });
    expect(readAnalyticsConfig({ ANALYTICS_HASH_SECRET: 'short' })).toEqual({ hashSecret: null, selfToken: null });
  });
});

describe('createRecorder', () => {
  it('records a pageview with a hash and no ip', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });

    await recorder.record(request(), hit);

    expect(memory.events).toHaveLength(1);
    expect(memory.events[0]).toMatchObject({ path: '/sobre', channel: 'google', country: 'BR', class: 'human' });
    expect(JSON.stringify(memory.events[0])).not.toContain('203.0.113.7');
  });

  it('records nothing without the secret', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: null, selfToken: null }, now });
    await recorder.record(request(), hit);
    expect(memory.daily.size).toBe(0);
  });

  it('records nothing for the author', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });
    await recorder.record(request({ cookie: 'a=b; nm_self=1' }), hit);
    expect(memory.daily.size).toBe(0);
  });

  it('gives up after the timeout and never throws', async () => {
    const slow: AnalyticsStore = { record: () => new Promise(() => {}), eventsOf: () => new Promise(() => {}) };
    const failing: AnalyticsStore = {
      record: () => Promise.reject(new Error('down')),
      eventsOf: () => Promise.reject(new Error('down')),
    };
    const config = { hashSecret: SECRET, selfToken: null };

    const started = Date.now();
    await createRecorder({ store: slow, config, now, timeoutMs: 50 }).record(request(), hit);
    expect(Date.now() - started).toBeLessThan(500);

    await expect(createRecorder({ store: failing, config, now }).record(request(), hit)).resolves.toBeUndefined();
    await expect(createRecorder({ store: failing, config, now }).journey(request())).resolves.toContain(
      'No journey recorded today.',
    );
  });

  it('finds the journey of the same visitor on the same day', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });

    await recorder.record(request(), hit);
    await recorder.record(request({ 'user-agent': `${CHROME} Other` }), { ...hit, path: '/lab' });

    const journey = await recorder.journey(request());
    expect(journey).toContain('/sobre');
    expect(journey).not.toContain('/lab');
  });
});
```

**Step 2:** `npx vitest run tests/analytics/recorder.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/config.ts`:**

```ts
export interface AnalyticsConfig {
  hashSecret: string | null;
  selfToken: string | null;
}

const MIN_SECRET = 32;

const secretOf = (value: string | undefined): string | null => {
  const text = (value ?? '').trim();
  return text.length >= MIN_SECRET ? text : null;
};

/**
 * Missing or weak is off, never an error: measuring is optional and must not
 * keep the site from booting the way a missing mail secret should (REQ-005).
 */
export const readAnalyticsConfig = (env: Record<string, string | undefined>): AnalyticsConfig => ({
  hashSecret: secretOf(env.ANALYTICS_HASH_SECRET),
  selfToken: secretOf(env.ANALYTICS_SELF_TOKEN),
});
```

**`src/lib/analytics/recorder.ts`:**

```ts
import { clientIpOf } from '../hire/rate-limit';
import { saoPauloDay } from '../now/day';
import { utmOf } from './channel';
import type { AnalyticsConfig } from './config';
import { type Conversion, type EventKind, type EventSource, buildEvent } from './event';
import { renderJourney } from './journey';
import type { AnalyticsStore } from './store';
import { visitorHash } from './visitor';

export const SELF_COOKIE = 'nm_self';

export const isSelf = (headers: Headers): boolean =>
  (headers.get('cookie') ?? '').split(';').some((pair) => pair.trim() === `${SELF_COOKIE}=1`);

/** Resolves undefined on timeout or failure; measuring never breaks a response. */
export const withTimeout = async <T>(work: Promise<T>, ms: number): Promise<T | undefined> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), ms);
      }),
    ]);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
};

export interface Hit {
  kind: EventKind;
  path: string;
  source: EventSource;
  referrer: string | null;
  search?: URLSearchParams;
  conversion?: Conversion;
}

export interface Recorder {
  record: (request: Request, hit: Hit) => Promise<void>;
  /** Today's pages of the visitor behind this request, as notification text. */
  journey: (request: Request) => Promise<string>;
}

export const createRecorder = ({
  store,
  config,
  now,
  timeoutMs = 250,
}: {
  store: AnalyticsStore;
  config: AnalyticsConfig;
  now: () => Date;
  timeoutMs?: number;
}): Recorder => {
  const visitorOf = (secret: string, request: Request, day: string): string =>
    visitorHash({ secret, day, ip: clientIpOf(request.headers), userAgent: request.headers.get('user-agent') });

  return {
    record: async (request, hit) => {
      const secret = config.hashSecret;
      if (!secret || isSelf(request.headers)) return;

      const at = now();
      const day = saoPauloDay(at);
      const event = buildEvent({
        kind: hit.kind,
        at,
        day,
        visitor: visitorOf(secret, request, day),
        userAgent: request.headers.get('user-agent'),
        source: hit.source,
        path: hit.path,
        referrer: hit.referrer,
        utm: utmOf(hit.search ?? new URLSearchParams()),
        country: request.headers.get('cf-ipcountry'),
        conversion: hit.conversion,
      });

      // The 250 ms ceiling (REQ-001): Cloud Run throttles the CPU once the
      // response is out, so an unawaited write could simply never happen.
      await withTimeout(store.record(event), timeoutMs);
    },

    journey: async (request) => {
      const secret = config.hashSecret;
      if (!secret) return renderJourney([]);

      const day = saoPauloDay(now());
      const events = await withTimeout(store.eventsOf(day, visitorOf(secret, request, day)), timeoutMs);
      return renderJourney(events ?? []);
    },
  };
};
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

## Lote 3: coleta

### Task 9: visitas SSR no middleware

**Requirement:** REQ-001, REQ-007
**Files:** Create `src/lib/analytics/runtime.ts`, `src/lib/analytics/measure.ts`; Modify `src/middleware.ts`; Test `tests/analytics/measure.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend) · reviewers business-logic-reviewer, consequences-reviewer, test-reviewer
**Depende de:** T8

A decisão sai do middleware para `measureRequest`, testável sem o módulo virtual `astro:middleware`.

**Step 1 (Red), `tests/analytics/measure.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { measureRequest } from '../../src/lib/analytics/measure';
import type { Hit } from '../../src/lib/analytics/recorder';

const spy = () => {
  const hits: Hit[] = [];
  return { hits, recorder: { record: async (_request: Request, hit: Hit) => void hits.push(hit) } };
};

const run = async (path: string, init: { prerendered?: boolean; contentType?: string; status?: number } = {}) => {
  const { hits, recorder } = spy();
  const url = new URL(`https://nandomoreira.dev${path}?utm_source=x&ignored=1`);
  await measureRequest(recorder, {
    request: new Request(url, { headers: { referer: 'https://www.google.com/' } }),
    url,
    isPrerendered: init.prerendered ?? false,
    response: new Response('', {
      status: init.status ?? 200,
      headers: { 'content-type': init.contentType ?? 'text/html' },
    }),
  });
  return hits;
};

describe('measureRequest', () => {
  it('records an SSR page with its referrer and query', async () => {
    const [hit] = await run('/sobre');
    expect(hit).toMatchObject({ kind: 'pageview', path: '/sobre', source: 'ssr', referrer: 'https://www.google.com/' });
    expect(hit?.search?.get('utm_source')).toBe('x');
  });

  it('normalises the trailing slash', async () => {
    expect((await run('/sobre/'))[0]?.path).toBe('/sobre');
  });

  it('records machine surfaces as machine', async () => {
    expect((await run('/llms.txt', { contentType: 'text/plain' }))[0]?.kind).toBe('machine');
  });

  it('leaves prerendered pages to the pixel, so nothing counts twice', async () => {
    expect(await run('/lab/forja', { prerendered: true })).toEqual([]);
  });

  it('ignores a 404', async () => {
    expect(await run('/nada', { status: 404 })).toEqual([]);
  });
});
```

**Step 2:** `npx vitest run tests/analytics/measure.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/measure.ts`:**

```ts
import { pagePath } from '../aeo/urls';
import type { Recorder } from './recorder';
import { measurementFor } from './surface';

export const measureRequest = async (
  recorder: Pick<Recorder, 'record'>,
  { request, url, isPrerendered, response }: { request: Request; url: URL; isPrerendered: boolean; response: Response },
): Promise<void> => {
  // In production the adapter serves prerendered files before middleware runs;
  // in dev it does not, and the pixel already counts them (REQ-002).
  if (isPrerendered) return;

  const kind = measurementFor({
    method: request.method,
    path: url.pathname,
    status: response.status,
    contentType: response.headers.get('content-type'),
    headers: request.headers,
  });
  if (!kind) return;

  await recorder.record(request, {
    kind,
    path: kind === 'pageview' ? pagePath(url.pathname) : url.pathname,
    source: 'ssr',
    referrer: request.headers.get('referer'),
    search: url.searchParams,
  });
};
```

**`src/lib/analytics/runtime.ts`:**

```ts
import { readAnalyticsConfig } from './config';
import { createRecorder } from './recorder';
import { firestoreAnalyticsStore } from './store';

/** One recorder per process, shared by middleware and routes. */
export const analyticsConfig = readAnalyticsConfig(process.env);

export const recorder = createRecorder({
  store: firestoreAnalyticsStore(),
  config: analyticsConfig,
  now: () => new Date(),
});
```

**`src/middleware.ts`** (substitui o arquivo):

```ts
import { defineMiddleware } from 'astro:middleware';
import { measureRequest } from './lib/analytics/measure';
import { recorder } from './lib/analytics/runtime';
import { robotsTagFor } from './lib/seo/backend-host';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  await measureRequest(recorder, {
    request: context.request,
    url: context.url,
    isPrerendered: context.isPrerendered,
    response,
  });

  const tag = robotsTagFor(context.url.hostname);
  if (!tag) return response;

  // Redirect responses carry immutable headers; copy them instead of failing.
  const headers = new Headers(response.headers);
  headers.set('x-robots-tag', tag);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
```

**Step 4:** `npx vitest run tests/analytics/measure.test.ts` → PASS; `npm run check` → 0 erros.
**Step 5:** `/git commit`.

---

### Task 10: rota `/v.gif`

**Requirement:** REQ-003
**Files:** Create `src/lib/analytics/pixel.ts`, `src/pages/v.gif.ts`; Modify `src/lib/aeo/sitemap.ts:38` (extrai `sitemapEntries`); Test `tests/analytics/pixel.test.ts`, `tests/aeo/sitemap.test.ts` (já existe, deve seguir verde)
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers security-reviewer, business-logic-reviewer, test-reviewer
**Depende de:** T8

**Step 1 (Red), `tests/analytics/pixel.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { OWN_HOSTS } from '../../src/lib/analytics/channel';
import { handlePixel } from '../../src/lib/analytics/pixel';
import type { Hit } from '../../src/lib/analytics/recorder';
import { createLimiter } from '../../src/lib/hire/rate-limit';

const setup = (max = 30) => {
  const hits: Hit[] = [];
  const deps = {
    recorder: { record: async (_request: Request, hit: Hit) => void hits.push(hit) },
    limiter: createLimiter({ max, windowMs: 60_000 }),
    knownPaths: async () => new Set(['/lab/forja', '/sessoes-do-red-dead']),
    ownHosts: OWN_HOSTS,
  };
  const pixel = (referer?: string, method = 'GET') =>
    handlePixel(
      new Request('https://nandomoreira.dev/v.gif', {
        method,
        headers: { ...(referer ? { referer } : {}), 'x-forwarded-for': '203.0.113.7' },
      }),
      deps,
    );
  return { hits, pixel };
};

describe('handlePixel', () => {
  it('always answers an uncacheable 1x1 GIF', async () => {
    const { pixel } = setup();
    const response = await pixel();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/gif');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(new Uint8Array(await response.arrayBuffer()).slice(0, 6)).toEqual(new TextEncoder().encode('GIF89a'));
  });

  it('records the page and UTMs from a same-site referer', async () => {
    const { hits, pixel } = setup();
    await pixel('https://nandomoreira.dev/lab/forja/?utm_source=linkedin');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ kind: 'pageview', path: '/lab/forja', source: 'pixel', referrer: null });
    expect(hits[0]?.search?.get('utm_source')).toBe('linkedin');
  });

  it('records nothing for a foreign or missing referer, an unknown page, or a non-GET', async () => {
    const { hits, pixel } = setup();
    await pixel();
    await pixel('https://evil.example/lab/forja');
    await pixel('https://nandomoreira.dev/nao-existe');
    await pixel('https://nandomoreira.dev/lab/forja', 'HEAD');
    expect(hits).toEqual([]);
  });

  it('stops recording past the limit but keeps answering', async () => {
    const { hits, pixel } = setup(2);
    for (let i = 0; i < 4; i += 1) expect((await pixel('https://nandomoreira.dev/lab/forja')).status).toBe(200);
    expect(hits).toHaveLength(2);
  });
});
```

**Step 2:** `npx vitest run tests/analytics/pixel.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/pixel.ts`:**

```ts
import { pagePath } from '../aeo/urls';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import type { Recorder } from './recorder';

/** The canonical 43-byte transparent GIF89a. */
const GIF = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  (char) => char.charCodeAt(0),
);

const gif = (): Response =>
  new Response(GIF, {
    status: 200,
    headers: { 'content-type': 'image/gif', 'cache-control': 'no-store', 'content-length': String(GIF.length) },
  });

const refererPage = (referer: string | null, ownHosts: readonly string[]) => {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return ownHosts.includes(url.hostname) ? { path: pagePath(url.pathname), search: url.searchParams } : null;
  } catch {
    return null;
  }
};

/**
 * Counts a visit to a prerendered page (REQ-003). The answer never changes, so
 * a probe learns nothing from it; only a same-site referer naming a real page,
 * within the per-IP limit, is written.
 */
export const handlePixel = async (
  request: Request,
  deps: {
    recorder: Pick<Recorder, 'record'>;
    limiter: Limiter;
    knownPaths: () => Promise<ReadonlySet<string>>;
    ownHosts: readonly string[];
  },
): Promise<Response> => {
  const page = request.method === 'GET' ? refererPage(request.headers.get('referer'), deps.ownHosts) : null;

  if (page && (await deps.knownPaths()).has(page.path) && deps.limiter.check(clientIpOf(request.headers))) {
    await deps.recorder.record(request, { kind: 'pageview', path: page.path, source: 'pixel', referrer: null, search: page.search });
  }

  return gif();
};
```

**`src/lib/aeo/sitemap.ts`:** mover a montagem de `entries` (de `const entries: Entry[] = [` até o fim do bloco de posts) para uma função exportada, sem mudar a saída:

```ts
export interface SitemapEntry {
  path: string;
  lastmod?: string;
}

export const sitemapEntries = ({ projects, posts = [], setupUpdatedAt }: Omit<Input, 'site'>): SitemapEntry[] => {
  const entries: SitemapEntry[] = [
    // ...exatamente o corpo atual, de { path: '/' } até o loop de posts...
  ];
  // ...blocos de posts e arquivo atuais, sem mudança...
  return entries;
};

export const buildSitemap = ({ site, ...rest }: Input): string => {
  const entries = sitemapEntries(rest);
  // ...serialização atual, sem mudança...
};
```

(Renomear o `interface Entry` local para `SitemapEntry` exportado; nada mais muda.)

**`src/pages/v.gif.ts`:**

```ts
import type { APIRoute } from 'astro';
import { sitemapEntries } from '../lib/aeo/sitemap';
import { OWN_HOSTS } from '../lib/analytics/channel';
import { handlePixel } from '../lib/analytics/pixel';
import { recorder } from '../lib/analytics/runtime';
import { getAllPosts, getAllProjects } from '../lib/content';
import { createLimiter } from '../lib/hire/rate-limit';

export const prerender = false;

/** 30 recorded visits per 10 minutes per IP, per instance (REQ-003). */
const limiter = createLimiter({ max: 30, windowMs: 10 * 60 * 1000 });

/** The sitemap's pages, computed once per process: content only changes with a deploy. */
let known: Promise<ReadonlySet<string>> | undefined;
const knownPaths = () =>
  (known ??= Promise.all([getAllProjects(), getAllPosts()]).then(
    ([projects, posts]) => new Set(sitemapEntries({ projects, posts }).map((entry) => entry.path)),
  ));

export const ALL: APIRoute = ({ request }) => handlePixel(request, { recorder, limiter, knownPaths, ownHosts: OWN_HOSTS });
```

**Step 4:** `npx vitest run tests/analytics/pixel.test.ts tests/aeo/sitemap.test.ts` → PASS.
**Step 5:** `/git commit`.

---

### Task 11: pixel nas páginas pré-renderizadas

**Requirement:** REQ-002
**Files:** Create `src/lib/analytics/pixel-placement.ts`, `tests/analytics/pixel-placement.build-test.ts`; Modify `src/layouts/BaseLayout.astro:164`; Test `tests/analytics/pixel-placement.test.ts`
**Team:** frontend · implementer `frontend-engineer` (frontend-design) · reviewers test-reviewer, accessibility-guardrails
**Depende de:** T10

**Step 1 (Red), `tests/analytics/pixel-placement.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { showsPixel } from '../../src/lib/analytics/pixel-placement';

describe('showsPixel', () => {
  it('is on for prerendered human pages only', () => {
    expect(showsPixel({ isPrerendered: true, view: undefined })).toBe(true);
    expect(showsPixel({ isPrerendered: false, view: undefined })).toBe(false);
    expect(showsPixel({ isPrerendered: true, view: 'ai' })).toBe(false);
  });
});
```

**`tests/analytics/pixel-placement.build-test.ts`:**

```ts
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLIENT = 'dist/client';
const PIXEL = '<img src="/v.gif"';

const pagesUnder = (dir: string): string[] =>
  existsSync(join(CLIENT, dir))
    ? readdirSync(join(CLIENT, dir))
        .map((name) => join(CLIENT, dir, name, 'index.html'))
        .filter(existsSync)
    : [];

describe('pixel placement in the build', () => {
  it('puts the pixel on every prerendered case and archive year', () => {
    const pages = [...pagesUnder('lab'), ...pagesUnder('portfolio'), ...pagesUnder('posts/arquivo')];
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) expect(readFileSync(page, 'utf8'), page).toContain(PIXEL);
  });

  it('puts the pixel on a prerendered post', () => {
    const post = join(CLIENT, 'como-exibir-calendario-do-terminal', 'index.html');
    expect(readFileSync(post, 'utf8')).toContain(PIXEL);
  });

  it('ships no prerendered home, so the SSR pages stay pixel-free', () => {
    expect(existsSync(join(CLIENT, 'index.html'))).toBe(false);
  });
});
```

**Step 2:** `npx vitest run tests/analytics/pixel-placement.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/pixel-placement.ts`:**

```ts
/**
 * Only where middleware cannot see the visit (REQ-002). An SSR page with the
 * pixel would be counted twice; the AI view is a machine surface, counted by
 * middleware as such.
 */
export const showsPixel = ({ isPrerendered, view }: { isPrerendered: boolean; view: string | undefined }): boolean =>
  isPrerendered && view !== 'ai';
```

**`src/layouts/BaseLayout.astro`:** importar `showsPixel` no frontmatter e, logo depois de `<PointerField />` (antes de `</body>`):

```astro
    {
      showsPixel({ isPrerendered: Astro.isPrerendered, view }) && (
        <img
          src="/v.gif"
          alt=""
          width="1"
          height="1"
          aria-hidden="true"
          decoding="async"
          referrerpolicy="strict-origin-when-cross-origin"
          class="pointer-events-none absolute size-px opacity-0"
        />
      )
    }
```

O `referrerpolicy` explícito garante que o Referer leve o caminho e a query, de que o
`/v.gif` depende.

**Step 4:** `npx vitest run tests/analytics/pixel-placement.test.ts` → PASS; `npm run build && npm run test:build` → PASS, incluindo `no-client-js` (um `<img>` não é script).
**Step 5:** `/git commit`.

---

### Task 12: rota `/eu` (exclusão do autor)

**Requirement:** REQ-008
**Files:** Create `src/lib/analytics/self.ts`, `src/pages/eu.ts`; Test `tests/analytics/self.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers security-reviewer, test-reviewer
**Depende de:** T8

**Step 1 (Red), `tests/analytics/self.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { handleSelf } from '../../src/lib/analytics/self';

const TOKEN = 't'.repeat(40);
const visit = (query: string, method = 'GET') => handleSelf(new Request(`https://nandomoreira.dev/eu${query}`, { method }), TOKEN);

describe('handleSelf', () => {
  it('sets the self cookie with the right token', () => {
    const response = visit(`?token=${TOKEN}`);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/');
    const cookie = response.headers.get('set-cookie') ?? '';
    for (const part of ['nm_self=1', 'Path=/', 'Max-Age=31536000', 'HttpOnly', 'Secure', 'SameSite=Lax']) {
      expect(cookie).toContain(part);
    }
  });

  it('answers 404 without a cookie for a wrong, missing or differently sized token, or a non-GET', () => {
    for (const response of [visit('?token=nope'), visit(''), visit(`?token=${TOKEN}x`), visit(`?token=${TOKEN}`, 'POST')]) {
      expect(response.status).toBe(404);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
  });

  it('answers 404 when no token is configured', () => {
    expect(handleSelf(new Request('https://nandomoreira.dev/eu?token=x'), null).status).toBe(404);
  });
});
```

**Step 2:** `npx vitest run tests/analytics/self.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/self.ts`:**

```ts
import { timingSafeEqual } from 'node:crypto';
import { SELF_COOKIE } from './recorder';

const sameToken = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const notFound = (): Response =>
  new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

/**
 * Marks the author's own browser so his visits are not counted (REQ-008). A
 * wrong token looks exactly like a route that does not exist.
 */
export const handleSelf = (request: Request, selfToken: string | null): Response => {
  const token = new URL(request.url).searchParams.get('token') ?? '';

  if (request.method !== 'GET' || !selfToken || !sameToken(token, selfToken)) return notFound();

  return new Response(null, {
    status: 303,
    headers: {
      location: '/',
      'cache-control': 'no-store',
      // The token is in this URL; the next page must not send it on as a referer.
      'referrer-policy': 'no-referrer',
      'set-cookie': `${SELF_COOKIE}=1; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    },
  });
};
```

**`src/pages/eu.ts`:**

```ts
import type { APIRoute } from 'astro';
import { analyticsConfig } from '../lib/analytics/runtime';
import { handleSelf } from '../lib/analytics/self';

export const prerender = false;

export const ALL: APIRoute = ({ request }) => handleSelf(request, analyticsConfig.selfToken);
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

## Lote 4: conversões

### Task 13: tabela fechada e rota `/go/...`

**Requirement:** REQ-010
**Files:** Create `src/lib/analytics/outbound.ts`, `src/pages/go/[...target].ts`; Test `tests/analytics/outbound.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers security-reviewer, business-logic-reviewer, test-reviewer
**Depende de:** T8

**Step 1 (Red), `tests/analytics/outbound.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { caseGoPath, contactGoPath, handleOutbound, outboundTable } from '../../src/lib/analytics/outbound';
import type { Hit } from '../../src/lib/analytics/recorder';

const table = outboundTable({
  contacts: [
    { kind: 'email', value: 'me@example.com' },
    { kind: 'github', value: 'https://github.com/nandomoreirame' },
  ],
  projects: [
    { slug: 'forja', block: 'ai-tooling', repoUrl: 'https://github.com/x/forja', liveUrl: null },
  ] as never,
});

const go = async (path: string, method = 'GET') => {
  const hits: Hit[] = [];
  const response = await handleOutbound(new Request(`https://nandomoreira.dev${path}`, { method }), {
    table: async () => table,
    recorder: { record: async (_request: Request, hit: Hit) => void hits.push(hit) },
  });
  return { response, hits };
};

describe('outbound', () => {
  it('builds paths for contacts and case links', () => {
    expect(contactGoPath('github')).toBe('/go/contato/github');
    expect(caseGoPath('lab', 'forja', 'repo')).toBe('/go/lab/forja/repo');
  });

  it('redirects a known contact and records the click', async () => {
    const { response, hits } = await go('/go/contato/github');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://github.com/nandomoreirame');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(hits[0]?.conversion).toEqual({ type: 'outbound', target: 'contato/github' });
  });

  it('turns the e-mail into a mailto', async () => {
    expect((await go('/go/contato/email')).response.headers.get('location')).toBe('mailto:me@example.com');
  });

  it('redirects a case link', async () => {
    expect((await go('/go/lab/forja/repo')).response.headers.get('location')).toBe('https://github.com/x/forja');
  });

  it('answers 404 for anything outside the table, and never reads a destination from the request', async () => {
    for (const path of ['/go/lab/forja/live', '/go/contato/x', '/go/https://evil.example', '/go/contato/github?to=https://evil.example/x']) {
      const { response, hits } = await go(path);
      if (path.includes('?to=')) {
        expect(response.headers.get('location')).toBe('https://github.com/nandomoreirame');
      } else {
        expect(response.status).toBe(404);
        expect(hits).toEqual([]);
      }
    }
  });

  it('does not record a HEAD', async () => {
    const { response, hits } = await go('/go/contato/github', 'HEAD');
    expect(response.status).toBe(302);
    expect(hits).toEqual([]);
  });
});
```


**Step 2:** `npx vitest run tests/analytics/outbound.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/outbound.ts`:**

```ts
import type { Project } from '../../content/schemas/project';
import { collectionOfBlock } from '../catalog/groups';
import type { Recorder } from './recorder';

export interface ContactLink {
  kind: string;
  value: string;
}

export const contactUrl = (contact: ContactLink): string =>
  contact.kind === 'email' ? `mailto:${contact.value}` : contact.value;

export const contactGoPath = (kind: string): string => `/go/contato/${kind}`;

export const caseGoPath = (collection: string, slug: string, link: 'repo' | 'live'): string =>
  `/go/${collection}/${slug}/${link}`;

/**
 * Every destination /go can reach, built from the profile and the projects
 * only. Nothing from the request ever becomes a Location, which is what keeps
 * this from being an open redirect (REQ-010).
 */
export const outboundTable = ({
  contacts,
  projects,
}: {
  contacts: readonly ContactLink[];
  projects: ReadonlyArray<Pick<Project, 'slug' | 'block' | 'repoUrl' | 'liveUrl'>>;
}): Map<string, string> => {
  const table = new Map<string, string>();

  for (const contact of contacts) table.set(contactGoPath(contact.kind), contactUrl(contact));

  for (const project of projects) {
    const collection = collectionOfBlock(project.block);
    if (project.repoUrl) table.set(caseGoPath(collection, project.slug, 'repo'), project.repoUrl);
    if (project.liveUrl) table.set(caseGoPath(collection, project.slug, 'live'), project.liveUrl);
  }

  return table;
};

const notFound = (): Response =>
  new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

export const handleOutbound = async (
  request: Request,
  { table, recorder }: { table: () => Promise<ReadonlyMap<string, string>>; recorder: Pick<Recorder, 'record'> },
): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return notFound();

  const path = new URL(request.url).pathname.replace(/\/+$/, '');
  const destination = (await table()).get(path);
  if (!destination) return notFound();

  if (request.method === 'GET') {
    await recorder.record(request, {
      kind: 'conversion',
      path,
      source: 'api',
      referrer: request.headers.get('referer'),
      conversion: { type: 'outbound', target: path.slice('/go/'.length) },
    });
  }

  return new Response(null, { status: 302, headers: { location: destination, 'cache-control': 'no-store' } });
};
```

**`src/pages/go/[...target].ts`:**

```ts
import type { APIRoute } from 'astro';
import { outboundTable, handleOutbound } from '../../lib/analytics/outbound';
import { recorder } from '../../lib/analytics/runtime';
import { getAllProjects, getProfile } from '../../lib/content';

export const prerender = false;

/** Built once per process: contacts and projects only change with a deploy. */
let cached: Promise<ReadonlyMap<string, string>> | undefined;
const table = () =>
  (cached ??= Promise.all([getProfile(), getAllProjects()]).then(([profile, projects]) =>
    outboundTable({ contacts: profile.contacts, projects }),
  ));

export const ALL: APIRoute = ({ request }) => handleOutbound(request, { table, recorder });
```

**Step 4:** PASS. **Step 5:** `/git commit`.

---

### Task 14: links humanos apontam para `/go/...`

**Requirement:** REQ-010
**Files:** Modify `src/lib/catalog/links.ts`, `src/components/catalog/LinkList.astro`, `src/components/catalog/CaseArticle.astro:164`, `src/components/home/Contact.astro:18`, `src/components/layout/SiteFooter.astro:41`, `src/pages/sobre.astro:72`, `src/pages/contato.astro:208`; Test `tests/catalog/links.test.ts`, `tests/home/about-and-contact.test.ts`, `tests/pages/sobre.test.ts`, `tests/pages/contato.test.ts`
**Team:** frontend · implementer `frontend-engineer` (frontend-design) · reviewers test-reviewer, accessibility-guardrails, consequences-reviewer
**Depende de:** T13

**Step 1 (Red):** nos quatro testes, toda asserção que fixa o href real de um contato ou de
repo/live passa a esperar o caminho `/go/...`. Acrescentar em `tests/catalog/links.test.ts`:

```ts
it('routes case links through /go when a base is given', () => {
  expect(
    visibleLinks({ repoUrl: 'https://github.com/x/forja', liveUrl: 'https://forja.dev', goBase: '/go/lab/forja' }).map(
      (link) => link.href,
    ),
  ).toEqual(['/go/lab/forja/live', '/go/lab/forja/repo']);
});
```

E em `tests/home/about-and-contact.test.ts` (ou no teste do rodapé, onde o render já existe):

```ts
it('sends every contact through /go/contato', async () => {
  const html = await render();
  expect(html).toContain('href="/go/contato/github"');
  expect(html).not.toContain('href="https://github.com/nandomoreirame"');
});
```

**Step 2:** `npx vitest run tests/catalog/links.test.ts tests/home/about-and-contact.test.ts tests/pages/sobre.test.ts tests/pages/contato.test.ts` → FAIL nas asserções novas.

**Step 3 (Green):**

- `src/lib/catalog/links.ts`: `LinkSource` ganha `goBase?: string`, e `href` passa a ser `goBase ? `${goBase}/${kind}` : url` para `live` e `repo`.
- `LinkList.astro`: aceitar `goBase?: string` e repassar a `visibleLinks(Astro.props)`.
- `CaseArticle.astro`: `<LinkList repoUrl={project.repoUrl} liveUrl={project.liveUrl} goBase={`/go/${collectionOfBlock(project.block)}/${project.slug}`} />`, importando `collectionOfBlock` de `../../lib/catalog/groups`.
- `Contact.astro`: `hrefFor` vira `contactGoPath(contact.kind)` (de `../../lib/analytics/outbound`); `target`/`rel` ficam como estão.
- `SiteFooter.astro`: `href={contactGoPath(contact.kind)}`, mantendo `rel="noopener noreferrer me"`.
- `sobre.astro`: `href={contactGoPath(contact.kind)}`.
- `contato.astro`: `href={contactGoPath('email')}` no botão "Prefiro e-mail".

JSON-LD (`person-ld`, `json-ld` dos cases), `llms.txt`, `AGENTS.md`, `.md` e MCP **não**
mudam: continuam lendo `contact.value`, `repoUrl` e `liveUrl` direto.

**Step 4:** mesmo comando → PASS; `npx vitest run tests/aeo` → PASS (nenhuma rota de máquina passou a mostrar `/go`).
**Step 5:** `/git commit`.

---

### Task 15: conversões de briefing e currículo, com percurso no aviso

**Requirement:** REQ-009, REQ-012
**Files:** Modify `src/lib/hire/handler.ts:9-16,142`, `src/lib/hire/notify.ts`, `src/pages/api/hire.ts`, `src/lib/cv/download.ts` (`CvDependencies`, `handleCvDownload`, `renderCvNotification`, `resendCvNotifier`), `src/pages/api/cv.ts`; Test `tests/analytics/lead-conversion.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers business-logic-reviewer, consequences-reviewer, security-reviewer, test-reviewer
**Depende de:** T8

**Step 1 (Red), `tests/analytics/lead-conversion.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import type { Hit, Recorder } from '../../src/lib/analytics/recorder';
import { handleCvDownload, renderCvNotification, toCvDownload } from '../../src/lib/cv/download';
import { handleHire } from '../../src/lib/hire/handler';
import { renderNotification } from '../../src/lib/hire/notify';
import { createLimiter } from '../../src/lib/hire/rate-limit';
import { toStoredBriefing } from '../../src/lib/hire/store';

const now = () => new Date('2026-10-14T17:10:00.000Z');

const analytics = (journey: () => Promise<string>) => {
  const hits: Hit[] = [];
  const recorder: Pick<Recorder, 'record' | 'journey'> = {
    record: async (_request, hit) => void hits.push(hit),
    journey,
  };
  return { hits, recorder };
};

const sent: Array<{ id: string; journey?: string }> = [];
const notifier = { send: async (_item: unknown, id: string, journey?: string) => void sent.push({ id, journey }) };

describe('hire conversion', () => {
  it('records the conversion and passes the journey to the notification', async () => {
    sent.length = 0;
    const { hits, recorder } = analytics(async () => 'Journey today\n  14:02  /lab/forja');
    const response = await handleHire(
      new Request('https://nandomoreira.dev/api/hire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'Ada', contact: 'ada@example.com', brief: 'Preciso de um MCP server' }),
      }),
      {
        store: { save: async () => 'doc-1', markNotified: async () => {} },
        notifier,
        limiter: createLimiter({ max: 5, windowMs: 60_000 }),
        now,
        analytics: recorder,
      },
    );

    expect(response.status).toBe(202);
    expect(hits[0]).toMatchObject({ kind: 'conversion', path: '/api/hire', conversion: { type: 'hire', refId: 'doc-1' } });
    expect(sent[0]?.journey).toContain('/lab/forja');
  });

  it('still notifies when there is no analytics', async () => {
    sent.length = 0;
    await handleHire(
      new Request('https://nandomoreira.dev/api/hire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'Ada', contact: 'ada@example.com', brief: 'Oi' }),
      }),
      { store: { save: async () => 'doc-2', markNotified: async () => {} }, notifier, limiter: createLimiter({ max: 5, windowMs: 60_000 }), now },
    );
    expect(sent[0]).toEqual({ id: 'doc-2', journey: undefined });
  });
});

describe('cv conversion', () => {
  it('records the download and passes the journey', async () => {
    sent.length = 0;
    const { hits, recorder } = analytics(async () => 'Journey today\n  14:05  /curriculo');
    await handleCvDownload(
      new Request('https://nandomoreira.dev/api/cv', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'nome=Ada&email=ada%40example.com',
      }),
      {
        store: { save: async () => 'cv-1', markNotified: async () => {} },
        notifier,
        limiter: createLimiter({ max: 5, windowMs: 60_000 }),
        now,
        analytics: recorder,
      },
    );
    expect(hits[0]?.conversion).toEqual({ type: 'cv', refId: 'cv-1' });
    expect(sent[0]?.journey).toContain('/curriculo');
  });
});

describe('notification text', () => {
  it('appends the journey to the briefing mail, before the briefing body', () => {
    const briefing = toStoredBriefing({
      payload: { from: 'Ada', contact: 'ada@example.com', brief: 'Oi' },
      sourceIp: '9.9.9.9',
      userAgent: null,
      now: now(),
    });
    const mail = renderNotification(briefing, 'doc-1', 'Journey today\n  14:02  /lab/forja');
    expect(mail.indexOf('/lab/forja')).toBeLessThan(mail.indexOf('Briefing\n--------'));
    expect(renderNotification(briefing, 'doc-1')).not.toContain('Journey');
  });

  it('appends the journey to the CV mail', () => {
    const download = toCvDownload({ name: 'Ada', email: null }, now());
    expect(renderCvNotification(download, 'cv-1', 'Journey today')).toContain('Journey today');
  });
});
```

**Step 2:** `npx vitest run tests/analytics/lead-conversion.test.ts` → FAIL.

**Step 3 (Green):**

`src/lib/hire/handler.ts`: em `Dependencies`, acrescentar

```ts
  /** Optional so tests and a site without the analytics secret behave as before. */
  analytics?: Pick<Recorder, 'record' | 'journey'>;
```

(import `type Recorder` de `../analytics/recorder`). Desestruturar `analytics` junto com
as outras dependências e, no lugar de `await notifier.send(briefing, id);` (linha 142):

```ts
  let journey: string | undefined;
  if (analytics) {
    // Both calls swallow their own failures (REQ-012): a lead is never lost to measuring.
    await analytics.record(request, {
      kind: 'conversion',
      path: '/api/hire',
      source: 'api',
      referrer: request.headers.get('referer'),
      conversion: { type: 'hire', refId: id },
    });
    journey = await analytics.journey(request);
  }

  try {
    await notifier.send(briefing, id, journey);
```

(O `try` existente continua igual; só o `send` ganha o terceiro argumento.)

`src/lib/hire/notify.ts`:

```ts
export interface Notifier {
  send: (briefing: StoredBriefing, id: string, journey?: string) => Promise<void>;
}

export const renderNotification = (briefing: StoredBriefing, id: string, journey?: string): string =>
  [
    // ...linhas atuais até `Record:    ${id}`, '' ...
    ...(journey ? [journey, ''] : []),
    'Briefing',
    '--------',
    briefing.brief,
    '',
  ].join('\n');
```

e `send: async (briefing, id, journey) => { ... text: renderNotification(briefing, id, journey) ... }`.

`src/lib/cv/download.ts`: mesma mudança em `CvNotifier.send`, `CvDependencies`
(`analytics?`), `renderCvNotification(download, id, journey?)` (journey depois de
`Record:`) e `resendCvNotifier`. Em `handleCvDownload`, depois de `id = await store.save(download)`
e antes do `try` de notificação:

```ts
  let journey: string | undefined;
  if (analytics) {
    await analytics.record(request, {
      kind: 'conversion',
      path: '/api/cv',
      source: 'api',
      referrer: request.headers.get('referer'),
      conversion: { type: 'cv', refId: id },
    });
    journey = await analytics.journey(request);
  }
```

`src/pages/api/hire.ts` e `src/pages/api/cv.ts`: acrescentar `analytics: recorder` em
`dependencies`, com `import { recorder } from '../../lib/analytics/runtime';`.

**Step 4:** `npx vitest run tests/analytics/lead-conversion.test.ts tests/api tests/cv` → PASS.
**Step 5:** `/git commit`.

---

### Task 16: contagem de chamadas MCP

**Requirement:** REQ-011, REQ-015
**Files:** Create `src/lib/analytics/mcp-usage.ts`; Modify `src/pages/api/mcp.ts` (`handle`); Test `tests/analytics/mcp-usage.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers security-reviewer, consequences-reviewer, test-reviewer
**Depende de:** T8

**Step 1 (Red), `tests/analytics/mcp-usage.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { mcpCalls } from '../../src/lib/analytics/mcp-usage';

describe('mcpCalls', () => {
  it('reads method and tool name, never the arguments', () => {
    const calls = mcpCalls(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_project', arguments: { slug: 'secret' } } }),
    );
    expect(calls).toEqual([{ method: 'tools/call', tool: 'get_project' }]);
    expect(JSON.stringify(calls)).not.toContain('secret');
  });

  it('reads the client name from initialize, capped at 64', () => {
    const calls = mcpCalls(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { clientInfo: { name: `claude-code${'x'.repeat(80)}` } } }),
    );
    expect(calls[0]?.client).toHaveLength(64);
  });

  it('counts each message of a batch, at most 20', () => {
    const batch = Array.from({ length: 25 }, (_, id) => ({ jsonrpc: '2.0', id, method: 'tools/list' }));
    expect(mcpCalls(JSON.stringify(batch))).toHaveLength(20);
  });

  it('returns nothing for invalid JSON or a message without a method', () => {
    expect(mcpCalls('{nope')).toEqual([]);
    expect(mcpCalls(JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }))).toEqual([]);
  });
});
```

**Step 2:** `npx vitest run tests/analytics/mcp-usage.test.ts` → FAIL.

**Step 3 (Green), `src/lib/analytics/mcp-usage.ts`:**

```ts
export interface McpCall {
  method: string;
  tool?: string;
  client?: string;
}

const MAX_NAME = 64;
const MAX_MESSAGES = 20;

const name = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/[\p{Cc}\p{Cf}]/gu, '').trim().slice(0, MAX_NAME);
  return text === '' ? undefined : text;
};

/**
 * What an agent asked for, never what it sent: only the method, the tool name
 * and the client name are read, and arguments are not even looked at (REQ-011).
 */
export const mcpCalls = (body: string): McpCall[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }

  const messages = (Array.isArray(parsed) ? parsed : [parsed]).slice(0, MAX_MESSAGES);

  return messages.flatMap((message): McpCall[] => {
    if (!message || typeof message !== 'object') return [];
    const { method, params } = message as { method?: unknown; params?: { name?: unknown; clientInfo?: { name?: unknown } } };
    const methodName = name(method);
    if (!methodName) return [];

    const tool = methodName === 'tools/call' ? name(params?.name) : undefined;
    const client = methodName === 'initialize' ? name(params?.clientInfo?.name) : undefined;

    return [{ method: methodName, ...(tool ? { tool } : {}), ...(client ? { client } : {}) }];
  });
};
```

**`src/pages/api/mcp.ts`**, no início de `handle`, antes de `createMcpServer()`:

```ts
  if (request.method === 'POST') {
    // A clone, so the transport still gets the untouched body (see below).
    const body = await readLimitedText(request.clone()).catch(() => '');
    await Promise.all(
      mcpCalls(body).map((call) =>
        recorder.record(request, {
          kind: 'conversion',
          path: '/api/mcp',
          source: 'api',
          referrer: null,
          conversion: {
            type: 'mcp',
            target: call.method,
            ...(call.tool ? { tool: call.tool } : {}),
            ...(call.client ? { client: call.client } : {}),
          },
        }),
      ),
    );
  }
```

Imports: `readLimitedText` de `../../lib/hire/read-body`, `mcpCalls` de
`../../lib/analytics/mcp-usage`, `recorder` de `../../lib/analytics/runtime`.

**Step 4:** `npx vitest run tests/analytics/mcp-usage.test.ts tests/mcp` → PASS.
**Step 5:** `/git commit`.

---

## Lote 5: política e operação

### Task 17: política de privacidade

**Requirement:** REQ-013
**Files:** Modify `src/lib/privacy/policy.ts`; Test `tests/privacy/policy.test.ts`
**Team:** docs · implementer `rpi-implementer` · reviewers business-logic-reviewer (precisão do texto frente ao código)
**Depende de:** T15, T16 (o texto descreve o que elas fazem)

**Step 1 (Red), `tests/privacy/policy.test.ts`:**

- `covers each topic`: a lista passa a ter `'medicao'` logo depois de `'nao-coletado'`.
- `carries a last-updated date`: `expect(POLICY_UPDATED_AT).toBe('<data do commit>')`.
- Acrescentar:

```ts
  it('describes the visit measurement honestly', () => {
    const section = privacySections.find((candidate) => candidate.id === 'medicao');
    const text = [section?.title, ...(section?.paragraphs ?? [])].join('\n');
    for (const fact of ['sem nenhum script', 'sem cookie', 'IP não é gravado', 'muda todo dia', '30 dias', '24 meses', 'art. 7º, IX', '/go/', 'utm_source']) {
      expect(text).toContain(fact);
    }
  });

  it('no longer claims there is no measurement', () => {
    expect(all()).not.toMatch(/não usa cookies, analytics/);
    expect(all()).not.toMatch(/não guardam nada sobre quem consulta/);
  });
```

**Step 2:** `npx vitest run tests/privacy/policy.test.ts` → FAIL.

**Step 3 (Green), `src/lib/privacy/policy.ts`:**

- `POLICY_UPDATED_AT` = data do commit.
- `POLICY_LEAD`: `'Versão curta: este site não usa cookies nem analytics de terceiros. Ele conta visitas no próprio servidor, sem guardar seu IP, e guarda o que você envia de propósito por até 12 meses.'`
- `nao-coletado`, primeiro parágrafo: `'O site não usa cookies de rastreamento, pixel de anúncio, gravação de sessão nem serviços de analytics de terceiros. A contagem de visitas descrita na seção seguinte roda no próprio servidor, e nada nela identifica quem você é.'`
- Nova seção, depois de `nao-coletado`:

```ts
  {
    id: 'medicao',
    title: 'Contagem de visitas',
    paragraphs: [
      'Para saber quais textos e canais trazem leitores, o servidor conta as visitas sem nenhum script e sem cookie. Nas páginas montadas a cada acesso, a contagem acontece na própria requisição; nos textos e cases, que são arquivos estáticos, uma imagem transparente de 1×1 pixel servida pelo próprio domínio faz a mesma contagem.',
      'Em cada visita guardo a página, o horário, o site de onde você veio (só o domínio, como linkedin.com), os parâmetros utm_source, utm_medium e utm_campaign quando o link os trouxer, o país informado pela Cloudflare e o tipo de visitante (pessoa, agente de IA ou robô).',
      'Para ligar as páginas de uma mesma visita sem cookie, calculo um código a partir do seu IP e do seu navegador, misturados com uma chave secreta que muda todo dia. O IP não é gravado, e o código de um dia não se liga ao do dia seguinte. Se você enviar o formulário ou baixar o currículo, o aviso que eu recebo inclui as páginas que você viu naquele dia.',
      'Os cliques nos meus contatos e nos links dos projetos passam por um endereço /go/ do próprio site antes de seguir para o destino, para que eu saiba quais são usados.',
      'Os registros de cada visita são apagados em 30 dias. Depois disso ficam só totais por dia, sem nenhum código de visitante, por 24 meses. Tudo fica no Firestore, do Google Cloud, nos Estados Unidos. Base legal: legítimo interesse (art. 7º, IX da LGPD).',
    ],
  },
```

- `agentes`, parágrafo único: `'O servidor MCP, o AGENTS.md, o llms.txt e as versões em markdown das páginas entram na contagem de visitas como as demais páginas. Do MCP guardo o nome do método, da ferramenta chamada e do cliente que se identificou, nunca os argumentos enviados.'`

**Step 4:** `npx vitest run tests/privacy/policy.test.ts tests/aeo/no-leak.test.ts` → PASS.
**Step 5:** `/git commit`.

---

### Task 18: verificação HTTP real

**Requirement:** REQ-003, REQ-008, REQ-010
**Files:** Modify `scripts/verify-aeo-routes.sh` (antes do bloco de vazamento)
**Team:** infra · implementer `infra-engineer` (bash-linux) · reviewers consequences-reviewer
**Depende de:** T10, T12, T13

**Step 1 (Red):** acrescentar o bloco abaixo e rodar `bash scripts/verify-aeo-routes.sh` antes
das Tasks 10, 12 e 13 estarem na árvore (ou com a rota `v.gif.ts` renomeada
temporariamente) → `FAIL: /v.gif ...`. Com elas presentes, segue.

```bash
# lead-analytics: pixel, outbound and self routes (REQ-003, REQ-008, REQ-010).
pixel=$(curl -s -D /tmp/aeo-pixel-headers -o /dev/null -w '%{http_code} %{content_type}' "${BASE}/v.gif")
[ "$pixel" = "200 image/gif" ] || { echo "FAIL: /v.gif answered '${pixel}'" >&2; exit 1; }
grep -qi '^cache-control: no-store' /tmp/aeo-pixel-headers || { echo "FAIL: /v.gif is cacheable" >&2; exit 1; }
echo "OK /v.gif"

go=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "${BASE}/go/contato/github")
case "$go" in
  "302 https://github.com/"*) echo "OK /go/contato/github" ;;
  *) echo "FAIL: /go/contato/github answered '${go}'" >&2; exit 1 ;;
esac

for route in /go/contato/nada "/go/https:/evil.example" "/eu" "/eu?token=wrong"; do
  status=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${route}")
  [ "$status" = "404" ] || { echo "FAIL: ${route} answered ${status}, expected 404" >&2; exit 1; }
  echo "OK ${route} (404)"
done
```

**Step 2/4:** `bash scripts/verify-aeo-routes.sh` → termina com `AEO ROUTES PASSED` (a evidência é essa linha).
**Step 5:** `/git commit`.

---

### Task 19: segredos, TTL e `apphosting.yaml`

**Requirement:** REQ-005, REQ-008, REQ-014
**Files:** Modify `apphosting.yaml`, `tests/now/apphosting.test.ts`
**Team:** infra · implementer `infra-engineer` (cloud-cli) · reviewers security-reviewer, consequences-reviewer
**Depende de:** todas as anteriores. **Executar só com o OK do autor**: cria recursos no Google Cloud.

Ordem obrigatória (CLAUDE.md, "Ligar as fontes da `/now`"): segredo existe → acesso
concedido → só então o yaml.

```bash
SCRATCH="$(mktemp -d)"
openssl rand -hex 32 > "$SCRATCH/hash"
firebase apphosting:secrets:set analytics-hash-secret --data-file "$SCRATCH/hash"
firebase apphosting:secrets:grantaccess analytics-hash-secret --backend nandomoreira-dev

mkdir -p ~/.config/nandomoreira && umask 077
openssl rand -hex 24 > ~/.config/nandomoreira/self-token
firebase apphosting:secrets:set analytics-self-token --data-file ~/.config/nandomoreira/self-token
firebase apphosting:secrets:grantaccess analytics-self-token --backend nandomoreira-dev
shred -u "$SCRATCH/hash"

gcloud firestore fields ttls update expiresAt --collection-group=analytics_events --enable-ttl --project=nandomoreira-dev
gcloud firestore fields ttls update expiresAt --collection-group=analytics_daily --enable-ttl --project=nandomoreira-dev
```

O token de autor fica só em `~/.config/nandomoreira/self-token` (0600); o autor abre
`https://nandomoreira.dev/eu?token=$(cat ~/.config/nandomoreira/self-token)` uma vez em cada
navegador dele.

**Step 1 (Red), `tests/now/apphosting.test.ts`:** acrescentar

```ts
describe('apphosting.yaml analytics secrets', () => {
  it.each(['ANALYTICS_HASH_SECRET', 'ANALYTICS_SELF_TOKEN'])('declares %s as a runtime secret, never a literal', (variable) => {
    const block = blocksOf(manifest).get(variable);
    expect(block).toBeDefined();
    expect(block).toContain('secret:');
    expect(block).toContain('RUNTIME');
    expect(block).not.toMatch(/^\s*value:/m);
  });
});
```

**Step 2:** `npx vitest run tests/now/apphosting.test.ts` → FAIL.

**Step 3 (Green), `apphosting.yaml`** (depois dos segredos do hire):

```yaml
  - variable: ANALYTICS_HASH_SECRET
    secret: analytics-hash-secret
    availability:
      - RUNTIME

  - variable: ANALYTICS_SELF_TOKEN
    secret: analytics-self-token
    availability:
      - RUNTIME
```

**Step 4:** PASS; `npm run verify` → verde.
**Step 5:** `/git commit`.

---

### Task 20: documentação

**Requirement:** rastreabilidade de todos
**Files:** Modify `docs/specs/lead-analytics/SPEC.md`, `docs/specs/lead-analytics/STATE.md`, `CLAUDE.md`
**Team:** docs · implementer direto · self-review
**Depende de:** T1 a T19

- **SPEC, Data Contract:** `channel` ganha `internal`; `conversion` ganha `tool?` e `client?`; `countries` usa `unknown` sem país; nota de que `outbound` só conta no agregado quando a classe é `human`.
- **SPEC, REQ-012:** o bloco do aviso é em inglês, como o resto do e-mail (`No journey recorded today.`).
- **SPEC, Traceability:** cada REQ passa a `Done` com o commit.
- **STATE:** `phase: implement-complete`, data e commits.
- **CLAUDE.md:**
  - em "Restrições", uma linha: a medição é server-side (middleware + `/v.gif` + `/go`), e o `<img>` do pixel não conta como script;
  - em "Armadilhas", uma linha: cachear HTML na Cloudflare faz as visitas SSR servidas do cache deixarem de contar.

**Step 5:** `/git commit`.

---

## Verificação final

```bash
npm run verify                      # check + test + build + test:build
bash scripts/verify-aeo-routes.sh   # termina com AEO ROUTES PASSED
```

Depois do deploy (feito pelo autor):

1. Abrir um post em janela anônima.
2. Conferir em `analytics_events` um evento `source: 'pixel'`, e confirmar se o `country` veio (fecha a suposição sobre `cf-ipcountry`).
3. Abrir `/eu?token=...`, navegar e confirmar que nada novo aparece.
