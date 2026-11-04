# Review: newsletter-antispam

- **Round:** 2026-11-04
- **Open findings:** 1
- **State:** awaiting fix
- **Implemented by:** opencode
- **Independent review:** pending (self-assessment)

> File rewritten whole on every `/rpi review`. A finding only disappears from here
> because it stopped existing in the code: whoever fixes it does not mark it resolved.

<!-- findings:begin -->

| Severity | File:line | Issue | Suggested fix |
|----------|-----------|-------|---------------|
| Critical | (gate) | tier1 FAIL fora desta feature: prettier --check (12 arquivos fora do diff, incluindo src/lib/art/motifs.ts, src/lib/http/session-cookie.ts, tools/stats/*) e npm test (tests/design-system/code-contrast.test.ts, tests/scripts/autowriter-run.test.ts). eslint não instalado. tsc e build passam; os arquivos da feature passam no prettier; os testes de newsletter, security, api e privacy passam. | fix before anything else |

<!-- findings:end -->

## Checks

<!-- checks:begin -->

| Check | Test | Holds |
|-------|------|-------|
| C1 | tests/newsletter/pending.test.ts::grava endereço novo como pending | yes |
| C2 | tests/newsletter/confirm.test.ts::confirma token válido uma única vez | yes |
| C3 | tests/newsletter/confirm.test.ts::token inválido responde igual a inexistente | yes |
| C4 | tests/newsletter/captcha-gate.test.ts::form sem captcha responde captcha e não grava | yes |
| C5 | tests/security/origin.test.ts::Origin fora da allowlist é recusado | yes |
| C6 | tests/security/hourly-limit.test.ts::bloqueia a 11ª requisição na mesma hora | yes |
| C7 | tests/newsletter/resend-window.test.ts::pending reenvia confirmação só após 24 horas | yes |
| C8 | tests/privacy/turnstile-disclosure.test.ts::privacidade cita o Cloudflare Turnstile | yes |
| C9 | tests/newsletter/legacy.test.ts::registro sem status é tratado como confirmed | yes |

<!-- checks:end -->
