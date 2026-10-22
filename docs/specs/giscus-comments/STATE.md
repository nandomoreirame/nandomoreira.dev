---
feature: giscus-comments
phase: plan-complete
depth: standard
spec_path: docs/specs/giscus-comments/SPEC.md
plan_path: docs/plans/2026-10-22-giscus-comments.md
started_at: 2026-10-22
updated_at: 2026-10-22
decisions:
  - "Giscus com autenticação GitHub e categoria própria Blog do tipo Announcements"
  - "Somente posts publicados com archived !== true; comentários logo depois de <AuthorBox />"
  - "Mapeamento pathname com modo estrito, idioma pt, sem reações"
  - "Carregamento sob demanda, temas noir/paper sincronizados e fallback para erro ou timeout"
  - "Política de privacidade atualizada na fonte compartilhada para HTML e Markdown"
blockers:
  - "Ativação depende de confirmar Discussions, instalar o app Giscus, criar a categoria Blog e configurar repoId/categoryId públicos"
transitions:
  - "2026-10-22: pesquisa e grilling concluídos; spec aprovada pelo usuário"
  - "2026-10-22: plano concluído com 5 tarefas; posição após AuthorBox confirmada pelo usuário"
---

# Estado: giscus-comments

Planejamento aprovado para comentários Giscus nos posts atuais do blog.
