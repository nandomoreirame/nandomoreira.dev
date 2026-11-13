---
slug: i18n-content
phase: implemented
spec_path: docs/specs/i18n-content/SPEC.md
plan_path: docs/plans/2026-10-19-i18n-content.md
depends_on: [i18n-foundation]
updated: 2026-11-13
---

# STATE: i18n-content

Spec aprovada pelo Fernando em 2026-10-19. Plano revisado em 2026-11-12, com 28 tarefas (entra a 19c). Implementação: `/rpi-implement i18n-content`.

Contagem na aprovação: 22 posts não arquivados (16 publicados e 6 rascunhos), não 23. Revisão de 2026-10-23: 28 cases e 25 posts não arquivados (18 publicados e 7 rascunhos). Entraram `camilla-saboia`, `terminal-noir`, dois posts publicados e o rascunho da paleta.

Revisão de 2026-11-12: 28 cases e 33 posts não arquivados (23 publicados e 10 rascunhos). Entraram nove posts (tarefa 19c); a série de dotfiles virou dois posts publicados (commit `89f9fd4`).

## Run rule (2026-11-13, Fernando)

Unattended run: do NOT create git commits. Commit signing goes through 1Password and needs his approval, and he is away. Each finished task is recorded as a tree object under `refs/rpi/NNN-<task>` plus a line in `.git/rpi-ledger.txt` (id, tree, files, commit message). When he is back, turn the snapshots into one signed commit per task (`git commit-tree` per ref, in order), then run the review. Never push.

## Verification (tarefa 26, 2026-11-13)

- `ALL LOCAL CHECKS PASSED` (`bash scripts/verify-local-server.sh`, `PORT=8081`)
- `AEO ROUTES PASSED` (`bash scripts/verify-aeo-routes.sh`, `PORT=8082`)
- `I18N ROUTES PASSED` (`bash scripts/verify-i18n-routes.sh`, `PORT=8083`)
- Posts traduzidos: **33** (28 cases em `projects-en/`)
