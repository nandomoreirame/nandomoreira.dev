# Proofs: newsletter-antispam

- **Commit:** 20cee1e78b5914b61d0175e553ea9288d16ba443
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
 ✓ tests/newsletter/store.test.ts > newsletter store > ids a subscriber by the SHA-256 of the normalised email, so a repeat lands on the same document 3ms
 ✓ tests/newsletter/store.test.ts > newsletter store > stores the email, the date and the source, never the network 3ms
 ✓ tests/newsletter/store.test.ts > firestoreSubscriberStore contract > tells the caller whether the address is new 2ms
 ✓ tests/newsletter/confirm.test.ts > confirmação > confirma token válido uma única vez 5ms
 ✓ tests/newsletter/confirm.test.ts > confirmação > token inválido responde igual a inexistente 1ms
 ✓ tests/newsletter/confirm.test.ts > confirmação > token expirado não confirma 1ms
 ✓ tests/newsletter/confirm.test.ts > confirmação > token antigo não confirma depois de reenviado 1ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > form sem captcha válido não grava 16ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > JSON de agente não exige captcha 5ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > JSON de agente não consome o limite por hora 2ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > form acima do limite por hora responde limite 1ms
 ✓ tests/security/form-gate.test.ts > portão do formulário de contato > o token do widget não entra no payload estrito 1ms
 ✓ tests/newsletter/resend-window.test.ts > reenvio > pending reenvia confirmação só após 24 horas 2ms
 ✓ tests/newsletter/resend-window.test.ts > reenvio > confirmed não reenvia nada 0ms
 ✓ tests/newsletter/resend-window.test.ts > reenvio > pending no handler reenvia só depois da janela 12ms
 ✓ tests/newsletter/pending.test.ts > inscrição > grava endereço novo como pending 5ms
 ✓ tests/newsletter/legacy.test.ts > legado > registro sem status é tratado como confirmed 1ms
 ✓ tests/privacy/turnstile-disclosure.test.ts > privacidade > privacidade cita o Cloudflare Turnstile 1ms
 ✓ tests/security/hourly-limit.test.ts > limite por hora > bloqueia a 11ª requisição na mesma hora 3ms
 ✓ tests/security/hourly-limit.test.ts > limite por hora > IP guardado só como hash 1ms
 ✓ tests/newsletter/captcha-gate.test.ts > portão de captcha > form sem captcha responde captcha e não grava 14ms
 ✓ tests/newsletter/captcha-gate.test.ts > portão de captcha > Origin fora da allowlist responde erro sem ler a gravação 2ms
 ✓ tests/newsletter/captcha-gate.test.ts > portão de captcha > a 11ª hora bloqueada responde limite e não grava 2ms
 ✓ tests/security/origin.test.ts > origin > Origin fora da allowlist é recusado 1ms
 ✓ tests/security/origin.test.ts > origin > Origin ausente é aceito 0ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > is a server route wired to the newsletter handler and the Firestore store 2ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > wires the e-mail to me and the thank-you to the subscriber 1ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > limits to five per IP every ten minutes 1ms
 ✓ tests/newsletter/route.test.ts > /api/subscribe route > turns Turnstile off when TURNSTILE_SECRET_KEY is empty 0ms
 ✓ tests/privacy/sales-fields.test.ts > privacy policy and the sales form > names the service field 1ms
 ✓ tests/privacy/sales-fields.test.ts > privacy policy and the sales form > says the form asks for an e-mail, since WhatsApp is a link and not a form field any more 0ms

 Test Files  36 passed (36)
      Tests  221 passed (221)
   Start at  09:18:08
   Duration  9.05s (transform 5.17s, setup 0ms, collect 35.55s, tests 2.14s, environment 13ms, prepare 4.28s)

stderr | tests/newsletter/handler.test.ts > handleSubscribe e-mails > keeps answering ok when the confirmation e-mail fails
newsletter: confirmation could not be sent

```
