# Plano: sales-landing

> **Spec:** docs/specs/sales-landing/SPEC.md

**Objetivo:** landing de vendas em `/servicos` e página de detalhe `/servicos/site-institucional`, com moldura própria, formulário no `/api/hire`, botão de WhatsApp e roteamento por host pronto para `contrate.nandomoreira.dev`.
**Arquitetura:** lógica pura em `src/lib/sales/` (host, catálogo, textos, origem do formulário, validação de contato), componentes em `src/components/sales/`, `SalesLayout` próprio sem script. O `/api/hire` ganha o campo opcional `service` e o redirect por origem; o middleware ganha a reescrita por host, desligada pela flag `SALES_HOST_LIVE` até o domínio existir.
**Stack:** Astro 7 SSR, Tailwind 4 (tokens de `global.css`), Zod, Vitest com `experimental_AstroContainer`.
**Total de tarefas:** 24, em 4 lotes.
**Complexidade estimada:** large.
**Depende de:** nada em andamento. Colide de leve com `hire-endpoint` (`implement-blocked`) em `src/lib/hire/*`: as mudanças aqui são aditivas e opcionais.

## Regras para quem implementa

- DO NOT run any git commands (commit, push, branch, merge, add). DO NOT invoke the git-commit skill.
- TDD: cada tarefa começa pelo teste vermelho, que precisa falhar pelo motivo certo.
- Nenhum hex, nenhum valor arbitrário do Tailwind (`[...]`), nenhum `<script>` de cliente, nenhuma diretiva `client:*`. Só tokens de `src/styles/global.css`.
- Texto visível em pt-BR com acentos; identificadores, comentários e rotas de máquina em inglês.
- Nenhum número inventado (percentual, `R$`, segundos, "horas úteis", "uptime") em texto das páginas de vendas.
- Ferramentas de Node pelo `./node_modules/.bin/` ou `npm run`, nunca o binário solto (shim do mise quebrado).
- No fim de cada lote: `npx vitest run` todo verde e `npm run check` com 0 erros.
- A árvore já tem 17 posts modificados e 2 não rastreados que não são desta feature: não toque neles.

---

## Lote 1: contrato do `/api/hire` e núcleo de vendas

### Tarefa 1: campo opcional `service` no schema

**Requisito:** REQ-022
**Arquivos:**
- Modificar: `src/lib/hire/schema.ts`
- Teste: `tests/api/hire-schema.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, security-reviewer, type-safety-reviewer, test-reviewer

**Passo 1: teste que falha.** Acrescente ao `describe('hireSchema')`:

```ts
import { HONEYPOT_FIELD, SERVICES, hireSchema } from '../../src/lib/hire/schema';

  it('accepts every declared service', () => {
    for (const service of SERVICES) {
      expect(hireSchema.safeParse({ ...valid, service }).success, service).toBe(true);
    }
  });

  it('lists the services the sales form offers, in order', () => {
    expect(SERVICES).toEqual([
      'website',
      'landing-page',
      'blog',
      'online-store',
      'web-product',
      'automation',
      'undecided',
    ]);
  });

  it('rejects a service outside the list', () => {
    expect(hireSchema.safeParse({ ...valid, service: 'mobile-app' }).success).toBe(false);
  });

  it('keeps service optional, so agents and /contato do not change', () => {
    expect(hireSchema.safeParse(valid).success).toBe(true);
  });
```

(Troque o import existente pelo de cima.)

**Passo 2:** `npx vitest run tests/api/hire-schema.test.ts`. Esperado: FAIL, `SERVICES` não é exportado (`expected undefined to equal [...]`).

**Passo 3: implementação.** Em `src/lib/hire/schema.ts`, depois de `INTERESTS`:

```ts
/**
 * What a visitor of the sales pages wants built. `undecided` is the "not sure
 * yet" answer, which is a valid lead, not a missing field.
 */
export const SERVICES = [
  'website',
  'landing-page',
  'blog',
  'online-store',
  'web-product',
  'automation',
  'undecided',
] as const;
```

E no `z.object({...})`, depois de `interests`:

```ts
    service: z.enum(SERVICES).optional(),
```

**Passo 4:** `npx vitest run tests/api/` Esperado: PASS.

**Passo 5:** `/git commit` (só o orquestrador, com consentimento).

---

### Tarefa 2: `service` gravado no briefing e na notificação

**Requisito:** REQ-026
**Arquivos:**
- Modificar: `src/lib/hire/store.ts`, `src/lib/hire/notify.ts`
- Teste: `tests/api/hire-notify-service.test.ts` (criar)

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, security-reviewer, type-safety-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { renderNotification } from '../../src/lib/hire/notify';
import { toStoredBriefing } from '../../src/lib/hire/store';

const now = new Date('2026-10-18T12:00:00.000Z');
const base = { from: 'Ada', contact: '11 91234-5678', brief: 'Quero um site.' };

describe('service on the stored briefing', () => {
  it('stores the chosen service', () => {
    const briefing = toStoredBriefing({
      payload: { ...base, service: 'website' },
      sourceIp: '203.0.113.1',
      userAgent: null,
      now,
    });

    expect(briefing.service).toBe('website');
  });

  it('stores null when no service was sent', () => {
    expect(toStoredBriefing({ payload: base, sourceIp: 'x', userAgent: null, now }).service).toBeNull();
  });

  it('shows the service in the notification mail', () => {
    const briefing = toStoredBriefing({
      payload: { ...base, service: 'online-store' },
      sourceIp: 'x',
      userAgent: null,
      now,
    });

    expect(renderNotification(briefing, 'doc-1')).toContain('Service:   online-store');
  });

  it('says not given when there is no service', () => {
    const briefing = toStoredBriefing({ payload: base, sourceIp: 'x', userAgent: null, now });

    expect(renderNotification(briefing, 'doc-1')).toContain('Service:   not given');
  });
});
```

**Passo 2:** `npx vitest run tests/api/hire-notify-service.test.ts`. Esperado: FAIL, `briefing.service` é `undefined`.

**Passo 3: implementação.**

`src/lib/hire/store.ts`, na interface `StoredBriefing`, depois de `interests`:

```ts
  /** What a sales-page visitor wants built; null from /contato and agents. */
  service: string | null;
```

E em `toStoredBriefing`, depois de `interests`:

```ts
  service: payload.service ?? null,
```

`src/lib/hire/notify.ts`, em `renderNotification`, depois da linha `Interests:`:

```ts
    `Service:   ${briefing.service ?? 'not given'}`,
```

Procure fixtures que montam `StoredBriefing` à mão e acrescente `service: null`:

```bash
grep -rln "networkExpiresAt" tests
```

**Passo 4:** `npx vitest run tests/api/ tests/analytics/` e `npm run check`. Esperado: PASS e 0 erros.

**Passo 5:** `/git commit`.

---

### Tarefa 3: rótulos de serviço e mensagens de envio das páginas de vendas

**Requisito:** REQ-024, REQ-025
**Arquivos:**
- Criar: `src/lib/sales/service-labels.ts`, `src/lib/sales/outcome.ts`
- Teste: `tests/sales/labels-outcome.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, type-safety-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/lib/hire/schema';
import { SERVICE_LABELS, SERVICE_OPTIONS } from '../../src/lib/sales/service-labels';
import { salesOutcomeMessage } from '../../src/lib/sales/outcome';

describe('SERVICE_LABELS', () => {
  it('labels every service in pt-BR', () => {
    expect(Object.keys(SERVICE_LABELS).sort()).toEqual([...SERVICES].sort());
    expect(SERVICE_LABELS.undecided).toBe('Ainda não sei');
    expect(SERVICE_LABELS.website).toBe('Site institucional');
  });

  it('offers the options in the schema order', () => {
    expect(SERVICE_OPTIONS.map((option) => option.value)).toEqual([...SERVICES]);
  });
});

describe('salesOutcomeMessage', () => {
  it('confirms a sent form as a status', () => {
    expect(salesOutcomeMessage('ok')?.role).toBe('status');
  });

  it('points to WhatsApp when the form fails', () => {
    for (const value of ['limite', 'erro']) {
      expect(salesOutcomeMessage(value)?.text).toContain('WhatsApp');
    }
  });

  it('names the contact rule when the form is invalid', () => {
    expect(salesOutcomeMessage('invalido')?.text).toContain('e-mail ou WhatsApp');
  });

  it('shows nothing for an unknown value, including prototype keys', () => {
    expect(salesOutcomeMessage('toString')).toBeUndefined();
    expect(salesOutcomeMessage(null)).toBeUndefined();
  });
});
```

**Passo 2:** `npx vitest run tests/sales/labels-outcome.test.ts`. Esperado: FAIL, módulos inexistentes.

**Passo 3: implementação.**

`src/lib/sales/service-labels.ts`:

```ts
import { SERVICES } from '../hire/schema';

export type Service = (typeof SERVICES)[number];

/** pt-BR labels for the API slugs; a missing key fails the type check. */
export const SERVICE_LABELS: Record<Service, string> = {
  website: 'Site institucional',
  'landing-page': 'Landing page',
  blog: 'Blog',
  'online-store': 'Loja virtual',
  'web-product': 'Produto web completo',
  automation: 'Automação e IA',
  undecided: 'Ainda não sei',
};

export const SERVICE_OPTIONS = SERVICES.map((value) => ({ value, label: SERVICE_LABELS[value] }));

export const isService = (value: unknown): value is Service =>
  typeof value === 'string' && Object.hasOwn(SERVICE_LABELS, value);
```

`src/lib/sales/outcome.ts`:

```ts
interface OutcomeMessage {
  role: 'status' | 'alert';
  text: string;
}

/** The sales pages have no e-mail on show, so a failure points to WhatsApp. */
const OUTCOMES: Record<string, OutcomeMessage> = {
  ok: { role: 'status', text: 'Recebi sua mensagem. Respondo pessoalmente, pelo canal que você deixou.' },
  invalido: {
    role: 'alert',
    text: 'Faltou o nome ou o contato não parece um e-mail ou WhatsApp válido. Confira e envie de novo.',
  },
  limite: { role: 'alert', text: 'Muitas tentativas seguidas. Espere alguns minutos ou me chame no WhatsApp.' },
  erro: { role: 'alert', text: 'Não consegui registrar a mensagem agora. Me chame no WhatsApp.' },
};

export const salesOutcomeMessage = (value: string | null): OutcomeMessage | undefined =>
  value !== null && Object.hasOwn(OUTCOMES, value) ? OUTCOMES[value] : undefined;
```

**Passo 4:** `npx vitest run tests/sales/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 4: validação do contato (e-mail ou telefone)

**Requisito:** REQ-023
**Arquivos:**
- Criar: `src/lib/sales/contact.ts`
- Teste: `tests/sales/contact.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, security-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { isReachableContact } from '../../src/lib/sales/contact';

describe('isReachableContact', () => {
  it.each([
    'ada@example.com',
    '  ada@example.com  ',
    '11 91234-5678',
    '(11) 91234-5678',
    '+55 11 91234-5678',
    '1132345678',
    '5511912345678',
  ])('accepts %s', (value) => {
    expect(isReachableContact(value)).toBe(true);
  });

  it.each([
    '',
    'me chama',
    'ada@',
    '91234-5678',
    '+55 11 91234-5678 9',
    '11 9123a-5678',
    '55119123456789',
  ])('rejects %s', (value) => {
    expect(isReachableContact(value)).toBe(false);
  });
});
```

**Passo 2:** `npx vitest run tests/sales/contact.test.ts`. Esperado: FAIL, módulo inexistente.

**Passo 3: implementação.** `src/lib/sales/contact.ts`:

```ts
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[\d\s()+-]+$/;

/**
 * A lead with no way to answer is a lost lead (sales-landing, REQ-023): the
 * sales form takes an e-mail or a Brazilian phone, 10 to 13 digits once the
 * punctuation people type is ignored (with or without the 55 country code).
 */
export const isReachableContact = (value: string): boolean => {
  const trimmed = value.trim();
  if (EMAIL.test(trimmed)) return true;
  if (!PHONE_CHARS.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 13;
};
```

**Passo 4:** `npx vitest run tests/sales/contact.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 5: host, caminhos e roteamento das páginas de vendas

**Requisito:** REQ-003, REQ-004, REQ-006
**Arquivos:**
- Criar: `src/lib/sales/host.ts`
- Teste: `tests/sales/host.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, security-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { SALES_HOST, SALES_HOST_LIVE, salesPath, salesRouting, salesUrl } from '../../src/lib/sales/host';

const at = (url: string) => new URL(url);

describe('sales host constants', () => {
  it('names the chosen subdomain', () => {
    expect(SALES_HOST).toBe('contrate.nandomoreira.dev');
  });

  it('ships switched off until the domain answers', () => {
    expect(SALES_HOST_LIVE).toBe(false);
  });
});

describe('salesPath and salesUrl', () => {
  it('lives under /servicos on the main host while the flag is off', () => {
    expect(salesPath(undefined, false)).toBe('/servicos');
    expect(salesPath('site-institucional', false)).toBe('/servicos/site-institucional');
    expect(salesUrl(undefined, false)).toBe('https://nandomoreira.dev/servicos');
  });

  it('moves to the subdomain root once live', () => {
    expect(salesPath(undefined, true)).toBe('/');
    expect(salesPath('site-institucional', true)).toBe('/site-institucional');
    expect(salesUrl('site-institucional', true)).toBe('https://contrate.nandomoreira.dev/site-institucional');
  });
});

describe('salesRouting', () => {
  it('does nothing while the flag is off, whatever the host', () => {
    expect(salesRouting(at('https://contrate.nandomoreira.dev/'), false)).toBeUndefined();
    expect(salesRouting(at('https://nandomoreira.dev/servicos'), false)).toBeUndefined();
  });

  it('rewrites the subdomain root and slugs onto /servicos', () => {
    expect(salesRouting(at('https://contrate.nandomoreira.dev/'), true)).toEqual({ rewrite: '/servicos' });
    expect(salesRouting(at('https://contrate.nandomoreira.dev/site-institucional'), true)).toEqual({
      rewrite: '/servicos/site-institucional',
    });
  });

  it('lets the API, /go, the pixel and assets through on the subdomain', () => {
    for (const path of ['/api/hire', '/go/contato/whatsapp', '/v.gif', '/servicos/projetos/mousai.webp', '/_astro/x.css', '/go', '/api']) {
      expect(salesRouting(at(`https://contrate.nandomoreira.dev${path}`), true), path).toBeUndefined();
    }
  });

  it('sends the old main-host address to the subdomain with a 301', () => {
    expect(salesRouting(at('https://nandomoreira.dev/servicos'), true)).toEqual({
      redirect: 'https://contrate.nandomoreira.dev/',
    });
    expect(salesRouting(at('https://nandomoreira.dev/servicos/site-institucional?envio=ok'), true)).toEqual({
      redirect: 'https://contrate.nandomoreira.dev/site-institucional?envio=ok',
    });
  });

  it('keeps the screenshots on the main host reachable', () => {
    expect(salesRouting(at('https://nandomoreira.dev/servicos/projetos/mousai.webp'), true)).toBeUndefined();
  });

  it('never touches other main-host pages', () => {
    expect(salesRouting(at('https://nandomoreira.dev/contato'), true)).toBeUndefined();
    expect(salesRouting(at('https://nandomoreira.dev/servicosx'), true)).toBeUndefined();
  });
});
```

**Passo 2:** `npx vitest run tests/sales/host.test.ts`. Esperado: FAIL, módulo inexistente.

**Passo 3: implementação.** `src/lib/sales/host.ts`:

```ts
/** The sales pages' own address (sales-landing, decided 2026-10-18). */
export const SALES_HOST = 'contrate.nandomoreira.dev';

