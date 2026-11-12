---
slug: i18n-foundation
phase: implement
spec_path: docs/specs/i18n-foundation/SPEC.md
plan_path: docs/plans/2026-10-19-i18n-foundation.md
depends_on: []
updated: 2026-11-12
---

# STATE: i18n-foundation

Spec aprovada pelo Fernando em 2026-10-19. Plano revisado em 2026-10-23, com 35 tarefas (entra a 14b); revisado de novo em 2026-11-12, com 37 (entram a 14c e a 27b). Implementação: `/rpi-implement i18n-foundation`.

A revisão absorve o que chegou depois do plano: teto do script em 2304 B (sobe no máximo até 2560 se a sugestão não couber, D13), tema no rodapé, paleta, Giscus, grade do blog no `__session`, e `/releases` fora do mapa (D14). O aviso de árvore suja em `middleware.ts` e `analytics/` caducou.

Revisão de 2026-11-12: `LiveBar` e `BackToTop` (14c), página e e-mail de confirmação da newsletter (27b), `/curriculo` refeito (tarefa 20), canal `devnull` e link "Links" no rodapé (8 e 13). Decisão pendente do Fernando na 14c: como a faixa de anúncios do Firestore ganha versão em inglês.
