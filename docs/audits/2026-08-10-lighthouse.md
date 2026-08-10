# Auditoria Lighthouse — 2026-08-10

> **Feature:** `launch-hardening` (F8) · tarefas T1, T2, T6
> **Reproduzir:** `bash scripts/audit-lighthouse.sh <url> [mais urls...]`

## Contexto da medição

| | |
|---|---|
| Alvo | `https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app` |
| Build servindo | `build-2026-08-09-005` (commit `987cf3f`) |
| Ferramenta | `lighthouse@12` via `npx`, Chrome 151 headless |
| Aquecimento | duas requisições descartadas por URL, porque `minInstances: 0` faz a primeira pagar cold start |

O Lighthouse roda por `npx` e **não** entra em `devDependencies`: `@lhci/cli` arrasta
`tmp <=0.2.5`, um aviso HIGH de path traversal, e o checklist de pré-deploy deste
repositório exige `npm audit` limpo de high e critical. Ferramenta de auditoria sob
demanda não vale um achado permanente na árvore de dependências.

## Resultado

Critério do plano: Performance, Acessibilidade e SEO **acima de 90**.

| Rota | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| `/` | 97 | 100 | 96 | 100 |
| `/lab/amnesia-claude-code` | 99 | 100 | 96 | 100 |
| `/criar-site-completo-com-o-notion` | **75** | **96** | 96 | 100 |

Duas rotas passaram limpo. O post reprovou em performance e foi o único a perder ponto em
acessibilidade. Ambos viraram tarefa, não nota renegociada.

## Achado 1 — contraste no código destacado (acessibilidade)

O Lighthouse reportou `#6a737d` sobre `#24292e`, **3,04:1**, abaixo do mínimo de 4,5:1 para
texto normal. São os comentários do tema `github-dark` do Shiki.

**Por que o portão existente não pegou.** `tests/design-system/contrast.test.ts` lê os
tokens da paleta em `global.css`. O Shiki escreve suas cores **inline**, a partir do
próprio tema, então nunca passaram perto do portão. O site tinha um portão de contraste e
publicou um par reprovado mesmo assim.

**Correção.** Tema trocado para `github-dark-default`, medido e não escolhido por gosto:

| Tema | Fundo | Pior token |
|---|---|---|
| `github-dark` (anterior) | `#24292e` | 3,05 |
| `github-dark-dimmed` | `#22272e` | 3,88 |
| `one-dark-pro` | `#282c34` | 3,73 |
| `dark-plus` | `#1E1E1E` | 5,00 |
| `catppuccin-mocha` | `#1e1e2e` | 5,81 |
| **`github-dark-default`** | `#0d1117` | **6,15** |

**Portão novo:** `tests/design-system/code-contrast.test.ts` renderiza cada post publicado
pelo `AstroContainer` e reprova qualquer token abaixo de 4,5:1 contra o fundo do bloco.
Provado vermelho contra o defeito real antes de virar verde.

## Achado 2 — LCP de 13,2s no post (performance)

| Métrica | Valor | Nota |
|---|---|---|
| First Contentful Paint | 1,1 s | 0,99 |
| **Largest Contentful Paint** | **13,2 s** | **0** |
| Total Blocking Time | 0 ms | 1 |
| Cumulative Layout Shift | 0,019 | 1 |
| Speed Index | 1,8 s | 1 |

Tudo verde menos o LCP, e o LCP é a capa do post.

**Causa.** A capa é `CleanShot_2024-06-09_at_19.55.53.gif`, um GIF **animado** de 1,9 MB que
o pipeline do Astro converte para webp animado de 2,2 MB. A animação é preservada de
propósito (decisão anterior registrada), então o peso é conteúdo, não defeito de build.

**Correção aplicada.** A capa estava com `loading="lazy"`, o padrão do `<Image>` do Astro:
o navegador adiava exatamente o elemento pelo qual a página esperava. Agora é
`loading="eager"` com `fetchpriority="high"`, travado por
`tests/posts/cover-priority.test.ts`.

**O que não foi feito, e por quê.** Reduzir o GIF, trocá-lo por vídeo ou por um poster
estático é decisão de conteúdo do autor, e trocar o formato de mídia é mudança de
arquitetura, que a spec põe fora do escopo. Com 2,2 MB de capa animada, o LCP continuará
alto nesse post específico até essa decisão ser tomada. As outras duas rotas medidas, que
representam os outros dois tipos de página, estão em 97 e 99.

## Próxima medição

Refazer contra o domínio final depois do cutover, com o mesmo comando, e comparar linha a
linha com esta tabela. Um número dito em conversa não permite comparação.
