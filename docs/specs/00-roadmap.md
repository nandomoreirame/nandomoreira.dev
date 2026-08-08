---
project: nandomoreira-dev
generated_at: 2026-08-08
current_sprint: 1
completed_features: []
total_sprints: 6
source_docs:
  - docs/BRIEF.md
  - docs/PRD.md
  - docs/MVP-SCOPE.md
  - docs/DESIGN-GUIDELINES.md
---

# Roadmap: nandomoreira.dev

## Overview

O portfólio publicado apresenta um desenvolvedor web full-stack genérico enquanto o
trabalho real do último ano é ferramental de agentes de IA, e o site está invisível
para o leitor que hoje faz a triagem inicial: não há `llms.txt`, `sitemap.xml`, dados
estruturados nem rota que um agente possa consultar.

A resposta é um portfólio que é a própria demonstração do que afirma. A camada humana
é 100% em português, escaneável em seções, com 8 cases que explicam a decisão técnica
e não só a lista de tecnologias. A camada de máquina é 100% em inglês: base AEO,
currículo em JSON Resume, servidor MCP com cinco tools e um canal de contratação
verificáveis por qualquer agente sem renderizar a página.

A persona principal é o avaliador técnico decidindo em poucos minutos se vale marcar
uma conversa. A persona secundária, e a tese do produto, é o agente de IA fazendo
triagem em nome dele. A hipótese sob teste é que o problema é de posicionamento e não
de acervo.

## Sprint Table

| Sprint | Slug | Objetivo | Features | Depende de | Done criteria | Esforço |
|--------|------|----------|----------|------------|---------------|---------|
| 1 | `infra-spike` | Provar que Astro 7 SSR sobe no Firebase App Hosting sem o adapter oficial, ou acionar o plano B | `infra-deploy-spike` (F8.1–F8.3) | — | Astro 7 SSR mínimo com `@astrojs/node` standalone e `apphosting.yaml` próprio respondendo em produção; deploy reproduzível por comando documentado. Em caso de falha, plano B (Hosting estático + Cloud Functions) decidido e registrado em ADR | 2 dias |
| 2 | `foundation` | Tokens, componentes base e a fonte única de verdade alimentando um catálogo que renderiza | `design-system-foundation` (—), `content-data-layer` (F3), `project-catalog` (F2) | sprint-1 | Tokens de cor, tipografia, espaçamento e raio no CSS e usados por nome; sete componentes base com todos os estados obrigatórios; catálogo renderizando da content collection com 1 case real; build falha com projeto inválido, comprovado por teste; fallback determinístico de imagem funcionando | 4 dias |
| 3 | `content` | Escrever a evidência e só então montar o hero que ela sustenta | `case-content` (—), `home-page` (F1) | sprint-2 | 8 cases publicados, 2 por bloco nos quatro blocos; nenhum link quebrado em projeto privado; página de case legível em 320px; home com um único CTA primário acima da dobra levando ao catálogo; seções na ordem definida, projetos antes de serviços; nenhum serviço sem case que o comprove; números da trajetória com a narrativa que os contextualiza | 1 semana |
| 4 | `agent-discovery` | Tornar o conteúdo encontrável e consumível por agente sem renderizar página | `aeo-base` (F4), `structured-resume` (F5) | sprint-3 | `/llms.txt`, `/AGENTS.md`, `/robots.txt` e `/sitemap.xml` respondendo 200 em inglês; JSON-LD `Person`, `WebSite` e `CreativeWork`/`SoftwareApplication` passando em validador de dados estruturados; `/api/resume.json` validando contra o schema JSON Resume com a extensão isolada em chave própria; `/api/resume.txt` em texto puro; tudo derivado da fonte única; nenhuma informação sensível nas rotas de máquina | ~3 dias |
| 5 | `agent-action` | O agente deixa de só ler e passa a agir | `mcp-server` (F6), `hire-endpoint` (F7) | sprint-4 | `/api/mcp` com as 5 tools respondendo, validado com um cliente MCP real e não apenas por teste unitário; nenhuma tool retorna dado divergente do site; erro JSON-RPC padronizado sem stack trace; `/api/hire` aceitando payload válido e rejeitando os quatro casos de abuso; registro sobrevive a falha de entrega do e-mail; regras do Firestore negam leitura pública de `hire_requests` | ~4 dias |
| 6 | `launch` | Endurecer e apontar o domínio | `launch-hardening` (F8.4–F8.6) | sprint-5 | Lighthouse acima de 90 em Performance, Acessibilidade e SEO; navegação completa por teclado com foco visível e ordem lógica; sem scroll horizontal em 320px; lint e type-check sem erro; validado em staging; domínio `nandomoreira.dev` apontado; site antigo desativado; revisado em celular real | 3 dias |

### Mapeamento com os milestones do MVP-SCOPE

| Milestone | Sprint |
|-----------|--------|
| M1 — Spike valida o deploy, ou plano B decidido | 1 |
| M2 — Catálogo renderiza da content collection, com 1 case real | 2 |
| M3 — 8 cases escritos e publicados | 3 |
| M4 — Quatro superfícies de agente respondendo, MCP validado com cliente real | 5 |
| M5 — Domínio apontado | 6 |

