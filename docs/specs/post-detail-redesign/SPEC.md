# Spec: post-detail-redesign

> A página de detalhe do post (`src/pages/[slug].astro`) no visual da tela "Scratchpad no Niri" do Stitch (projeto 3626158459540278205, tela `93c4fba6119e4e70ba2ace126812e150`), pedida pelo autor em 2026-10-17. Do Stitch entra o visual; o conteúdo vem do post real. O que já funciona (modo leitura, índice em popover no celular, barra dos blocos de código, capa/arte, JSON-LD) continua funcionando.

## Requisitos

1. [REQ-001] QUANDO a página renderizar ENTÃO ela NÃO DEVE ter trilha de volta (nem o `← Voltar aos posts` atual, nem o `<!-- [←Voltar aos posts] /posts` do Stitch): o item "Blog" do menu já marca a seção. O cabeçalho do artigo DEVE começar pelos selos (quando houver) e pela linha de meta.
2. [REQ-002] QUANDO a página renderizar ENTÃO, acima do `h1`, a linha de meta (mono, `text-small`, `muted-foreground`) DEVE mostrar só: a data longa em `<time datetime>` (sem o prefixo `publicado:` e sem `>`), os `markers` como `#marker` e o ícone Lucide `clock` seguido de "N min de leitura" (`readingMinutes` do corpo do post), separados por `•` (`aria-hidden`). Sem `markers`, a data e os minutos ficam com um separador só. Abaixo do `h1` DEVE vir o `summary` do post como lead (`text-h3`, `muted-foreground`). O `h1` e o lead DEVEM ficar limitados à medida `max-w-list`. Os selos "Rascunho" e "Arquivo" continuam acima da linha de meta.
3. [REQ-003] QUANDO a página renderizar ENTÃO os controles DEVEM ficar numa caixa (`rounded-lg`, borda `border`, fundo `surface`, `p-md`/`md:p-lg`) com, à esquerda, o `ReaderMode` atual sem mudança de comportamento (switch "Modo leitura" e popover de ajustes) e, à direita, separados por um divisor vertical a partir de `md`: os três links de IA **com texto visível** ("Resumir com Claude", "Google AI", "ChatGPT", cada um com `✨` `aria-hidden`), o botão "Copiar link" (`CopyButton`, só aparece com JS e copia a URL canônica do post) e o link `.md` para `/<slug>.md`. Os links de IA e o "Copiar link"/`.md` DEVEM sumir no modo leitura; o switch não. Abaixo do cabeçalho DEVE haver uma linha hairline (`border-border`) na largura do container.
4. [REQ-004] QUANDO o schema de posts validar ENTÃO DEVE aceitar o campo opcional `snapshot`: `{ version?: string (1 a 16 caracteres), items: lista de 1 a 6 pares { label: 1 a 20 caracteres, value: 1 a 32 caracteres } }`. Fora disso o build DEVE falhar. Os 11 posts publicados correntes DEVEM ganhar um `snapshot` tirado do próprio texto (nada inventado); rascunhos e arquivados não.
5. [REQ-005] QUANDO o post tiver `snapshot` ENTÃO a coluna lateral DEVE mostrar, abaixo do índice, o card `// stack snapshot` (rótulo mono no acento, `version` à direita se houver, linha hairline, e um par por linha: rótulo em `muted-foreground` à esquerda, valor em `foreground` à direita, `font-mono text-caption`), dentro de um `<dl>`. A coluna lateral DEVE existir quando houver índice **ou** snapshot. Abaixo de `md` o card DEVE aparecer depois do corpo do texto. O card DEVE sumir no modo leitura.
6. [REQ-006] QUANDO o índice renderizar ENTÃO a partir de `md` ele DEVE ser um card (`rounded-lg`, borda `border`, fundo `surface`, `p-md`) com cabeçalho: ícone Lucide `list` no acento, `Índice de conteúdo` (mono, maiúsculas) e, à direita, "N seções" (N = quantidade de `h2`), separado da lista por linha hairline. Os itens NÃO DEVEM ter número; itens `h3` ficam recuados. O popover do celular, o `aria-current` e o sublinhado continuam como estão.
7. [REQ-007] QUANDO o corpo do post renderizar ENTÃO todo `h2` exceto o primeiro DEVE ter uma linha hairline (`border-border`) acima, separando as seções. Os `h2` NÃO DEVEM ter número. Só na página de post: o `Prose` dos cases e da visão de IA NÃO DEVE mudar.
8. [REQ-008] QUANDO o artigo terminar ENTÃO DEVE vir a caixa "Conversar com o autor" (`rounded-lg`, borda `border`, fundo `surface`): ícone Lucide `square-terminal` no acento, título `h2` "Conversar com o autor", o texto fixo "Ficou alguma dúvida, achou um erro ou quer propor uma melhoria? Me chama por e-mail ou entrega este site para o seu agente." e dois links secundários (nunca `bg-primary`): o e-mail do perfil (`contacts` de `kind: email`) como `mailto:` com `↗`, e `$ curl <site>/AGENTS.md` (em `success`) para `/AGENTS.md`. Mesmo texto em todos os posts. A caixa DEVE sumir no modo leitura.
9. [REQ-009] QUANDO houver posts relacionados ENTÃO a seção DEVE ter o rótulo `// LEITURA COMPLEMENTAR` (mono, maiúsculas, acento, `//` `aria-hidden`), o `h2` "Posts relacionados" em serif e, à direita, o link "Ver todos no blog" com seta para `/posts`; e os até três posts em grade (uma coluna, três a partir de `md`) de cards novos (`RelatedPostCard`): data curta em `<time>`, o primeiro `marker` como `#marker` no acento à direita, título como `h3` com o link esticado sobre o card, `summary` cortado em 3 linhas e o rodapé "Ler artigo" com seta, só visual (`aria-hidden`). Substitui a lista de `ListRow`.
10. [REQ-010] QUANDO o post tiver capa ou arte ENTÃO ela DEVE aparecer depois da linha que fecha o cabeçalho e antes do corpo, na largura do container, mantendo `loading="eager"` e `fetchpriority="high"` na capa.

