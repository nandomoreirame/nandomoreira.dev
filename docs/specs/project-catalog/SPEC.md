# Spec: Catálogo de projetos e experimentos

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 2
> **PRD:** F2 (F2.1 a F2.5)
> **Status:** draft
> **Criado:** 2026-08-08

## Problem Statement

O catálogo é a evidência. Sem ele, o site afirma um posicionamento em IA e agentes sem
provar nada, e o `BRIEF.md` diz que o problema nunca foi falta de acervo e sim de
leitura dele.

A persona principal decide em poucos minutos e a frustração declarada no `PRD.md` é
"portfólio que lista tecnologias sem mostrar decisão, escopo ou resultado". O caminho
infeliz do Flow 1 é explícito: um case sem link, sem imagem ou com texto raso encerra a
avaliação ali.

## Goals

- Grid agrupado pelos quatro blocos do acervo, escaneável sem filtro.
- Página de case que apresenta problema, decisões técnicas e resultado, nessa ordem.
- Nenhum link quebrado: projeto com repositório privado omite o link em vez de renderizar um href morto.
- Nenhum card quebrado: projeto sem imagem recebe o fallback determinístico.
- Página de case legível em 320px, incluindo tabela dentro do texto.

## Context

`content-data-layer` (F3) entrega os dados e a camada de acesso;
`design-system-foundation` entrega `BaseLayout`, `ProjectCard`, `TechBadge`,
`SectionHeader`, `CodeBlock` e `Prose`. Esta feature é a superfície que os junta.

O conteúdo dos 8 cases é escrito na sprint 3. Aqui entra a estrutura, o roteamento e a
renderização, validados com o case real que `content-data-layer` cadastra. É o
milestone M2 do `MVP-SCOPE.md`: "Catálogo renderiza a partir da content collection, com
1 case real".

Duas superfícies:

- `/projetos` — grid agrupado pelos quatro blocos.
- `/projetos/<slug>` — página de case, uma por projeto, gerada a partir da collection.

O JSON-LD por case (F2.5) entra aqui e não em `aeo-base`, porque o tipo depende do
artefato: `SoftwareApplication` para software com versão no ar, `CreativeWork` para o
restante. Essa decisão é de quem conhece o dado do case, não da camada de descoberta.

## Verified Claims

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| A camada de acesso expõe `getProjectsByBlock`, `getProject` e `getAllProjects` | `docs/plans/2026-08-08-content-data-layer.md` (Task 9) | assumption |
| `ProjectCard` já resolve o fallback determinístico a partir do slug | `docs/plans/2026-08-08-design-system-foundation.md` (Task 12) | assumption |
| `Prose` limita a medida e faz tabela rolar no próprio container | `docs/plans/2026-08-08-design-system-foundation.md` (Task 12) | assumption |
| Um projeto sempre tem ao menos um entre `repoUrl` e `liveUrl` | `docs/specs/content-data-layer/SPEC.md` (REQ-003) | assumption |
| Os quatro blocos vêm em ordem de posicionamento, com bloco vazio presente | `docs/plans/2026-08-08-content-data-layer.md` (Task 7) | assumption |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um visitante acessa `/projetos` ENTÃO o sistema DEVE exibir os cases agrupados pelos quatro blocos do acervo, na ordem de posicionamento declarada.
2. **[REQ-002]** QUANDO um card é renderizado ENTÃO ele DEVE apresentar nome, uma linha de descrição e as tecnologias principais, e levar à página do case.
3. **[REQ-003]** QUANDO um visitante abre um case ENTÃO o sistema DEVE exibir problema, decisões técnicas e resultado, nessa ordem, mais as imagens e os links disponíveis.
4. **[REQ-004]** QUANDO um projeto tem repositório privado ENTÃO o sistema DEVE omitir o link de repositório e exibir apenas o link da versão no ar.
5. **[REQ-005]** QUANDO um projeto não tem imagem ENTÃO o sistema DEVE aplicar o fallback visual determinístico, e NÃO PODE renderizar card quebrado nem espaço vazio.
6. **[REQ-006]** QUANDO um case é renderizado ENTÃO o sistema DEVE embutir JSON-LD do tipo `SoftwareApplication` quando o projeto tem versão no ar, e `CreativeWork` caso contrário.
7. **[REQ-007]** QUANDO uma rota `/projetos/<slug>` é requisitada com um slug inexistente ENTÃO o sistema DEVE responder 404, e NÃO PODE renderizar página vazia nem lançar erro não tratado.
8. **[REQ-008]** QUANDO qualquer página do catálogo é renderizada em viewport a partir de 320px ENTÃO ela NÃO PODE produzir scroll horizontal no corpo da página.
9. **[REQ-009]** QUANDO o grid é renderizado ENTÃO ele DEVE usar uma coluna a partir de 320px, duas a partir de 640px e três a partir de 1024px.
10. **[REQ-010]** QUANDO um bloco não tem nenhum case ENTÃO o sistema DEVE exibir o bloco com um estado vazio explícito, em vez de omiti-lo silenciosamente.
11. **[REQ-011]** QUANDO os dados de projeto são obtidos ENTÃO eles DEVEM vir exclusivamente da camada de acesso de `content-data-layer`.