## Feature Index

Cada feature abaixo vira uma invocação de `/rpi:research <slug>`, salvo as marcadas
como conteúdo. As specs são salvas em `docs/specs/<slug>/SPEC.md`.

| Slug | PRD ID | Prioridade | Sprint | Descrição |
|------|--------|------------|--------|-----------|
| `infra-deploy-spike` | F8 (F8.1–F8.3) | P0 | 1 | Spike de deploy: Astro 7 com `@astrojs/node` standalone no Firebase App Hosting via `apphosting.yaml` próprio. Bloqueia todo o resto |
| `design-system-foundation` | — | P0 | 2 | Tokens semânticos de cor, tipografia, espaçamento, raio e motion, mais os sete componentes base em Astro com todos os estados obrigatórios. Derivada de `DESIGN-GUIDELINES.md`; sustenta F1 e F2 |
| `content-data-layer` | F3 | P0 | 2 | Fonte única de verdade em Astro Content Collections com schema Zod validado em build, alimentando site, currículo, `llms.txt`, JSON-LD e as tools do MCP |
| `project-catalog` | F2 | P0 | 2 | Grid agrupado pelos quatro blocos do acervo e página de case por projeto, com regra de integridade de link e fallback determinístico de imagem |
| `case-content` | — | P0 | 3 | **Conteúdo, não código. Não passa por `/rpi:research`.** Os 8 cases escritos, 2 por bloco. Está no índice por ser o maior risco do projeto (RISK-003) e item da Definition of Done |
| `home-page` | F1 | P0 | 3 | Home em seções escaneáveis com prova antes da oferta, um único CTA primário e cada serviço referenciando um case que o comprove |
| `aeo-base` | F4 | P0 | 4 | Superfície estática de descoberta para agentes e answer engines em inglês: `llms.txt`, `AGENTS.md`, `robots.txt`, `sitemap.xml` e JSON-LD |
| `structured-resume` | F5 | P0 | 4 | Currículo em JSON Resume com bloco de extensão próprio para agentes, tooling de IA e disponibilidade, mais versão em texto puro |
| `mcp-server` | F6 | P0 | 5 | Servidor MCP em `/api/mcp` com o SDK oficial na versão estável do protocolo, expondo `get_profile`, `list_projects`, `get_project`, `get_resume` e `check_availability` |
| `hire-endpoint` | F7 | P0 | 5 | Canal de contratação por agente com validação Zod estrita, limite de tamanho antes do parse, honeypot, rate limit por instância, persistência no Firestore e notificação por e-mail |
| `launch-hardening` | F8 (F8.4–F8.6) | P0 | 6 | Lighthouse, acessibilidade por teclado, validação em staging e cutover do domínio |

### Fora do MVP

Permanecem no PRD e entram depois do lançamento, sem sprint alocada neste roadmap.

| Slug | PRD ID | Prioridade | Versão alvo |
|------|--------|------------|-------------|
| `agents-page` | F9 | P1 | v1.1 |
| `dynamic-og-images` | F10 | P1 | v1.1 |
| `analytics` | F12 | P1 | v1.1 (necessária para fechar H3) |
| `catalog-filter` | F11 | P1 | v1.2 (primeira ilha interativa) |
| `english-pages` | F15 | P2 | v1.2, se H3 se confirmar |
| `interactive-demos` | F13 | P2 | v2.0 |
| `blog` | F14 | P2 | v2.0, se H4 for refutada |

## Riscos que atravessam o roadmap

| # | Risco | Onde aparece | Como o roadmap responde |
|---|-------|--------------|-------------------------|
| RISK-001 | Astro SSR não sobe no App Hosting sem adapter oficial mantido | Sprint 1 | O spike é a sprint 1 inteira e bloqueia todo o resto. Plano B declarado em F8.2 |
| RISK-003 | Os 8 cases nunca são escritos (probabilidade **Alta**) | Sprint 3 | `case-content` é item explícito do índice e a sprint 3 escreve os cases **antes** da home, não depois |
| RISK-005 | Prazo estoura e nada vai ao ar | Fronteira entre sprints 4 e 5 | Ao fim da sprint 4 o conjunto do corte de emergência (F1, F2, F3, F4, F5, F8) está completo. Se o prazo estourar, pula-se a sprint 5 e F6/F7 entram depois, com o site já no ar |
| RISK-002 | `/api/hire` sem rate limit nativo na plataforma | Sprint 5 | Contador em memória por instância, aceito como aproximado. Cloud Armor fica como escalada |
| RISK-004 | Prova social exibida é legado Jekyll de 2018 | Sprint 3 | Narrativa de trajetória assumida na home, em vez de número agregado sem contexto |

## Status de planejamento

Specs e planos das sprints 1 a 4 já existem. As quatro features restantes ficaram de
fora porque dependem do resultado do spike: `structured-resume`, `mcp-server` e
`hire-endpoint` são rotas de servidor, e `launch-hardening` é o cutover, os quatro
reescritos se o plano B for acionado.

