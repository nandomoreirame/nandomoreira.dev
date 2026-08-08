---
phase: complete
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
  - "Região us-east4: o App Hosting não oferece us-east1 (ADR-001)"
  - "Deploy a partir do fonte local, não de repo GitHub conectado (ADR-001)"
  - "REQ-009 atendido pelo shutdown nativo do standalone (ADR-002)"
blockers: []
transitions:
  - "2026-08-08: research (autônomo, derivado de PRD F8 + BRIEF RISK-001)"
  - "2026-08-08: plan-complete"
  - "2026-08-08: implement-complete"
  - "2026-08-08: review (5 achados; região, config não versionada, modelo de deploy, ADR-001 ausente, portão local com falso positivo)"
  - "2026-08-08: complete (achados resolvidos, plano A confirmado em ADR-001)"
---

# STATE — infra-deploy-spike

Sprint 1 do roadmap, **concluída**. O gate F8.1 fechou: `docs/adr/001-hosting-platform.md`
declara plano A confirmado, então a sprint 2 está liberada.

Astro 7.2.0 SSR com `@astrojs/node` 11.1.0 standalone está no ar em
`https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app`. RISK-001 fechado e Q1 do
PRD respondida.

## Achados da revisão e resolução

| # | Achado | Resolução |
|---|--------|-----------|
| 1 | `docs/adr/001-hosting-platform.md` não existia (REQ-007, REQ-008) | ADR escrito com a evidência de produção |
| 2 | Backend em `us-east4`, documentos diziam `us-east1` | `us-east1` não existe no App Hosting; BRIEF, PRD, MVP-SCOPE, SPEC, plano e CLAUDE.md corrigidos |
| 3 | `firebase.json` e `.firebaserc` fora do versionamento (REQ-005) | Versionados |
| 4 | Sem repo GitHub conectado, e a Task 9 documentava `--git-commit` | Task 9 reescrita para deploy a partir do fonte local; decisão registrada no ADR-001 |
| 5 | `verify-local-server.sh` podia dar PASS validando processo alheio na porta | Checa o PID no start, falha se nunca ficar pronto, e escopa o check de bind ao próprio PID |

## Dívida deixada em aberto

- Repositório GitHub não conectado ao backend, então não dá para responder qual commit está servindo. Recomendado conectar antes do cutover (sprint 6).
- REQ-011 (lint e type-check em CI) segue pendente. É P3, e `npm run verify` já cobre localmente.
