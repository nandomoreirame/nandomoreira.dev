# Spec: Notas

> **Roadmap:** `docs/specs/00-roadmap.md` — F14 promovida de P2 para P0
> **PRD:** F14 (era "Blog", passa a "Notas")
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

O PRD lista "Não é um blog" nos Non-Goals, e o `MVP-SCOPE.md` trata escrever artigos
como armadilha porque compete com os 8 cases, que são o RISK-003, o risco de maior
probabilidade do projeto. A decisão foi tomada mesmo assim, e por um motivo defensável:
H4 do BRIEF supõe que os cases substituem o blog como motor de citação em answer
engine, e essa hipótese só se testa tendo as duas superfícies.

O formato escolhido reduz o risco que o PRD apontava. **Nota não é artigo.** É texto
curto, sem data exibida, sem periodicidade e sem compromisso de volume. A armadilha que
o `MVP-SCOPE.md` descreve é "escrever o blog já que estou escrevendo os cases", e ela
depende de o blog ter fim indefinido. Uma nota não tem.

## Goals

- Uma superfície de texto curto sob `/notas`, no mesmo padrão de linha das demais listagens.
- Nenhuma data visível, em nenhuma superfície humana.
- Notas descobertas por agente pelas mesmas rotas de máquina que já existem.
- Custo marginal de publicação: escrever um markdown e nada mais.

## Context

Esta feature depende de `theme-restyle`, que entrega o componente de linha com coluna
de data opcional (REQ-022 daquela spec). Sem ele não há como listar nota no mesmo
padrão do portfólio e do laboratório.

O nome é decisão do autor: **notas**, não blog. A rota é `/notas` e o título da página é
"Minhas notas". O identificador interno permanece em inglês (`notes`), conforme a
convenção do projeto.

A ausência de data exibida tem uma consequência técnica que não pode ser ignorada: sem
nenhuma data, não há ordem estável entre notas, o RSS não tem `pubDate` e o
`sitemap.xml` não tem `lastmod`. A resolução adotada é manter a data no frontmatter
como **metadado de ordenação e de máquina, nunca renderizada em superfície humana**.

O `MVP-SCOPE.md` e os Non-Goals do `PRD.md` precisam ser reescritos, porque hoje dizem o
contrário. Isso é parte da feature, não efeito colateral.

## Verified Claims

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| O PRD declara "Não é um blog" nos Non-Goals | `docs/PRD.md:48` | yes |
| F14 (Blog) está como P2, v2.0, "se H4 for refutada" | `docs/specs/00-roadmap.md` (tabela Fora do MVP) | yes |
| O `MVP-SCOPE.md` lista o blog em "O que NÃO ENTRA" e como tentação a evitar | `docs/MVP-SCOPE.md:80` | yes |
| Existe camada de acesso única, e nada lê `getCollection` fora dela | `tests/content/single-source.test.ts` | yes (portão verificado) |
| `llms.txt`, `sitemap.xml` e `robots.txt` derivam da camada de acesso | `src/lib/aeo/` | yes |
| O componente de linha aceita item sem data | `docs/specs/theme-restyle/SPEC.md` (REQ-022) | assumption (entregue por aquela feature) |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO uma nota é cadastrada ENTÃO seu schema DEVE exigir título, resumo e corpo, e aceitar como opcionais marcadores de assunto.
2. **[REQ-002]** QUANDO uma nota é renderizada em qualquer superfície humana ENTÃO o sistema NÃO PODE exibir data de publicação nem de atualização.
3. **[REQ-003]** QUANDO uma nota é cadastrada ENTÃO ela DEVE declarar uma data no frontmatter, usada exclusivamente para ordenação, RSS e `lastmod`.
4. **[REQ-004]** QUANDO um visitante acessa `/notas` ENTÃO o sistema DEVE listar as notas no padrão de linha, da mais recente para a mais antiga, com a coluna de data colapsada.
5. **[REQ-005]** QUANDO um visitante acessa `/notas/<slug>` ENTÃO o sistema DEVE apresentar o título e o corpo da nota com a medida de linha do corpo de texto.
6. **[REQ-006]** QUANDO uma rota `/notas/<slug>` é requisitada com um slug inexistente ENTÃO o sistema DEVE responder 404.
7. **[REQ-007]** QUANDO dois arquivos de nota declaram o mesmo slug ENTÃO o build DEVE falhar.
8. **[REQ-008]** QUANDO os dados de nota são obtidos ENTÃO eles DEVEM vir exclusivamente da camada de acesso, como todo o resto do site.
9. **[REQ-009]** QUANDO `llms.txt` é gerado ENTÃO ele DEVE listar as notas publicadas, derivadas da camada de acesso.
10. **[REQ-010]** QUANDO `sitemap.xml` é gerado ENTÃO ele DEVE incluir `/notas` e cada `/notas/<slug>`.
11. **[REQ-011]** QUANDO uma nota é renderizada ENTÃO ela DEVE embutir JSON-LD do tipo apropriado para texto curto.
12. **[REQ-012]** QUANDO não existe nenhuma nota publicada ENTÃO `/notas` DEVE apresentar estado vazio explícito, e a rota NÃO PODE aparecer na navegação principal.
13. **[REQ-013]** QUANDO uma nota é marcada como rascunho ENTÃO ela NÃO PODE aparecer em nenhuma superfície pública, nem humana nem de máquina.