/**
 * False until the custom domain answers on App Hosting. While false the pages
 * live at /servicos on the main host; flipping it turns on the rewrite, the
 * 301 from the main host and the canonical on the subdomain. Runbook:
 * docs/runbooks/sales-subdomain.md.
 */
export const SALES_HOST_LIVE = false;

export const SALES_BASE = '/servicos';
const MAIN_ORIGIN = 'https://nandomoreira.dev';

/** First path segments the subdomain must never rewrite. */
const RESERVED = new Set(['api', 'go', 'servicos']);

/** Root-relative path of a sales page as served right now. */
export const salesPath = (slug?: string, live: boolean = SALES_HOST_LIVE): string => {
  if (live) return slug ? `/${slug}` : '/';
  return slug ? `${SALES_BASE}/${slug}` : SALES_BASE;
};

/** Absolute URL of a sales page: canonical, sitemap and links from the main site. */
export const salesUrl = (slug?: string, live: boolean = SALES_HOST_LIVE): string =>
  `${live ? `https://${SALES_HOST}` : MAIN_ORIGIN}${salesPath(slug, live)}`;

export type SalesRoute = { rewrite: string } | { redirect: string } | undefined;

/**
 * What the middleware does with a request. Only a bare slug is rewritten, so
 * anything with a dot (assets, the pixel) or a second segment passes through.
 */
export const salesRouting = (url: URL, live: boolean = SALES_HOST_LIVE): SalesRoute => {
  if (!live) return undefined;
  const path = url.pathname;

  if (url.hostname === SALES_HOST) {
    if (path === '/') return { rewrite: SALES_BASE };
    const slug = /^\/([a-z0-9-]+)$/.exec(path)?.[1];
    if (slug && !RESERVED.has(slug)) return { rewrite: `${SALES_BASE}/${slug}` };
    return undefined;
  }

  if (path !== SALES_BASE && !path.startsWith(`${SALES_BASE}/`)) return undefined;
  const rest = path.slice(SALES_BASE.length);
  if (!/^(\/[a-z0-9-]+)?$/.test(rest)) return undefined;

  return { redirect: `https://${SALES_HOST}${rest || '/'}${url.search}` };
};
```

**Passo 4:** `npx vitest run tests/sales/host.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 6: catálogo de serviços validado por Zod

**Requisito:** REQ-011, REQ-017, REQ-019, REQ-020
**Arquivos:**
- Criar: `src/lib/sales/catalog.ts`
- Teste: `tests/sales/catalog.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, type-safety-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/lib/hire/schema';
import { SALES_SERVICES, detailFor, detailSlugs, serviceAnchor } from '../../src/lib/sales/catalog';

describe('sales catalog', () => {
  it('offers the six services in the landing order', () => {
    expect(SALES_SERVICES.map((service) => service.service)).toEqual(SERVICES.filter((value) => value !== 'undecided'));
  });

  it('gives every service 3 or 4 items of what the client receives', () => {
    for (const service of SALES_SERVICES) {
      expect(service.receives.length, service.slug).toBeGreaterThanOrEqual(3);
      expect(service.receives.length, service.slug).toBeLessThanOrEqual(4);
    }
  });

  it('publishes a detail page only for the institutional website', () => {
    expect(detailSlugs()).toEqual(['site-institucional']);
    expect(detailFor('loja-virtual')).toBeUndefined();
    expect(detailFor('constructor')).toBeUndefined();
  });

  it('lays out the detail page as the Stitch screen does', () => {
    const detail = detailFor('site-institucional')!;

    expect(detail.anatomy).toHaveLength(4);
    expect(detail.fit).toHaveLength(4);
    expect(detail.comparison.columns).toEqual(['Site institucional', 'Landing page', 'Loja virtual']);
    for (const row of detail.comparison.rows) expect(row.values).toHaveLength(3);
    expect(detail.faq.map((item) => item.question)).toHaveLength(4);
  });

  it('lists the editing panel as an optional add-on (REQ-020)', () => {
    expect(detailFor('site-institucional')!.addons.map((addon) => addon.title)).toContain('Painel de edição');
  });

  it('explains Firebase Hosting by the shop-window analogy', () => {
    expect(detailFor('site-institucional')!.underTheHood.join(' ')).toContain('Firebase Hosting');
  });

  it('derives the anchor from the slug', () => {
    expect(serviceAnchor('blog')).toBe('servico-blog');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/catalog.test.ts`. Esperado: FAIL, módulo inexistente.

**Passo 3: implementação.** `src/lib/sales/catalog.ts`:

```ts
import { z } from 'zod';
import { SERVICES } from '../hire/schema';

const item = z.object({ title: z.string().min(1), text: z.string().min(1) });

const detailSchema = z.object({
  hero: z.object({ title: z.string().min(1), lead: z.string().min(1), cta: z.string().min(1) }),
  anatomy: z.array(item.extend({ note: z.string().min(1) })).length(4),
  fit: z.array(item).length(4),
  included: z.array(item).min(1),
  addons: z.array(item).min(1),
  underTheHood: z.array(z.string().min(1)).min(1),
  comparison: z.object({
    caption: z.string().min(1),
    columns: z.array(z.string()).length(3),
    rows: z.array(z.object({ criterion: z.string(), values: z.array(z.string()).length(3) })).min(1),
  }),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
});

const serviceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  service: z.enum(SERVICES),
  icon: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  audience: z.string().min(1),
  receives: z.array(z.string().min(1)).min(3).max(4),
  detail: detailSchema.optional(),
});

export type SalesService = z.infer<typeof serviceSchema>;
export type ServiceDetail = z.infer<typeof detailSchema>;

const SITE_INSTITUCIONAL: ServiceDetail = {
  hero: {
    title: 'Site institucional: seu cartão de visita que trabalha 24 horas.',
    lead: 'O endereço oficial do seu negócio na internet, feito para transmitir credibilidade a quem acabou de conhecer você. Sem depender de rede social nem de mensagens soltas para explicar o que você faz.',
    cta: 'Quero um site assim',
  },
  anatomy: [
    { title: 'Início', text: 'A primeira impressão: quem você é, o que faz e para quem, com um convite para conversar.', note: 'Impacto imediato e clareza' },
    { title: 'Sobre você ou a empresa', text: 'Sua história, seus princípios e o seu método. Constrói confiança antes da compra.', note: 'Confiança e reputação' },
    { title: 'Serviços ou produtos', text: 'O que você entrega, com clareza. Responde às dúvidas mais comuns antes do primeiro contato.', note: 'Explicação sem rodeio' },
    { title: 'Contato', text: 'Caminho direto para falar com você: botão de WhatsApp e um formulário simples.', note: 'Canal aberto sem atrito' },
  ],
  fit: [
    { title: 'Indicações perdidas no meio do caminho', text: 'Você depende de indicação boca a boca e perde clientes que procuram o seu nome antes de fechar.' },
    { title: 'Tempo gasto em explicações repetitivas', text: 'Você explica o seu método e responde às mesmas dúvidas em cada primeiro contato.' },
    { title: 'Buscas no Google sem encontrar você', text: 'Você quer aparecer quando alguém da sua cidade procura pelo que você faz, sem depender só de anúncio pago.' },
    { title: 'Superar a cara de amadorismo', text: 'Você quer passar mais segurança do que um perfil de rede social ou um cartão digital genérico.' },
  ],
  included: [
    { title: 'Design exclusivo feito sob medida', text: 'Nada de modelo pronto ou site genérico de construtor.' },
    { title: 'Versão para celular', text: 'Layout pensado para celular, tablet e computador.' },
    { title: 'Domínio próprio configurado', text: 'O seu endereço oficial, registrado no seu nome.' },
    { title: 'Cadeado de segurança HTTPS', text: 'Conexão protegida e o cadeado no navegador do visitante.' },
    { title: 'Otimização para o Google', text: 'Estrutura e informações que ajudam o Google a entender o seu site.' },
    { title: 'Botão de WhatsApp', text: 'O visitante começa a conversa com uma mensagem pronta.' },
    { title: 'Formulário de contato simples', text: 'As mensagens chegam organizadas no seu e-mail.' },
    { title: 'Publicação no Firebase Hosting', text: 'Hospedagem rápida e segura na infraestrutura do Google.' },
  ],
  addons: [
    { title: 'Blog integrado', text: 'Espaço para artigos que atraem visitantes pelo Google.' },
    { title: 'Área do cliente', text: 'Acesso com login para materiais, propostas ou consultas.' },
    { title: 'Agendamento online', text: 'O cliente marca um horário direto na sua agenda.' },
    { title: 'Textos escritos por mim', text: 'Escrevo as páginas se você não quiser escrever nada.' },
    { title: 'Versão em inglês', text: 'Para atender clientes de fora do Brasil.' },
    { title: 'Painel de edição', text: 'Para você trocar textos e fotos sozinho, quando quiser.' },
  ],
  underTheHood: [
    'A analogia da vitrine: em vez de pagar o aluguel de um servidor ligado o tempo todo, o seu site funciona como uma vitrine sempre acesa.',
    'Ele é publicado no Firebase Hosting, do Google: uma rede de servidores espalhada pelo mundo, que entrega o site rápido onde o visitante estiver.',
    'Na prática, o site abre rápido em qualquer celular, já vem com o cadeado de segurança e tem um custo de manutenção que costuma ficar perto de zero.',
  ],
  comparison: {
    caption: 'Site institucional, landing page e loja virtual lado a lado',
    columns: ['Site institucional', 'Landing page', 'Loja virtual'],
    rows: [
      { criterion: 'Para que serve', values: ['Apresentar o negócio inteiro e passar credibilidade.', 'Vender uma única oferta ou captar contatos de uma campanha.', 'Vender produtos com carrinho de compras.'] },
      { criterion: 'Quantidade de páginas', values: ['De uma a quatro seções ou páginas.', 'Uma página única e focada.', 'Muitas páginas de catálogo.'] },
      { criterion: 'Foco principal', values: ['Autoridade, clareza e contato.', 'Conversão de quem chega por anúncio.', 'Venda concluída no checkout.'] },
      { criterion: 'Quando escolher', values: ['Você presta serviços, tem escritório ou consultoria.', 'Você vai rodar uma campanha específica.', 'Você vende mercadorias e precisa de frete e estoque.'] },
    ],
  },
  faq: [
    { question: 'Quantas páginas ou seções meu site institucional pode ter?', answer: 'Normalmente cabe em uma página com as quatro partes (início, sobre, serviços e contato) ou em até quatro páginas. Se precisar de mais, isso entra na proposta.' },
    { question: 'Eu mesmo vou conseguir trocar textos e fotos depois?', answer: 'Pequenas trocas de texto e foto ficam por minha conta no acompanhamento. Se preferir editar sozinho, o site pode ganhar um painel de edição simples, como opcional.' },
    { question: 'O domínio e o site ficam registrados em meu nome?', answer: 'Sim. Se você ainda não tem domínio, eu registro no seu nome, e as contas do site também ficam com você.' },
    { question: 'Quanto tempo leva para ficar pronto?', answer: 'O prazo vem na proposta, com a data de cada etapa.' },
  ],
};

/** Landing order. Parsed at load, so a malformed entry fails the build, not a visit. */
export const SALES_SERVICES: readonly SalesService[] = z.array(serviceSchema).parse([
  {
    slug: 'site-institucional',
    service: 'website',
    icon: 'lucide:app-window',
    title: 'Site institucional',
    summary: 'Seu cartão de visita que trabalha 24 horas: explica quem você é, o que oferece e como falar com você.',
    audience: 'Empresas, clínicas e profissionais que precisam de uma presença confiável no Google.',
    receives: ['Design sob medida', 'Feito para ser encontrado no Google', 'Rápido no celular', 'Botão de contato direto'],
    detail: SITE_INSTITUCIONAL,
  },
  {
    slug: 'landing-page',
    service: 'landing-page',
    icon: 'lucide:mouse-pointer-click',
    title: 'Landing page',
    summary: 'Uma página focada em um único objetivo: transformar visitantes em contatos ou vendas.',
    audience: 'Lançamentos de produtos, campanhas de anúncios e divulgação de serviços pontuais.',
    receives: ['Texto claro e persuasivo', 'Carregamento rápido', 'Integração com WhatsApp', 'Medição de quem virou contato'],
  },
  {
    slug: 'blog',
    service: 'blog',
    icon: 'lucide:newspaper',
    title: 'Blog',
    summary: 'Seu espaço próprio para publicar artigos, ensinar o seu público e construir autoridade sem depender dos algoritmos das redes.',
    audience: 'Especialistas, consultores e marcas que querem ser encontrados no Google pelo conteúdo.',
    receives: ['Painel simples de escrita', 'Categorias e busca', 'Leitura confortável', 'Compartilhamento fácil'],
  },
  {
    slug: 'loja-virtual',
    service: 'online-store',
    icon: 'lucide:shopping-bag',
    title: 'Loja virtual',
    summary: 'Sua vitrine online com catálogo organizado, carrinho e pagamento seguro.',
    audience: 'Quem quer vender produtos físicos ou digitais sem depender do WhatsApp.',
    receives: ['Catálogo fácil de atualizar', 'Pagamento seguro com Pix e cartão', 'Cálculo de frete', 'Painel de pedidos'],
  },
  {
    slug: 'produto-web',
    service: 'web-product',
    icon: 'lucide:layout-dashboard',
    title: 'Produto web completo',
    summary: 'Um sistema com login, cadastro de usuários e dados guardados com segurança, como um aplicativo, só que direto no navegador.',
    audience: 'Empreendedores e empresas com uma ideia de serviço digital ou plataforma própria.',
    receives: ['Área logada com login', 'Painel administrativo', 'Banco de dados em tempo real', 'Cresce junto com o uso'],
  },
  {
    slug: 'automacao-ia',
    service: 'automation',
    icon: 'lucide:bot',
    title: 'Automação e IA',
    summary: 'Rotinas inteligentes que cuidam das tarefas repetitivas da sua operação para liberar o seu tempo.',
    audience: 'Negócios que gastam horas alimentando planilhas, triando e-mails ou respondendo mensagens.',
    receives: ['Integração entre as ferramentas que você já usa', 'Assistente com inteligência artificial', 'Relatórios automáticos', 'Menos erros manuais'],
  },
]);

export const serviceAnchor = (slug: string): string => `servico-${slug}`;

export const detailFor = (slug: string): (SalesService & { detail: ServiceDetail }) | undefined => {
  const found = SALES_SERVICES.find((service) => service.slug === slug);
  return found?.detail ? (found as SalesService & { detail: ServiceDetail }) : undefined;
};

export const detailSlugs = (): string[] =>
  SALES_SERVICES.filter((service) => service.detail).map((service) => service.slug);
```

**Passo 4:** `npx vitest run tests/sales/catalog.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 7: origem do formulário, payload de vendas e redirect

**Requisito:** REQ-021, REQ-023, REQ-024, REQ-025
**Depende de:** tarefas 1, 3, 4, 5 e 6
**Arquivos:**
- Criar: `src/lib/sales/form.ts`
- Modificar: `src/lib/hire/form.ts` (`FIELD_MAP`, `OPTIONAL`, `formRedirect`), `src/lib/hire/handler.ts` (`handleHire`)
- Teste: `tests/sales/form.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, security-reviewer, type-safety-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Dependencies, handleHire } from '../../src/lib/hire/handler';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import type { StoredBriefing } from '../../src/lib/hire/store';
import { salesFormToPayload, salesOriginOf } from '../../src/lib/sales/form';

