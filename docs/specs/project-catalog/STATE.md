---
phase: plan-complete
spec_path: docs/specs/project-catalog/SPEC.md
plan_path: docs/plans/2026-08-08-project-catalog.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "Rota dinâmica [slug].astro com getStaticPaths derivado da collection"
  - "JSON-LD por case decidido aqui, não em aeo-base: o tipo depende do artefato"
  - "liveUrl presente é SoftwareApplication; senão CreativeWork"
  - "Slug inexistente responde 404 real, não redireciona"
  - "Bloco vazio aparece com estado explícito, não some"
  - "Sem carrossel de imagens: exige estado no cliente"
  - "Página de case sem lógica própria de confidencialidade (fica na camada de acesso)"
blockers:
  - "Depende de content-data-layer (camada de acesso) e design-system-foundation (componentes). É a última das três features da sprint 2"
transitions:
  - "2026-08-08: research (autônomo, derivado de PRD F2 + Flow 1 + EC-001/003/011)"
  - "2026-08-08: plan-complete"
---

# STATE — project-catalog

Sprint 2 do roadmap, depois de `content-data-layer` e `design-system-foundation`.
Entrega o milestone M2: catálogo renderizando a partir da content collection com 1 case
real.

Só a estrutura entra aqui. O texto dos 8 cases é da sprint 3 (`case-content`), e a
separação é deliberada: o `PRD.md` diz que F2 entrega "a estrutura, o schema e o
cadastro", com o conteúdo escrito pelo autor.

Duas decisões que valem revisitar se algo mudar: o JSON-LD do case mora nesta feature
(não em `aeo-base`) porque o tipo depende do artefato, e o bloco vazio é renderizado em
vez de omitido porque é o sinal mais direto de que a Definition of Done (2 cases por
bloco) ainda não fechou.
