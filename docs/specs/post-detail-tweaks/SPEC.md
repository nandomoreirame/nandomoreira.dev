# Spec: post-detail-tweaks

> Ajustes menores da página de post depois de `post-detail-redesign`, pedidos pelo autor em 2026-10-17 olhando o dev server; o último item segue o bloco de código da tela "Scratchpad no Niri" do Stitch (projeto 3626158459540278205, tela `93c4fba6119e4e70ba2ace126812e150`).

## Requisitos

1. [REQ-001] QUANDO a página de post renderizar ENTÃO o `h1` e o lead (`data-post-lead`) NÃO DEVEM ter `max-w-list`: ocupam a largura do container, sem o espaço vazio à direita.
2. [REQ-002] QUANDO o índice renderizar ENTÃO o cabeçalho DEVE mostrar só o ícone e `Índice`; a contagem "N seções" NÃO DEVE existir.
3. [REQ-003] QUANDO a caixa "Conversar com o autor" renderizar ENTÃO a fileira de links DEVE começar pelo botão "Contato" (`Button`, variante primária) para `/contato`, seguido do e-mail e do `$ curl`, que continuam secundários. Na página de post ele é o único botão primário.
4. [REQ-004] QUANDO um bloco de código renderizar ENTÃO ele DEVE ter uma barra no topo, sempre visível (não mais só no hover), separada do código por linha hairline: à esquerda um ponto no acento e o rótulo em mono `text-caption` `muted-foreground`; à direita as ações "Raw" e "Copiar" como texto (mono, `text-caption`), sem tooltip. O rótulo DEVE ser o `title="..."` do meta do bloco (ex.: ` ```bash title="bin/scratchpad.sh — scratchpad_toggle()" `); sem `title`, a linguagem do bloco (ex.: `bash`); sem linguagem (`text`, `plaintext`), `texto`. Moldura (borda `border-strong`, `rounded-md`) no bloco inteiro, barra incluída. Raw continua checkbox sem JS; Copiar continua oculto sem JS. Vale para todo bloco do site (posts, cases, visão de IA).
5. [REQ-005] QUANDO um post publicado corrente tiver bloco de código cujo arquivo o próprio texto nomeia (no parágrafo logo antes do bloco ou no próprio código) ENTÃO o bloco DEVE ganhar `title="<arquivo>"`. Nada inventado; sem arquivo nomeado, sem `title`.

## Decisões

| Pergunta | Decisão |
|---|---|
| Variante do "Contato" | Primária: é a ação principal da caixa, e a página de post não tinha outro botão primário |
| Raw na barra nova | Fica, como texto ao lado de "Copiar" (o Stitch só mostra Copiar, mas Raw já existe e não custa espaço) |
| Cor do ponto | Sempre o acento (`primary`); o Stitch varia por bloco sem regra |
| Rótulo sem `title` | A linguagem, para a barra nunca ficar vazia; `texto` para blocos sem linguagem |
| Numeração das linhas | Continua como está |
| Fonte do `title` | Meta do fence; o Astro (satteri) repassa como `options.meta.__raw` ao transformer do Shiki |

## Restrições

Nenhum JavaScript novo (Copiar usa o handler `data-copy` que já existe), nenhum hex, nenhum valor arbitrário novo do Tailwind; CSS novo em `global.css` com tokens. Contraste do código medido em `tests/design-system/code-contrast.test.ts` não pode cair. Texto visível novo só o desta spec.

## Estratégia de testes

Transformer em `tests/code/toolbar.test.ts` (Shiki direto, com `meta: { __raw }`); CSS em `tests/design-system/code-toolbar-css.test.ts`; índice em `tests/posts/toc.test.ts`; caixa em `tests/posts/author-box.test.ts`; página em `tests/posts/post-page.test.ts`. No fim, `npm run verify`.