| Slug | Sprint | SPEC | Plano |
|------|--------|------|-------|
| `infra-deploy-spike` | 1 | `docs/specs/infra-deploy-spike/SPEC.md` | `docs/plans/2026-08-08-infra-deploy-spike.md` |
| `design-system-foundation` | 2 | `docs/specs/design-system-foundation/SPEC.md` | `docs/plans/2026-08-08-design-system-foundation.md` |
| `content-data-layer` | 2 | `docs/specs/content-data-layer/SPEC.md` | `docs/plans/2026-08-08-content-data-layer.md` |
| `project-catalog` | 2 | `docs/specs/project-catalog/SPEC.md` | `docs/plans/2026-08-08-project-catalog.md` |
| `case-content` | 3 | — (conteúdo) | — |
| `home-page` | 3 | `docs/specs/home-page/SPEC.md` | `docs/plans/2026-08-08-home-page.md` |
| `aeo-base` | 4 | `docs/specs/aeo-base/SPEC.md` | `docs/plans/2026-08-08-aeo-base.md` |
| `structured-resume` | 4 | pendente do spike | pendente do spike |
| `mcp-server` | 5 | pendente do spike | pendente do spike |
| `hire-endpoint` | 5 | pendente do spike | pendente do spike |
| `launch-hardening` | 6 | pendente do spike | pendente do spike |

## Como usar este roadmap

1. Rode `/rpi:research <feature-slug>` para a primeira feature da sprint corrente.
2. Depois que `/rpi:implement` concluir, atualize este arquivo: adicione o slug em
   `completed_features` no frontmatter e incremente `current_sprint` quando a sprint
   fechar.
3. Repita até todas as sprints estarem concluídas.

Ordem sugerida da sprint 2, por dependência: `design-system-foundation` e
`content-data-layer` em paralelo, `project-catalog` depois dos dois.

## Decision Log

- 2026-08-08: Specs e planos gerados até a fronteira do spike (sprints 1 a 4). As
  quatro features de sprint 4b em diante ficam sem spec até o ADR
  `docs/adr/001-hosting-platform.md` existir, porque plano A e plano B produzem
  arquiteturas diferentes para rota de servidor e para cutover. Planejá-las agora seria
  apostar no plano A.
- 2026-08-08: Research conduzido em modo autônomo, derivado de `BRIEF.md`, `PRD.md`,
  `MVP-SCOPE.md` e `DESIGN-GUIDELINES.md`, sem interview por feature. O discovery já
  havia rodado 3 rodadas de interview e 3 de grilling, e o PRD já traz requisitos no
  formato QUANDO/ENTÃO/DEVE por feature.
- 2026-08-08: Cinco tools no MCP tratadas como autoritativas (`get_profile`,
  `list_projects`, `get_project`, `get_resume`, `check_availability`). `BRIEF.md` e a
  prosa de F6 dizem "quatro tools", mas F6.2, o grilling #5 do PRD e a Definition of
  Done do `MVP-SCOPE.md` listam cinco. Confirmado pelo autor.
- 2026-08-08: Roadmap e specs subsequentes escritos em pt-BR, com o formato de
  requisito QUANDO/ENTÃO/DEVE, acompanhando o idioma de todo o acervo em `docs/`.
  Identificadores, slugs e chaves de frontmatter permanecem em inglês. Confirmado
  pelo autor.
- 2026-08-08: Spike de deploy definido como sprint 1 e bloqueador de tudo, conforme
  F8.1 do PRD ("ANTES de qualquer implementação de feature") e RISK-001.
- 2026-08-08: F8 dividida entre a sprint 1 (F8.1–F8.3, o spike) e a sprint 6
  (F8.4–F8.6, qualidade e cutover). São momentos distintos do ciclo e agrupá-los
  tornaria a sprint 1 impossível de fechar.
- 2026-08-08: `design-system-foundation` criada como feature sem ID no PRD, derivada
  de `DESIGN-GUIDELINES.md`, porque F1 e F2 dependem dos tokens e componentes.
- 2026-08-08: `case-content` incluída no índice de features apesar de ser conteúdo e
  não código, por ser o maior risco do projeto (RISK-003) e item contável da
  Definition of Done. Não passa por `/rpi:research`.
- 2026-08-08: Fase "Camada de máquina" do `MVP-SCOPE.md` dividida em duas sprints
  (4 e 5) para que a fronteira entre elas coincida com o corte de emergência do
  RISK-005.
- 2026-08-08: Cases escritos antes da home na sprint 3, conforme a armadilha
  declarada no `MVP-SCOPE.md` ("o hero decorre do que eles provam").
- 2026-08-08: Nenhum track secundário. `LANDING-PAGE-SPEC.md` não foi gerado por
  decisão do discovery (grilling #11 do PRD): a estrutura da home está em F1 e nos
  User Flows, e um documento separado duplicaria a fonte de verdade.
