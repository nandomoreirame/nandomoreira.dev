---
phase: plan-complete
spec_path: docs/specs/design-system-foundation/SPEC.md
plan_path: docs/plans/2026-08-08-design-system-foundation.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "Tokens em @theme do Tailwind 4, no CSS, sem arquivo de configuração"
  - "Componentes em Astro puro, sem biblioteca de UI (REQ-008: zero JS de cliente)"
  - "Borda em vez de sombra para elevação, por causa do fundo quase preto"
  - "Fontes locais, sem CDN"
  - "Teste que varre src/ reprovando literal fora da escala (REQ-002 vira portão)"
  - "border (1,31:1) nunca como único delimitador de alvo interativo"
blockers:
  - "Depende do ADR docs/adr/001-hosting-platform.md (sprint 1) existir. A feature é de build e não muda entre plano A e B, mas o gate F8.1 vale"
transitions:
  - "2026-08-08: research (autônomo, derivado de DESIGN-GUIDELINES.md + MVP-SCOPE decisões de simplificação)"
  - "2026-08-08: plan-complete"
---

# STATE — design-system-foundation

Sprint 2 do roadmap, junto com `content-data-layer` e `project-catalog`. Sustenta F1 e
F2, que não conseguem começar sem tokens e componentes base.

Não tem ID no PRD: os requisitos foram derivados de `DESIGN-GUIDELINES.md` inteiro,
mais os requisitos não funcionais de acessibilidade e performance do `PRD.md` e as
decisões de simplificação do `MVP-SCOPE.md`.

A restrição que mais amarra o desenho: `border` (`#262626`) reprova WCAG AA com 1,31:1
sobre o fundo. Isso não é detalhe de paleta, é regra que precisa estar codificada nos
componentes (REQ-004), senão vaza para produção como alvo interativo invisível.
