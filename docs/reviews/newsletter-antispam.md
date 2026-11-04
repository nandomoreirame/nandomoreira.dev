# Review: newsletter-antispam

- **Round:** 2026-11-04
- **Open findings:** 7
- **State:** awaiting fix
- **Implemented by:** grok
- **Independent review:** pending (self-assessment)

> File rewritten whole on every `/rpi review`. A finding only disappears from here
> because it stopped existing in the code: whoever fixes it does not mark it resolved.

<!-- findings:begin -->

| Severity | File:line | Issue | Suggested fix |
|----------|-----------|-------|---------------|
| Critical | (gate) | tier1 FAIL fora desta feature: prettier --check (src/lib/art/motifs.ts, src/lib/http/session-cookie.ts, tests/art/generate.test.ts, tests/catalog/closing-cta.test.ts, tests/config/stats-deploy.test.ts, tests/posts/listing-view.test.ts, tools/stats/*) e npm test (tests/design-system/code-contrast.test.ts, tests/scripts/autowriter-run.test.ts). eslint não instalado. tsc e build passam; os arquivos .ts da feature passam no prettier; os testes de newsletter, security e privacy passam. | fix before anything else |
| High | src/pages/api/subscribe.ts:21 | Chaves do Turnstile sem validação cruzada. Só o segredo: todo POST de formulário responde captcha sem widget (formulário morto). Só a chave do site: o widget aparece e nada é verificado, sem aviso (fail-open). Mesmo problema em src/pages/api/hire.ts:24 e src/pages/contato.astro:28. | Falhar no boot quando exatamente uma das duas variáveis estiver definida, como readHireConfig faz, e cobrir com teste. |
| Medium | src/pages/api/subscribe/confirm.ts:22 | Confirmação por GET. Leitores de link (Outlook Safe Links, prefetch do Gmail, antivírus corporativo) consomem o token antes do clique humano. O clique real cai em invalid, e a inscrição foi confirmada sem intenção do dono da caixa. | Página GET com botão que faz POST para confirmar. REQ-002 da spec precisa ser ajustado. |
| Medium | docs/specs/newsletter-antispam/SPEC.md:130 | A coleção request_hourly_limits precisa de TTL em expiresAt, exigido pela própria spec, mas ausente das ações manuais e de qualquer documento. Sem ela, cresce indefinidamente (um doc por hash de IP por hora). | Incluir em Ações manuais: gcloud firestore fields ttls update expiresAt --collection-group=request_hourly_limits --enable-ttl --project=nandomoreira-dev |
| Medium | src/lib/hire/handler.ts:104 | O limite por hora roda antes do parse e vale para todo POST de /api/hire, inclusive o JSON de agentes. O commit 046b964 diz limit form posts. Um agente que passe de 10 chamadas por hora recebe rateLimited, e cada chamada já abre transação no Firestore. | Decidir o escopo. Se for só formulário, mover a checagem para dentro do ramo fromForm. Se for para todos, alinhar commit e SPEC D4 e registrar a mudança do contrato de agente. |
| Low | src/lib/newsletter/confirm.ts:16 | Dois GET simultâneos com o mesmo token leem pending antes de qualquer update, e o Set welcomed só protege dentro da mesma instância. Resultado: aviso e boas-vindas duplicados. | Atualização condicional no store (transação, ou precondição status == pending). |
| Low | tests/security/hourly-limit.test.ts:17 | Carry-over da rodada 1. Só o último retorno é asserido. Se as dez primeiras chamadas forem recusadas, o teste continua verde. | Guardar os onze resultados e exigir que as dez primeiras sejam true. |

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
