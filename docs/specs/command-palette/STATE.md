---
slug: command-palette
phase: none
spec_path: docs/specs/command-palette/SPEC.md
plan_path: docs/plans/2026-10-19-command-palette.md
updated: 2026-10-19
---

# STATE: command-palette

Concluída em 2026-10-19. As 15 tarefas foram implementadas, a revisão fechou com zero achados (`docs/reviews/command-palette.md`) e o Fernando verificou no navegador (tarefa 15).

Mudanças pedidas durante a implementação, já refletidas na spec e no `CLAUDE.md`:
- orçamento do script do ponteiro em 2304 B gzip (D2), por causa do `__vitePreload` do Vite;
- botão no canto inferior direito, acima do seletor de IA, com o mesmo hover revelando `+ K`;
- hero sem botões, só a dica `Ctrl K` (no toque, um link para `/sobre`); o portão de CTA primário aceita zero;
- atalhos de uma letra em Geral (`L`, `E`, `M`, `I`), desligados em telas de toque (D6);
- toast ao copiar o link, scroll da página travado com a paleta aberta.

Próxima feature que mexe no mesmo script e no layout: `i18n-foundation`.
