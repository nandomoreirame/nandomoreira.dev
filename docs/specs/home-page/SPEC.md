# Spec: Home em seções, prova primeiro

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 3
> **PRD:** F1 (F1.1 a F1.5)
> **Status:** draft
> **Criado:** 2026-08-08

## Problem Statement

A home é onde o reposicionamento acontece ou não acontece. Hoje o site apresenta um
desenvolvedor web full-stack genérico, e o avaliador técnico decide em poucos minutos
se vale marcar uma conversa. Se o posicionamento em IA e agentes não estiver visível de
imediato, ele não continua lendo e nada do que vem depois importa.

Há um risco de execução conhecido: três objetivos comerciais (vitrine, consultoria,
posição sênior) com peso igual não convertem nenhum. O `BRIEF.md` resolve isso com
hierarquia explícita e um único CTA primário.

## Goals

- Posicionamento em IA e agentes visível sem rolagem, tanto em 320px quanto em desktop.
- Exatamente um CTA primário acima da dobra, levando ao catálogo.
- Nenhum serviço anunciado sem um case que o comprove.
- Números da trajetória sempre acompanhados da narrativa que explica sua origem.

## Context

Esta feature vem depois dos 8 cases, e a ordem é deliberada. O `MVP-SCOPE.md` lista
"começar pelo hero bonito" como armadilha: o hero é a última coisa que converte quando
não há case por trás, e é a parte mais fácil de refazer depois. O contra-veneno
declarado é escrever os cases primeiro, porque o hero decorre do que eles provam.

A ordem das seções está fixada no `PRD.md`: hero, projetos e experimentos em destaque,
trajetória e números, o que eu faço por você, sobre, contato. Projetos vêm antes de
serviços porque a evidência precede a oferta.

A parte mais delicada é a trajetória. O `BRIEF.md` registra que cerca de 700 das 964
estrelas vêm de temas Jekyll de 2018, não de trabalho com IA. Exibir o número agregado
sem contexto seria enganoso, e omiti-lo desperdiçaria a prova social mais forte que
existe. A resolução do grilling foi narrativa de trajetória assumida (RISK-004), e isso
é requisito, não estilo.

`content-data-layer` já garante o que a home precisa: `getFeaturedProjects` para os
destaques e `getProfile` para posicionamento, trajetória, serviços e contatos. O schema
de perfil já exige que todo serviço aponte para um `caseSlug` e que todo item de
trajetória tenha `context` não vazio.

## Verified Claims

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| `getFeaturedProjects` e `getProfile` existem na camada de acesso | `docs/plans/2026-08-08-content-data-layer.md` (Task 9) | assumption |
| O schema de perfil exige `caseSlug` não vazio em cada serviço | `docs/plans/2026-08-08-content-data-layer.md` (Task 4) | assumption |
| O schema de perfil exige `context` não vazio em cada item de trajetória | `docs/plans/2026-08-08-content-data-layer.md` (Task 4) | assumption |
| `StatItem` falha em build se receber número sem contexto | `docs/plans/2026-08-08-design-system-foundation.md` (Task 10) | assumption |
| `SiteNav` e `BaseLayout` já existem com skip link e container | `docs/plans/2026-08-08-project-catalog.md` (Task 10) | assumption |
| Cerca de 700 das 964 estrelas vêm de repositórios Jekyll de 2018 | `docs/BRIEF.md:190` | assumption |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um visitante acessa a home ENTÃO o sistema DEVE exibir o posicionamento em IA e agentes e um único CTA primário que leva ao catálogo.
2. **[REQ-002]** QUANDO a home é renderizada ENTÃO ela NÃO PODE conter mais de um CTA de peso primário na página inteira.
3. **[REQ-003]** QUANDO o hero é renderizado em qualquer viewport a partir de 320px ENTÃO o posicionamento e o CTA primário DEVEM estar visíveis sem rolagem.
4. **[REQ-004]** QUANDO a home é renderizada ENTÃO as seções DEVEM aparecer na ordem hero, destaques, trajetória, serviços, sobre e contato.
5. **[REQ-005]** QUANDO a seção de trajetória é exibida ENTÃO cada número DEVE vir acompanhado da narrativa que explica sua origem.
6. **[REQ-006]** QUANDO a seção de serviços é exibida ENTÃO cada serviço DEVE referenciar ao menos um case que o comprove, e o build DEVE falhar se algum serviço apontar para um slug inexistente.
7. **[REQ-007]** QUANDO a seção de contato é exibida ENTÃO ela DEVE oferecer ao menos um canal direto, sem formulário obrigatório.
8. **[REQ-008]** QUANDO a home é renderizada em qualquer viewport a partir de 320px ENTÃO ela NÃO PODE produzir scroll horizontal no corpo da página.
9. **[REQ-009]** QUANDO os dados da home são obtidos ENTÃO eles DEVEM vir exclusivamente da camada de acesso de `content-data-layer`.
10. **[REQ-010]** QUANDO a seção de destaques é exibida ENTÃO ela DEVE apresentar os projetos marcados como destaque e um link para o catálogo completo.
11. **[REQ-011]** QUANDO a home é renderizada ENTÃO ela DEVE embutir JSON-LD do tipo `Person`, derivado do perfil.
12. **[REQ-012]** QUANDO a home é renderizada ENTÃO a hierarquia de heading DEVE começar em `h1` e não PODE pular nível.