### P2 (Should Have)

 1. **[REQ-012]** QUANDO uma imagem de case é renderizada ENTÃO ela DEVE declarar dimensões e usar carregamento preguiçoso fora da primeira dobra, para não estourar o CLS de 0,1.
 2. **[REQ-013]** QUANDO uma página de case é renderizada ENTÃO ela DEVE oferecer navegação de volta ao catálogo e para o bloco a que pertence.
 3. **[REQ-014]** QUANDO um case tem várias imagens ENTÃO elas DEVEM ser apresentadas em sequência legível, sem carrossel nem controle que exija JavaScript.

### P3 (Nice to Have)

 1. **[REQ-015]** QUANDO uma página de case é renderizada ENTÃO ela DEVE sugerir dois outros cases do mesmo bloco ao final.

## Edge Cases

- **Projeto com repositório privado (EC-001)** — `repoUrl` nulo. O bloco de links renderiza só o `liveUrl`. Nunca um `<a href="null">` nem um botão desabilitado sem explicação.
- **Projeto sem imagem (EC-003)** — Fallback determinístico de `ProjectCard`, e a página de case simplesmente não renderiza a seção de imagens.
- **Bloco vazio** — Renderiza com estado vazio explícito (REQ-010). Omitir o bloco esconderia do próprio autor que a Definition of Done ainda não foi cumprida.
- **Slug inexistente** — 404 real, com status HTTP 404 e não uma página 200 dizendo "não encontrado". Um agente que recebe 200 numa rota inexistente conclui que o projeto existe.
- **Case sob confidencialidade (EC-011)** — A camada de acesso já redigiu nome e métrica. A página renderiza o que recebeu, sem lógica própria de confidencialidade, ou a regra passaria a existir em dois lugares.
- **Tabela larga dentro do texto do case** — Rola dentro do container do `Prose`. O corpo da página nunca rola.
- **Título muito longo no card** — Quebra em várias linhas, e todos os cards da linha mantêm a mesma altura para o grid não ficar irregular.
- **Case com muitas tecnologias** — A lista de badges quebra em várias linhas em vez de estourar a largura do card.
- **Um único case no catálogo inteiro** — O grid renderiza um card em uma coluna, sem esticar para preencher a linha. É o estado do M2 e não pode parecer erro.

## Architecture Decisions

1. **Rota dinâmica `[slug].astro` com `getStaticPaths` derivado da collection** — Uma rota manual por case seria duplicação de exatamente aquilo que F3 existe para eliminar. Alternativa descartada: página por arquivo.
2. **JSON-LD por case decidido aqui, não em `aeo-base`** — O tipo depende do artefato e só quem tem o dado do case pode escolher. `aeo-base` cuida do JSON-LD global (`Person`, `WebSite`).
3. **Grid em CSS Grid puro, sem JavaScript** — Nenhuma feature P0 pode enviar JavaScript ao cliente. O filtro (F11) é v1.2 e é justamente a primeira ilha.
4. **Sem carrossel de imagens** — Carrossel exige estado no cliente e esconde conteúdo atrás de interação. Imagens em sequência vertical, que é o que a persona escaneando prefere.
5. **404 real via `Astro.rewrite` ou resposta com status 404** — Um 200 com texto de erro engana agente e mecanismo de busca. O status é a informação.
6. **Página de case sem lógica de confidencialidade** — A redação vive na camada de acesso. Reimplementar aqui criaria duas verdades sobre o mesmo dado.
7. **Ordem fixa problema, decisões, resultado** — É a sequência que o Flow 1 descreve e a que a persona usa para julgar qualidade de raciocínio. Não é configurável por case.

