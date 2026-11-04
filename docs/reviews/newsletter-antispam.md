# Review: newsletter-antispam

- **Round:** 2026-11-04
- **Open findings:** 2
- **State:** awaiting independent review
- **Implemented by:** grok
- **Independent review:** pending (self-assessment)

> File rewritten whole on every `/rpi review`. A finding only disappears from here
> because it stopped existing in the code: whoever fixes it does not mark it resolved.

<!-- findings:begin -->

| Severity | File:line | Issue | Suggested fix |
|----------|-----------|-------|---------------|
| Critical | (gate) | tier1: prettier --check . falha em arquivos fora deste diff (templates Askama em tools/stats e fontes não relacionadas). npm test falha em tests/scripts/autowriter-run.test.ts (6) e tests/design-system/code-contrast.test.ts (2); esses arquivos não mudaram neste feature. tier2: vitest run --coverage sai 1 porque @vitest/coverage-v8 não está instalado. tsc e o build passaram. Os proofs C1 a C9 passaram. | fix before anything else |
| Low | tests/security/hourly-limit.test.ts:17 | O teste da 11ª chamada só guarda o último retorno. Se as dez primeiras também fossem recusadas, ele continuaria verde. | Guarde os onze resultados e exija que as dez primeiras passem. |

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

## Reviewers

- opencode: exit 3, timed out after 540s without writing rows.
- agy: disabled in the registry.
- codex: disabled in the registry.
- grok: implemented this round, so it does not lead the judgment.

The independent chain ended. The judgment in this file is a self-assessment.
