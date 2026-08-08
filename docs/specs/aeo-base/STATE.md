---
phase: plan-complete
spec_path: docs/specs/aeo-base/SPEC.md
plan_path: docs/plans/2026-08-08-aeo-base.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "Rotas de máquina como endpoints Astro derivados da camada de acesso, não arquivos em public/"
  - "sitemap.xml gerado por código próprio, não por @astrojs/sitemap"
  - "JSON-LD WebSite no layout base; Person fica em home-page e por case em project-catalog"
  - "Escape de < centralizado numa função compartilhada pelos três geradores de JSON-LD"
  - "robots.txt com allowlist explícita de crawlers de answer engine"
  - "Nenhum e-mail nas rotas de máquina (REQ-008)"
  - "lastmod derivado do conteúdo, não da data do build"
blockers:
  - "Depende de content-data-layer, home-page e project-catalog. Marginalmente afetada pelo resultado do spike: as quatro rotas de texto sobrevivem ao plano B"
transitions:
  - "2026-08-08: research (autônomo, derivado de PRD F4 + US-006 + EC-010 + NFR de segurança)"
  - "2026-08-08: plan-complete"
---

# STATE — aeo-base

Sprint 4 do roadmap, junto com `structured-resume`. Ao fim desta sprint o conjunto do
corte de emergência do RISK-005 (F1, F2, F3, F4, F5, F8) está completo: o site já
constitui lançamento válido mesmo sem F6 e F7.

É a feature que torna as outras três da camada de máquina descobríveis. Currículo, MCP e
canal de contratação podem funcionar perfeitamente e ainda assim nenhum agente saber que
existem.

O requisito que mais exige atenção é REQ-008 (nenhuma informação sensível), porque a
premissa declarada em EC-010 é crawler hostil: o `robots.txt` é orientação, nunca
controle de acesso. O portão é um teste que varre a saída gerada das quatro rotas
procurando e-mail, chave e caminho absoluto, e ele precisa rodar sobre o conteúdo
renderizado, não sobre o template.

Todo o conteúdo destas rotas é em inglês, por decisão do `BRIEF.md`.