### P2 (Should Have)

14. **[REQ-014]** QUANDO um agente requisita `/rss.xml` ENTÃO o sistema DEVE responder com as notas publicadas, usando a data de frontmatter como `pubDate`.
15. **[REQ-015]** QUANDO uma nota declara marcadores ENTÃO a linha da listagem DEVE exibi-los na coluna à direita, como o portfólio faz com tecnologias.
16. **[REQ-016]** QUANDO uma nota é renderizada ENTÃO ela DEVE oferecer navegação de volta para `/notas`.

### P3 (Nice to Have)

17. **[REQ-017]** QUANDO a home é renderizada ENTÃO ela PODE exibir as notas mais recentes numa seção própria, no mesmo padrão de linha.

## Edge Cases

- **Nenhuma nota publicada** — `/notas` renderiza estado vazio e some da navegação (REQ-012). Um item de menu levando a uma listagem vazia é pior do que não ter o item, e é o estado inicial garantido desta feature.
- **Nota em rascunho** — Fora de tudo: listagem, `sitemap.xml`, `llms.txt` e RSS. Um rascunho no sitemap é conteúdo prometido que não existe.
- **Slug duplicado entre notas** — Falha no build, pela mesma razão do projeto: o slug é rota e identificador de JSON-LD. Vale a mesma lição aprendida em `content-data-layer`, onde o glob do Astro colapsa ids iguais e só avisa.
- **Slug colidindo com o de um projeto** — Não colide: os espaços de rota são distintos (`/notas/<slug>` e `/portfolio/<slug>`). Nenhuma checagem cruzada é necessária.
- **Nota sem marcadores** — Válido. A coluna da direita fica vazia, como acontece com qualquer linha sem marcador.
- **Corpo muito longo** — A medida de linha do corpo já limita a leitura; nota longa é sinal de que deveria ser um case, não uma regra a codificar.
- **Data no frontmatter vazando para a superfície humana** — É o erro mais provável desta feature, porque o dado existe e está a um campo de distância. REQ-002 vira portão automatizado, não recomendação.

## Architecture Decisions

