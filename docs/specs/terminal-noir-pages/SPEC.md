# Spec: terminal-noir-pages

> Feature mãe: `docs/specs/terminal-noir-redesign/STATE.md` (fase 7). Aprovada em 2026-10-17.

## Problema

As páginas internas ainda misturam o visual antigo e o Terminal Noir: título em Inter na
`/sobre`, títulos semibold em post e case, seções sem numeração, listagem do blog
compacta demais. As telas internas do Stitch (projeto 3626158459540278205) definem o
padrão. Do Stitch entra só o visual; o conteúdo continua vindo do perfil, das
collections e de `src/lib/`.

## Objetivos

- Toda página interna com o título em Newsreader 400 e a hierarquia das telas do Stitch.
- Listagem do blog no formato do Stitch, com tempo de leitura calculado.
- Nenhum texto ou número inventado; nenhum JavaScript novo; nenhum portão relaxado.

## Contexto

Fases 1 a 6 da feature mãe já entregaram tokens, fontes, moldura, `Card`,
`TerminalWindow`, `StatusDot`, `Button` com seta, `PageHeader` em Newsreader, linhas de
lista e a home. Esta feature cobre as páginas que faltam.

## Afirmações verificadas

| Afirmação | Fonte (arquivo:linha) | Verificada |
|---|---|---|
| `SectionHeader` aceita `index` mas não o exibe | `src/components/ui/SectionHeader.astro:7` (`index?: number`), `:11` (não desestrutura `index`) | sim |
| A home passa `index` para `CollectionSection`, que o repassa | `src/pages/index.astro` (`index={1}`, `index={2}`) | sim |
| `NowSection` desenha o próprio h2 em serifa semibold | `src/components/now/NowSection.astro:12` | sim |
| Seções do Setup vêm de `SETUP_SECTIONS` | `src/lib/setup/setup.ts:46` | sim |
| O h2 das seções do Setup está dentro do `Prose` | `src/pages/setup.astro` (`<Prose>` envolve o `map` das seções) | sim |
| Só `posts.ts` chama `getCollection('posts')`, e o corpo está em `entry.body` | `src/lib/content/posts.ts:81`, `:96` (`load` devolve só `entry.data`) | sim |
| "Atualizada em" aparece em três páginas | `src/pages/now.astro:32`, `src/pages/privacidade.astro:27`, `src/pages/setup.astro:21` | sim |
| Labels do formulário já são mono caixa alta; campos já em `bg-background` | `src/pages/contato.astro:22`, `:24` | sim |
| `h1` da `/sobre` em Inter semibold | `src/pages/sobre.astro:46` | sim |
| `h1` do post e do case em serifa semibold | `src/pages/[slug].astro:93`, `src/components/catalog/CaseArticle.astro:36` | sim |
| `/posts` e o arquivo por ano usam `ListRow` | `src/pages/posts/index.astro:39`, `src/pages/posts/arquivo/[year].astro:59` | sim |
| `ArtRow` não recebe `liveUrl` | `src/components/catalog/CollectionListing.astro:45` | sim |
| Disponibilidade tem `detail` | `src/content/schemas/profile.ts:19` | sim |
| A URL do MCP é `absoluteUrl(site, '/api/mcp')` | `src/lib/aeo/hire-brief.ts:40` | sim |

## Requisitos

### P1

