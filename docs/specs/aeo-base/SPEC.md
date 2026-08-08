# Spec: Base AEO

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 4
> **PRD:** F4 (F4.1 a F4.5)
> **Status:** draft
> **Criado:** 2026-08-08

## Problem Statement

O site está invisível para o leitor que hoje faz a triagem inicial. Não há `llms.txt`,
`sitemap.xml`, dados estruturados nem qualquer rota que um agente possa consultar:
ambos os arquivos retornam 404 hoje.

Sem esta camada, nenhuma outra peça da superfície de agentes é descoberta. O currículo
estruturado, o servidor MCP e o canal de contratação podem existir e funcionar
perfeitamente, e ainda assim nenhum agente saber que existem. É a feature que torna as
outras três encontráveis.

## Goals

- `/llms.txt`, `/AGENTS.md`, `/robots.txt` e `/sitemap.xml` respondendo 200, em inglês.
- JSON-LD válido de `Person` e `WebSite` em toda página, passando em validador de dados estruturados.
- Permissão explícita para os principais crawlers de answer engine no `robots.txt`.
- Nenhuma informação sensível exposta nas rotas de máquina, assumindo que um crawler pode ignorar `robots.txt`.

## Context

Esta é a primeira das duas features da sprint 4, e junto com `structured-resume` fecha o
conjunto do corte de emergência do RISK-005: com ela, F1, F2, F3, F4, F5 e F8 estão
completas e o site já constitui lançamento válido.

Toda a camada de máquina é em inglês por decisão do `BRIEF.md`: a camada humana é 100%
em português, e a de máquina é 100% em inglês, o que recupera parte do alcance
internacional sem o custo de manter duas versões de cada página.

O conteúdo sai inteiramente da camada de acesso de `content-data-layer`. Nenhuma
listagem escrita à mão: um `llms.txt` mantido manualmente diverge do site na primeira
alteração, que é exatamente o modo de falha que F3 existe para eliminar.

Divisão de responsabilidade do JSON-LD, já fixada nas features anteriores:

- `Person` — gerado em `home-page`, derivado do perfil.
- `CreativeWork` e `SoftwareApplication` — gerados em `project-catalog`, por case.
- `WebSite` — desta feature, global, injetado no layout base.

`/AGENTS.md` é um brief de contratação para agentes, com serviços, disponibilidade e
como acionar os endpoints. É o documento que transforma a camada de máquina de conjunto
de rotas em oferta legível.

## Verified Claims

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| A camada de acesso expõe `getAllProjects`, `getProfile` e `getAvailability` | `docs/plans/2026-08-08-content-data-layer.md` (Task 9) | assumption |
| `home-page` já injeta JSON-LD `Person` | `docs/plans/2026-08-08-home-page.md` (Task 8) | assumption |
| `project-catalog` já injeta JSON-LD por case | `docs/plans/2026-08-08-project-catalog.md` (Task 7) | assumption |
| `BaseLayout` recebe `title` e `description` e é usado por todas as páginas | `docs/plans/2026-08-08-design-system-foundation.md` (Task 6) | assumption |
| `/llms.txt` e `/sitemap.xml` retornam 404 no site atual | `docs/PRD.md:30` | assumption |
| As rotas de produto são `/`, `/projetos` e `/projetos/<slug>` | `docs/plans/2026-08-08-project-catalog.md` (Tasks 5 e 7) | assumption |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um agente requisita `/llms.txt` ENTÃO o sistema DEVE responder 200 com um índice em inglês do conteúdo e das rotas de máquina.
2. **[REQ-002]** QUANDO `/llms.txt` é gerado ENTÃO seu conteúdo DEVE derivar da camada de acesso, e NÃO PODE conter listagem de projeto escrita à mão.
3. **[REQ-003]** QUANDO um agente requisita `/AGENTS.md` ENTÃO o sistema DEVE responder 200 com um brief de contratação em inglês contendo serviços, disponibilidade e como acionar os endpoints.
4. **[REQ-004]** QUANDO um crawler requisita `/robots.txt` ENTÃO o sistema DEVE declarar permissão explícita para os principais crawlers de answer engine e apontar o `sitemap.xml`.
5. **[REQ-005]** QUANDO um agente requisita `/sitemap.xml` ENTÃO o sistema DEVE listar todas as rotas públicas indexáveis, derivadas da camada de acesso.
6. **[REQ-006]** QUANDO qualquer página é renderizada ENTÃO o sistema DEVE embutir JSON-LD válido do tipo `WebSite`.
7. **[REQ-007]** QUANDO qualquer JSON-LD é embutido ENTÃO ele DEVE ser JSON sintaticamente válido, com o caractere `<` escapado para que conteúdo não escape do elemento `script`.
8. **[REQ-008]** QUANDO qualquer rota de máquina é servida ENTÃO ela NÃO PODE expor endereço de e-mail, credencial, caminho interno, dado de cliente sob confidencialidade nem detalhe de infraestrutura.
9. **[REQ-009]** QUANDO uma rota de máquina é servida ENTÃO ela DEVE declarar o `content-type` correto: `text/plain` para `llms.txt`, `text/markdown` para `AGENTS.md`, `text/plain` para `robots.txt` e `application/xml` para `sitemap.xml`.
10. **[REQ-010]** QUANDO uma página é renderizada ENTÃO ela DEVE declarar uma URL canônica absoluta.
11. **[REQ-011]** QUANDO uma rota de máquina lista URLs ENTÃO elas DEVEM ser absolutas, com o domínio de produção.
12. **[REQ-012]** QUANDO uma rota é marcada como não indexável (404, páginas de erro) ENTÃO ela NÃO PODE aparecer no `sitemap.xml`.

