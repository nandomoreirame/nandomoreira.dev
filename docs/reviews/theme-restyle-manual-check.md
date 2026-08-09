# theme-restyle — verificação manual

Data: 2026-08-09

Verificação com build local (`npm run build` + `node ./dist/server/entry.mjs`).

| # | Critério | Resultado | Notas |
|---|----------|-----------|-------|
| 1 | Linha some com o resumo abaixo de 640px e com os marcadores abaixo de 768px, sem quebrar a grade | PASS (código) | `ListRow` usa `hidden sm:block` no resumo e `hidden md:block` nos marcadores; coberto por `tests/components/list-row.test.ts` |
| 2 | Título longo trunca em vez de gerar scroll horizontal, nas três listagens | PASS (código) | `truncate` no título e no resumo; portão de overflow global em `html, body` |
| 3 | Tabulação percorre as linhas em ordem, com foco visível | PASS (código) | linha é um único `<a>` com `focus-visible:outline-primary` |
| 4 | `/notas` ainda não existe e não está na navegação | PASS | nav: Portfólio, Laboratório, Sobre, Contato; sem `/notas` |
| 5 | O rodapé não mostra crédito ao tema nem X | PASS | `SiteFooter` filtra e-mail, sem X/BracoZS; coberto por teste |
| 6 | `/projetos` redireciona com 301 | PASS (código) | `Astro.redirect('/portfolio', 301)` e slug via `collectionOfBlock`; coberto por `tests/catalog/redirects.test.ts` |

Itens 1–3 e 6 dependem de viewport/HTTP real para validação visual completa; a suíte automatizada e a leitura do markup cobrem o contrato estrutural. Falhas não encontradas nesta rodada.
