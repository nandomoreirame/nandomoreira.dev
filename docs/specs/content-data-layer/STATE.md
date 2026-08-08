---
phase: plan-complete
spec_path: docs/specs/content-data-layer/SPEC.md
plan_path: docs/plans/2026-08-08-content-data-layer.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "Astro Content Collections com Zod, sem CMS"
  - "Camada de acesso única em src/lib/content/, com portão contra getCollection fora dela"
  - "Filtragem de confidencialidade na leitura, não na escrita"
  - "slug explícito no frontmatter, não derivado do nome do arquivo"
  - "Regra de integridade de link como refinamento Zod: build falha, não é convenção"
  - "Ordem dos blocos em constante declarada, não alfabética"
blockers:
  - "Depende do ADR docs/adr/001-hosting-platform.md (sprint 1). A feature é de build e sobrevive ao plano B"
transitions:
  - "2026-08-08: research (autônomo, derivado de PRD F3 + Data Models + Edge Cases)"
  - "2026-08-08: plan-complete"
---

# STATE — content-data-layer

Sprint 2 do roadmap. É pré-requisito de F1, F2, F4, F5 e F6: cinco features consomem
esta camada, então um erro aqui se propaga por todo o resto do MVP.

O requisito que mais define o desenho é REQ-007 (acesso exclusivamente pela camada de
acesso). Sem ele, "fonte única" vira intenção: a primeira página com pressa importa
`getCollection` direto, a filtragem de confidencialidade deixa de ser aplicada de forma
consistente e as superfícies voltam a divergir, que é exatamente o problema que F3
existe para resolver.

Conteúdo dos 8 cases fica fora: aqui entra o schema mais um case real de exemplo, que é
o que M2 do `MVP-SCOPE.md` exige.