### P2 (Should Have)

 1. **[REQ-013]** QUANDO uma seção é referenciada pela navegação ENTÃO ela DEVE ter uma âncora estável, para que `/#projetos` e similares funcionem.
 2. **[REQ-014]** QUANDO um serviço é exibido ENTÃO o case que o comprova DEVE ser clicável a partir dali.
 3. **[REQ-015]** QUANDO a seção sobre é exibida ENTÃO ela DEVE apresentar a bio derivada do perfil, sem texto duplicado no código.

### P3 (Nice to Have)

 1. **[REQ-016]** QUANDO a home é renderizada ENTÃO ela PODE exibir a disponibilidade declarada no perfil, com a data da última atualização.

## Edge Cases

- **Nenhum projeto marcado como destaque** — A seção de destaques renderiza um estado vazio explícito com link para o catálogo, e não some. Sumir esconderia do autor que `featured` não foi configurado.
- **Serviço apontando para slug inexistente** — Build falha (REQ-006). É o único jeito de garantir "nenhum serviço sem case" de forma durável; conferir na revisão não sobrevive a seis sprints.
- **Trajetória com número sem contexto** — Impossível: o schema de perfil e o `StatItem` já falham antes. A regra existe em dois lugares de propósito, porque RISK-004 é de probabilidade alta.
- **Headline muito longa** — O hero quebra em várias linhas e o CTA continua acima da dobra em 320px. Se não couber, o texto encurta; o CTA não desce.
- **Perfil sem contato de e-mail** — Falha na validação do perfil. REQ-007 exige ao menos um canal direto, e um portfólio sem forma de contato falha o objetivo comercial inteiro.
- **Um único case publicado** — A home continua coerente: um destaque, e o link para o catálogo. É o estado possível durante a sprint 3.
- **Disponibilidade desatualizada** — A data vem do perfil e é exibida junto (REQ-016). Um status sem data é pior que nenhum status.
- **Visitante com JavaScript desativado** — Nada muda: a home é inteiramente estática e SSR.

## Architecture Decisions

1. **CTA primário único, verificado por teste** — REQ-002 é a regra que o `BRIEF.md` e o `DESIGN-GUIDELINES.md` mais repetem, e é a mais fácil de violar sem perceber ao adicionar uma seção. Um teste que conta variantes `primary` no HTML renderizado a torna durável.
2. **Validação cruzada serviço-case em build** — O schema de perfil garante que `caseSlug` não é vazio, mas não que aponta para um projeto existente, porque as duas collections são independentes. A checagem cruzada vive nesta feature, que é onde as duas se encontram.
3. **Ordem das seções fixa no código, não configurável** — A ordem é uma decisão de produto (prova antes de oferta), não uma preferência. Torná-la dado convidaria a mudá-la sem revisitar a decisão.
4. **JSON-LD `Person` aqui, `WebSite` em `aeo-base`** — `Person` deriva do perfil, que é o dado desta página. `WebSite` é global e pertence à camada de descoberta.
5. **Uma seção por componente, em `src/components/home/`** — A home tem seis seções com regras distintas. Um único arquivo de 400 linhas tornaria REQ-004 e REQ-002 impossíveis de testar isoladamente.
6. **Contato sem formulário** — O `MVP-SCOPE.md` declara "contato por e-mail direto, sem formulário" como atrito aceitável. O formulário para agente é `/api/hire`, que é outra feature e outra persona.
7. **Trajetória usa `StatItem`, que já recusa número solto** — A regra fica no componente, não na página, para valer em qualquer lugar onde um número apareça.

