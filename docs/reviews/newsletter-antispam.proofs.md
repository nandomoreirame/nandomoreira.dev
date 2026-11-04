# Proofs: newsletter-antispam

- **Commit:** a740591aca963c2cfadd8e7c24a509540923ce6d
- **Tree:** clean
- **Result:** PASS

| Check | Requirements | Proof | Status |
| --- | --- | --- | --- |
| C1 | REQ-001 | run unit \| ✓ grava endereço novo como pending | PASS |
| C2 | REQ-002 | run unit \| ✓ confirma token válido uma única vez | PASS |
| C3 | REQ-003 | run unit \| ✓ token inválido responde igual a inexistente | PASS |
| C4 | REQ-004 | run unit \| ✓ form sem captcha responde captcha e não grava | PASS |
| C5 | REQ-005 | run unit \| ✓ Origin fora da allowlist é recusado | PASS |
| C6 | REQ-006 | run unit \| ✓ bloqueia a 11ª requisição na mesma hora | PASS |
| C7 | REQ-007 | run unit \| ✓ pending reenvia confirmação só após 24 horas | PASS |
| C8 | REQ-008 | run unit \| ✓ privacidade cita o Cloudflare Turnstile | PASS |
| C9 | REQ-009 | run unit \| ✓ registro sem status é tratado como confirmed | PASS |

## Runs

### run unit (exit 0)

```text
 ✓ tests/security/turnstile.test.ts > turnstile > token rejeitado pela API é recusado 8ms
 ✓ tests/security/turnstile.test.ts > turnstile > token aceito pela API passa 2ms
 ✓ tests/security/hourly-limit.test.ts > limite por hora > bloqueia a 11ª requisição na mesma hora 5ms
 ✓ tests/security/hourly-limit.test.ts > limite por hora > IP guardado só como hash 1ms
 ✓ tests/newsletter/store.test.ts > newsletter store > ids a subscriber by the SHA-256 of the normalised email, so a repeat lands on the same document 2ms
 ✓ tests/newsletter/store.test.ts > newsletter store > stores the email, the date and the source, never the network 3ms
 ✓ tests/newsletter/store.test.ts > firestoreSubscriberStore contract > tells the caller whether the address is new 11ms
 ✓ tests/newsletter/captcha-gate.test.ts > portão de captcha > form sem captcha responde captcha e não grava 20ms
 ✓ tests/newsletter/captcha-gate.test.ts > portão de captcha > Origin fora da allowlist responde erro sem ler a gravação 2ms
 ✓ tests/newsletter/captcha-gate.test.ts > portão de captcha > a 11ª hora bloqueada responde limite e não grava 2ms
 ✓ tests/newsletter/pending.test.ts > inscrição > grava endereço novo como pending 4ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > is a server route wired to the newsletter handler and the Firestore store 5ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > wires the e-mail to me and the thank-you to the subscriber 1ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > limits to five per IP every ten minutes 1ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > turns Turnstile off when TURNSTILE_SECRET_KEY is empty 1ms
 ✓ tests/newsletter/privacy-and-rules.test.ts > newsletter privacy and rules > denies every client path to newsletter_subscribers explicitly 4ms
 ✓ tests/newsletter/privacy-and-rules.test.ts > newsletter privacy and rules > documents the newsletter in the privacy policy, with consent, storage and how to leave 2ms
 ✓ tests/privacy/sales-fields.test.ts > privacy policy and the sales form > names the service field 3ms
 ✓ tests/privacy/sales-fields.test.ts > privacy policy and the sales form > says the form asks for an e-mail, since WhatsApp is a link and not a form field any more 1ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > form sem captcha válido não grava 18ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > JSON de agente não exige captcha 6ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > o token do widget não entra no payload estrito 2ms
 ✓ tests/privacy/turnstile-disclosure.test.ts > privacidade > privacidade cita o Cloudflare Turnstile 3ms
 ✓ tests/newsletter/resend-window.test.ts > reenvio > pending reenvia confirmação só após 24 horas 3ms
 ✓ tests/newsletter/resend-window.test.ts > reenvio > confirmed não reenvia nada 0ms
 ✓ tests/newsletter/resend-window.test.ts > reenvio > pending no handler reenvia só depois da janela 22ms
 ✓ tests/newsletter/confirm.test.ts > confirmação > confirma token válido uma única vez 6ms
 ✓ tests/newsletter/confirm.test.ts > confirmação > token inválido responde igual a inexistente 1ms
 ✓ tests/newsletter/legacy.test.ts > legado > registro sem status é tratado como confirmed 1ms
 ✓ tests/security/origin.test.ts > origin > Origin fora da allowlist é recusado 1ms
 ✓ tests/security/origin.test.ts > origin > Origin ausente é aceito 0ms

 Test Files  35 passed (35)
      Tests  211 passed (211)
   Start at  08:37:23
   Duration  25.22s (transform 21.80s, setup 0ms, collect 105.16s, tests 4.64s, environment 16ms, prepare 7.48s)

stderr | tests/newsletter/handler.test.ts > handleSubscribe e-mails > keeps answering ok when the confirmation e-mail fails
newsletter: confirmation could not be sent

```
