# Spec: Currículo estruturado

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 4
> **PRD:** F5 (F5.1–F5.3) · **User stories:** US-004, US-007
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

O agente que faz triagem em nome do avaliador não tem como responder "onde ele
trabalhou", "quanto tempo de carreira" ou "está disponível" sem renderizar a página e
interpretar prosa. As quatro rotas de máquina da `aeo-base` descrevem o site; nenhuma
descreve a **pessoa** num formato que outro sistema consuma sem heurística.

`/api/resume.json` e `/api/resume.txt` respondem **404** em produção hoje.

Há um bloqueio de conteúdo antes do bloqueio de código: o schema de `profile` não tem
histórico profissional nem formação. Ele nasceu para alimentar a home, não um currículo.
Um JSON Resume sem `work` valida, mas responde vazio exatamente à pergunta que motiva a
feature.

## Goals

- Servir currículo em inglês aderente ao JSON Resume, derivado da fonte única.
- Expressar o que o schema padrão não cobre (agentes, tooling de IA, disponibilidade)
  sem quebrar a validação.
- Servir a mesma informação em texto puro, para o agente que não quer JSON.

## Context

### O que a fonte única já tem

`src/content/profile/profile.md` traz `name`, `wordmark`, `headline`, `bio`,
`positioning`, `stack` (5 itens), `trajectory` (3 números com narrativa), `services`
(3, cada um apontando um case), `availability` (`status`, `detail`, `updatedAt`) e
`contacts` (email, github, linkedin).

Os 15 cases em `src/content/projects/` trazem `title`, `summary`, `problem`,
`decisions`, `outcome`, `tech`, `repoUrl`, `liveUrl`, `date`, e as flags `confidential`
e `discontinued`.

### O que falta

`work` e `education` não existem em lugar nenhum do repositório. **Decisão do autor
(2026-08-09):** entram no schema de `profile`, e o histórico é escrito como conteúdo.

### A camada de acesso

`src/lib/content/profile.ts` e `projects.ts` são o único caminho para `getCollection`
(`tests/content/single-source.test.ts` reprova qualquer outro). O gerador do currículo
consome a camada, como `llms-txt.ts` e `sitemap.ts` já fazem.

### Redação de confidencialidade

`src/lib/content/confidential.ts` já aplica a redação usada pelo catálogo. Um case
`confidential: true` não pode identificar o cliente em nenhuma superfície, e o currículo
é mais uma delas.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| `/api/resume.json` e `/api/resume.txt` respondem 404 em produção | `curl` contra o backend | sim |
| Em `src/pages/api/` só existe `health.ts` | `find` no repositório | sim |
| `@jsonresume/schema` está em 1.3.1, publicado 22/07/2026 | `npm view` | sim |
| O schema JSON Resume declara `additionalProperties: true` no root e em `meta` | `schema.json` do repositório oficial | sim |
| Uma chave top-level customizada **passa** na validação | mesma leitura do schema | sim |
| O perfil não tem `work` nem `education` | `profile.md` completo | sim |
| A camada de acesso é o único caminho para `getCollection` | `single-source.test.ts` | sim |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um agente requisita `/api/resume.json` ENTÃO o sistema DEVE responder 200 com `content-type: application/json` e corpo aderente ao schema JSON Resume.
2. **[REQ-002]** QUANDO o currículo é montado ENTÃO ele DEVE ser derivado da camada de acesso, e NÃO PODE chamar `getCollection` diretamente.
3. **[REQ-003]** QUANDO o payload é validado contra `@jsonresume/schema` ENTÃO a validação DEVE passar, e o build DEVE falhar se não passar.
4. **[REQ-004]** QUANDO o currículo declara o que o schema padrão não cobre ENTÃO isso DEVE viver numa chave de extensão própria no root, sem quebrar a validação.
5. **[REQ-005]** QUANDO um agente requisita `/api/resume.txt` ENTÃO o sistema DEVE responder 200 em `text/plain` com a mesma informação, legível sem parser.
6. **[REQ-006]** QUANDO o perfil declara histórico profissional ENTÃO o schema de `profile` DEVE validá-lo em build, com data de início obrigatória e data de fim opcional para a posição corrente.
7. **[REQ-007]** QUANDO um case `confidential: true` alimenta o currículo ENTÃO o nome do cliente NÃO PODE aparecer em nenhuma das duas rotas.
8. **[REQ-008]** QUANDO as rotas de currículo respondem ENTÃO elas DEVEM estar em inglês, como as demais rotas de máquina.
9. **[REQ-009]** QUANDO o portão de vazamento roda ENTÃO as duas rotas DEVEM passar por ele, sem e-mail, chave, caminho absoluto ou IP privado.

