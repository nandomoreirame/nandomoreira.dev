# Spec: post-review

> Revisor de texto dos posts, só no `astro dev`: o autor grifa trechos de um post, escreve o pedido de mudança ou o texto substituto, e salva tudo num `.md` que o Claude lê para editar `src/content/posts/<slug>.md`. Pedido do autor em 2026-10-21.

## Contexto

Ferramentas parecidas existem ([Agentation](https://agentation.dev), extensões de grifar com exportação em Markdown), mas nenhuma sabe qual arquivo-fonte gerou a página. O ganho aqui é a ligação direta entre o grifo e o `.md` do post, com a linha provável.

O site barra JavaScript de cliente fora de uma lista de exceções nomeadas (`tests/design-system/no-client-js.build-test.ts`). O revisor não entra nessa lista porque nunca chega ao build: é um app da Dev Toolbar do Astro (`addDevToolbarApp`), que só existe no `astro dev`. O canal entre o navegador e o disco é o par `toolbar.on`/`toolbar.send` do hook `astro:server:setup`, também só do dev. Assim o revisor não precisa de rota HTTP nova.

## Requisitos

1. [REQ-001] QUANDO o site rodar em `astro dev` ENTÃO a Dev Toolbar DEVE ter o app "Revisar texto" (`id: post-review`). QUANDO o site for construído (`astro build`, inclusive `--mode staging`) ENTÃO nenhum arquivo, script ou marcador do revisor DEVE existir em `dist/`.
2. [REQ-002] QUANDO a página de post renderizar ENTÃO o `<article data-reader-article>` DEVE carregar `data-post-slug="<slug>"`. Em qualquer outra página o app DEVE mostrar "Abra um post para revisar" e não aceitar anotações.
3. [REQ-003] QUANDO o app estiver ligado e o autor selecionar texto dentro do título, do lead ou do corpo do post (`data-post-lead`, `h1`, `.prose`/conteúdo do `Prose`), com mouse ou teclado, ENTÃO o painel do app DEVE abrir um formulário com a citação e dois campos: "O que mudar" (pedido livre) e "Texto novo" (substituto). Seleção fora dessas áreas DEVE ser ignorada. QUANDO os dois campos estiverem vazios ENTÃO salvar a anotação DEVE ser recusado com a mensagem "Escreva o pedido ou o texto novo".
4. [REQ-004] QUANDO uma anotação for criada ENTÃO ela DEVE guardar: a citação exata (`quote`), até 32 caracteres antes (`prefix`) e depois (`suffix`) no texto do artigo, o título da seção mais próxima acima (`h2`/`h3`, ou `null` antes do primeiro), o pedido e o texto novo. Limites: citação de 1 a 2000 caracteres, pedido até 2000, texto novo até 4000, no máximo 100 anotações por post.
5. [REQ-005] QUANDO houver anotações ENTÃO cada trecho anotado DEVE aparecer marcado na página pela CSS Custom Highlight API (sem alterar o DOM do post), e o painel DEVE listá-las na ordem do texto, cada uma com o botão "Remover". As anotações DEVEM sobreviver a um recarregamento da página (`localStorage`, chave `post-review:<slug>`), com `try/catch` em toda leitura e escrita.
6. [REQ-006] QUANDO o autor clicar "Salvar revisão" ENTÃO o app DEVE enviar `{ slug, annotations }` pelo evento `post-review:save`, e o servidor DEVE validar o payload com Zod (slug no padrão do schema de posts, limites do REQ-004). Payload inválido ou slug sem arquivo em `src/content/posts/<slug>.md` DEVE ser recusado sem escrever nada, e o app DEVE mostrar o motivo.
7. [REQ-007] QUANDO o payload for válido ENTÃO o servidor DEVE gravar `docs/post-reviews/<slug>.md` (sobrescrevendo o anterior) no formato da seção "Formato da saída", e responder `post-review:saved` com o caminho relativo, que o app mostra ("Salvo em docs/post-reviews/<slug>.md").
8. [REQ-008] QUANDO o servidor gravar a revisão ENTÃO cada anotação DEVE trazer a linha provável no `.md` do post: a primeira linha cujo texto, sem a marcação inline do Markdown (`*`, `_`, crases, `[texto](url)` vira `texto`) e com espaços normalizados, contém a citação também normalizada. Sem correspondência, a anotação DEVE dizer "linha não localizada" e o Claude procura pela citação com o contexto.
9. [REQ-009] QUANDO o autor clicar "Limpar" ENTÃO as anotações do post DEVEM sair do painel, da página e do `localStorage`; o arquivo em `docs/post-reviews/` NÃO DEVE ser apagado pelo app.
10. [REQ-010] QUANDO o painel renderizar ENTÃO todo controle DEVE ser alcançável por teclado e ter rótulo acessível; o atalho `Alt+R`, com o app ligado, DEVE abrir o formulário para a seleção atual (seleção por teclado com Shift+setas).

## Formato da saída

`docs/post-reviews/<slug>.md`, em pt-BR, legível por gente e por agente:

```markdown
# Revisão: <título do post>

- Post: src/content/posts/<slug>.md
- Gerada em: <ISO 8601 com offset>
- Anotações: <N>

Aplique cada anotação no arquivo do post. A citação é o texto renderizado; no
fonte ela pode ter marcação Markdown. Use o contexto antes/depois para achar o
trecho certo quando ele se repetir. Não mude nada fora dos trechos anotados.

## 1. <seção ou "Abertura">, linha <L | não localizada>

> <citação>

Contexto: «…<prefix>» [citação] «<suffix>…»

**Pedido:** <pedido ou "(nenhum)">

**Texto novo:**

> <texto novo ou "(nenhum)">
```

## Decisões

| Pergunta | Decisão |
|---|---|
| Ambiente | Só `astro dev` (autor). Homologação e produção ficam de fora |
| Mecanismo | App da Dev Toolbar do Astro + `toolbar.on/send`: dev-only por construção, sem rota HTTP e sem tocar a lista de JS de cliente |
| Saída | Grava `docs/post-reviews/<slug>.md` no repo. Pasta própria porque `docs/reviews/` já é do `/rpi-review` |
| Versionar as revisões? | Não: `docs/post-reviews/` entra no `.gitignore`. É fila de trabalho, não histórico |
| Tipos de anotação | Pedido livre e texto substituto (um dos dois obrigatório). Sem etiquetas e sem comentário geral |
| Escopo | Só posts do blog (`src/content/posts`). Cases e copy de páginas ficam de fora |
| Ancoragem | Citação + prefixo/sufixo (modelo `TextQuoteSelector` do W3C) + seção + linha provável |
| Marcação na página | CSS Custom Highlight API, para não mexer no DOM que o modo leitura e o índice usam |
| Salvar de novo | Sobrescreve o arquivo com a lista inteira, que mora no `localStorage` até "Limpar" |

## Restrições

- Nada do revisor em `dist/`: um teste de build procura o id `post-review` e o nome do evento na saída.
- O servidor grava só dentro de `docs/post-reviews/`, com o nome derivado do slug validado pelo regex do schema de posts (sem caminho vindo do cliente).
- O único texto visível novo em produção é nenhum; `data-post-slug` é atributo, sem texto.
- Estilo do painel com os componentes da Dev Toolbar (`astro-dev-toolbar-window`, `-button`, `-card`), não com Tailwind do site: o canvas é shadow DOM e não recebe o CSS do site, e o portão de valores arbitrários só vale para o site.

## Estratégia de testes

- Funções puras em `src/lib/post-review/` com Vitest (`environment: node`): schema do payload, ancoragem (prefixo/sufixo a partir de texto e offsets), localização da linha, renderização do Markdown, resolução segura do arquivo.
- Handler do servidor testado com um `toolbar` falso e um diretório temporário.
- Lógica de seleção do app com `happy-dom` (já no projeto) no arquivo de teste.
- Página de post: `tests/posts/post-page.test.ts` confere `data-post-slug`.
- Build: `tests/post-review/no-reviewer-in-dist.build-test.ts` prova que nada vaza.
- No fim, `npm run verify` e um teste manual no `astro dev` registrado em `docs/reviews/post-review-manual-check.md`.

## Fora do escopo

- Aplicar as mudanças automaticamente (isso é do Claude lendo o arquivo).
- Comando ou skill nova para aplicar; uma linha no `CLAUDE.md` do projeto basta para indicar o arquivo.
- Revisão no celular ou na homologação.
