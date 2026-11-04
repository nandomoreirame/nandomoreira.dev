# Plan: Anti-spam da newsletter e dos formulários

> **Spec:** docs/specs/newsletter-antispam/SPEC.md

**Goal:** Só entra na lista endereço com posse comprovada por confirmação, e os formulários humanos passam a exigir Turnstile, Origin válido e limite por hora persistido.
**Architecture:** Double opt-in no handler da newsletter, com token de uso único guardado como hash. Verificação de captcha, Origin e limite por hora em módulos puros sob `src/lib/security/`, chamados por `/api/subscribe` e `/api/hire` somente para POST de formulário.
**Tech Stack:** Astro 7 SSR, TypeScript, Zod, Firestore (Admin SDK), Resend, Cloudflare Turnstile, Vitest.
**Lessons applied:** none
**Total Tasks:** 11
**Estimated Complexity:** large: 9+

---

## Checks

**Run unit**: `npx vitest run tests/newsletter tests/security tests/components tests/privacy --reporter=verbose`

- C1 (REQ-001): endereço novo fica pending e sem aviso. Proof: run unit | ✓ grava endereço novo como pending
- C2 (REQ-002): token válido confirma uma única vez. Proof: run unit | ✓ confirma token válido uma única vez
- C3 (REQ-003): token inválido responde igual a endereço inexistente. Proof: run unit | ✓ token inválido responde igual a inexistente
- C4 (REQ-004): form sem captcha não grava. Proof: run unit | ✓ form sem captcha responde captcha e não grava
- C5 (REQ-005): Origin fora da allowlist é recusado. Proof: run unit | ✓ Origin fora da allowlist é recusado
- C6 (REQ-006): 11ª requisição na mesma hora é bloqueada. Proof: run unit | ✓ bloqueia a 11ª requisição na mesma hora
- C7 (REQ-007): pending reenvia só após 24 horas. Proof: run unit | ✓ pending reenvia confirmação só após 24 horas
- C8 (REQ-008): privacidade cita o Turnstile. Proof: run unit | ✓ privacidade cita o Cloudflare Turnstile
- C9 (REQ-009): registro legado é tratado como confirmed. Proof: run unit | ✓ registro sem status é tratado como confirmed

---

### Task 1: Inscrição nasce pending

**Requirement:** REQ-001
**Files:**
- Create: `tests/newsletter/pending.test.ts`
- Modify: `src/lib/newsletter/store.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: business-logic-reviewer, security-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { toSubscriber } from '../../src/lib/newsletter/store';

describe('inscrição', () => {
  it('grava endereço novo como pending', () => {
    const doc = toSubscriber('Ana@Example.com', new Date('2026-11-03T12:00:00Z'));
    expect(doc.status).toBe('pending');
    expect(doc.email).toBe('ana@example.com');
    expect(doc.confirmTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(doc.confirmExpiresAt).toBe('2026-11-10T12:00:00.000Z');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/newsletter/pending.test.ts`
Expected: FAIL with "expected undefined to be 'pending'"

**Step 3: Write minimal implementation**
```ts
import { createHash, randomBytes } from 'node:crypto';

const CONFIRM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const newConfirmation = (now: Date) => {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(now.getTime() + CONFIRM_WINDOW_MS).toISOString(),
  };
};

export const toSubscriber = (email: string, now: Date) => {
  const confirmation = newConfirmation(now);
  return {
    email: normalise(email),
    status: 'pending' as const,
    subscribedAt: now.toISOString(),
    source: 'posts' as const,
    confirmTokenHash: confirmation.tokenHash,
    confirmExpiresAt: confirmation.expiresAt,
  };
};
```
Ajuste o teste de `toSubscriber` existente em `tests/newsletter` se ele assumir o formato antigo, e mantenha `normalise` e `subscriberId` como estão.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/newsletter/pending.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 2: Confirmação por token de uso único

