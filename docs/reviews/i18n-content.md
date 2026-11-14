# Review: i18n-content

- **Round:** 2026-11-13
- **Open findings:** 2
- **State:** awaiting independent review
- **Independent review:** pending (self-assessment)

> File rewritten whole on every `/rpi review`. A finding only disappears from here
> because it stopped existing in the code: whoever fixes it does not mark it resolved.

<!-- findings:begin -->

| Severity | File:line | Issue | Suggested fix |
|----------|-----------|-------|---------------|
| Critical | (gate) | tier1 FAIL (2): prettier --check . falha em formatação e no template tools/stats/templates/body.html; npm test tem 9 falhas em confetti, code-contrast e autowriter-run. Tipos e build aprovados; eslint ausente. | fix before anything else |
| Spec | — | — | — |
| Medium | src/lib/aeo/llms-txt.ts:20 | REQ-014: MACHINE_ROUTES e AGENTS.md ainda anunciam /portfolio/<slug>.md e /lab/<slug>.md, rotas que chamam getProject sem locale e devolvem o case em pt-BR; o ai-index já aponta /en/...md | Anunciar /en/portfolio/<slug>.md e /en/lab/<slug>.md com fallback pt-BR por item, alinhar src/lib/aeo/agents-md.ts:47 e os testes aeo |

<!-- findings:end -->

## Evidências da rodada

- HEAD revisado: `c3f55ba`; correções comparadas a `ad9909b`. Planos e specs mantidos como referência da feature completa.
- Implementador não declarado no relatório anterior nem na invocação. Codex conduziu a rodada; Grok foi o segundo revisor e retornou achados. Nenhuma CLI elegível falhou antes dele. A independência em relação ao implementador permanece pendente.
- Achados atuais de código: 1, todos Medium; 0 corroborado(s) independentemente pelos dois revisores. O Critical adicional da tabela representa os portões vermelhos.
- Tier1 executado para este slug: FAIL (2), com tsc e build aprovados. Formatação reprovada com warnings e erro de parser no template de stats; ESLint indisponível. Logs: `/tmp/rpi-i18n-rereview/`.
- Execução detalhada no mesmo HEAD: 3.975/3.984 testes aprovados, 9 falhas nos mesmos três arquivos registrados na rodada anterior. Todos os 617 testes de i18n passaram. `npm run check`: 0 erros, 0 warnings, 17 hints. Testes de build: 43/43.
- Test signal do delta: 46 arquivos analisados, um alerta de interação sem resultado em `tests/newsletter/handler.test.ts`, um aviso de happy path e `tests/i18n/cases-en.test.ts` sem blocos reconhecidos. Nenhum arquivo marcado como not checked. Esses alertas são insumos e não geram achados duplicados. Glossary check sem linhas.
- Planos legados sem `## Checks`: nenhum veredicto Cn. Nenhuma invariável declarada no PRD.

## Standards

Os portões globais continuam vermelhos. Nenhum vazamento confidencial adicional encontrado na leitura e fusão das sobreposições. Nenhum novo smell bloqueante comprovado.

## Spec

Os achados anteriores de links internos, contagem por ocorrência, testes de rotas de máquina, dados ingleses da visão IA, URL do case Markdown, ai-index, escrita do Now e query/fragmento deixaram de existir no código atual. O problema da tabela afeta a descoberta dos mirrors por agentes e permanece aberto.

Sondagem isolada chamou os geradores de llms.txt e AGENTS.md com o perfil e cases ingleses: ambos anunciam o padrão /lab/<slug>.md. Seguir o mirror de Forja por esse padrão devolveu o summary pt-BR. Log: `/tmp/rpi-i18n-rereview/discovery-probe.log`.

Sugestão de simplificação, não bloqueante: compartilhar a descoberta dos Markdown entre os índices e o ai-index, com a escolha de URL por item já aplicada em casePath.

## Encaminhamento

Lições: nenhuma registrada, promovida ou penalizada nesta rodada aberta. Correção: `/rpi implement i18n-content` na CLI implementadora.
