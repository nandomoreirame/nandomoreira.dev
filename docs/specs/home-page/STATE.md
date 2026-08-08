---
phase: plan-complete
spec_path: docs/specs/home-page/SPEC.md
plan_path: docs/plans/2026-08-08-home-page.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "CTA primário único, verificado por teste que conta variantes no HTML renderizado"
  - "Validação cruzada serviço-case em build: serviço apontando para slug inexistente falha"
  - "Ordem das seis seções fixa no código, não configurável"
  - "JSON-LD Person aqui; WebSite fica em aeo-base"
  - "Uma seção por componente em src/components/home/"
  - "Contato por e-mail direto, sem formulário (o canal de agente é /api/hire)"
blockers:
  - "Depende dos 8 cases escritos: os destaques e a seção de serviços referenciam cases reais"
transitions:
  - "2026-08-08: research (autônomo, derivado de PRD F1 + US-001/004/005 + BRIEF hierarquia de CTA)"
  - "2026-08-08: plan-complete"
---

# STATE — home-page

Sprint 3 do roadmap, junto com a escrita dos 8 cases (`case-content`). A ordem interna
da sprint importa: os cases primeiro, a home depois. O `MVP-SCOPE.md` lista "começar
pelo hero bonito" como armadilha explícita, porque o hero decorre do que os cases
provam.

Dois requisitos carregam o peso do produto aqui. REQ-002 (exatamente um CTA primário) é
a decisão comercial do `BRIEF.md` sobre hierarquia de objetivos, e é a mais fácil de
violar por acidente ao acrescentar uma seção. REQ-005 (número sempre com narrativa) é a
mitigação de RISK-004: cerca de 700 das 964 estrelas vêm de temas Jekyll de 2018, e
exibir o agregado sem contexto seria enganoso.

REQ-006 (serviço sem case falha o build) é a validação cruzada que nenhuma das duas
collections consegue fazer sozinha: o schema de perfil não enxerga a collection de
projetos.