**Requirement:** REQ-002, REQ-003
**Files:**
- Create: `src/lib/newsletter/confirm.ts`
- Create: `tests/newsletter/confirm.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: business-logic-reviewer, security-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { confirmSubscription } from '../../src/lib/newsletter/confirm';
import { newConfirmation } from '../../src/lib/newsletter/store';

const memory = (doc: Record<string, unknown>) => ({
  find: async () => doc,
  update: async (patch: Record<string, unknown>) => Object.assign(doc, patch),
});

describe('confirmação', () => {
  it('confirma token válido uma única vez', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const c = newConfirmation(now);
    const doc: Record<string, unknown> = { status: 'pending', confirmTokenHash: c.tokenHash, confirmExpiresAt: c.expiresAt };
    const first = await confirmSubscription(c.token, now, memory(doc));
    const second = await confirmSubscription(c.token, now, memory(doc));
    expect(first).toBe('confirmed');
    expect(second).toBe('invalid');
    expect(doc.status).toBe('confirmed');
  });

  it('token inválido responde igual a inexistente', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const none = await confirmSubscription('qualquer', now, memory({}));
    const missing = await confirmSubscription('outro', now, { find: async () => null, update: async () => {} });
    expect(none).toBe(missing);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/newsletter/confirm.test.ts`
Expected: FAIL with "Cannot find module '../../src/lib/newsletter/confirm'"

**Step 3: Write minimal implementation**
```ts
import { createHash } from 'node:crypto';

export type ConfirmOutcome = 'confirmed' | 'invalid';

export interface ConfirmStore {
  find: (tokenHash: string) => Promise<Record<string, unknown> | null>;
  update: (patch: Record<string, unknown>) => Promise<void>;
}

export const confirmSubscription = async (token: string, now: Date, store: ConfirmStore): Promise<ConfirmOutcome> => {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const doc = await store.find(tokenHash);
  if (!doc || doc.status !== 'pending') return 'invalid';
  if (String(doc.confirmExpiresAt) < now.toISOString()) return 'invalid';
  await store.update({ status: 'confirmed', confirmedAt: now.toISOString(), confirmTokenHash: null });
  return 'confirmed';
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/newsletter/confirm.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 3: Aviso e boas-vindas só depois da confirmação

**Requirement:** REQ-001, REQ-002
**Files:**
- Modify: `src/lib/newsletter/handler.ts`
- Modify: `src/lib/newsletter/mail.ts`
- Create: `src/emails/newsletter-confirm.tsx`
- Create: `src/pages/api/subscribe/confirm.ts`
- Create: `tests/newsletter/double-optin.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: business-logic-reviewer, security-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it, vi } from 'vitest';
import { confirmedBy, handleSubscribe } from '../../src/lib/newsletter/handler';

describe('double opt-in', () => {
  it('novo endereço não notifica antes da confirmação', async () => {
    const notify = vi.fn();
    const thankYou = vi.fn();
    const sendConfirmation = vi.fn();
    const response = await handleSubscribe(formRequest('ana@example.com'), {
      store: { save: async () => true },
      limiter: { check: () => true },
      now: () => new Date('2026-11-03T12:00:00Z'),
      notify,
      thankYou,
      sendConfirmation,
    });
    expect(response.status).toBe(303);
    expect(notify).not.toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
    expect(sendConfirmation).toHaveBeenCalledTimes(1);
  });

  it('confirmação dispara aviso e boas-vindas uma vez', async () => {
    const notify = vi.fn();
    const thankYou = vi.fn();
    await confirmedBy({ email: 'ana@example.com', notify, thankYou });
    await confirmedBy({ email: 'ana@example.com', notify, thankYou });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(thankYou).toHaveBeenCalledTimes(1);
  });
});

const formRequest = (email: string) =>
  new Request('https://nandomoreira.dev/api/subscribe?origem=/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(email)}`,
  });
```
Antes de rodar, ajuste o `store` do teste para a interface real de `SubscriberStore` em `src/lib/newsletter/store.ts` (o stub acima é ilustrativo). `confirmedBy` é exportado de `handler.ts`, junto com `handleSubscribe`.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/newsletter/double-optin.test.ts`
Expected: FAIL with "notify was called" (o handler atual notifica endereço novo na hora)

**Step 3: Write minimal implementation**
Em `handler.ts`, troque o bloco `if (isNew)` por envio de confirmação, e exporte `confirmedBy`, que envia aviso e boas-vindas apenas na primeira confirmação:
```ts
if (isNew) {
  await sendConfirmation(result.data.email, token);
}
```
```ts
export const confirmedBy = async ({ email, notify, thankYou }: { email: string; notify: SubscriberNotifier; thankYou: ThankYouSender }) => {
  await notify(await subscriberMail({ email, origin: '/posts', at: new Date().toISOString() }));
  await thankYou(email, await thankYouMail({ name: null, kind: 'newsletter' }));
};
```
Em `src/pages/api/subscribe/confirm.ts`, leia `token` da query, chame `confirmSubscription` e responda com `303` para `/posts?assinatura=ok#novidades` nos dois casos de `invalid` e `confirmed`, sem diferença observável. `newsletter-confirm.tsx` segue o padrão de `newsletter-notification.tsx`, com o link `https://nandomoreira.dev/api/subscribe/confirm?token=`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/newsletter/double-optin.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 4: Reenvio de confirmação com intervalo de 24 horas