### P2 (Should Have)

 1. **[REQ-013]** QUANDO `/llms.txt` é gerado ENTÃO ele DEVE seguir a convenção da especificação `llms.txt`: título `H1`, resumo em citação e seções `H2` com links anotados.
 2. **[REQ-014]** QUANDO `/sitemap.xml` é gerado ENTÃO cada entrada DEVE trazer `lastmod`, derivado do conteúdo e não do instante da requisição.
 3. **[REQ-015]** QUANDO uma página é renderizada ENTÃO ela DEVE declarar metadados Open Graph mínimos: título, descrição, tipo e URL.

### P3 (Nice to Have)

 1. **[REQ-016]** QUANDO `/AGENTS.md` é servido ENTÃO ele PODE trazer exemplos executáveis de chamada aos endpoints de máquina.

## Edge Cases

- **Crawler ignora `robots.txt` (EC-010)** — Sem impacto, por construção: REQ-008 garante que nada sensível está nas rotas públicas. O `robots.txt` é orientação, não controle de acesso, e tratá-lo como segurança é o erro clássico desta camada.
- **Catálogo vazio** — `llms.txt` e `sitemap.xml` continuam válidos, listando apenas as rotas fixas. Nenhuma rota de máquina pode quebrar por ausência de conteúdo.
- **Case sob confidencialidade** — A camada de acesso já redigiu nome e métrica antes de entregar. As rotas de máquina renderizam o que receberam, sem lógica própria de confidencialidade.
- **Título de projeto com caractere especial de XML** — `&`, `<` e `>` precisam ser escapados no `sitemap.xml`, ou o XML fica malformado e o sitemap inteiro é descartado pelo crawler.
- **Conteúdo com `</script>` dentro do JSON-LD** — REQ-007 escapa `<`. Sem isso, um case cujo texto contenha a sequência quebra o documento e pode virar vetor de injeção.
- **`Astro.site` não configurado** — Todas as URLs sairiam relativas e o sitemap seria inútil. O build deve falhar de forma explícita em vez de emitir URLs quebradas.
- **Rota nova adicionada sem entrar no sitemap** — Risco real ao longo das sprints. Mitigado derivando o sitemap da mesma fonte que gera as rotas, nunca de uma lista paralela.
- **Disponibilidade desatualizada em `/AGENTS.md`** — O campo vem do perfil com `updatedAt`, e a data é exibida junto. Um agente precisa poder qualificar quão fresca é a informação.

## Architecture Decisions

1. **Rotas de máquina como endpoints Astro, não arquivos em `public/`** — Arquivo estático em `public/` seria uma segunda fonte de verdade, mantida à mão, que diverge do site na primeira alteração. Endpoint derivado da camada de acesso não pode divergir.
2. **JSON-LD `WebSite` no layout base, não por página** — É global. Repetir em cada página convidaria à divergência e ao esquecimento numa rota nova.
3. **Escape de `<` centralizado numa função compartilhada** — REQ-007 vale para os três geradores de JSON-LD do projeto (`Person`, por case, e `WebSite`). Três implementações separadas garantem que uma delas fica para trás.
4. **`robots.txt` com allowlist explícita de crawlers de answer engine** — Um `User-agent: *` permissivo cobriria tecnicamente o caso, mas declarar os agentes por nome documenta a intenção e sobrevive a uma futura restrição do padrão.
5. **`sitemap.xml` escrito à mão em vez de `@astrojs/sitemap`** — A integração oficial gera a partir das rotas do build, e as rotas de máquina não deveriam estar no sitemap. Um gerador próprio de vinte linhas dá controle exato sobre o que entra, com menos configuração do que ajustar filtros da integração.
6. **`llms.txt` seguindo a convenção da especificação** — Formato que os consumidores já sabem ler. Inventar um layout próprio anularia o propósito da rota.
7. **Nenhum e-mail nas rotas de máquina** — REQ-008. O contato humano fica na home, onde serve ao visitante; publicá-lo numa rota feita para ser raspada é convite a spam sem ganho.