## Grilling Log

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Como garantir "um único CTA primário" de forma durável | Teste que conta variantes primárias no HTML da home | É a regra mais repetida nos documentos e a mais fácil de quebrar por acidente ao adicionar seção |
| 2 | Onde validar que todo serviço tem case | Checagem cruzada em build, nesta feature | O schema de perfil não enxerga a collection de projetos. As duas só se encontram aqui |
| 3 | Seção de destaques vazia some ou aparece | Aparece, com estado vazio | Sumir esconde do autor que `featured` não foi configurado |
| 4 | Números da trajetória com ou sem contexto | Sempre com, garantido em dois lugares | RISK-004 é de probabilidade alta e o custo de exibir número enganoso é a credibilidade do site inteiro |
| 5 | Disponibilidade entra no P0 | Não, P3 (REQ-016) | O canal de contato já cobre o objetivo. A disponibilidade é dado de agente, e o MCP a serve em F6.5 |
| 6 | Hero com animação de entrada | Não | `DESIGN-GUIDELINES.md`: nenhuma animação atrasa a leitura do conteúdo, e texto não entra com fade a partir do invisível |
| 7 | Seções `sobre` e `contato` como páginas próprias ou seções da home | Seções da home, com âncora | O PRD descreve a home em seções, e a persona escaneia uma página em vez de navegar entre quatro |

## Constraints

- Astro 7.2.0 em `output: 'server'`, sem JavaScript de cliente.
- Consome exclusivamente a camada de acesso de `content-data-layer` (REQ-009).
- Reusa `BaseLayout`, `SiteNav`, `ProjectCard`, `SectionHeader`, `StatItem` e `Button` sem redefinir estilo.
- WCAG AA, com hierarquia de heading sem salto e alvo de toque de 44px.
- Depende dos 8 cases estarem escritos, porque a seção de serviços referencia cases reais e os destaques mostram cases reais.
- Compartilha a semana da sprint 3 com a escrita dos 8 cases, que é o trabalho mais pesado da sprint.

## Out of Scope

| Item | Reason |
|------|--------|
| Hero 3D, WebGL, Three.js | Descartado no PRD por risco de prazo e performance |
| Depoimentos e logos de cliente | Não há material real, e inventar destrói a credibilidade |
| Formulário de contato | `MVP-SCOPE.md` aceita e-mail direto. O canal para agente é F7 |
| Página `/agents` | F9, P1, v1.1 |
| OG image dinâmica | F10, P1, v1.1 |
| Newsletter | Fora do escopo do produto |
| Animação de scroll reveal | Contraria a regra de motion do `DESIGN-GUIDELINES.md` |
| Alternância de idioma | F15, P2, v1.2 |

## Test Strategy

- **Unit:** a validação cruzada serviço-case (dado um perfil e uma lista de slugs, quais serviços apontam para case inexistente). É a única lógica real da feature e a que precisa falhar o build.
- **Integration:** renderização da home via `experimental_AstroContainer` com fixtures de perfil e projetos. As asserções que importam: exatamente um CTA primário (REQ-002), ordem das seis seções por posição no HTML (REQ-004), hierarquia de heading sem salto (REQ-012), presença de um canal de contato (REQ-007), estado vazio quando não há destaque.
- **Contract:** o JSON-LD `Person` embutido é JSON válido e traz `name`, `url` e `sameAs` derivados do perfil.
- **Manual, uma vez:** conferir em 320px real que o posicionamento e o CTA cabem sem rolagem (REQ-003). É a única asserção que teste em `AstroContainer` não alcança, porque depende de altura de viewport.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Posicionamento e CTA primário para o catálogo | P1 | Pending |
| REQ-002 | Exatamente um CTA primário na página | P1 | Pending |
| REQ-003 | Posicionamento e CTA sem rolagem a partir de 320px | P1 | Pending |
| REQ-004 | Seis seções na ordem declarada | P1 | Pending |
| REQ-005 | Número da trajetória sempre com narrativa | P1 | Pending |
| REQ-006 | Serviço sem case existente falha o build | P1 | Pending |
| REQ-007 | Canal de contato direto, sem formulário | P1 | Pending |
| REQ-008 | Sem scroll horizontal a partir de 320px | P1 | Pending |
| REQ-009 | Dados exclusivamente da camada de acesso | P1 | Pending |
| REQ-010 | Destaques mais link para o catálogo completo | P1 | Pending |
| REQ-011 | JSON-LD `Person` derivado do perfil | P1 | Pending |
| REQ-012 | Hierarquia de heading a partir de `h1`, sem salto | P1 | Pending |
| REQ-013 | Âncora estável por seção | P2 | Pending |
| REQ-014 | Case do serviço clicável | P2 | Pending |
| REQ-015 | Bio derivada do perfil, sem duplicação | P2 | Pending |
| REQ-016 | Disponibilidade com data de atualização | P3 | Pending |