const saved: StoredBriefing[] = [];

const deps = (): Dependencies => ({
  store: {
    save: vi.fn(async (briefing: StoredBriefing) => {
      saved.push(briefing);
      return 'doc-1';
    }),
    markNotified: vi.fn(async () => undefined),
  },
  notifier: { send: vi.fn(async () => undefined) },
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-10-18T12:00:00.000Z'),
});

const post = (query: string, fields: Array<[string, string]>) =>
  handleHire(
    new Request(`https://nandomoreira.dev/api/hire${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
    deps(),
  );

const lead: Array<[string, string]> = [
  ['nome', 'Ada'],
  ['contato', '11 91234-5678'],
  ['servico', 'website'],
  ['mensagem', ''],
  [FORM_HONEYPOT, ''],
];

beforeEach(() => {
  saved.length = 0;
});

describe('salesOriginOf', () => {
  it('maps the landing and each detail slug to its page', () => {
    expect(salesOriginOf(new URL('https://x/api/hire?origem=landing'))).toBe('/servicos');
    expect(salesOriginOf(new URL('https://x/api/hire?origem=site-institucional'))).toBe('/servicos/site-institucional');
  });

  it('ignores anything outside the closed list (no open redirect)', () => {
    for (const value of ['https://evil.example', '//evil.example', 'loja-virtual', '']) {
      expect(salesOriginOf(new URL(`https://x/api/hire?origem=${encodeURIComponent(value)}`)), value).toBeUndefined();
    }
    expect(salesOriginOf(new URL('https://x/api/hire'))).toBeUndefined();
  });
});

describe('salesFormToPayload', () => {
  it('maps contato and servico onto the API payload', () => {
    expect(salesFormToPayload(new URLSearchParams([...lead.slice(0, 3), ['mensagem', 'Tenho uma clínica.']]))).toEqual({
      from: 'Ada',
      contact: '11 91234-5678',
      service: 'website',
      brief: 'Tenho uma clínica.',
    });
  });

  it('fills an empty message with the chosen service, since brief is required', () => {
    expect(salesFormToPayload(new URLSearchParams(lead)).brief).toBe('Interesse: Site institucional');
  });

  it('falls back to "not sure yet" when no service came either', () => {
    const params = new URLSearchParams([['nome', 'Ada'], ['contato', 'ada@example.com'], ['mensagem', '  ']]);
    expect(salesFormToPayload(params).brief).toBe('Interesse: Ainda não sei');
  });
});

describe('handleHire from a sales page', () => {
  it('stores the lead and goes back to the landing with ok', async () => {
    const response = await post('?origem=landing', lead);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/servicos?envio=ok#envio');
    expect(saved[0]?.service).toBe('website');
  });

  it('returns to the detail page it came from', async () => {
    const response = await post('?origem=site-institucional', lead);
    expect(response.headers.get('location')).toBe('/servicos/site-institucional?envio=ok#envio');
  });

  it('refuses a contact that is neither e-mail nor phone', async () => {
    const fields = lead.map(([key, value]): [string, string] => [key, key === 'contato' ? 'me chama' : value]);
    const response = await post('?origem=landing', fields);

    expect(response.headers.get('location')).toBe('/servicos?envio=invalido#envio');
    expect(saved).toHaveLength(0);
  });

  it('sends an unknown origin back to /contato', async () => {
    const response = await post('?origem=https%3A%2F%2Fevil.example', [
      ['nome', 'Ada'],
      ['email', 'ada@example.com'],
      ['mensagem', 'Oi'],
    ]);
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
  });

  it('keeps /contato exactly as before', async () => {
    const response = await post('', [['nome', 'Ada'], ['email', 'ada@example.com'], ['mensagem', 'Oi']]);
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/form.test.ts`. Esperado: FAIL, `src/lib/sales/form` inexistente.

**Passo 3: implementação.**

`src/lib/hire/form.ts`: acrescente ao `FIELD_MAP` e ao `OPTIONAL`, e dê um destino ao redirect:

```ts
const FIELD_MAP: Record<string, string> = {
  [FORM_HONEYPOT]: HONEYPOT_FIELD,
  nome: 'from',
  email: 'contact',
  // The sales form asks for "e-mail ou WhatsApp" in one field.
  contato: 'contact',
  mensagem: 'brief',
  empresa: 'company',
  orcamento: 'budget',
  servico: 'service',
};

const OPTIONAL = new Set(['company', 'budget', 'service']);
```

```ts
/**
 * Where the form lands after a submission; the page reads `envio`. `base` is
 * a sales page chosen from a closed list (src/lib/sales/form.ts), never a
 * value taken from the request.
 */
export const formRedirect = (outcome: FormOutcome, base = '/contato'): Response =>
  new Response(null, {
    status: 303,
    headers: { location: `${base}?envio=${outcome}#envio`, 'cache-control': 'no-store' },
  });
```

`src/lib/sales/form.ts`:

```ts
import { formToPayload } from '../hire/form';
import { detailSlugs } from './catalog';
import { salesPath } from './host';
import { SERVICE_LABELS, isService } from './service-labels';

/**
 * The page a sales form came from, read from the action's `?origem=`: it is
 * in the URL, so even a failure before the body is read (rate limit) can go
 * back to the right page. Only known values map to a path.
 */
export const salesOriginOf = (url: URL): string | undefined => {
  const origin = url.searchParams.get('origem');
  if (origin === 'landing') return salesPath();
  if (origin && detailSlugs().includes(origin)) return salesPath(origin);
  return undefined;
};

/** The message is optional on the sales form, but `brief` is required by the schema. */
export const salesFormToPayload = (params: URLSearchParams): Record<string, unknown> => {
  const payload = formToPayload(params);
  const brief = typeof payload.brief === 'string' ? payload.brief.trim() : '';

  if (brief === '') {
    const service = isService(payload.service) ? payload.service : 'undecided';
    payload.brief = `Interesse: ${SERVICE_LABELS[service]}`;
  }

  return payload;
};
```

`src/lib/hire/handler.ts`: importe e use a origem.

```ts
import { isReachableContact } from '../sales/contact';
import { salesFormToPayload, salesOriginOf } from '../sales/form';
```

No começo de `handleHire`, depois de `const fromForm = isForm(request);`:

```ts
  // A sales page posts with ?origem=; it gets its own redirect and contact rule.
  const salesBase = fromForm ? salesOriginOf(new URL(request.url)) : undefined;
```

Troque `formRedirect(FORM_OUTCOMES[kind])` por `formRedirect(FORM_OUTCOMES[kind], salesBase)` e `formRedirect('ok')` por `formRedirect('ok', salesBase)`.

Troque a linha do parse:

```ts
    const params = fromForm ? new URLSearchParams(raw) : undefined;
    parsed = params ? (salesBase ? salesFormToPayload(params) : formToPayload(params)) : JSON.parse(raw);
```

Depois de `if (!result.success) return fail('invalid');`:

```ts
  // REQ-023 of sales-landing: only the sales form; /contato and agents keep the free-text contact.
  if (salesBase && !isReachableContact(result.data.contact)) return fail('invalid');
```

**Passo 4:** `npx vitest run tests/sales/ tests/api/`. Esperado: PASS, inclusive os testes antigos de `/contato`.

**Passo 5:** `/git commit`.

---

### Tarefa 8: `service` documentado para agentes

**Requisito:** REQ-027
**Arquivos:**
- Modificar: `src/lib/aeo/agents-md.ts` (bloco "Sending a briefing"), `src/lib/aeo/hire-brief.ts` (`body`)
- Teste: `tests/aeo/hire-service-docs.test.ts` (criar)

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { buildAgentsMd } from '../../src/lib/aeo/agents-md';
import { buildHireBrief } from '../../src/lib/aeo/hire-brief';
import { SERVICES } from '../../src/lib/hire/schema';

const site = new URL('https://nandomoreira.dev');
const profile = {
  name: 'Fernando Moreira Costa',
  stack: ['TypeScript'],
  availability: { status: 'open', detail: 'Open.', updatedAt: '2026-10-18' },
} as never;

describe('service in the agent contract', () => {
  it('lists every service value in the hire brief', () => {
    const brief = buildHireBrief({ site, profile });
    for (const service of SERVICES) expect(brief, service).toContain(service);
  });

  it('documents service in AGENTS.md', async () => {
    const markdown = await buildAgentsMd({ site, profile, projects: [] } as never);
    expect(markdown).toContain('`service`');
    for (const service of SERVICES) expect(markdown, service).toContain(`\`${service}\``);
  });
});
```

Antes de rodar, confira a assinatura real de `buildAgentsMd` em `src/lib/aeo/agents-md.ts` e ajuste a chamada do segundo teste a ela (o fixture de `tests/aeo/no-leak.test.ts` mostra os argumentos usados hoje).

**Passo 2:** `npx vitest run tests/aeo/hire-service-docs.test.ts`. Esperado: FAIL, `website` ausente.

**Passo 3: implementação.**

`hire-brief.ts`: importe `SERVICES` junto de `BUDGETS, INTERESTS` e acrescente ao `body`, depois de `interests`:

```ts
    service: `optional, what a person wants built: ${SERVICES.join(' | ')}`,
```

`agents-md.ts`: importe `SERVICES` e troque a linha de `interests` por:

```ts
    `  \`interests\`, a list of distinct values from ${INTERESTS.map((value) => `\`${value}\``).join(', ')},`,
    `  \`service\`, what a person wants built, one of ${SERVICES.map((value) => `\`${value}\``).join(', ')}.`,
```

**Passo 4:** `npx vitest run tests/aeo/ tests/pages/`. Esperado: PASS (inclusive `no-leak`).

**Passo 5:** `/git commit`.

---

### Tarefa 9: política de privacidade cita serviço e WhatsApp

**Requisito:** REQ-029
**Arquivos:**
- Modificar: `src/lib/privacy/policy.ts:57`
- Teste: `tests/privacy/sales-fields.test.ts` (criar)

**Time:**
- Track: docs
- Implementer: rpi-implementer
- Reviewers: self-review

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import * as policy from '../../src/lib/privacy/policy';

const text = JSON.stringify(policy);

describe('privacy policy and the sales form', () => {
  it('names the service field', () => {
    expect(text).toContain('serviço desejado');
  });

  it('says the contact may be a WhatsApp number', () => {
    expect(text).toContain('e-mail ou WhatsApp');
  });
});
```

**Passo 2:** `npx vitest run tests/privacy/sales-fields.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** Em `src/lib/privacy/policy.ts:57`, troque a frase por:

```ts
      'Pelos formulários de contato e de serviços, ou pela API para agents (/api/hire), chegam os campos que você preenche: nome, contato (e-mail ou WhatsApp), empresa, orçamento, interesses, serviço desejado e mensagem. A finalidade é responder você e tratar uma possível proposta de trabalho (art. 7º, V da LGPD).',
```

**Passo 4:** `npx vitest run tests/privacy/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

## Lote 2: roteamento, configuração e WhatsApp

### Tarefa 10: middleware aplica a reescrita e o 301

**Requisito:** REQ-003, REQ-004
**Depende de:** tarefa 5
**Arquivos:**
- Modificar: `src/middleware.ts`
- Teste: `tests/sales/middleware.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, security-reviewer, test-reviewer

**Passo 1: teste que falha.** O teste de fonte aqui só prova a ligação; a lógica está testada na tarefa 5 e a prova por HTTP fica no runbook (tarefa 24).

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/middleware.ts', 'utf8');