## Grilling Log

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Bloco vazio some ou aparece | Aparece com estado vazio | O bloco vazio é sinal de que a Definition of Done não fechou. Escondê-lo esconde do autor o que mais protege contra RISK-003 |
| 2 | JSON-LD do case fica aqui ou em `aeo-base` | Aqui | O tipo depende do artefato. Centralizar em `aeo-base` obrigaria aquela feature a conhecer a semântica de cada case |
| 3 | Como escolher entre `SoftwareApplication` e `CreativeWork` | Tem `liveUrl` é `SoftwareApplication`; senão `CreativeWork` | Regra determinística a partir de dado que já existe, sem novo campo no schema |
| 4 | Slug inexistente devolve 404 ou redireciona ao catálogo | 404 | Redirecionar faz um agente concluir que a URL era válida. O status é informação |
| 5 | Carrossel de imagens no case | Não | Exige estado no cliente e esconde conteúdo atrás de interação, contra REQ-008 de `design-system-foundation` |
| 6 | Cases relacionados entram no P0 | Não, P3 (REQ-015) | Com 8 cases e um grid agrupado, a navegação lateral já é barata |
| 7 | Página de case em rota `/projetos/<slug>` ou `/cases/<slug>` | `/projetos/<slug>` | A navegação do PRD diz "Projetos", e a URL deve casar com o rótulo que o visitante clicou |

## Constraints

- Astro 7.2.0 em `output: 'server'`, sem JavaScript de cliente.
- Consome exclusivamente a camada de acesso de `content-data-layer` (REQ-011).
- Reusa os componentes de `design-system-foundation` sem redefinir estilo.
- WCAG AA: hierarquia de heading sem salto, link com texto significativo, imagem com `alt` descritivo.
- Compartilha os 4 dias da sprint 2 com as outras duas features. É a última das três, porque depende das duas.
- Conteúdo real dos 8 cases é da sprint 3: aqui só a estrutura, validada com um case.

## Out of Scope

| Item | Reason |
|------|--------|
| O texto dos 8 cases | Sprint 3 (`case-content`) |
| Filtro por bloco ou tecnologia | F11, P1, v1.2. É a primeira ilha interativa |
| Busca no catálogo | Não está no PRD. Com 8 cases não se justifica |
| Demos interativas dentro do case | F13, P2, v2.0 |
| OG image dinâmica por case | F10, P1, v1.1 |
| Paginação | Com 8 cases, paginação é cerimônia |
| Comentários ou reações | Fora do escopo do produto |

## Test Strategy

- **Unit:** a função que escolhe o tipo de JSON-LD a partir do projeto (`liveUrl` presente ou não), e a que monta a lista de links visíveis a partir de `repoUrl` e `liveUrl`. São as duas únicas decisões de lógica da feature, e é onde o erro sai caro (link quebrado, dado estruturado errado).
- **Integration:** renderização do grid e da página de case via `experimental_AstroContainer`, com fixtures cobrindo repositório privado, ausência de imagem, bloco vazio e catálogo com um único case. Asserções sobre o que precisa e o que não pode aparecer no HTML.
- **Contract:** o JSON-LD embutido precisa ser JSON válido e conter os campos obrigatórios do tipo escolhido. Um teste que faz `JSON.parse` do bloco `application/ld+json` pega o erro mais provável, que é interpolação quebrando a sintaxe.
- **Route:** `/projetos/<slug>` inexistente responde 404. Testado pelo handler, não só pela existência do arquivo.
- **Manual, uma vez:** leitura de um case em 320px real e navegação por teclado pelo grid. Lighthouse fica para `launch-hardening`.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Grid agrupado pelos quatro blocos, em ordem declarada | P1 | Pending |
| REQ-002 | Card com nome, descrição, tecnologias e link para o case | P1 | Pending |
| REQ-003 | Case com problema, decisões e resultado, nessa ordem | P1 | Pending |
| REQ-004 | Repositório privado omite o link em vez de quebrá-lo | P1 | Pending |
| REQ-005 | Projeto sem imagem recebe fallback determinístico | P1 | Pending |
| REQ-006 | JSON-LD por case, tipo derivado do artefato | P1 | Pending |
| REQ-007 | Slug inexistente responde 404 | P1 | Pending |
| REQ-008 | Sem scroll horizontal a partir de 320px | P1 | Pending |
| REQ-009 | Grid de 1, 2 e 3 colunas por breakpoint | P1 | Pending |
| REQ-010 | Bloco vazio com estado explícito | P1 | Pending |
| REQ-011 | Dados exclusivamente da camada de acesso | P1 | Pending |
| REQ-012 | Imagem com dimensões e carregamento preguiçoso | P2 | Pending |
| REQ-013 | Navegação de volta ao catálogo e ao bloco | P2 | Pending |
| REQ-014 | Múltiplas imagens em sequência, sem carrossel | P2 | Pending |
| REQ-015 | Sugestão de dois cases do mesmo bloco | P3 | Pending |