1. [REQ-001] QUANDO o `SectionHeader` receber `step` ENTÃO o sistema DEVE exibir o número com dois dígitos seguido de `//` (mono, no acento, oculto de leitor de tela) antes do título, com o título em Inter (`text-h3 font-medium text-foreground`); sem `step`, o sistema DEVE manter o cabeçalho atual, inclusive na home, que passa `index`.
2. [REQ-002] QUANDO a `/setup` renderizar ENTÃO o sistema DEVE abrir cada seção com o cabeçalho numerado, na ordem de `SETUP_SECTIONS`, com o corpo da seção em `Prose` e os itens em lista (nome, motivo, atalhos) sem mudança de texto.
3. [REQ-003] QUANDO a `/now` renderizar ENTÃO o sistema DEVE abrir cada seção com o cabeçalho numerado, na ordem da página, e DEVE pôr o bloco "Foco" dentro de um `Card`.
4. [REQ-004] QUANDO a `/sobre` renderizar ENTÃO o sistema DEVE desenhar o `h1` em Newsreader 400 (`font-serif font-normal tracking-tight`), a experiência como linha do tempo (fio vertical, marcador por cargo, o cargo atual no acento, período num chip mono) e os resultados em `Card`.
5. [REQ-005] QUANDO a `/contato` renderizar em `lg` ou mais ENTÃO o sistema DEVE pôr o formulário à esquerda, num `Card`, e à direita o brief AGENTS.md em `TerminalWindow` (sem a coluna do pitch) e um card "MCP" com `https://nandomoreira.dev/api/mcp` e Copiar; abaixo de `lg`, o sistema DEVE empilhar com o formulário primeiro.
6. [REQ-006] QUANDO um post ou um case renderizar ENTÃO o sistema DEVE desenhar o `h1` em Newsreader 400 com `tracking-tight`, sem `font-semibold`.
7. [REQ-008] QUANDO a camada de acesso carregar um post ENTÃO o sistema DEVE anexar `readingMinutes`: palavras do corpo em markdown ÷ 200, arredondado para cima, mínimo 1, sem contar blocos de código, sintaxe de markdown nem frontmatter; a conta DEVE ser uma função pura em `src/lib/posts/reading-time.ts`.
8. [REQ-009] QUANDO `/posts` ou `/posts/arquivo/<ano>` renderizar ENTÃO o sistema DEVE desenhar cada post com o componente `PostRow`: linha de meta mono (chip "Rascunho" quando for o caso, data, `/`, ícone de relógio e "N min de leitura"), até três marcadores em chips à direita, título em Newsreader 400 grande (`text-h1` a partir de `sm`) que fica âmbar no hover, resumo inteiro e nenhuma seta; a linha toda é o link. A home continua com `ListRow`.
9. [REQ-010] QUANDO um post declarar `extras` no frontmatter ENTÃO o `PostRow` DEVE mostrar, abaixo do resumo, uma linha mono com os itens separados por `•`, o primeiro no acento; o schema DEVE aceitar de 1 a 2 strings de até 60 caracteres; sem `extras`, a linha não aparece.
10. [REQ-011] QUANDO a `/posts` renderizar ENTÃO o sistema DEVE mostrar, junto do lead, um link "RSS" para `/rss.xml` e um chip com o total de posts correntes publicados ("N artigos").
11. [REQ-012] QUANDO um case com `liveUrl` aparecer em `/portfolio` ou `/lab` ENTÃO o `ArtRow` DEVE mostrar "No ar · <domínio>" com o `StatusDot` verde, como texto (a linha inteira já é o link); o domínio vem de `liveUrl` sem protocolo e sem `www.`.
12. [REQ-013] QUANDO a `/setup`, a `/now` ou a `/privacidade` renderizar ENTÃO a linha "Atualizada em" DEVE ser uma faixa mono com ícone de relógio e fio âmbar à esquerda (componente `UpdatedAt`).
13. [REQ-015] QUANDO a `/contato` renderizar o formulário ENTÃO o card do formulário DEVE trazer uma caixa de disponibilidade com o `StatusDot` do status do perfil, o rótulo do status e o `availability.detail`.
14. [REQ-016] QUANDO a home renderizar ENTÃO o sistema DEVE separar as seções depois do hero com um fio de largura total (`border-border`, decorativo).

### P2

15. [REQ-007] QUANDO a `/portfolio` ou a `/lab` renderizar ENTÃO o sistema DEVE fechar a página com um bloco de CTA em `Card`: eyebrow mono, título em Newsreader, uma frase e um `Button` primário com seta para `/contato`. Texto aprovado:
    - Portfólio: eyebrow "Próximo passo"; título "Precisa de algo assim no seu produto?"; frase "Conte o problema e o prazo. Respondo com o que dá para fazer e o que não dá."; botão "Vamos conversar".
    - Lab: eyebrow "Próximo passo"; título "Tem um problema parecido no seu fluxo?"; frase "Boa parte destas ferramentas nasceu de uma dor minha. Se a sua é parecida, me conta."; botão "Vamos conversar".
16. [REQ-014] QUANDO a `/now` renderizar ENTÃO o sistema DEVE fechar a página com um `Card` "O que é uma página Agora?": "Uma página Agora diz no que a pessoa está focada neste momento, e não tudo o que já fez. A ideia é do Derek Sivers, e o nownownow.com reúne as que existem." com link externo para `https://nownownow.com`.

## Casos de borda