### P2 (Should Have)

10. **[REQ-010]** QUANDO o currículo lista projetos ENTÃO ele DEVE preferir os cases com evidência verificável, e NÃO PODE inflar o acervo com os descontinuados sem marcá-los como encerrados.
11. **[REQ-011]** QUANDO a disponibilidade é servida ENTÃO ela DEVE trazer a data da última atualização, para o agente calibrar a confiança.
12. **[REQ-012]** QUANDO `sitemap.xml` é gerado ENTÃO as duas rotas de currículo DEVEM constar, como as demais rotas de máquina.

### P3 (Nice to Have)

13. **[REQ-013]** QUANDO o currículo é servido ENTÃO ele PODE declarar `meta.canonical` apontando para a própria URL.

## Edge Cases

- **Posição corrente sem data de fim** — `endDate` ausente significa "até hoje"; o
  texto puro precisa dizer isso em vez de deixar em branco.
- **Case confidencial em `projects`** — entra pelo título redigido, nunca pelo cliente.
- **Case descontinuado** — aparece com a marcação de encerrado, ou não aparece; o que
  não pode é ser apresentado como ativo.
- **Perfil sem `work`** — enquanto o histórico não for escrito, a chave fica ausente e
  o payload continua válido. O portão de schema não pode exigir conteúdo que é do autor.
- **`summary` longo demais para texto puro** — o `.txt` quebra em linhas, sem truncar
  informação.

## Architecture Decisions

1. **Extensão em chave top-level, não dentro de `meta`** — O schema permite ambos
   (`additionalProperties: true` nos dois níveis), mas `meta` é descrito como metadado
   do documento, e agentes/tooling/disponibilidade são conteúdo. Uma chave própria
   deixa a fronteira explícita para quem lê o payload sem consultar o schema.
2. **`work` e `education` entram no schema de `profile`** — Decisão do autor. A
   alternativa recusada foi derivar `work` dos cases de cliente, que equipara projeto a
   emprego e conflita com a redação de confidencialidade.
3. **Validação contra `@jsonresume/schema` roda em teste, não em runtime** — Validar a
   cada requisição custa em toda chamada e falha tarde. O build é onde a fonte muda.
4. **Uma função pura monta o currículo; as duas rotas são casca** — `resume.json` e
   `resume.txt` renderizam a mesma estrutura, então a estrutura vive em `src/lib/aeo/`
   e as rotas só serializam. É o padrão que `llms-txt.ts` já estabelece.
5. **O texto puro é derivado do mesmo objeto, não escrito à parte** — Duas fontes
   divergiriam na primeira mudança.

## Constraints

- Conteúdo das rotas de máquina em inglês; nada de pt-BR nelas.
- Nenhum e-mail nas rotas de máquina: o contato humano fica na home e o canal de agente
  é `/api/hire`.
- A camada de acesso continua sendo o único caminho para `getCollection`.
- Zero JavaScript de cliente permanece inviolável (não afeta rota de API, mas o portão
  varre o build inteiro).

## Out of Scope

- Página HTML de currículo para humano.
- PDF.
- Histórico completo de 14 anos: o conteúdo entra na medida em que o autor escrever.
- Tradução do currículo para pt-BR.

## Decisões pendentes do autor

1. **O conteúdo de `work` e `education`**: quais posições, períodos e instituições
   entram. O plano cria o schema e um exemplo mínimo; o preenchimento é conteúdo.