describe('middleware wiring for the sales host', () => {
  it('asks salesRouting what to do with each request', () => {
    expect(source).toContain('salesRouting(context.url)');
  });

  it('answers a permanent redirect for the old address', () => {
    expect(source).toMatch(/status:\s*301/);
  });

  it('rewrites through next() instead of redirecting', () => {
    expect(source).toContain('next(sales.rewrite)');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/middleware.test.ts`. Esperado: FAIL.

**Passo 3: implementação.** `src/middleware.ts`:

```ts
import { defineMiddleware } from 'astro:middleware';
import { measureRequest } from './lib/analytics/measure';
import { recorder } from './lib/analytics/runtime';
import { salesRouting } from './lib/sales/host';
import { robotsTagFor } from './lib/seo/backend-host';

export const onRequest = defineMiddleware(async (context, next) => {
  // Off until SALES_HOST_LIVE (docs/runbooks/sales-subdomain.md).
  const sales = salesRouting(context.url);
  if (sales && 'redirect' in sales) {
    return new Response(null, { status: 301, headers: { location: sales.redirect } });
  }

  const response = await (sales ? next(sales.rewrite) : next());

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

**Passo 4:** `npx vitest run tests/sales/ tests/seo/` e `npm run check`. Esperado: PASS e 0 erros.

**Passo 5:** `/git commit`.

---

### Tarefa 11: `allowedDomains` confia no subdomínio

**Requisito:** REQ-005
**Arquivos:**
- Modificar: `astro.config.mjs` (`security.allowedDomains`)
- Teste: `tests/config/allowed-domains.test.ts`

**Time:**
- Track: infra
- Implementer: infra-engineer (skills: bash-linux)
- Reviewers: security-reviewer, consequences-reviewer

**Passo 1: teste que falha.** Acrescente ao `it.each` a linha `'contrate.nandomoreira.dev',`.

**Passo 2:** `npx vitest run tests/config/allowed-domains.test.ts`. Esperado: FAIL para `contrate.nandomoreira.dev`.

**Passo 3: implementação.** Em `astro.config.mjs`:

```js
import { SALES_HOST } from './src/lib/sales/host.ts';
```

E na lista `allowedDomains`, depois de `www.nandomoreira.dev`:

```js
      // The sales pages' subdomain (sales-landing, REQ-005): without it the
      // form posted from there gets 403 from the origin check.
      { hostname: SALES_HOST, protocol: 'https' },
```

**Passo 4:** `npx vitest run tests/config/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 12: contato `whatsapp` no perfil, fora das rotas de máquina

**Requisito:** REQ-024, REQ-028
**Arquivos:**
- Modificar: `src/content/schemas/profile.ts:26`, `src/content/profile/profile.md` (`contacts`), `src/lib/ui/contact-icons.ts`, `src/components/home/Contact.astro` (`LABELS`), `tests/helpers/machine-leaks.ts`, `tests/aeo/no-leak.test.ts` (fixture `profile.contacts`)
- Teste: `tests/sales/whatsapp-contact.test.ts` (criar)

**Time:**
- Track: data
- Implementer: backend-engineer
- Reviewers: consequences-reviewer, security-reviewer, business-logic-reviewer

**Antes de editar:** confira se há dev server (`./node_modules/.bin/astro dev status` ou `ss -ltnp | grep :4321`). Se houver, pare-o antes de mexer no schema e no `profile.md`, senão o store grava o perfil sem o contato novo (armadilha do CLAUDE.md).

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { outboundTable } from '../../src/lib/analytics/outbound';
import { getProfile } from '../../src/lib/content';
import { MACHINE_LEAKS } from '../helpers/machine-leaks';

describe('WhatsApp contact', () => {
  it('is on the profile as wa.me with a prefilled message', async () => {
    const whatsapp = (await getProfile()).contacts.find((contact) => contact.kind === 'whatsapp');
    expect(whatsapp?.value).toMatch(/^https:\/\/wa\.me\/5511917493331\?text=/);
  });

  it('resolves through /go so the click is measured', async () => {
    const table = outboundTable({ contacts: (await getProfile()).contacts, projects: [] });
    expect(table.get('/go/contato/whatsapp')).toMatch(/^https:\/\/wa\.me\/5511917493331/);
  });

  it('makes the machine-route leak gate catch the number', () => {
    const caught = MACHINE_LEAKS.some(([, pattern]) => pattern.test('https://wa.me/5511917493331'));
    expect(caught).toBe(true);
  });
});
```

**Passo 2:** `npx vitest run tests/sales/whatsapp-contact.test.ts`. Esperado: FAIL, contato ausente e padrão inexistente.

**Passo 3: implementação.**

`src/content/schemas/profile.ts:26`:

```ts
  kind: z.enum(['email', 'github', 'linkedin', 'site', 'whatsapp']),
```

`src/content/profile/profile.md`, em `contacts`, depois de `linkedin`:

```yaml
  - kind: whatsapp
    value: https://wa.me/5511917493331?text=Ol%C3%A1%2C%20Fernando!%20Vim%20pela%20sua%20p%C3%A1gina%20de%20servi%C3%A7os.
```

`src/lib/ui/contact-icons.ts`, no mapa: `whatsapp: 'simple-icons:whatsapp',`.

`src/components/home/Contact.astro`, em `LABELS`: `whatsapp: 'WhatsApp',`.

`tests/helpers/machine-leaks.ts`, no fim da lista:

```ts
  ['phone number', /wa\.me\/|\b55\d{10,11}\b/],
```

`tests/aeo/no-leak.test.ts`, no fixture `profile.contacts`, acrescente
`{ kind: 'whatsapp', value: 'https://wa.me/5511917493331?text=Oi' },` para que toda rota de máquina seja testada com o número presente no perfil.

**Passo 4:** `npx vitest run tests/` inteiro e `npm run check`. Esperado: PASS. Se alguma rota de máquina vazar o número, corrija a rota com a mesma lista de permissão que já exclui o e-mail; nunca relaxe o portão.

**Passo 5:** `/git commit`.

---

## Lote 3: páginas

### Tarefa 13: screenshots dos projetos e foto

**Requisito:** REQ-014, REQ-015
**Arquivos:**
- Criar: `public/servicos/projetos/{encantos-brincantes,portfoliosnap,bragstack,mousai}.webp`, `public/servicos/fernando.webp`
- Teste: `tests/sales/assets.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: accessibility-guardrails, test-reviewer

**Passo 1: teste que falha.**

```ts
import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const FILES = [
  'public/servicos/projetos/encantos-brincantes.webp',
  'public/servicos/projetos/portfoliosnap.webp',
  'public/servicos/projetos/bragstack.webp',
  'public/servicos/projetos/mousai.webp',
  'public/servicos/fernando.webp',
];

describe('sales assets', () => {
  it.each(FILES)('%s is a real WebP under 300 KB', (file) => {
    const head = readFileSync(file).subarray(0, 12).toString('latin1');
    expect(head.startsWith('RIFF') && head.endsWith('WEBP')).toBe(true);
    expect(statSync(file).size).toBeLessThan(300 * 1024);
  });
});
```

**Passo 2:** `npx vitest run tests/sales/assets.test.ts`. Esperado: FAIL, `ENOENT`.

**Passo 3: implementação.** Capture os 4 sites no ar e converta (o Chromium do Playwright já está em `~/.cache/ms-playwright`; se a versão do pacote não casar, rode `npx -y playwright install chromium` antes):

```bash
mkdir -p public/servicos/projetos
SHOTS=$(mktemp -d)
while read -r slug url; do
  npx -y playwright screenshot --viewport-size=1280,800 --wait-for-timeout=2500 "$url" "$SHOTS/$slug.png" \
    && magick "$SHOTS/$slug.png" -resize 1200x -quality 80 "public/servicos/projetos/$slug.webp"
done <<'EOF'
encantos-brincantes https://www.encantosbrincantes.com.br
portfoliosnap https://www.portfoliosnap.com.br
bragstack https://bragstack.app
mousai https://mousai.gallery
EOF
magick ~/dev/projects/ascode.com.br/src/images/team/fernando-moreira.jpg -resize 480x480 -quality 82 public/servicos/fernando.webp
```

Abra cada `.webp` e confira que mostra o site (não um banner de cookie ou tela em branco). Se algum vier errado, refaça só ele com `--wait-for-timeout` maior.

**Passo 4:** `npx vitest run tests/sales/assets.test.ts`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 14: textos fixos da landing e portão de números inventados

**Requisito:** REQ-008, REQ-010, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-030
**Depende de:** tarefa 6
**Arquivos:**
- Criar: `src/lib/sales/copy.ts`, `tests/helpers/invented-numbers.ts`
- Teste: `tests/sales/copy.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: business-logic-reviewer, test-reviewer

**Passo 1: teste que falha.**

`tests/helpers/invented-numbers.ts`:

```ts
/** Figures the Stitch screens invented and the sales pages must never show (RISK-004). */
export const INVENTED_NUMBERS: Array<[string, RegExp]> = [
  ['percentage', /\d+(?:[.,]\d+)?\s?%/],
  ['brl amount', /R\$\s?\d/],
  ['time metric', /\b\d+(?:[.,]\d+)?\s?(?:ms|s|segundos?)\b|horas úteis/i],
  ['uptime', /uptime/i],
];

/** Visible text only: CSS and attributes legitimately carry numbers. */
export const visibleText = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ');

export const inventedNumbersIn = (text: string): string[] =>
  INVENTED_NUMBERS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
```

`tests/sales/copy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SALES_SERVICES, serviceAnchor } from '../../src/lib/sales/catalog';
import { SALES_COPY } from '../../src/lib/sales/copy';
import { inventedNumbersIn } from '../helpers/invented-numbers';

describe('invented-number gate', () => {
  it('can fail: it catches every figure the Stitch made up', () => {
    for (const sample of ['99.98% no ar', 'R$ 14.890 hoje', '< 1.5s', 'Retorno em até 24 horas úteis', '99.99% Uptime']) {
      expect(inventedNumbersIn(sample), sample).not.toEqual([]);
    }
  });

  it('lets the approved figures of speech through', () => {
    expect(inventedNumbersIn('Seu cartão de visita que trabalha 24 horas. 15 anos de código.')).toEqual([]);
  });

  it('finds nothing in the sales copy or the catalog', () => {
    expect(inventedNumbersIn(JSON.stringify({ SALES_COPY, SALES_SERVICES }))).toEqual([]);
  });
});

describe('SALES_COPY', () => {
  it('maps each of the 6 situations to an existing service', () => {
    const slugs = SALES_SERVICES.map((service) => service.slug);
    expect(SALES_COPY.situations).toHaveLength(6);
    for (const situation of SALES_COPY.situations) expect(slugs).toContain(situation.service);
  });

  it('has the 7 steps in order, with 03 and 04 labelled', () => {
    expect(SALES_COPY.steps.map((step) => step.title)).toEqual([
      'Entrevista', 'Pesquisa', 'Design', 'Aprovação', 'Desenvolvimento', 'Testes', 'Entrega',
    ]);
    expect(SALES_COPY.steps.filter((step) => step.highlight).map((step) => step.title)).toEqual(['Design', 'Aprovação']);
  });

  it('explains the seven Firebase tools by analogy', () => {
    expect(SALES_COPY.tools.map((tool) => tool.name)).toEqual([
      'Firebase Hosting', 'Firebase App Hosting', 'Firestore', 'Authentication', 'Cloud Functions', 'Cloud Storage', 'Gemini',
    ]);
  });

  it('shows only the four approved projects', () => {
    expect(SALES_COPY.projects.map((project) => project.slug)).toEqual([
      'encantos-brincantes', 'portfoliosnap', 'bragstack', 'mousai',
    ]);
  });

  it('answers the six landing questions without promising a fixed price', () => {
    expect(SALES_COPY.faq).toHaveLength(6);
    expect(JSON.stringify(SALES_COPY.faq)).not.toMatch(/valor fechado|preço fixo/i);
  });

  it('builds the anchor the situation cards link to', () => {
    expect(serviceAnchor(SALES_COPY.situations[0]!.service)).toBe('servico-site-institucional');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/copy.test.ts`. Esperado: FAIL, `copy.ts` inexistente.

**Passo 3: implementação.** `src/lib/sales/copy.ts`:

```ts
/** Fixed text of the sales landing (sales-landing, Anexos A e B). Visible copy, so pt-BR. */
export const SALES_COPY = {
  hero: {
    eyebrow: 'Sites, lojas e sistemas para o seu negócio',
    title: 'Seu site, sua loja ou seu sistema, do primeiro papo até estar no ar.',
    lead: 'Você me conta o que o seu negócio precisa, mesmo que ainda não saiba o nome disso. Eu traduzo em um projeto, desenho, construo e entrego funcionando.',
    primary: 'Quero conversar sobre meu projeto',
    secondary: 'Ver como funciona',
    proofs: ['15 anos de código em produção', 'Design aprovado antes da programação', 'Sem jargão técnico'],
  },
  situationsHeader: {
    eyebrow: 'Ponto de partida',
    title: 'Não sabe por onde começar? Comece pela sua situação.',
    lead: 'Você não precisa conhecer termos técnicos nem saber qual tecnologia contratar. Escolha a frase que mais parece com o seu momento.',
  },
  situations: [
    { label: 'Presença', quote: 'Quero que me encontrem no Google', service: 'site-institucional' },
    { label: 'Divulgação', quote: 'Preciso de uma página para divulgar uma oferta ou um evento', service: 'landing-page' },
    { label: 'Vendas', quote: 'Quero vender pela internet sem depender do WhatsApp', service: 'loja-virtual' },
    { label: 'Autoridade', quote: 'Quero escrever e atrair clientes com conteúdo', service: 'blog' },
    { label: 'Aplicativo', quote: 'Tenho uma ideia de aplicativo ou sistema', service: 'produto-web' },
    { label: 'Tempo', quote: 'Perco horas com tarefas repetitivas e planilhas', service: 'automacao-ia' },
  ],
  servicesHeader: {
    eyebrow: 'Soluções sob medida',
    title: 'Serviços pensados para o momento do seu negócio',
    lead: 'Tudo explicado sem enrolação: o que é, para quem serve e o que você recebe.',
  },
  stepsHeader: {
    eyebrow: 'Transparência total',
    title: 'Como eu trabalho',
    lead: 'Um processo simples e previsível. Você sempre sabe em que pé está o projeto e o que precisa fazer.',
  },
  steps: [
    { title: 'Entrevista', text: 'Uma conversa para entender o seu negócio, o seu cliente e o seu objetivo.', youDo: 'Você só precisa contar a sua história.' },
    { title: 'Pesquisa', text: 'Estudo o seu mercado, os concorrentes e o que o seu cliente procura.', youDo: 'Você tira as dúvidas que eu tiver sobre o seu público.' },
    { title: 'Design', text: 'Desenho as telas antes de escrever qualquer código, para você ver como vai ficar.', youDo: 'Você vê o visual e dá as primeiras impressões.', highlight: 'Você aprova antes' },
    { title: 'Aprovação', text: 'Você revisa, pede ajustes e só seguimos quando estiver do seu jeito.', youDo: 'Você dá o sinal verde para a construção.', highlight: 'Sem surpresas' },
    { title: 'Desenvolvimento', text: 'Construo o site ou sistema de verdade, com atualizações para você acompanhar.', youDo: 'Você acompanha pelos links de teste.' },
    { title: 'Testes', text: 'Testo em celular, computador e diferentes navegadores, e verifico velocidade e segurança.', youDo: 'Você navega e experimenta a versão final.' },
    { title: 'Entrega', text: 'Publico no ar com o seu domínio, explico como usar e fico por perto nos primeiros dias.', youDo: 'Você recebe os acessos e começa a divulgar.' },
  ],
  stepsNote: 'As etapas 03 e 04 garantem que nada é construído sem a sua aprovação.',
  toolsHeader: {
    eyebrow: 'Infraestrutura explicada',
    title: 'As ferramentas por trás, explicadas sem complicação',
    lead: 'Pense na tecnologia como uma loja física. Eu uso o Firebase, a plataforma do Google, e cada peça dela faz um papel conhecido.',
  },
  tools: [
    { name: 'Firebase Hosting', analogy: 'O endereço e a vitrine', text: 'Hospeda sites que não mudam a cada visita, como o institucional, a landing page e o blog. Rápido no mundo todo, com cadeado de segurança incluso e custo que costuma ficar perto de zero.' },
    { name: 'Firebase App Hosting', analogy: 'A loja com atendente', text: 'Para sites que montam cada página na hora, com conteúdo que muda, área de cliente e integrações.' },
    { name: 'Firestore', analogy: 'O arquivo e o estoque', text: 'Banco de dados que guarda produtos, pedidos e cadastros, e atualiza tudo em tempo real.' },
    { name: 'Authentication', analogy: 'O porteiro', text: 'Login com e-mail ou conta Google, para cada pessoa ver só o que é dela.' },
    { name: 'Cloud Functions', analogy: 'O funcionário dos bastidores', text: 'Tarefas automáticas no servidor, como enviar o e-mail de confirmação, processar um pagamento ou gerar um relatório.' },
    { name: 'Cloud Storage', analogy: 'O depósito', text: 'Fotos, PDFs e arquivos enviados por você ou pelos seus clientes.' },
    { name: 'Gemini', analogy: 'O assistente', text: 'A inteligência artificial do Google, para resumos, textos e automações dentro do seu produto.' },
  ],
  toolsNote: 'Infraestrutura do Google, a mesma usada por grandes empresas, com custo que cresce junto com o seu negócio.',
  projectsHeader: {
    eyebrow: 'Casos concretos',
    title: 'Projetos reais',
    lead: 'Alguns trabalhos feitos do zero e que estão no ar.',
  },
  projects: [
    { slug: 'encantos-brincantes', kind: 'Vitrine online', text: 'Levou para a web a venda de recursos lúdicos para educação infantil, que antes dependia de mensagem direta.', alt: 'Página inicial da vitrine Encantos Brincantes, com produtos lúdicos para educação infantil' },
    { slug: 'portfoliosnap', kind: 'Produto web com IA', text: 'Professores registram atividades em segundos e a inteligência artificial gera o relatório pedagógico do mês.', alt: 'Tela do PortfolioSnap com o registro de atividades de uma turma' },
    { slug: 'bragstack', kind: 'Aplicativo web com Firebase', text: 'Registro de conquistas profissionais em poucos toques, organizado pela inteligência artificial.', alt: 'Tela inicial do BragStack, aplicativo de registro de conquistas' },
    { slug: 'mousai', kind: 'Produto web', text: 'Mural de referências visuais para artistas, compartilhado por um código curto.', alt: 'Galeria de referências visuais no Mousai' },
  ],
  about: {
    name: 'Fernando Moreira',
    role: 'Desenvolvedor de software sênior em São Paulo, atendendo todo o Brasil de forma remota.',
    photoAlt: 'Foto de Fernando Moreira, de óculos e barba, sorrindo',
    points: [
      { title: '15 anos construindo software', text: 'com passagem por grandes empresas de tecnologia, como Itaú Unibanco, Pipefy e Skyone.' },
      { title: 'Você fala direto com quem constrói', text: 'sem intermediário e sem telefone sem fio. A sua necessidade é entendida na raiz.' },
      { title: 'O acompanhamento continua depois da entrega', text: 'fico por perto com suporte, ajustes e evolução conforme o seu negócio cresce.' },
    ],
  },
  faqHeader: {
    eyebrow: 'Respostas sem rodeios',
    title: 'Dúvidas frequentes',
    lead: 'As perguntas mais comuns de quem está dando o primeiro passo.',
  },
  faq: [
    { question: 'Preciso entender de tecnologia?', answer: 'Não. Você conta como funciona o seu negócio e o que espera do site; a parte técnica é comigo, e explico cada escolha em português claro.' },
    { question: 'Quanto custa?', answer: 'Depende do que o seu projeto precisa e do que você quer incluir. Depois da primeira conversa, montamos o escopo juntos e eu envio uma proposta; o valor varia conforme o que entra agora e o que fica para depois.' },
    { question: 'Quanto tempo leva?', answer: 'Também depende do projeto. O prazo vem na proposta, com a data de cada etapa, e você acompanha o andamento pelo link de teste.' },
    { question: 'Vou conseguir atualizar sozinho?', answer: 'Pequenas trocas de texto e foto ficam por minha conta no acompanhamento. Se preferir editar sozinho, o site pode ganhar um painel de edição simples, como opcional.' },
    { question: 'O site fica no meu nome?', answer: 'Sim. O domínio, as contas e o projeto ficam no seu nome, e você nunca fica preso a mim.' },
    { question: 'E depois da entrega, você continua ajudando?', answer: 'Sim. Continuo acompanhando o projeto, com suporte, ajustes e evolução conforme o seu negócio cresce.' },
  ],
  contact: {
    eyebrow: 'Primeiro passo',
    title: 'Vamos tirar sua ideia do papel?',
    lead: 'A primeira conversa é sem compromisso. Você conta, eu escuto e te digo o caminho mais simples.',
    note: 'Respondo pessoalmente, pelo canal que você escolher.',
    submit: 'Quero conversar sobre meu projeto',
    whatsapp: 'Prefiro conversar pelo WhatsApp',
  },
} as const;
```

**Passo 4:** `npx vitest run tests/sales/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 15: `SalesLayout` com cabeçalho, rodapé, SEO e JSON-LD `Service`

**Requisito:** REQ-001, REQ-006, REQ-031, REQ-032, REQ-033
**Depende de:** tarefa 5
**Arquivos:**
- Criar: `src/lib/sales/service-ld.ts`, `src/layouts/SalesLayout.astro`
- Teste: `tests/sales/layout.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesLayout from '../../src/layouts/SalesLayout.astro';
import { serviceLd } from '../../src/lib/sales/service-ld';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(SalesLayout, {
    props: { title: 'Serviços | Fernando Moreira', description: 'Sites e sistemas.', slug: 'site-institucional' },
    slots: { default: '<h1>Teste</h1>' },
    request: new Request('https://nandomoreira.dev/servicos/site-institucional'),
  });
};

describe('serviceLd', () => {
  it('describes a Service provided by the person', () => {
    const ld = serviceLd({ name: 'Site institucional', description: 'd', url: 'https://x/servicos' });
    expect(ld['@type']).toBe('Service');
    expect(ld.provider).toMatchObject({ '@type': 'Person', name: 'Fernando Moreira' });
    expect(ld.areaServed).toMatchObject({ name: 'Brasil' });
  });
});

describe('SalesLayout', () => {
  it('points the canonical at the main host while the subdomain is off', async () => {
    expect(await render()).toContain('<link rel="canonical" href="https://nandomoreira.dev/servicos/site-institucional"');
  });

  it('has a skip link, a main landmark, header and footer', async () => {
    const html = await render();
    expect(html).toContain('href="#main"');
    expect(html).toMatch(/<main[^>]*id="main"/);
    expect(html).toContain('<header');
    expect(html).toContain('<footer');
  });

  it('does not reuse the main site frame or its script', async () => {
    const html = await render();
    expect(html).not.toContain('data-pointer-field');
    expect(html).not.toMatch(/<script(?![^>]*application\/ld\+json)/);
  });

  it('serialises the Service JSON-LD', async () => {
    expect(await render()).toContain('"@type":"Service"');
  });

  it('links the privacy policy on the main domain and shows no fake legal links', async () => {
    const html = await render();
    expect(html).toContain('https://nandomoreira.dev/privacidade');
    expect(html).not.toContain('Termos de Serviço');
  });

  it('offers a share card', async () => {
    expect(await render()).toContain('property="og:image" content="https://nandomoreira.dev/og/servicos/site-institucional.png"');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/layout.test.ts`. Esperado: FAIL, módulos inexistentes.

**Passo 3: implementação.**

`src/lib/sales/service-ld.ts`:

```ts
interface Input {
  name: string;
  description: string;
  url: string;
}

/** schema.org Service for a sales page; serialised by serialiseJsonLd, never by hand. */
export const serviceLd = ({ name, description, url }: Input) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  description,
  url,
  serviceType: name,
  areaServed: { '@type': 'Country', name: 'Brasil' },
  provider: { '@type': 'Person', name: 'Fernando Moreira', url: 'https://nandomoreira.dev' },
});
```

`src/layouts/SalesLayout.astro`:

```astro
---
import { serialiseJsonLd } from '../lib/aeo/json-ld';
import { absoluteUrl } from '../lib/aeo/urls';
import { ogImagePath } from '../lib/og/pages';
import { metaDescription } from '../lib/seo/meta';
import { salesPath, salesUrl } from '../lib/sales/host';
import { serviceLd } from '../lib/sales/service-ld';
import { contactGoPath } from '../lib/analytics/outbound';
import serifHeadingFont from '../assets/fonts/newsreader-latin-variable.woff2?url';
import sansBodyFont from '../assets/fonts/inter-latin-variable.woff2?url';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  /** Detail page slug; absent on the landing. */
  slug?: string;
  /** Service name for the JSON-LD; defaults to the page title. */
  serviceName?: string;
}

const { title, description, slug, serviceName } = Astro.props;
const canonical = salesUrl(slug);
// The share cards live on the main host under the internal path.
const ogImage = absoluteUrl(new URL('https://nandomoreira.dev'), ogImagePath(salesPath(slug, false)));
const jsonLd = serialiseJsonLd(serviceLd({ name: serviceName ?? title, description, url: canonical }));
const home = salesPath();
const year = new Date().getUTCFullYear();

const NAV = [
  { href: `${home}#servicos`, label: 'Serviços' },
  { href: `${home}#como-trabalho`, label: 'Como trabalho' },
  { href: `${home}#projetos`, label: 'Projetos' },
  { href: `${home}#duvidas`, label: 'Dúvidas' },
];
const link =
  'inline-flex min-h-11 items-center text-small text-muted-foreground transition-[color] duration-(--duration-fast) ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
---

<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>{title}</title>
    <meta name="description" content={metaDescription(description)} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImage} />
    <script type="application/ld+json" is:inline set:html={jsonLd} />
    <link rel="preload" href={serifHeadingFont} as="font" type="font/woff2" crossorigin />
    <link rel="preload" href={sansBodyFont} as="font" type="font/woff2" crossorigin />
  </head>
  <body class="bg-background text-foreground">
    <a
      href="#main"
      class="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-md focus-visible:left-md focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-md focus-visible:py-sm focus-visible:text-primary-foreground"
    >
      Pular para o conteúdo
    </a>

    <header class="border-b border-border">
      <div class="mx-auto flex w-full max-w-page items-center justify-between gap-md px-lg py-md">
        <a href={home} class="inline-flex min-h-11 items-center gap-xs font-mono text-body font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <span class="size-2 rounded-full bg-primary" aria-hidden="true"></span>
          nandomoreira.dev
        </a>
        <nav aria-label="Seções" class="hidden md:block">
          <ul class="flex items-center gap-lg">
            {NAV.map((item) => <li><a href={item.href} class={link}>{item.label}</a></li>)}
          </ul>
        </nav>
        <a
          href="#contato"
          class="inline-flex min-h-11 items-center rounded-md bg-primary px-md text-small font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Conversar
        </a>
      </div>
    </header>

    <main id="main" tabindex="-1" class="focus:outline-none">
      <slot />
    </main>

    <footer class="border-t border-border">
      <div class="mx-auto flex w-full max-w-page flex-col gap-md px-lg py-xl md:flex-row md:items-center md:justify-between">
        <p class="text-small text-muted-foreground">
          <span class="font-mono font-semibold text-foreground">nandomoreira.dev</span>
          · © {year} Fernando Moreira, desenvolvedor de software em São Paulo.
        </p>
        <ul class="flex flex-wrap gap-md">
          <li><a class={link} href="https://nandomoreira.dev">Site pessoal</a></li>
          <li><a class={link} href={contactGoPath('whatsapp')}>WhatsApp</a></li>
          <li><a class={link} href={contactGoPath('linkedin')}>LinkedIn</a></li>
          <li><a class={link} href="https://nandomoreira.dev/privacidade">Privacidade</a></li>
        </ul>
      </div>
    </footer>
  </body>
</html>
```

O `Conversar` do cabeçalho usa `bg-primary` de propósito: é a moldura da landing, fora de `src/components/home`, e o portão do CTA único vale só para a home.

**Passo 4:** `npx vitest run tests/sales/ tests/design-system/` e `npm run check`. Esperado: PASS (o portão de literais não acha hex nem `[...]`).

**Passo 5:** `/git commit`.

---

### Tarefa 16: hero, situações e serviços

**Requisito:** REQ-008, REQ-009, REQ-010, REQ-011
**Depende de:** tarefas 6 e 14
**Arquivos:**
- Criar: `src/components/sales/SectionIntro.astro`, `src/components/sales/HeroArt.astro`, `src/components/sales/SalesHero.astro`, `src/components/sales/SituationGrid.astro`, `src/components/sales/ServiceBlocks.astro`
- Teste: `tests/sales/sections-top.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesHero from '../../src/components/sales/SalesHero.astro';
import ServiceBlocks from '../../src/components/sales/ServiceBlocks.astro';
import SituationGrid from '../../src/components/sales/SituationGrid.astro';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

const html = async (component: Parameters<AstroContainer['renderToString']>[0]) =>
  (await AstroContainer.create()).renderToString(component);

describe('SalesHero', () => {
  it('has the page h1 and the two calls', async () => {
    const out = await html(SalesHero);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('href="#contato"');
    expect(out).toContain('href="#como-trabalho"');
  });

  it('draws the browser windows without a single invented figure', async () => {
    expect(inventedNumbersIn(visibleText(await html(SalesHero)))).toEqual([]);
  });

  it('hides the decorative art from screen readers', async () => {
    expect(await html(SalesHero)).toMatch(/data-hero-art[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-hero-art/);
  });
});

describe('SituationGrid', () => {
  it('links each situation to the service anchor on the page', async () => {
    const out = await html(SituationGrid);
    expect(out.match(/href="#servico-/g)).toHaveLength(6);
    expect(out).toContain('href="#servico-loja-virtual"');
  });
});

describe('ServiceBlocks', () => {
  it('renders six anchored services', async () => {
    const out = await html(ServiceBlocks);
    expect(out.match(/id="servico-/g)).toHaveLength(6);
    expect(out).toContain('id="servicos"');
  });

  it('links "Entender em detalhes" only where a detail page exists', async () => {
    const out = await html(ServiceBlocks);
    expect(out.match(/Entender em detalhes/g)).toHaveLength(1);
    expect(out).toContain('href="/servicos/site-institucional"');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/sections-top.test.ts`. Esperado: FAIL, componentes inexistentes.

**Passo 3: implementação.**

`src/components/sales/SectionIntro.astro`:

```astro
---
interface Props {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  centered?: boolean;
}

const { id, eyebrow, title, lead, centered = false } = Astro.props;
---

<div class:list={['flex flex-col gap-sm', centered && 'items-center text-center']}>
  <p class="font-mono text-micro uppercase tracking-eyebrow text-primary">{eyebrow}</p>
  <h2 id={id} class="max-w-2xl font-serif text-h1 font-normal text-foreground">{title}</h2>
  {lead && <p class="max-w-2xl text-body text-muted-foreground">{lead}</p>}
</div>
```

`src/components/sales/HeroArt.astro`:

```astro
---
/** Decorative: three stacked browser windows (site, store, panel), no figures, no client names. */
const bar = 'flex items-center gap-xs border-b border-border px-md py-sm';
const dot = 'size-2 rounded-full bg-border-strong';
---

<div data-hero-art aria-hidden="true" class="relative hidden rounded-lg border border-border bg-surface p-lg lg:block">
  <div class="rounded-md border border-border bg-surface-elevated">
    <div class={bar}><span class={dot}></span><span class={dot}></span><span class={dot}></span></div>
    <div class="flex flex-col gap-sm p-md">
      <span class="h-2 w-1/3 rounded-sm bg-primary"></span>
      <span class="h-2 w-3/4 rounded-sm bg-border-strong"></span>
      <span class="h-2 w-2/3 rounded-sm bg-border"></span>
    </div>
  </div>
  <div class="relative z-10 -mt-md ml-xl rounded-md border border-border-strong bg-surface-elevated">
    <div class={bar}><span class="font-mono text-micro text-muted-foreground">loja / vitrine</span></div>
    <div class="grid grid-cols-3 gap-sm p-md">
      <span class="aspect-square rounded-sm bg-border"></span>
      <span class="aspect-square rounded-sm bg-border"></span>
      <span class="aspect-square rounded-sm bg-border"></span>
    </div>
  </div>
  <div class="-mt-sm rounded-md border border-primary bg-surface-elevated p-md">
    <p class="font-mono text-micro text-muted-foreground">painel</p>
    <div class="mt-sm flex items-end gap-sm">
      <span class="h-4 flex-1 rounded-sm bg-border"></span>
      <span class="h-6 flex-1 rounded-sm bg-border"></span>
      <span class="h-8 flex-1 rounded-sm bg-primary"></span>
      <span class="h-5 flex-1 rounded-sm bg-border"></span>
    </div>
  </div>
</div>
```

`src/components/sales/SalesHero.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { SALES_COPY } from '../../lib/sales/copy';
import HeroArt from './HeroArt.astro';

const { hero } = SALES_COPY;
---

<section aria-labelledby="hero-title" class="mx-auto grid w-full max-w-page gap-xl px-lg py-2xl lg:grid-cols-2 lg:items-center lg:py-3xl">
  <div class="flex flex-col gap-lg">
    <p class="inline-flex w-fit items-center gap-xs rounded-full border border-border-strong px-md py-xs font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">
      <span class="size-2 rounded-full bg-success" aria-hidden="true"></span>{hero.eyebrow}
    </p>
    <h1 id="hero-title" class="font-serif text-display font-normal text-foreground">{hero.title}</h1>
    <p class="text-lead text-muted-foreground">{hero.lead}</p>
    <div class="flex flex-wrap gap-md">
      <a href="#contato" class="inline-flex min-h-11 items-center rounded-md bg-primary px-lg text-body font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{hero.primary}</a>
      <a href="#como-trabalho" class="inline-flex min-h-11 items-center gap-xs rounded-md border border-border-strong px-lg text-body text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {hero.secondary}<Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
      </a>
    </div>
    <ul class="flex flex-wrap gap-x-lg gap-y-sm border-t border-border pt-md">
      {hero.proofs.map((proof) => (
        <li class="inline-flex items-center gap-xs font-mono text-micro text-muted-foreground">
          <Icon name="lucide:check" class="size-3 text-primary" aria-hidden="true" />{proof}
        </li>
      ))}
    </ul>
  </div>
  <HeroArt />
</section>
```

`src/components/sales/SituationGrid.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { SALES_SERVICES, serviceAnchor } from '../../lib/sales/catalog';
import { SALES_COPY } from '../../lib/sales/copy';
import SectionIntro from './SectionIntro.astro';

const { situationsHeader, situations } = SALES_COPY;
const titleOf = (slug: string) => SALES_SERVICES.find((service) => service.slug === slug)?.title ?? slug;
---

<section aria-labelledby="situacao-title" class="border-t border-border">
  <div class="mx-auto flex w-full max-w-page flex-col gap-xl px-lg py-2xl lg:py-3xl">
    <SectionIntro id="situacao-title" {...situationsHeader} />
    <ul class="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
      {situations.map((situation, index) => (
        <li>
          <a
            href={`#${serviceAnchor(situation.service)}`}
            class="flex h-full flex-col gap-md rounded-md border border-border bg-surface p-lg transition-[border-color] duration-(--duration-fast) ease-out hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span class="font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">{String(index + 1).padStart(2, '0')} / {situation.label}</span>
            <span class="text-h3 text-foreground">“{situation.quote}”</span>
            <span class="mt-auto inline-flex items-center justify-between border-t border-border pt-sm font-mono text-small text-primary">
              {titleOf(situation.service)}<Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  </div>
</section>
```

`src/components/sales/ServiceBlocks.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { SALES_SERVICES, serviceAnchor } from '../../lib/sales/catalog';
import { SALES_COPY } from '../../lib/sales/copy';
import { salesPath } from '../../lib/sales/host';
import SectionIntro from './SectionIntro.astro';
---

<section id="servicos" aria-labelledby="servicos-title" class="border-t border-border">
  <div class="mx-auto flex w-full max-w-page flex-col gap-xl px-lg py-2xl lg:py-3xl">
    <SectionIntro id="servicos-title" {...SALES_COPY.servicesHeader} />
    <ul class="grid gap-md md:grid-cols-2 lg:grid-cols-3">
      {SALES_SERVICES.map((service, index) => (
        <li id={serviceAnchor(service.slug)} class="flex scroll-mt-xl flex-col gap-md rounded-md border border-border bg-surface p-lg">
          <div class="flex items-center justify-between">
            <span class="font-mono text-micro uppercase tracking-eyebrow text-primary">Serviço {String(index + 1).padStart(2, '0')}</span>
            <Icon name={service.icon} class="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 class="text-h3 font-semibold text-foreground">{service.title}</h3>
          <p class="text-small text-muted-foreground">{service.summary}</p>
          <div class="rounded-sm bg-surface-elevated p-md">
            <p class="font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">Para quem é</p>
            <p class="mt-xs text-small text-foreground">{service.audience}</p>
          </div>
          <p class="font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">O que você recebe</p>
          <ul class="flex flex-col gap-xs">
            {service.receives.map((item) => (
              <li class="flex items-start gap-xs text-small text-foreground">
                <Icon name="lucide:check" class="mt-xs size-4 shrink-0 text-primary" aria-hidden="true" />{item}
              </li>
            ))}
          </ul>
          {service.detail && (
            <a href={salesPath(service.slug)} class="mt-auto inline-flex min-h-11 items-center justify-between border-t border-border pt-sm text-small text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Entender em detalhes<Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
            </a>
          )}
        </li>
      ))}
    </ul>
  </div>
</section>
```

Se `scroll-mt-xl` não existir no tema, use `scroll-mt-2xl` ou outro token de espaçamento existente; nunca um valor entre colchetes.

**Passo 4:** `npx vitest run tests/sales/ tests/design-system/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 17: etapas e ferramentas

**Requisito:** REQ-012, REQ-013
**Depende de:** tarefa 14
**Arquivos:**
- Criar: `src/components/sales/StepsTimeline.astro`, `src/components/sales/ToolsGrid.astro`
- Teste: `tests/sales/sections-middle.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import StepsTimeline from '../../src/components/sales/StepsTimeline.astro';
import ToolsGrid from '../../src/components/sales/ToolsGrid.astro';

const render = async (component: Parameters<AstroContainer['renderToString']>[0], props = {}) =>
  (await AstroContainer.create()).renderToString(component, { props });

describe('StepsTimeline', () => {
  it('lists the seven steps in an ordered list', async () => {
    const html = await render(StepsTimeline);
    expect(html).toContain('<ol');
    expect(html.match(/<li/g)).toHaveLength(7);
    expect(html).toContain('id="como-trabalho"');
  });

  it('labels the approval steps in text, not only by colour', async () => {
    const html = await render(StepsTimeline);
    expect(html).toContain('Você aprova antes');
    expect(html).toContain('Sem surpresas');
  });

  it('has a compact variant without "o que você faz" for the detail page', async () => {
    const html = await render(StepsTimeline, { variant: 'compact' });
    expect(html.match(/<li/g)).toHaveLength(7);
    expect(html).not.toContain('O que você faz');
  });
});

describe('ToolsGrid', () => {
  it('shows each tool with its shop analogy', async () => {
    const html = await render(ToolsGrid);
    expect(html).toContain('O porteiro');
    expect(html).toContain('Cloud Functions');
    expect(html.match(/<li/g)).toHaveLength(7);
  });
});
```

**Passo 2:** `npx vitest run tests/sales/sections-middle.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`src/components/sales/StepsTimeline.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { SALES_COPY } from '../../lib/sales/copy';
import SectionIntro from './SectionIntro.astro';

interface Props {
  variant?: 'full' | 'compact';
}

const { variant = 'full' } = Astro.props;
const { steps, stepsHeader, stepsNote } = SALES_COPY;
const number = (index: number) => String(index + 1).padStart(2, '0');
---

<section id={variant === 'full' ? 'como-trabalho' : undefined} aria-labelledby={`etapas-${variant}`} class="scroll-mt-2xl border-t border-border">
  <div class="mx-auto flex w-full max-w-page flex-col gap-xl px-lg py-2xl lg:py-3xl">
    {variant === 'full' ? (
      <SectionIntro id={`etapas-${variant}`} {...stepsHeader} centered />
    ) : (
      <SectionIntro id={`etapas-${variant}`} eyebrow="Metodologia transparente" title="Como vamos fazer, em 7 etapas" />
    )}
    {variant === 'full' ? (
      <ol class="mx-auto flex w-full max-w-3xl flex-col gap-md">
        {steps.map((step, index) => (
          <li class:list={['flex gap-md rounded-md border bg-surface p-lg', step.highlight ? 'border-primary' : 'border-border']}>
            <span class="font-mono text-h3 text-primary">{number(index)}</span>
            <div class="flex flex-col gap-sm">
              <h3 class="flex flex-wrap items-center gap-sm text-h3 font-semibold text-foreground">
                {step.title}
                {step.highlight && <span class="rounded-sm bg-primary px-sm font-mono text-micro text-primary-foreground">{step.highlight}</span>}
              </h3>
              <p class="text-small text-muted-foreground">{step.text}</p>
              <p class="w-fit rounded-sm bg-surface-elevated px-sm py-xs text-small text-foreground">
                <span class="font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">O que você faz: </span>{step.youDo}
              </p>
            </div>
          </li>
        ))}
      </ol>
    ) : (
      <ol class="grid gap-sm sm:grid-cols-2 lg:grid-cols-7">
        {steps.map((step, index) => (
          <li class:list={['flex flex-col gap-xs rounded-md border bg-surface p-md', step.highlight ? 'border-primary' : 'border-border']}>
            <span class="font-mono text-small text-primary">{number(index)}</span>
            <h3 class="text-body font-semibold text-foreground">{step.title}</h3>
            {step.highlight && <span class="font-mono text-micro text-primary">{step.highlight}</span>}
          </li>
        ))}
      </ol>
    )}
    <p class="mx-auto flex w-full max-w-3xl items-center gap-sm rounded-md border border-border-strong bg-surface px-md py-sm text-small text-muted-foreground">
      <Icon name="lucide:shield-check" class="size-4 shrink-0 text-primary" aria-hidden="true" />{stepsNote}
    </p>
  </div>
</section>
```

`src/components/sales/ToolsGrid.astro`:

```astro
---
import { SALES_COPY } from '../../lib/sales/copy';
import SectionIntro from './SectionIntro.astro';

const { tools, toolsHeader, toolsNote } = SALES_COPY;
---

<section aria-labelledby="ferramentas-title" class="border-t border-border">
  <div class="mx-auto flex w-full max-w-page flex-col gap-xl px-lg py-2xl lg:py-3xl">
    <SectionIntro id="ferramentas-title" {...toolsHeader} />
    <ul class="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <li class="flex flex-col gap-sm rounded-md border border-border bg-surface p-lg">
          <p class="font-mono text-micro uppercase tracking-eyebrow text-primary">Analogia: “{tool.analogy}”</p>
          <h3 class="text-h3 font-semibold text-foreground">{tool.name}</h3>
          <p class="text-small text-muted-foreground">{tool.text}</p>
        </li>
      ))}
    </ul>
    <p class="rounded-md border border-border-strong bg-surface px-md py-sm text-center font-mono text-small text-muted-foreground">{toolsNote}</p>
  </div>
</section>
```

**Passo 4:** `npx vitest run tests/sales/ tests/design-system/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 18: projetos reais e sobre

**Requisito:** REQ-014, REQ-015
**Depende de:** tarefas 13 e 14
**Arquivos:**
- Criar: `src/lib/sales/projects.ts`, `src/components/sales/ProjectShowcase.astro`, `src/components/sales/AboutCard.astro`
- Teste: `tests/sales/sections-proof.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AboutCard from '../../src/components/sales/AboutCard.astro';
import ProjectShowcase from '../../src/components/sales/ProjectShowcase.astro';
import { salesProjects } from '../../src/lib/sales/projects';

const render = async (component: Parameters<AstroContainer['renderToString']>[0]) =>
  (await AstroContainer.create()).renderToString(component);

describe('salesProjects', () => {
  it('joins the copy to the collection: name, domain and /go link', async () => {
    const projects = await salesProjects();
    expect(projects.map((project) => project.slug)).toEqual(['encantos-brincantes', 'portfoliosnap', 'bragstack', 'mousai']);
    expect(projects.find((project) => project.slug === 'mousai')).toMatchObject({
      title: 'Mousai',
      domain: 'mousai.gallery',
      href: '/go/portfolio/mousai/live',
      image: '/servicos/projetos/mousai.webp',
    });
  });
});

describe('ProjectShowcase', () => {
  it('shows four projects with real screenshots and alt text', async () => {
    const html = await render(ProjectShowcase);
    expect(html).toContain('id="projetos"');
    expect(html.match(/<img/g)).toHaveLength(4);
    expect(html).not.toMatch(/<img(?![^>]*alt="[^"]+")/);
  });
});

describe('AboutCard', () => {
  it('uses the real photo and the approved facts', async () => {
    const html = await render(AboutCard);
    expect(html).toContain('src="/servicos/fernando.webp"');
    expect(html).toContain('Itaú Unibanco');
    expect(html).toContain('Desenvolvedor de software sênior');
  });
});
```

Antes de rodar, confira em `src/lib/catalog/groups.ts` qual coleção (`portfolio` ou `lab`) cada um dos 4 projetos recebe pelo `block`, e ajuste o `href` esperado do Mousai se for `lab`.

**Passo 2:** `npx vitest run tests/sales/sections-proof.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`src/lib/sales/projects.ts`:

```ts
import { caseGoPath } from '../analytics/outbound';
import { collectionOfBlock } from '../catalog/groups';
import { getAllProjects } from '../content';
import { SALES_COPY } from './copy';

export interface SalesProject {
  slug: string;
  title: string;
  kind: string;
  text: string;
  alt: string;
  domain: string;
  href: string;
  image: string;
}

/**
 * Name and live URL come from the collection (single source); the plain-words
 * line comes from the sales copy, because the case summaries speak to engineers.
 * A project missing from the collection or without a live URL fails the build.
 */
export const salesProjects = async (): Promise<SalesProject[]> => {
  const projects = await getAllProjects();

  return SALES_COPY.projects.map((entry) => {
    const project = projects.find((candidate) => candidate.slug === entry.slug);
    if (!project?.liveUrl) throw new Error(`Sales project ${entry.slug} needs a live URL in the collection.`);

    return {
      ...entry,
      title: project.title,
      domain: new URL(project.liveUrl).hostname.replace(/^www\./, ''),
      href: caseGoPath(collectionOfBlock(project.block), project.slug, 'live'),
      image: `/servicos/projetos/${project.slug}.webp`,
    };
  });
};
```

`src/components/sales/ProjectShowcase.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { SALES_COPY } from '../../lib/sales/copy';
import { salesProjects } from '../../lib/sales/projects';
import SectionIntro from './SectionIntro.astro';

const projects = await salesProjects();
---

<section id="projetos" aria-labelledby="projetos-title" class="scroll-mt-2xl border-t border-border">
  <div class="mx-auto flex w-full max-w-page flex-col gap-xl px-lg py-2xl lg:py-3xl">
    <SectionIntro id="projetos-title" {...SALES_COPY.projectsHeader} />
    <ul class="grid gap-md md:grid-cols-2">
      {projects.map((project) => (
        <li class="flex flex-col gap-md rounded-md border border-border bg-surface p-lg">
          <div class="flex items-center justify-between gap-sm font-mono text-micro uppercase tracking-eyebrow">
            <span class="text-primary">{project.kind}</span>
            <span class="text-muted-foreground normal-case">{project.domain}</span>
          </div>
          <h3 class="text-h3 font-semibold text-foreground">{project.title}</h3>
          <p class="text-small text-muted-foreground">{project.text}</p>
          <img src={project.image} alt={project.alt} width="1200" height="750" loading="lazy" decoding="async" class="aspect-video w-full rounded-sm border border-border object-cover object-top" />
          <a href={project.href} target="_blank" rel="noopener" class="ml-auto inline-flex min-h-11 items-center gap-xs text-small text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Visitar {project.title}<Icon name="lucide:external-link" class="size-4" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  </div>
</section>
```

`src/components/sales/AboutCard.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { SALES_COPY } from '../../lib/sales/copy';

const { about } = SALES_COPY;
const ICONS = ['lucide:badge-check', 'lucide:messages-square', 'lucide:life-buoy'];
---

<section aria-labelledby="sobre-title" class="border-t border-border">
  <div class="mx-auto w-full max-w-3xl px-lg py-2xl lg:py-3xl">
    <div class="flex flex-col gap-lg rounded-lg border border-border bg-surface p-lg sm:flex-row">
      <img src="/servicos/fernando.webp" alt={about.photoAlt} width="160" height="160" loading="lazy" class="size-32 shrink-0 rounded-md border border-primary object-cover" />
      <div class="flex flex-col gap-md">
        <p class="font-mono text-micro uppercase tracking-eyebrow text-primary">Quem vai construir</p>
        <h2 id="sobre-title" class="font-serif text-h1 font-normal text-foreground">{about.name}</h2>
        <p class="text-small text-muted-foreground">{about.role}</p>
        <ul class="flex flex-col gap-sm">
          {about.points.map((point, index) => (
            <li class="flex items-start gap-sm text-small text-muted-foreground">
              <Icon name={ICONS[index]!} class="mt-xs size-4 shrink-0 text-primary" aria-hidden="true" />
              <span><strong class="font-semibold text-foreground">{point.title}</strong> {point.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</section>
```

**Passo 4:** `npx vitest run tests/sales/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 19: dúvidas, formulário e WhatsApp

**Requisito:** REQ-016, REQ-021, REQ-024, REQ-025
**Depende de:** tarefas 3, 7 e 14
**Arquivos:**
- Criar: `src/components/sales/FaqList.astro`, `src/components/sales/SalesContact.astro`
- Teste: `tests/sales/contact-section.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails, security-reviewer

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FaqList from '../../src/components/sales/FaqList.astro';
import SalesContact from '../../src/components/sales/SalesContact.astro';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import { SALES_COPY } from '../../src/lib/sales/copy';

const render = async (component: Parameters<AstroContainer['renderToString']>[0], props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(component, { props });

describe('FaqList', () => {
  it('uses native details/summary for every question', async () => {
    const html = await render(FaqList, { items: SALES_COPY.faq, id: 'duvidas' });
    expect(html.match(/<details/g)).toHaveLength(6);
    expect(html.match(/<summary/g)).toHaveLength(6);
  });
});

describe('SalesContact', () => {
  const props = { origin: 'landing', outcome: null, preselect: undefined };

  it('posts to /api/hire with its origin in the query', async () => {
    expect(await render(SalesContact, props)).toContain('action="/api/hire?origem=landing"');
  });

  it('asks for name, a text contact, the service and an optional message', async () => {
    const html = await render(SalesContact, props);
    expect(html).toMatch(/<input[^>]*name="nome"[^>]*required/);
    expect(html).toMatch(/<input[^>]*name="contato"[^>]*type="text"|<input[^>]*type="text"[^>]*name="contato"/);
    expect(html).toContain('name="servico"');
    expect(html).not.toMatch(/<textarea[^>]*required/);
    expect(html).toContain(`name="${FORM_HONEYPOT}"`);
  });

  it('labels every control', async () => {
    const html = await render(SalesContact, props);
    const ids = [...html.matchAll(/<(?:input|textarea|select)[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
    for (const id of ids) expect(html, id).toMatch(new RegExp(`<label[^>]*for="${id}"`));
  });

  it('preselects the service of a detail page', async () => {
    expect(await render(SalesContact, { ...props, preselect: 'website' })).toMatch(/<option[^>]*value="website"[^>]*selected/);
  });

  it('shows the outcome in a live region and replaces the form on success', async () => {
    const html = await render(SalesContact, { ...props, outcome: 'ok' });
    expect(html).toMatch(/role="status"/);
    expect(html).not.toContain('<form');
  });

  it('keeps the form and alerts on failure', async () => {
    const html = await render(SalesContact, { ...props, outcome: 'invalido' });
    expect(html).toMatch(/role="alert"/);
    expect(html).toContain('<form');
  });

  it('offers WhatsApp through /go', async () => {
    expect(await render(SalesContact, props)).toContain('href="/go/contato/whatsapp"');
  });

  it('promises no reply time', async () => {
    expect(await render(SalesContact, props)).not.toMatch(/horas úteis/);
  });
});
```

**Passo 2:** `npx vitest run tests/sales/contact-section.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`src/components/sales/FaqList.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import SectionIntro from './SectionIntro.astro';

interface Props {
  id: string;
  items: ReadonlyArray<{ question: string; answer: string }>;
  eyebrow?: string;
  title?: string;
  lead?: string;
}

const { id, items, eyebrow = 'Respostas sem rodeios', title = 'Dúvidas frequentes', lead } = Astro.props;
---

<section id={id} aria-labelledby={`${id}-title`} class="scroll-mt-2xl border-t border-border">
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-xl px-lg py-2xl lg:py-3xl">
    <SectionIntro id={`${id}-title`} eyebrow={eyebrow} title={title} lead={lead} centered />
    <div class="flex flex-col gap-sm">
      {items.map((item) => (
        <details class="group rounded-md border border-border-strong bg-surface">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-md px-lg py-md text-body text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {item.question}
            <Icon name="lucide:chevron-down" class="size-4 shrink-0 text-primary transition-transform duration-(--duration-fast) group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p class="px-lg pb-md text-small text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  </div>
</section>
```

`src/components/sales/SalesContact.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import { contactGoPath } from '../../lib/analytics/outbound';
import { FORM_HONEYPOT } from '../../lib/hire/form';
import { SALES_COPY } from '../../lib/sales/copy';
import { salesOutcomeMessage } from '../../lib/sales/outcome';
import { SERVICE_OPTIONS, type Service } from '../../lib/sales/service-labels';

interface Props {
  /** `landing` or a detail slug; goes in the action so the handler can send the visitor back. */
  origin: string;
  /** The `envio` query value, if any. */
  outcome: string | null;
  preselect?: Service;
  title?: string;
}

const { origin, outcome, preselect, title = SALES_COPY.contact.title } = Astro.props;
const { contact } = SALES_COPY;
const message = salesOutcomeMessage(outcome);
const sent = message?.role === 'status';
const field =
  'min-h-11 w-full rounded-md border border-border-strong bg-background px-md py-sm text-body text-foreground placeholder:text-muted-foreground hover:border-primary focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const label = 'mb-xs block font-mono text-small text-muted-foreground';
---

<section id="contato" aria-labelledby="contato-title" class="scroll-mt-2xl border-t border-border">
  <div class="mx-auto grid w-full max-w-page gap-xl px-lg py-2xl lg:grid-cols-2 lg:py-3xl">
    <div class="flex flex-col gap-md">
      <p class="font-mono text-micro uppercase tracking-eyebrow text-primary">{contact.eyebrow}</p>
      <h2 id="contato-title" class="font-serif text-h1 font-normal text-foreground">{title}</h2>
      <p class="text-body text-muted-foreground">{contact.lead}</p>
      <p class="inline-flex items-center gap-xs font-mono text-small text-muted-foreground">
        <Icon name="lucide:user-round-check" class="size-4 text-primary" aria-hidden="true" />{contact.note}
      </p>
      <a href={contactGoPath('whatsapp')} target="_blank" rel="noopener" class="inline-flex min-h-11 w-fit items-center gap-sm rounded-md border border-border-strong px-lg text-body text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <Icon name="simple-icons:whatsapp" class="size-4" aria-hidden="true" />{contact.whatsapp}
      </a>
    </div>

    <div id="envio" class="rounded-lg border border-border bg-surface p-lg">
      {message && (
        <p role={message.role} class:list={['mb-md rounded-md border px-md py-sm text-small', sent ? 'border-success text-foreground' : 'border-destructive text-foreground']}>
          {message.text}
        </p>
      )}
      {!sent && (
        <form action={`/api/hire?origem=${origin}`} method="post" class="flex flex-col gap-md">
          <div>
            <label for="vendas-nome" class={label}>Seu nome</label>
            <input id="vendas-nome" name="nome" type="text" autocomplete="name" maxlength="200" required class={field} placeholder="Como posso te chamar?" />
          </div>
          <div>
            <label for="vendas-contato" class={label}>E-mail ou WhatsApp</label>
            <input id="vendas-contato" name="contato" type="text" inputmode="email" autocomplete="email" maxlength="320" required class={field} placeholder="Por onde prefere conversar?" />
          </div>
          <div>
            <label for="vendas-servico" class={label}>O que você precisa?</label>
            <select id="vendas-servico" name="servico" class={field}>
              {SERVICE_OPTIONS.map((option) => (
                <option value={option.value} selected={option.value === (preselect ?? 'undecided')}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label for="vendas-mensagem" class={label}>Conte um pouco sobre o seu projeto (opcional)</label>
            <textarea id="vendas-mensagem" name="mensagem" rows="4" maxlength="8000" class={field} placeholder="Qual é o seu negócio e o que você quer agora?"></textarea>
          </div>
          {/* Honeypot: hidden from people and assistive tech, see src/lib/hire/form.ts. */}
          <div class="sr-only" aria-hidden="true">
            <label for="vendas-hp">Não preencha</label>
            <input id="vendas-hp" name={FORM_HONEYPOT} type="text" tabindex="-1" autocomplete="off" />
          </div>
          <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-xs rounded-md bg-primary px-lg text-body font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {contact.submit}<Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  </div>
</section>
```

Confira em `src/pages/contato.astro` como o honeypot é escondido hoje e copie exatamente o mesmo markup, se for diferente do acima.

**Passo 4:** `npx vitest run tests/sales/ tests/design-system/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 20: página `/servicos`

**Requisito:** REQ-001, REQ-008, REQ-016, REQ-030, REQ-032
**Depende de:** tarefas 15 a 19
**Arquivos:**
- Criar: `src/pages/servicos/index.astro`
- Teste: `tests/sales/landing-page.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Landing from '../../src/pages/servicos/index.astro';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

const render = async (query = '') =>
  (await AstroContainer.create()).renderToString(Landing, {
    request: new Request(`https://nandomoreira.dev/servicos${query}`),
  });

describe('/servicos', () => {
  it('renders the sections in the approved order', async () => {
    const html = await render();
    const order = ['hero-title', 'situacao-title', 'servicos-title', 'etapas-full', 'ferramentas-title', 'projetos-title', 'sobre-title', 'duvidas-title', 'contato-title'];
    const positions = order.map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('has exactly one h1', async () => {
    expect((await render()).match(/<h1/g)).toHaveLength(1);
  });

  it('shows no invented figure anywhere on the page', async () => {
    expect(inventedNumbersIn(visibleText(await render()))).toEqual([]);
  });

  it('reads the form outcome from the query', async () => {
    expect(await render('?envio=ok')).toMatch(/role="status"/);
  });

  it('posts the form as the landing', async () => {
    expect(await render()).toContain('action="/api/hire?origem=landing"');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/landing-page.test.ts`. Esperado: FAIL, página inexistente.

**Passo 3: implementação.** `src/pages/servicos/index.astro`:

```astro
---
import AboutCard from '../../components/sales/AboutCard.astro';
import FaqList from '../../components/sales/FaqList.astro';
import ProjectShowcase from '../../components/sales/ProjectShowcase.astro';
import SalesContact from '../../components/sales/SalesContact.astro';
import SalesHero from '../../components/sales/SalesHero.astro';
import ServiceBlocks from '../../components/sales/ServiceBlocks.astro';
import SituationGrid from '../../components/sales/SituationGrid.astro';
import StepsTimeline from '../../components/sales/StepsTimeline.astro';
import ToolsGrid from '../../components/sales/ToolsGrid.astro';
import SalesLayout from '../../layouts/SalesLayout.astro';
import { SALES_COPY } from '../../lib/sales/copy';

export const prerender = false;

const outcome = Astro.url.searchParams.get('envio');
---

<SalesLayout
  title="Sites, lojas e sistemas para o seu negócio | Fernando Moreira"
  description="Site institucional, landing page, blog, loja virtual, produto web e automação com IA, explicados sem jargão. Do primeiro papo até estar no ar."
  serviceName="Desenvolvimento de sites e produtos web"
>
  <SalesHero />
  <SituationGrid />
  <ServiceBlocks />
  <StepsTimeline />
  <ToolsGrid />
  <ProjectShowcase />
  <AboutCard />
  <FaqList id="duvidas" items={SALES_COPY.faq} {...SALES_COPY.faqHeader} />
  <SalesContact origin="landing" outcome={outcome} />
</SalesLayout>
```

**Passo 4:** `npx vitest run tests/sales/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 21: página `/servicos/[slug]` (Site institucional)

**Requisito:** REQ-002, REQ-017, REQ-018, REQ-019, REQ-020
**Depende de:** tarefas 6, 15, 17 e 19
**Arquivos:**
- Criar: `src/components/sales/ServiceDetail.astro`, `src/components/sales/ServiceComparison.astro`, `src/pages/servicos/[slug].astro`
- Teste: `tests/sales/detail-page.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design, nextjs-fsd-conventions)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Detail from '../../src/pages/servicos/[slug].astro';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

const render = async (slug: string) => {
  const container = await AstroContainer.create();
  return container.renderToResponse(Detail, {
    params: { slug },
    request: new Request(`https://nandomoreira.dev/servicos/${slug}`),
  });
};

describe('/servicos/site-institucional', () => {
  it('answers 200 with breadcrumb and one h1', async () => {
    const response = await render('site-institucional');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('aria-label="Trilha"');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('builds an accessible comparison table', async () => {
    const html = await (await render('site-institucional')).text();
    expect(html).toContain('<caption');
    expect(html.match(/scope="col"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html.match(/scope="row"/g)).toHaveLength(4);
  });

  it('lists the editing panel among the add-ons', async () => {
    expect(await (await render('site-institucional')).text()).toContain('Painel de edição');
  });

  it('shows none of the Stitch hosting figures', async () => {
    expect(inventedNumbersIn(visibleText(await (await render('site-institucional')).text()))).toEqual([]);
  });

  it('preselects its own service in the form and posts as itself', async () => {
    const html = await (await render('site-institucional')).text();
    expect(html).toContain('action="/api/hire?origem=site-institucional"');
    expect(html).toMatch(/<option[^>]*value="website"[^>]*selected/);
  });
});

describe('/servicos/<other>', () => {
  it.each(['loja-virtual', 'nada-aqui'])('answers 404 for %s', async (slug) => {
    expect((await render(slug)).status).toBe(404);
  });
});
```

**Passo 2:** `npx vitest run "tests/sales/detail-page.test.ts"`. Esperado: FAIL, página inexistente.

**Passo 3: implementação.**

`src/components/sales/ServiceDetail.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
import type { SalesService, ServiceDetail } from '../../lib/sales/catalog';
import { salesPath } from '../../lib/sales/host';
import SectionIntro from './SectionIntro.astro';

interface Props {
  service: SalesService & { detail: ServiceDetail };
}

const { service } = Astro.props;
const { detail } = service;
const wrap = 'mx-auto flex w-full max-w-page flex-col gap-xl px-lg py-2xl lg:py-3xl';
---

<section aria-labelledby="detalhe-title" class="mx-auto flex w-full max-w-page flex-col gap-lg px-lg py-2xl lg:py-3xl">
  <nav aria-label="Trilha" class="font-mono text-small text-muted-foreground">
    <a href={`${salesPath()}#servicos`} class="hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">Serviços</a>
    <span aria-hidden="true"> / </span><span aria-current="page" class="text-foreground">{service.title}</span>
  </nav>
  <h1 id="detalhe-title" class="max-w-3xl font-serif text-display font-normal text-foreground">{detail.hero.title}</h1>
  <p class="max-w-2xl text-lead text-muted-foreground">{detail.hero.lead}</p>
  <div class="flex flex-wrap gap-md">
    <a href="#contato" class="inline-flex min-h-11 items-center gap-xs rounded-md bg-primary px-lg text-body font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{detail.hero.cta}<Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" /></a>
    <a href="#incluso" class="inline-flex min-h-11 items-center rounded-md border border-border-strong px-lg text-body text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Ver o que está incluso</a>
  </div>
</section>

<section aria-labelledby="anatomia-title" class="border-t border-border">
  <div class={wrap}>
    <SectionIntro id="anatomia-title" eyebrow="Anatomia do projeto" title="O que é, na prática" lead="Um site institucional organiza a sua presença em quatro partes, cada uma com um trabalho a fazer pelo seu negócio." />
    <ol class="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
      {detail.anatomy.map((part, index) => (
        <li class="flex flex-col gap-sm rounded-md border border-border bg-surface p-lg">
          <span class="font-mono text-micro uppercase tracking-eyebrow text-primary">Parte {String(index + 1).padStart(2, '0')}</span>
          <h3 class="text-h3 font-semibold text-foreground">{part.title}</h3>
          <p class="text-small text-muted-foreground">{part.text}</p>
          <p class="mt-auto border-t border-border pt-sm font-mono text-micro text-muted-foreground">{part.note}</p>
        </li>
      ))}
    </ol>
  </div>
</section>

<section aria-labelledby="para-voce-title" class="border-t border-border">
  <div class={wrap}>
    <SectionIntro id="para-voce-title" eyebrow="Diagnóstico" title="É para você se..." />
    <ul class="grid gap-md md:grid-cols-2">
      {detail.fit.map((item) => (
        <li class="flex flex-col gap-xs rounded-md border border-border bg-surface p-lg">
          <h3 class="text-body font-semibold text-foreground">{item.title}</h3>
          <p class="text-small text-muted-foreground">{item.text}</p>
        </li>
      ))}
    </ul>
  </div>
</section>

<section id="incluso" aria-labelledby="incluso-title" class="scroll-mt-2xl border-t border-border">
  <div class={wrap}>
    <SectionIntro id="incluso-title" eyebrow="Escopo do serviço" title="O que está incluso" />
    <ul class="grid gap-md md:grid-cols-2">
      {detail.included.map((item) => (
        <li class="flex items-start gap-sm rounded-md border border-border bg-surface p-lg">
          <Icon name="lucide:circle-check" class="mt-xs size-4 shrink-0 text-primary" aria-hidden="true" />
          <div><h3 class="text-body font-semibold text-foreground">{item.title}</h3><p class="text-small text-muted-foreground">{item.text}</p></div>
        </li>
      ))}
    </ul>
  </div>
</section>

<section aria-labelledby="extras-title" class="border-t border-border">
  <div class={wrap}>
    <SectionIntro id="extras-title" eyebrow="Módulos extras" title="O que pode ser adicionado" lead="Opcionais combinados conforme o momento do seu negócio, sempre sob consulta." />
    <ul class="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
      {detail.addons.map((item) => (
        <li class="flex flex-col gap-xs rounded-md border border-border bg-surface p-lg">
          <h3 class="text-body font-semibold text-foreground">{item.title}</h3>
          <p class="text-small text-muted-foreground">{item.text}</p>
          <p class="mt-auto pt-sm font-mono text-micro text-muted-foreground">Sob consulta</p>
        </li>
      ))}
    </ul>
  </div>
</section>

<section aria-labelledby="por-baixo-title" class="border-t border-border">
  <div class={wrap}>
    <SectionIntro id="por-baixo-title" eyebrow="Infraestrutura descomplicada" title="Como funciona por baixo: sem sustos no fim do mês" />
    <div class="flex max-w-2xl flex-col gap-md">
      {detail.underTheHood.map((paragraph) => <p class="text-body text-muted-foreground">{paragraph}</p>)}
    </div>
  </div>
</section>
```

A tabela comparativa fica num componente à parte, porque a página encaixa as etapas compactas entre "Como funciona por baixo" e a comparação:

`src/components/sales/ServiceComparison.astro`:

```astro
---
import type { ServiceDetail } from '../../lib/sales/catalog';
import SectionIntro from './SectionIntro.astro';

interface Props {
  comparison: ServiceDetail['comparison'];
}

const { comparison } = Astro.props;
---

<section aria-labelledby="comparando-title" class="border-t border-border">
  <div class="mx-auto flex w-full max-w-page flex-col gap-xl px-lg py-2xl lg:py-3xl">
    <SectionIntro id="comparando-title" eyebrow="Orientação" title="Comparando: qual escolher?" />
    {/* Stacks into one block per criterion on phones, so the page never scrolls sideways (REQ-018). */}
    <table class="w-full text-left text-small">
      <caption class="sr-only">{comparison.caption}</caption>
      <thead class="hidden md:table-header-group">
        <tr>
          <th scope="col" class="p-md font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">Critério</th>
          {comparison.columns.map((column, index) => (
            <th scope="col" class:list={['p-md font-mono text-micro uppercase tracking-eyebrow', index === 0 ? 'text-primary' : 'text-muted-foreground']}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {comparison.rows.map((row) => (
          <tr class="grid border-t border-border md:table-row">
            <th scope="row" class="p-md font-mono text-micro uppercase tracking-eyebrow text-muted-foreground">{row.criterion}</th>
            {row.values.map((value, index) => (
              <td class:list={['p-md', index === 0 ? 'bg-surface-elevated text-foreground' : 'text-muted-foreground']}>
                <span class="mb-xs block font-mono text-micro uppercase text-muted-foreground md:hidden">{comparison.columns[index]}</span>{value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
```


`src/pages/servicos/[slug].astro`:

```astro
---
import FaqList from '../../components/sales/FaqList.astro';
import SalesContact from '../../components/sales/SalesContact.astro';
import ServiceComparison from '../../components/sales/ServiceComparison.astro';
import ServiceDetail from '../../components/sales/ServiceDetail.astro';
import StepsTimeline from '../../components/sales/StepsTimeline.astro';
import SalesLayout from '../../layouts/SalesLayout.astro';
import { detailFor } from '../../lib/sales/catalog';

export const prerender = false;

const service = detailFor(Astro.params.slug ?? '');
// Only services with a written detail page exist; the rest stay as landing anchors.
if (!service) return new Response(null, { status: 404 });

const outcome = Astro.url.searchParams.get('envio');
---

<SalesLayout
  title={`${service.title} | Fernando Moreira`}
  description={service.detail.hero.lead}
  slug={service.slug}
  serviceName={service.title}
>
  <ServiceDetail service={service} />
  <StepsTimeline variant="compact" />
  <ServiceComparison comparison={service.detail.comparison} />
  <FaqList id="duvidas" items={service.detail.faq} lead="Respostas práticas para as perguntas mais comuns de quem contrata pela primeira vez." />
  <SalesContact origin={service.slug} outcome={outcome} preselect={service.service} title={`Vamos tirar seu ${service.title.toLowerCase()} do papel?`} />
</SalesLayout>
```

Depois de verde, rode o build e confirme por HTTP que o 404 de produção mostra a página de erro do site; se vier corpo vazio, troque o `return new Response(...)` por `return Astro.rewrite('/404')`:

```bash
npm run build && PORT=4932 RESEND_API_KEY=re_x HIRE_NOTIFY_TO=a@example.com node dist/server/entry.mjs &
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4932/servicos/loja-virtual   # 404
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4932/servicos/site-institucional   # 200
kill %1
```

(As variáveis de ambiente que o servidor exige para subir estão no `beforeAll` de `tests/design-system/no-client-js.build-test.ts`; copie de lá se faltar alguma.)

**Passo 4:** `npx vitest run tests/sales/` e `npm run check`. Esperado: PASS e 0 erros.

**Passo 5:** `/git commit`.

---

## Lote 4: integração com o site

### Tarefa 22: sitemap e cartões OG

**Requisito:** REQ-033
**Depende de:** tarefas 5 e 6
**Arquivos:**
- Modificar: `src/lib/aeo/sitemap.ts` (`sitemapEntries`), `src/lib/og/pages.ts` (`ogPages`)
- Teste: `tests/sales/seo-entries.test.ts`

**Time:**
- Track: backend
- Implementer: backend-engineer (skills: typescript-backend)
- Reviewers: business-logic-reviewer, consequences-reviewer, test-reviewer

**Passo 1: teste que falha.**

```ts
import { describe, expect, it } from 'vitest';
import { sitemapEntries } from '../../src/lib/aeo/sitemap';
import { ogPages } from '../../src/lib/og/pages';

describe('sales pages in the sitemap', () => {
  it('lists the landing and the detail page while they live on the main host', () => {
    const paths = sitemapEntries({ projects: [], salesLive: false }).map((entry) => entry.path);
    expect(paths).toContain('/servicos');
    expect(paths).toContain('/servicos/site-institucional');
  });

  it('drops them once the subdomain is live, since the main host answers 301', () => {
    const paths = sitemapEntries({ projects: [], salesLive: true }).map((entry) => entry.path);
    expect(paths.some((path) => path.startsWith('/servicos'))).toBe(false);
  });
});

describe('sales share cards', () => {
  it('generates a card for each sales page', async () => {
    const keys = (await ogPages()).map((page) => page.key);
    expect(keys).toContain('servicos');
    expect(keys).toContain('servicos/site-institucional');
  });
});
```

**Passo 2:** `npx vitest run tests/sales/seo-entries.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`src/lib/aeo/sitemap.ts`: importe `SALES_HOST_LIVE`, `salesPath` de `../sales/host` e `detailSlugs` de `../sales/catalog`; acrescente `salesLive?: boolean` ao parâmetro de `sitemapEntries` (default `SALES_HOST_LIVE`) e, depois de `/privacidade`:

```ts
    // On the main host only until the subdomain is live (sales-landing, REQ-033).
    ...(salesLive ? [] : [salesPath(undefined, false), ...detailSlugs().map((slug) => salesPath(slug, false))]).map(
      (path) => ({ path }),
    ),
```

`src/lib/og/pages.ts`: importe `detailFor`, `detailSlugs` de `../sales/catalog` e acrescente depois de `/curriculo`:

```ts
    staticPage('/servicos', 'Seu site, sua loja ou seu sistema, do primeiro papo até estar no ar', 'Serviços', 'storefront'),
    ...detailSlugs().map((slug) => staticPage(`/servicos/${slug}`, detailFor(slug)!.detail.hero.title, 'Serviços', 'wireframe')),
```

**Passo 4:** `npx vitest run tests/sales/ tests/aeo/ tests/og/`. Esperado: PASS.

**Passo 5:** `/git commit`.

---

### Tarefa 23: links discretos na home e no `/contato`

**Requisito:** REQ-007
**Depende de:** tarefa 5
**Arquivos:**
- Modificar: `src/components/home/Services.astro`, `src/pages/contato.astro` (logo depois do `PageHeader`)
- Teste: `tests/sales/entry-links.test.ts`

**Time:**
- Track: frontend
- Implementer: frontend-engineer (skills: frontend-design)
- Reviewers: test-reviewer, accessibility-guardrails

**Passo 1: teste que falha.**

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Services from '../../src/components/home/Services.astro';
import Contato from '../../src/pages/contato.astro';

describe('entry points to the sales landing', () => {
  it('links from the home services section, without a second primary CTA', async () => {
    const html = await (await AstroContainer.create()).renderToString(Services, {
      props: { services: [], projects: [] },
    });
    expect(html).toContain('href="https://nandomoreira.dev/servicos"');
    expect(html).toContain('Para o seu negócio');
    expect(html).not.toContain('bg-primary');
  });

  it('links from /contato', async () => {
    const html = await (await AstroContainer.create()).renderToString(Contato, {
      request: new Request('https://nandomoreira.dev/contato'),
    });
    expect(html).toContain('href="https://nandomoreira.dev/servicos"');
  });
});
```

Se `ServiceCards` lançar com `services: []`, passe no teste um serviço e um projeto mínimos que satisfaçam a validação cruzada (veja `tests/home/` para um fixture pronto).

**Passo 2:** `npx vitest run tests/sales/entry-links.test.ts`. Esperado: FAIL.

**Passo 3: implementação.**

`src/components/home/Services.astro`: importe `salesUrl` de `../../lib/sales/host` e, depois de `<ServiceCards ... />`:

```astro
  <p class="mt-lg text-small text-muted-foreground">
    Para o seu negócio: site, loja virtual ou sistema, explicados sem jargão.
    <a href={salesUrl()} class="text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Ver os serviços</a>
  </p>
```

`src/pages/contato.astro`: o mesmo parágrafo, com o texto "Tem um negócio e precisa de um site ou sistema? Veja a página feita para você.", logo depois do `PageHeader`.

**Passo 4:** `npx vitest run tests/sales/ tests/home/ tests/pages/`. Esperado: PASS (o portão do CTA único continua verde).

**Passo 5:** `/git commit`.

---

### Tarefa 24: portão de JS, verificação completa e runbook do subdomínio

**Requisito:** REQ-031, REQ-034 (e a ativação de REQ-003 a REQ-006)
**Depende de:** todas
**Arquivos:**
- Modificar: `tests/design-system/no-client-js.build-test.ts` (`SSR_ROUTES`)
- Criar: `docs/runbooks/sales-subdomain.md`

**Time:**
- Track: infra
- Implementer: infra-engineer (skills: cloud-cli, bash-linux)
- Reviewers: security-reviewer, consequences-reviewer

**Passo 1: teste que falha.** Acrescente `'/servicos'` e `'/servicos/site-institucional'` a `SSR_ROUTES`. Para provar que o portão pega as rotas novas, ponha temporariamente um `<script>console.log(1)</script>` no `SalesLayout`, rode o passo 2 e confirme o FAIL; depois remova.

**Passo 2:** `npm run build && npm run test:build`. Esperado com o script temporário: FAIL apontando `/servicos`.

**Passo 3: implementação.** Remova o script temporário. Escreva `docs/runbooks/sales-subdomain.md` (pt-BR):

```markdown
# Runbook: ligar contrate.nandomoreira.dev

1. Firebase console → App Hosting → backend `nandomoreira-dev` → Settings → Domains → Add custom domain `contrate.nandomoreira.dev`.
2. Criar no DNS os registros que o console mostrar e esperar o certificado ficar `ACTIVE`.
3. Confirmar que o domínio responde servindo o site principal: `curl -sI https://contrate.nandomoreira.dev/contato` (200).
4. Em `src/lib/sales/host.ts`, trocar `SALES_HOST_LIVE` para `true`; rodar `npx vitest run` e `npm run verify`.
5. Push em `main` e, depois do rollout, conferir:
   - `curl -s -o /dev/null -w '%{http_code}' https://contrate.nandomoreira.dev/` → 200
   - `curl -s -o /dev/null -w '%{http_code}' https://contrate.nandomoreira.dev/site-institucional` → 200
   - `curl -sI https://nandomoreira.dev/servicos | grep -i '^location'` → `https://contrate.nandomoreira.dev/`
   - Enviar o formulário em `https://contrate.nandomoreira.dev/` e ver `?envio=ok` (um 403 aqui é o `allowedDomains`).
6. O sitemap do domínio principal deixa de listar `/servicos` sozinho. Um sitemap próprio do subdomínio fica para depois, se o Search Console pedir.
```

Verificação a 390px (REQ-034), com o build rodando:

```bash
npm run build && PORT=4933 RESEND_API_KEY=re_x HIRE_NOTIFY_TO=a@example.com node dist/server/entry.mjs &
for path in /servicos /servicos/site-institucional; do
  npx -y playwright screenshot --viewport-size=390,844 --full-page "http://127.0.0.1:4933$path" "$TMPDIR/sales-$(basename $path).png"
done
kill %1
```

Abra as duas imagens e compare com as telas mobile do Stitch (`1cda02f890eb48b090398883134c42f6` e `5983629069cc4cf4b6f1c5e797b27fbb`): nenhuma rolagem lateral e a tabela empilhada por critério.

**Passo 4:** `npm run verify`. Esperado: termina verde (check, test, build e test:build). A evidência é a saída de cada etapa, não o código de saída de um pipe.

**Passo 5:** `/git commit`.
