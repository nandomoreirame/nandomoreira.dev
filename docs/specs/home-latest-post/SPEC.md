# Spec: home-latest-post

> A seção `// POST RECENTE` da tela "Home (Versão Enxuta - Destaque Último Post)" do Stitch (projeto 3626158459540278205, tela `43fe32d1547244928869cfe7e18dc5a3`), pedida pelo autor em 2026-10-17. Só essa seção: portfólio, laboratório e o resto da home ficam como estão. Do Stitch entra o visual; o conteúdo vem do post real.

## Requisitos

1. [REQ-001] QUANDO a home renderizar ENTÃO a seção `id="blog"` DEVE mostrar **um único card**, com o post atual (não arquivado, não rascunho) mais recente, no lugar da lista de quatro `ListRow`. Sem post publicado, a seção NÃO DEVE renderizar.
2. [REQ-002] QUANDO a seção renderizar ENTÃO o cabeçalho DEVE ter, à esquerda, um ponto no acento e o rótulo `// POST RECENTE` em mono, maiúsculas e no acento (`h2`), e à direita o link "Ver todos os posts no blog" para `/posts`, em mono, discreto, com a seta Lucide; o link continua texto, nunca botão primário.
3. [REQ-003] QUANDO o card renderizar ENTÃO a linha de meta DEVE mostrar a data curta (`toShortDate`, em `<time datetime>`) e "N min de leitura" (`readingMinutes`); e, se o post tiver `extras`, um separador `|` e um selo com ponto e o texto de `extras[0]`, na cor `success`. Sem `extras`, sem separador nem selo. O caminho de arquivo do Stitch NÃO DEVE existir.
4. [REQ-004] QUANDO o card renderizar ENTÃO ele DEVE mostrar o título do post como `h3` (fica no acento no hover do card), o `summary` embaixo e, no rodapé separado por linha hairline, até três `markers` como `#marker` e a indicação "Ler artigo completo" com seta, só visual (`aria-hidden`): o card inteiro já é o link para `/<slug>` (REQ-007), e um segundo link para o mesmo destino seria uma parada de tab repetida, como já decidido no `PostRow`.
5. [REQ-005] QUANDO o schema de posts validar ENTÃO DEVE aceitar o campo opcional `keyPoints`: lista de 1 a 3 frases, cada uma de 1 a 140 caracteres. Fora disso o build DEVE falhar.
6. [REQ-006] QUANDO o post tiver `keyPoints` ENTÃO o rodapé DEVE ter o "Preview rápido": um botão com o ícone de terminal ao lado de "Ler artigo completo" (um `<label>` de um checkbox nativo, o padrão do modo leitura) que abre, abaixo da linha inteira, o painel com o rótulo `TL;DR // PONTOS-CHAVE`, os `keyPoints` em lista com marcador `→` em `success` e a linha "Resumir com IA:" com os links do `AiSummaryLink` apontando para `<site>/<slug>.md`. Sem `keyPoints`, NÃO DEVE haver botão nem painel. Troca de 2026-10-17: o `<details>` não permitia o botão na linha e o painel embaixo.
7. [REQ-007] QUANDO o card renderizar ENTÃO ele NÃO DEVE ser um `<a>` envolvendo controles: o link do post DEVE ser o título, esticado sobre o card (pseudo-elemento) para o card inteiro ser clicável, e o checkbox do "Preview rápido", o painel e os links de IA DEVEM ficar acima dele (`relative z-10`) e focáveis por teclado. O foco no link do título DEVE contornar o card inteiro. Nenhum `<button>` ou `onclick`; nenhum JavaScript de cliente novo.

## Decisões

| Pergunta | Decisão |
|---|---|
| Quantidade de posts na home | Só o mais recente, em card; a lista de quatro sai |
| Selo "script v1.4 testado" do Stitch | Vem de `extras[0]`, campo que já existe; sem `extras`, sem selo. Hoje nenhum post tem `extras` |
| Caminho `dotfiles/niri/scratchpad.py` | Sai: era conteúdo inventado |
| "Preview rápido" | Checkbox nativo com `<label>` ao lado de "Ler artigo completo" e painel por `group-has-checked`, sem JS (era `<details>`, trocado em 2026-10-17 para seguir o Stitch); campo novo `keyPoints`; os resumos por IA reaproveitam `AI_SUMMARY_TARGETS` |
| Card inteiro como `<a>` (Stitch) | Não: HTML inválido com controles dentro. Título com link esticado |
| Largura | A do container da página (`max-w-page`, a mesma do menu), sem `max-w-list`; pedido do autor em 2026-10-17, depois de ver o card |

## Restrições

Nenhum JavaScript novo, nenhum hex ou valor arbitrário novo (tokens existentes: `surface`, `surface-elevated`, `border`, `border-strong`, `primary`, `success`, `muted-foreground`), nenhum portão relaxado. Texto visível novo só o desta spec. `getCollection` só na camada de acesso. Ao acrescentar `keyPoints` ao schema, pare o `astro dev` antes de editar qualquer `.md` (armadilha do store congelado no `CLAUDE.md`).

## Estratégia de testes

Schema por `safeParse` em `tests/content/post-key-points.test.ts`; `latestPosts` genérico em `tests/posts/latest.test.ts`; o card por AstroContainer em `tests/home/latest-posts.test.ts` (reescrito) e `tests/home/list-column.test.ts`; a página por leitura do fonte em `tests/home/index-page.test.ts`. No fim, `npm run verify`.