**Requirement:** REQ-007
**Files:**
- Modify: `src/lib/newsletter/handler.ts`
- Create: `tests/newsletter/resend-window.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: business-logic-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { mayResendConfirmation } from '../../src/lib/newsletter/handler';

describe('reenvio', () => {
  it('pending reenvia confirmação só após 24 horas', () => {
    const sent = new Date('2026-11-03T12:00:00Z');
    expect(mayResendConfirmation(sent, new Date('2026-11-03T20:00:00Z'))).toBe(false);
    expect(mayResendConfirmation(sent, new Date('2026-11-04T12:00:00Z'))).toBe(true);
  });

  it('confirmed não reenvia nada', () => {
    expect(mayResendConfirmation(null, new Date())).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/newsletter/resend-window.test.ts`
Expected: FAIL with "mayResendConfirmation is not a function"

**Step 3: Write minimal implementation**
```ts
const RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;

export const mayResendConfirmation = (lastSentAt: Date | null, now: Date): boolean =>
  lastSentAt !== null && now.getTime() - lastSentAt.getTime() >= RESEND_WINDOW_MS;
```
Use a função no ramo de endereço `pending` existente do handler. Guarde `confirmSentAt` no documento, e use `null` quando o status for `confirmed`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/newsletter/resend-window.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 5: Registro legado sem status vira confirmed

**Requirement:** REQ-009
**Files:**
- Modify: `src/lib/newsletter/store.ts`
- Create: `tests/newsletter/legacy.test.ts`

**Team:**
- Track: data
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: consequences-reviewer, business-logic-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { statusOf } from '../../src/lib/newsletter/store';

