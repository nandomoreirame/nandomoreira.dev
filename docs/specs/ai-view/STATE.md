---
feature: ai-view
phase: none
started_at: 2026-10-08
depth: standard
spec_path: docs/specs/ai-view/SPEC.md
plan_path: docs/plans/2026-10-08-ai-view.md
---

# Estado: ai-view

Implementado em 2026-10-08, 10 tarefas.

- Grok implementou as Tasks 1 a 6 e estourou o tempo limite no meio da Task 7; o Claude assumiu da 7 em diante. O Codex estava sem cota (até 2026-11-06), então a revisão foi do Claude.
- Evidência: `npm run verify` verde (1075 unitários, 13 de build, 0 erros no check), `AEO ROUTES PASSED`, `KEYBOARD WALK PASSED`, `VIEWPORT 320 PASSED`.
- A verificação de 320px achou dois estouros reais em `/lab/forja/ia` (URL no bloco Título/URL e link longo no markdown renderizado), corrigidos com quebra de palavra.
- Portão de vazamento provado vermelho com um builder de página vazando e-mail.

## Pendência fora desta feature

`npm audit --omit=dev`: 24 vulnerabilidades (2 críticas, 12 altas), todas anteriores à feature, entre elas Astro 7.2.0 (RCE via otimização AVIF e bypass de autorização), `@astrojs/node`, `@modelcontextprotocol/sdk` e `sharp`. Bloqueia o deploy pelo checklist de pré-deploy.
