---
feature: giscus-comments
phase: implement
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
  - "Categoria Blog DIC_kwDOTyj5uc4DJVid gravada na config em 2026-10-22. O app Giscus não está instalado: GET https://giscus.app/api/discussions responde 403 \"giscus is not installed on this repository\". Sem o app o widget não abre."
transitions:
  - "2026-10-22: pesquisa e grilling concluídos; spec aprovada pelo usuário"
  - "2026-10-22: plano concluído com 5 tarefas; posição após AuthorBox confirmada pelo usuário"
  - "2026-10-22: implementação iniciada"
---

# Estado: giscus-comments

Implementação dos comentários Giscus nos posts atuais do blog.