- Post sem corpo ou só com código: `readingMinutes` é 1.
- `extras` com mais de 2 itens ou item acima de 60 caracteres: o schema quebra o build.
- `liveUrl` com subdomínio (`app.exemplo.com`): mantém o subdomínio, tira só `www.`.
- Disponibilidade `closed`: a caixa do Contato mostra o ponto vermelho, sem pulsar.
- Formulário enviado (`envio`): o `EmptyState` de sucesso substitui o formulário dentro do mesmo card; a coluna direita continua.

## Decisões

| Pergunta | Decisão |
|---|---|
| Prop da numeração | `step`, separada de `index`, para não numerar a home |
| AgentBrief na `/contato` | `variant="panel"`: só a janela |
| Copiar do MCP | `CopyButton` apontando para `<code id="mcp-url">`, sem script novo |
| Linha do tempo | CSS puro; "atual" é cargo sem `endDate` |
| Tempo de leitura | Na camada de acesso (`src/lib/content/posts.ts`), tipo `PostSummary = Post & { readingMinutes }` |
| Data na listagem | Mantém "16 out. 2026" |
| Fio entre seções da home | Componente `SectionRule` de largura total (`relative left-1/2 w-screen -translate-x-1/2`), sem valor arbitrário |
| Cabeçalho dentro do Prose | Setup e Agora tiram o cabeçalho de dentro do `Prose`; só o corpo da seção fica nele |

## Restrições

- Nenhum JavaScript novo; nenhum hex ou valor arbitrário novo; contraste pelos tokens.
- Nenhum portão relaxado; o formulário e o `/api/hire` não mudam de comportamento.
- Texto visível em pt-BR; identificadores e comentários em inglês.

## Fora do escopo

| Item | Motivo |
|---|---|
| Conteúdo inventado pelo Stitch (hardware, ferramentas, biografia, "Vida pessoal", "NDA Ready", métricas por post) | Não é do autor |
| Cards por item no Setup | Decisão do autor: seções numeradas, itens em lista |
| Card lateral de status na `/sobre` | Decisão do autor: linha do tempo, sem card |
| Filtros por tag, paginação e newsletter do blog | Feature à parte |
| Faixa de seguidores e repositórios do Lab | Número sem narrativa (RISK-004) |
| Variantes de eyebrow | Comparação adiada para o fim do redesign |
| Preencher `extras` nos posts | O autor escreve quando quiser |

## Estratégia de testes

- Unit: `readingMinutes` (função pura), `liveHost`, schema de `extras`.
- Componentes por AstroContainer: `SectionHeader` com `step`, `PostRow`, `UpdatedAt`, `SectionRule`, `AgentBrief` panel, `ArtRow` com status, `Experience` como linha do tempo.
- Páginas: `/setup`, `/now`, `/sobre`, `/contato`, `/posts`, `/portfolio`, `/lab`, post e case, checando estrutura e classes.
- Fim: `npm run verify` e conferência no navegador em 1280 e 390px.

## Rastreabilidade

| ID | Descrição | Prioridade | Status |
|---|---|---|---|
| REQ-001 | Seção numerada no SectionHeader | P1 | Pendente |
| REQ-002 | Setup com seções numeradas | P1 | Pendente |
| REQ-003 | Agora com seções numeradas e Foco em Card | P1 | Pendente |
| REQ-004 | Sobre: h1, linha do tempo, resultados em Card | P1 | Pendente |
| REQ-005 | Contato em duas colunas com card do MCP | P1 | Pendente |
| REQ-006 | h1 de post e case em Newsreader 400 | P1 | Pendente |
| REQ-007 | CTA final em Portfólio e Lab | P2 | Pendente |
| REQ-008 | Tempo de leitura na camada de acesso | P1 | Pendente |
| REQ-009 | PostRow no blog e no arquivo | P1 | Pendente |
| REQ-010 | Campo `extras` opcional | P1 | Pendente |
| REQ-011 | RSS e total de artigos no blog | P1 | Pendente |
| REQ-012 | Status "No ar" nos cases com liveUrl | P1 | Pendente |
| REQ-013 | Faixa "Atualizada em" | P1 | Pendente |
| REQ-014 | Card "O que é uma página Agora?" | P2 | Pendente |
| REQ-015 | Disponibilidade no card do formulário | P1 | Pendente |
| REQ-016 | Fio entre seções da home | P1 | Pendente |