1. **Notas, não blog** — Decisão do autor sobre o nome, e ela carrega o formato: texto curto sem periodicidade. Reduz exatamente o risco que o `MVP-SCOPE.md` apontava, que era o blog não ter fim definido.
2. **Data existe, mas nunca aparece** — Sem nenhuma data não há ordem estável, RSS válido nem `lastmod`. Mantê-la como metadado resolve os três sem contrariar o pedido, que é sobre o que o leitor vê.
3. **Portão contra vazamento de data** — Um teste que renderiza a listagem e a página de nota e reprova qualquer coisa com cara de data. A regra é fácil de violar sem perceber justamente porque o campo está ali.
4. **Coleção própria, camada de acesso compartilhada** — `notes` é uma collection nova, mas o acesso passa pelo mesmo barril de `src/lib/content/`, sob o portão de fonte única que já existe.
5. **Fora da navegação enquanto vazia** — REQ-012. A feature entrega a estrutura, e o conteúdo é do autor; até existir a primeira nota, o menu não promete o que não há.
6. **Rota em português, identificador em inglês** — `/notas` para o leitor, `notes` para o código, seguindo a convenção do projeto.

## Constraints

- Depende de `theme-restyle` estar implementada: o componente de linha com data opcional vem de lá.
- Zero JavaScript de cliente, tema escuro exclusivo, WCAG AA: invioláveis, como no resto do site.
- Todo acesso a conteúdo pela camada única, sob o portão existente.
- A camada de máquina é em inglês; o conteúdo das notas é em português, como o resto da camada humana.
- Exige reescrever os Non-Goals do `PRD.md`, a seção "O que NÃO ENTRA" e a tabela de tentações do `MVP-SCOPE.md`, e mover F14 de P2 para P0 no roadmap.

## Out of Scope

| Item | Reason |
|------|--------|
| Escrever as notas | Conteúdo do autor, como os 8 cases |
| Comentários, reações, newsletter | Fora do escopo do produto |
| Paginação | Sem volume que a justifique, e o formato não prevê acúmulo rápido |
| Categorias ou arquivo por período | Contraria o formato: nota não tem data exibida |
| Busca | Exigiria índice no cliente, contra a decisão de zero JavaScript |
| Imagens de capa e OG por nota | F10, P1, v1.1 |

## Test Strategy

- **Unit:** o schema de nota, cobrindo campos obrigatórios, rascunho e slug em kebab-case; e o filtro que remove rascunho de qualquer consulta pública.
- **Gate:** o portão de REQ-002. Renderiza listagem e página de nota com uma data conhecida no frontmatter e reprova se ela aparecer no HTML, em qualquer formato. É o teste que impede a regressão mais provável da feature.
- **Integration:** `/notas` no padrão de linha com a coluna de data colapsada, ordenação decrescente, e estado vazio quando não há nota publicada.
- **Contract:** `llms.txt` e `sitemap.xml` incluem as notas publicadas e excluem rascunhos. O RSS, quando entrar, valida como XML bem formado.
- **Build:** slug duplicado quebra o build, pelo mesmo mecanismo de loader que `content-data-layer` usa para projetos.
- **Route:** `/notas/<slug>` inexistente responde 404 de verdade, com status, não página 200 de erro.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Schema de nota com título, resumo e corpo | P1 | Pending |
| REQ-002 | Nenhuma data em superfície humana | P1 | Pending |
| REQ-003 | Data no frontmatter para ordenação e máquina | P1 | Pending |
| REQ-004 | `/notas` no padrão de linha, sem coluna de data | P1 | Pending |
| REQ-005 | Página de nota com medida de linha do corpo | P1 | Pending |
| REQ-006 | Slug inexistente responde 404 | P1 | Pending |
| REQ-007 | Slug duplicado quebra o build | P1 | Pending |
| REQ-008 | Acesso pela camada única | P1 | Pending |
| REQ-009 | Notas listadas no `llms.txt` | P1 | Pending |
| REQ-010 | Notas no `sitemap.xml` | P1 | Pending |
| REQ-011 | JSON-LD por nota | P1 | Pending |
| REQ-012 | Estado vazio e fora da navegação enquanto vazia | P1 | Pending |
| REQ-013 | Rascunho fora de toda superfície pública | P1 | Pending |
| REQ-014 | RSS com as notas publicadas | P2 | Pending |
| REQ-015 | Marcadores na coluna da direita | P2 | Pending |
| REQ-016 | Navegação de volta para `/notas` | P2 | Pending |
| REQ-017 | Notas recentes na home | P3 | Pending |
