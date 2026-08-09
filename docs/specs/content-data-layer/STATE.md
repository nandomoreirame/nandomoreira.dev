---
phase: implemented
spec_path: docs/specs/content-data-layer/SPEC.md
plan_path: docs/plans/2026-08-08-content-data-layer.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "Astro Content Collections com Zod 4.x (peer do Astro 7), sem CMS"
  - "Camada de acesso única em src/lib/content/, com portão contra getCollection fora dela"
  - "Filtragem de confidencialidade na leitura, não na escrita; strip case-insensitive; images.alt incluso"
  - "slug/liveUrl/repoUrl não são redigidos: case confidential não pode identificar o cliente nesses campos (refinamento Zod)"
  - "slug explícito no frontmatter, não derivado do nome do arquivo"
  - "Regra de integridade de link como refinamento Zod: build falha, não é convenção"
  - "REQ-010: unique slug no loader (varredura de arquivos), porque o glob colapsa ids iguais"
  - "Ordem dos blocos em constante declarada, não alfabética"
  - "Sprint 3: os três services do profile apontam a forja por ser o único case; trocar caseSlug quando os 8 existirem"
blockers: []
transitions:
  - "2026-08-08: research (autônomo, derivado de PRD F3 + Data Models + Edge Cases)"
  - "2026-08-08: plan-complete"
  - "2026-08-08: implemented (review findings REQ-009/REQ-010/Zod 4 aplicados)"
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