## Decisões

| Pergunta | Decisão |
|---|---|
| Trilha `<!-- [←Voltar aos posts]` e `> publicado:` (Stitch) | Saem, e a trilha atual também; a meta fica data • tags • minutos (autor, 2026-10-17) |
| Controles de leitura inline (Stitch) | Não: fica o switch "Modo leitura" com o popover atual, dentro da caixa nova (autor, 2026-10-17) |
| Card `// stack snapshot` | Campo opcional `snapshot` no frontmatter; preenchido nos 11 posts publicados a partir do texto (autor) |
| Caixa "Conversar com o autor" | Texto fixo, sem campo por post (autor). Título do Stitch ("...ou questionar o script") era específico deste post |
| Capa/arte (ausentes no Stitch) | Ficam, entre a caixa de controles e o corpo (autor) |
| E-mail `contato@` do Stitch | Sai: o e-mail vem de `profile.contacts` (`oi@nandomoreira.dev` hoje) |
| Chip `focus-workspace-previous` no fim do Stitch | Sai: era conteúdo do post, não do layout |
| Cabeçalho do bloco de código com nome do arquivo (Stitch) | Fora do escopo: a barra atual (Raw, Copiar, numeração) continua; nome de arquivo pede mudança no Shiki |
| Parágrafo de abertura maior (Stitch) | Fora: o corpo já é 18px; o lead é o `summary` acima (REQ-002) |
| Faixa de fundo de ponta a ponta no cabeçalho (Stitch) | Não: só a linha hairline na largura do container, como a seção de posts da home |
| "Copiar link" | `CopyButton` (handler `data-copy` do único script do site) lendo um elemento oculto com a URL canônica; sem JS, não aparece |
| Rótulos dos links de IA | Visíveis, nome acessível começa pelo texto visível (WCAG 2.5.3) e termina em ", abre em nova aba" |
| Números das seções (`01`, `01.`) do Stitch | Saem, no corpo e no índice (autor, 2026-10-17); fica só a linha entre as seções, pelo `Prose` com prop `ruled` |

## Grilling Log

| Pergunta | Resposta (recomendada e adotada) |
|---|---|
| A coluna lateral aparece em post sem índice mas com snapshot? | Sim (REQ-005); sem nenhum dos dois, o texto fica com a largura toda, como hoje |
| No celular, o snapshot vai onde, se o índice é popover? | Depois do corpo, antes da caixa do autor (REQ-005) |
| O `AiSummaryLink` muda no card da home? | Não: ganha uma prop `labelled`; sem ela continua só ícone com tooltip |
| A caixa do autor quebra o portão de um CTA primário? | Não: os dois links são secundários (sem `bg-primary`) |
| Post sem `h2` (antigos) ganha borda estranha? | Não: sem `h2`, nenhuma linha |

## Restrições

Nenhum JavaScript novo (o "Copiar link" usa o handler que já existe), nenhum hex, nenhum valor arbitrário novo do Tailwind (`max-w-list`, `surface`, `border`, `primary`, `success`, `muted-foreground` já existem; CSS novo de `counter` vai em `global.css`), nenhum portão relaxado. Texto visível novo só o desta spec. `getCollection` só na camada de acesso. Ao acrescentar `snapshot` ao schema, pare o `astro dev` e apague `.astro/data-store.json` antes de editar qualquer `.md` (armadilha do store congelado no `CLAUDE.md`).

## Estratégia de testes

Schema por `safeParse` em `tests/content/post-snapshot.test.ts`; cabeçalho do índice em `tests/posts/toc.test.ts`; componentes novos por AstroContainer (`tests/posts/post-snapshot-card.test.ts`, `tests/posts/related-post-card.test.ts`, `tests/posts/author-box.test.ts`); `AiSummaryLink` rotulado em `tests/posts/ai-summary.test.ts`; a página por render em `tests/posts/post-page.test.ts` (cabeçalho, ordem capa/corpo, seções). Presentational puro (classes) fica com teste de fonte só onde já existe. No fim, `npm run verify`.