## Grilling Log

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Rotas de máquina como arquivo estático ou endpoint | Endpoint derivado da camada de acesso | Arquivo em `public/` é segunda fonte de verdade e diverge na primeira alteração, contra F3 |
| 2 | `@astrojs/sitemap` ou gerador próprio | Próprio | As rotas de máquina não devem entrar no sitemap, e filtrar a integração custa mais que gerar |
| 3 | E-mail em `/AGENTS.md` | Não | REQ-008. O canal para agente é `/api/hire` (F7); para humano, a home |
| 4 | Onde vive o JSON-LD `WebSite` | Layout base | É global. Por página, uma rota nova esqueceria dele |
| 5 | `robots.txt` como controle de acesso | Não, é orientação | EC-010 assume que o crawler ignora. A proteção real é não ter nada sensível lá |
| 6 | `llms.txt` com formato próprio ou o da spec | O da spec | Formato conhecido é o ponto inteiro da rota |
| 7 | `lastmod` do sitemap com a data do build | Não, derivado do conteúdo (REQ-014) | Data de build muda a cada deploy sem o conteúdo ter mudado, e ensina o crawler a ignorar o campo |

## Constraints

- Astro 7.2.0 em `output: 'server'`, sem JavaScript de cliente.
- Todo o conteúdo destas rotas é em inglês, sem exceção.
- Consome exclusivamente a camada de acesso de `content-data-layer`.
- `Astro.site` precisa estar configurado como `https://nandomoreira.dev`.
- Nenhuma informação sensível, assumindo crawler hostil que ignora `robots.txt`.
- Esforço estimado de ~3 dias, compartilhado com `structured-resume`.
- Depende do resultado do spike apenas de forma marginal: quatro rotas de texto sobrevivem tanto ao plano A quanto ao plano B, mudando apenas onde são servidas.

## Out of Scope

| Item | Reason |
|------|--------|
| `/api/resume.json` e `/api/resume.txt` | Feature `structured-resume` (F5), mesma sprint |
| `/api/mcp` | Feature `mcp-server` (F6), sprint 5 |
| `/api/hire` | Feature `hire-endpoint` (F7), sprint 5 |
| JSON-LD `Person` e por case | Já entregues por `home-page` e `project-catalog` |
| OG images dinâmicas | F10, P1, v1.1. REQ-015 cobre apenas as meta tags |
| `hreflang` e versão em inglês das páginas humanas | F15, P2, v1.2 |
| Analytics e log de chamadas às rotas de máquina | F12, P1, v1.1. É o que fecha H3, mas depois do lançamento |
| Submissão a Search Console e similares | Operação de lançamento, não desenvolvimento |

## Test Strategy

- **Unit:** os geradores de conteúdo como funções puras (dado perfil e projetos, produzir o corpo de `llms.txt`, `AGENTS.md` e `sitemap.xml`). Testar o texto gerado é rápido e cobre o que mais importa: derivar da fonte, escapar corretamente e não vazar dado sensível.
- **Contract:** cada rota responde 200 com o `content-type` declarado em REQ-009. Um `content-type` errado faz o consumidor tratar XML como HTML e descartar.
- **Contract:** o `sitemap.xml` gerado é XML bem formado, verificado por parse real e não por expressão regular.
- **Security:** um teste que varre a saída das quatro rotas procurando padrão de e-mail, chave e caminho absoluto do sistema de arquivos. É o portão de REQ-008, e precisa rodar sobre o conteúdo gerado, não sobre o template.
- **Integration:** o JSON-LD `WebSite` aparece no HTML de todas as rotas de produto, e faz `JSON.parse` sem erro.
- **Manual, uma vez:** colar o JSON-LD de uma página de cada tipo num validador de dados estruturados. É o critério de aceite declarado no PRD e nenhum teste local o substitui.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | `/llms.txt` responde 200 com índice em inglês | P1 | Pending |
| REQ-002 | `llms.txt` derivado da camada de acesso | P1 | Pending |
| REQ-003 | `/AGENTS.md` com brief de contratação em inglês | P1 | Pending |
| REQ-004 | `robots.txt` com allowlist e ponteiro para o sitemap | P1 | Pending |
| REQ-005 | `sitemap.xml` com todas as rotas públicas | P1 | Pending |
| REQ-006 | JSON-LD `WebSite` em toda página | P1 | Pending |
| REQ-007 | JSON-LD válido, com `<` escapado | P1 | Pending |
| REQ-008 | Nenhuma informação sensível nas rotas de máquina | P1 | Pending |
| REQ-009 | `content-type` correto por rota | P1 | Pending |
| REQ-010 | URL canônica absoluta por página | P1 | Pending |
| REQ-011 | URLs absolutas nas rotas de máquina | P1 | Pending |
| REQ-012 | Rota não indexável fora do sitemap | P1 | Pending |
| REQ-013 | `llms.txt` no formato da especificação | P2 | Pending |
| REQ-014 | `lastmod` derivado do conteúdo | P2 | Pending |
| REQ-015 | Open Graph mínimo por página | P2 | Pending |
| REQ-016 | Exemplos executáveis em `/AGENTS.md` | P3 | Pending |