describe('legado', () => {
  it('registro sem status é tratado como confirmed', () => {
    expect(statusOf({ email: 'a@b.co' })).toBe('confirmed');
    expect(statusOf({ email: 'a@b.co', status: 'pending' })).toBe('pending');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/newsletter/legacy.test.ts`
Expected: FAIL with "statusOf is not a function"

**Step 3: Write minimal implementation**
```ts
export const statusOf = (doc: { status?: string }): 'pending' | 'confirmed' =>
  doc.status === 'pending' ? 'pending' : 'confirmed';
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/newsletter/legacy.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 6: Verificação do Turnstile no servidor

**Requirement:** REQ-004
**Files:**
- Create: `src/lib/security/turnstile.ts`
- Create: `tests/security/turnstile.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: security-reviewer, business-logic-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it, vi } from 'vitest';
import { requiresCaptcha, verifyTurnstile } from '../../src/lib/security/turnstile';

const form = new Request('https://nandomoreira.dev/api/hire', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' } });
const json = new Request('https://nandomoreira.dev/api/hire', { method: 'POST', headers: { 'content-type': 'application/json' } });

describe('turnstile', () => {
  it('form sem token Turnstile é recusado', async () => {
    expect(requiresCaptcha(form)).toBe(true);
    expect(await verifyTurnstile('', { secret: 's', fetch: vi.fn(), remoteIp: '1.1.1.1' })).toBe(false);
  });

  it('JSON de agente dispensa Turnstile', () => {
    expect(requiresCaptcha(json)).toBe(false);
  });

  it('token rejeitado pela API é recusado', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: false }), { status: 200 }));
    expect(await verifyTurnstile('tok', { secret: 's', fetch, remoteIp: '1.1.1.1' })).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/security/turnstile.test.ts`
Expected: FAIL with "Cannot find module '../../src/lib/security/turnstile'"

**Step 3: Write minimal implementation**
```ts
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const requiresCaptcha = (request: Request): boolean =>
  (request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded');

export const verifyTurnstile = async (
  token: string,
  { secret, fetch, remoteIp }: { secret: string; fetch: typeof globalThis.fetch; remoteIp: string },
): Promise<boolean> => {
  if (token.trim() === '') return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: remoteIp });
  const response = await fetch(SITEVERIFY, { method: 'POST', body });
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/security/turnstile.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 7: Allowlist de Origin

**Requirement:** REQ-005
**Files:**
- Create: `src/lib/security/origin.ts`
- Create: `tests/security/origin.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: security-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { originAllowed } from '../../src/lib/security/origin';

describe('origin', () => {
  it('Origin fora da allowlist é recusado', () => {
    expect(originAllowed('https://evil.example', ['https://nandomoreira.dev'])).toBe(false);
  });

  it('Origin ausente é aceito', () => {
    expect(originAllowed(null, ['https://nandomoreira.dev'])).toBe(true);
    expect(originAllowed('https://nandomoreira.dev', ['https://nandomoreira.dev'])).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/security/origin.test.ts`
Expected: FAIL with "Cannot find module '../../src/lib/security/origin'"

**Step 3: Write minimal implementation**
```ts
export const originAllowed = (origin: string | null, allowed: readonly string[]): boolean =>
  origin === null || allowed.includes(origin);
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/security/origin.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 8: Limite por hora no Firestore

**Requirement:** REQ-006
**Files:**
- Create: `src/lib/security/hourly-limit.ts`
- Create: `tests/security/hourly-limit.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: security-reviewer, consequences-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { hourlyKeyOf, allowHourly } from '../../src/lib/security/hourly-limit';

describe('limite por hora', () => {
  it('bloqueia a 11ª requisição na mesma hora', async () => {
    const counts = new Map<string, number>();
    const store = {
      increment: async (key: string) => {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return next;
      },
    };
    const now = new Date('2026-11-03T12:10:00Z');
    let last = true;
    for (let i = 0; i < 11; i++) last = await allowHourly('203.0.113.7', now, { store, max: 10 });
    expect(last).toBe(false);
  });

  it('IP guardado só como hash', () => {
    const key = hourlyKeyOf('203.0.113.7', new Date('2026-11-03T12:10:00Z'));
    expect(key).not.toContain('203.0.113.7');
    expect(key).toMatch(/^[a-f0-9]{64}-2026-11-03T12$/);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/security/hourly-limit.test.ts`
Expected: FAIL with "Cannot find module '../../src/lib/security/hourly-limit'"

**Step 3: Write minimal implementation**
```ts
import { createHash } from 'node:crypto';

export interface HourlyStore {
  increment: (key: string, expiresAt: Date) => Promise<number>;
}

export const hourlyKeyOf = (ip: string, now: Date): string => {
  const hash = createHash('sha256').update(ip).digest('hex');
  return `${hash}-${now.toISOString().slice(0, 13)}`;
};

export const allowHourly = async (ip: string, now: Date, { store, max }: { store: HourlyStore; max: number }): Promise<boolean> => {
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const count = await store.increment(hourlyKeyOf(ip, now), expiresAt);
  return count <= max;
};
```
A chave tem a forma `<sha256-do-ip>-<AAAA-MM-DDTHH>`, que o teste confere. Não há mais transformação além do `slice`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/security/hourly-limit.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 9: Integrar captcha e Origin nos endpoints

**Requirement:** REQ-004, REQ-005, REQ-006
**Files:**
- Modify: `src/lib/newsletter/handler.ts`
- Modify: `src/lib/hire/handler.ts`
- Modify: `src/pages/api/subscribe.ts`
- Modify: `src/pages/api/hire.ts`
- Create: `tests/newsletter/captcha-gate.test.ts`

**Team:**
- Track: backend
- Implementer: backend-engineer (skills: the project's backend conventions skill, if installed)
- Reviewers: security-reviewer, business-logic-reviewer, test-reviewer

**Step 1: Write the failing test**
```ts
import { describe, expect, it, vi } from 'vitest';
import { handleSubscribe } from '../../src/lib/newsletter/handler';

describe('portão de captcha', () => {
  it('form sem captcha responde captcha e não grava', async () => {
    const save = vi.fn(async () => true);
    const request = new Request('https://nandomoreira.dev/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'email=ana%40example.com',
    });
    const response = await handleSubscribe(request, {
      store: { save, lookup: async () => null },
      limiter: { check: () => true },
      now: () => new Date(),
      captcha: { required: true, verify: async () => false },
      sendConfirmation: vi.fn(),
    });
    expect(response.headers.get('location')).toContain('assinatura=captcha');
    expect(save).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/newsletter/captcha-gate.test.ts`
Expected: FAIL with "expected ... to contain 'assinatura=captcha'"

**Step 3: Write minimal implementation**
Em `handleSubscribe`, logo após a checagem de limite e antes de ler o corpo, chame `captcha.verify` quando `captcha.required` for verdadeiro, lendo `cf-turnstile-response` do corpo. Se falhar, responda `captcha`. Acrescente `'captcha'` a `SubscribeOutcome`. Adicione `captcha`, `origins` e `hourly` a `SubscribeDependencies`, e em `subscribe.ts` e `hire.ts` injete os módulos de `src/lib/security/` lendo `TURNSTILE_SECRET_KEY` e `ALLOWED_ORIGINS` de `process.env` no momento do boot, como os demais segredos. Se `TURNSTILE_SECRET_KEY` não estiver configurada, a verificação fica desligada e o teste de build deve acusar isso.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/newsletter/captcha-gate.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 10: Widget do Turnstile nos formulários humanos

**Requirement:** REQ-004
**Files:**
- Create: `src/components/security/TurnstileWidget.astro`
- Modify: `src/components/posts/NewsletterCard.astro`
- Modify: `src/pages/contato.astro`
- Create: `tests/components/turnstile-widget.test.ts`

**Team:**
- Track: frontend
- Implementer: frontend-engineer (skills: the project's UI conventions skill, if installed)
- Reviewers: type-safety-reviewer, test-reviewer, accessibility guard (`<dev-dir>/references/guards/accessibility.md`)

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TurnstileWidget from '../../src/components/security/TurnstileWidget.astro';

describe('TurnstileWidget', () => {
  it('widget só renderiza com site key configurada', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TurnstileWidget, { props: { siteKey: '' } });
    expect(html).not.toContain('cf-turnstile');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/components/turnstile-widget.test.ts`
Expected: FAIL with "Cannot find module '../../src/components/security/TurnstileWidget.astro'"

**Step 3: Write minimal implementation**
`TurnstileWidget.astro` recebe `siteKey` e renderiza `<div class="cf-turnstile" data-sitekey={siteKey} data-turnstile-widget></div>` somente quando `siteKey` não está vazia. Carrega `https://challenges.cloudflare.com/turnstile/v0/api.js` com `async defer` apenas nessa condição, marcado com `data-turnstile-loader`, sob a exceção registrada na Task 11. Em `NewsletterCard.astro` e `contato.astro`, insira o widget dentro do `<form>` existente, sem alterar os nomes dos campos atuais. Mantenha o envio sem JS funcionando: sem o script, o servidor responde `captcha`, conforme SPEC.md.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/components/turnstile-widget.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)

---

### Task 11: Exceção de JS, gate e divulgação na privacidade

**Requirement:** REQ-008
**Files:**
- Modify: `CLAUDE.md`
- Modify: `tests/design-system/no-client-js.build-test.ts`
- Modify: `src/pages/privacidade.astro`
- Create: `tests/privacy/turnstile-disclosure.test.ts`

**Team:**
- Track: docs
- Implementer: rpi-implementer (direct)
- Reviewers: self-review (no panel)

**Step 1: Write the failing test**
```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('privacidade', () => {
  it('privacidade cita o Cloudflare Turnstile', () => {
    const source = readFileSync('src/pages/privacidade.astro', 'utf8');
    expect(source).toContain('Cloudflare Turnstile');
    expect(source).toContain('hash');
    expect(source).toContain('30 dias');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/privacy/turnstile-disclosure.test.ts`
Expected: FAIL with "expected ... to contain 'Cloudflare Turnstile'"

**Step 3: Write minimal implementation**
Em `privacidade.astro`, acrescente um parágrafo em pt-BR descrevendo o Cloudflare Turnstile como verificação anti-robô, o hash SHA-256 do IP guardado por 30 dias e o e-mail de confirmação da newsletter. Em `CLAUDE.md`, na lista de exceções de JavaScript de cliente, registre o widget do Turnstile com data de 2026-11-03, a condição de carregamento e o limite de bytes. Em `no-client-js.build-test.ts`, acrescente o script do widget à lista de permissão, sem afrouxar nenhum outro limite, e registre a alteração no `CLAUDE.md`, porque o portão não deve ser relaxado sem decisão registrada.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/privacy/turnstile-disclosure.test.ts`
Expected: PASS

**Step 5: Commit**
Run: `/git commit`
(Do NOT use raw git commands. The `/git commit` skill applies the project's commit standards automatically.)
