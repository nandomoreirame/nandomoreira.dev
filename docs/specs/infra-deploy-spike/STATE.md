---
phase: plan-complete
spec_path: docs/specs/infra-deploy-spike/SPEC.md
plan_path: docs/plans/2026-08-08-infra-deploy-spike.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "@astrojs/node standalone em vez de @apphosting/astro-adapter (0.0.1, abandonado)"
  - "Prova de SSR por /api/health com corpo variável entre chamadas"
  - "Escopo mínimo: sem Tailwind, sem content collections"
  - "Tempo de caixa de 2 dias; estourou, aciona o plano B"
  - "O spike vira a base do projeto, não é descartado"
blockers: []
transitions:
  - "2026-08-08: research (autônomo, derivado de PRD F8 + BRIEF RISK-001)"
  - "2026-08-08: plan-complete"
---

# STATE — infra-deploy-spike

Sprint 1 do roadmap. Bloqueia todas as demais features (F8.1).

Research conduzido em modo autônomo: os requisitos foram derivados de `PRD.md` (F8,
Q1, EC-013), `BRIEF.md` (RISK-001) e `MVP-SCOPE.md` (M1, timeline). Não houve
interview porque o discovery já resolveu as decisões de plataforma no grilling.

O repositório está vazio (só `docs/`). Todas as afirmações técnicas da spec estão
registradas como `assumption` na tabela de Verified Claims: é o spike que as converte
em fato.
