# Spec: Camada de dados única

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 2
> **PRD:** F3 (F3.1, F3.2, F3.3)
> **Status:** draft
> **Criado:** 2026-08-08

## Problem Statement

Seis superfícies precisam falar do mesmo conjunto de fatos: a home, o catálogo, o
`llms.txt`, o JSON-LD, o currículo e as tools do MCP. Se cada uma tiver a sua cópia,
elas divergem na primeira alteração, e o modo de falha é o pior possível para este
produto: o agente responde errado com confiança, o que é pior do que o endpoint não
existir.

O `PRD.md` declara isso em Flow 2 ("Caminho infeliz: endpoint fora do ar ou payload
divergente do site faz o agente responder errado com confiança") e transforma F3 em
pré-requisito de F5 e F6.

## Goals

- Nenhum dado de projeto ou de perfil escrito duas vezes no repositório.
- Build que falha com erro de schema quando um campo obrigatório falta ou vem malformado, comprovado por teste.
- Um projeto sem nenhum link (nem repositório, nem versão no ar) impossível de publicar.
- Uma alteração no perfil refletida em todas as superfícies no próximo build, sem edição em outro lugar.

## Context

`DESIGN-GUIDELINES.md` e `project-catalog` consomem esta camada, mas quem mais depende
dela é a camada de máquina das sprints 4 e 5. O `PRD.md` já define as duas collections
e seus campos na seção Data Models.

A escolha é Astro Content Collections com schema Zod validado em build. O `MVP-SCOPE.md`
descarta CMS explicitamente: Content Collections dão schema validado sem serviço
externo, e o conteúdo fica versionado junto ao código.

Duas collections:

- **`projects`** — um arquivo por case, com `slug`, `title`, `block`, `summary`, `problem`, `decisions`, `outcome`, `tech`, `repoUrl`, `liveUrl`, `images`, `featured`, `confidential`.
- **`profile`** — fonte única para bio, posicionamento, stack, trajetória, serviços, disponibilidade e canais de contato.

A regra de integridade mais importante do `PRD.md`: `repoUrl` e `liveUrl` não podem ser
ambos nulos, porque um case sem nenhum link não tem evidência verificável, e o Flow 1
declara que um case sem link encerra a avaliação ali.

## Verified Claims

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| Existe um projeto Astro 7 com Vitest configurado | `docs/plans/2026-08-08-infra-deploy-spike.md` (Tasks 1-3) | assumption |
| Os campos e tipos de `projects` são os da tabela do PRD | `docs/PRD.md:513` | assumption (é a especificação, não código existente) |
| `repoUrl` e `liveUrl` não podem ser ambos nulos | `docs/PRD.md:529` | assumption |
| Os quatro blocos são `ai-tooling`, `ai-product`, `systems-cli`, `professional` | `docs/PRD.md:517` | assumption |
| Astro valida o schema de uma collection durante `astro build` e falha o processo em caso de erro | n/a | assumption (REQ-004 existe para provar) |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO uma collection `projects` é declarada ENTÃO seu schema DEVE exigir `slug`, `title`, `block`, `summary`, `problem`, `decisions`, `outcome`, `tech`, `featured` e `confidential`, e aceitar como opcionais `repoUrl`, `liveUrl` e `images`.
2. **[REQ-002]** QUANDO o campo `block` recebe um valor fora de `ai-tooling`, `ai-product`, `systems-cli` e `professional` ENTÃO a validação DEVE falhar.
3. **[REQ-003]** QUANDO um projeto tem `repoUrl` e `liveUrl` ambos ausentes ou nulos ENTÃO a validação DEVE falhar, porque um case sem link não tem evidência verificável.
4. **[REQ-004]** QUANDO um campo obrigatório está ausente ou malformado ENTÃO o build DEVE terminar com erro de schema e código de saída diferente de zero.
5. **[REQ-005]** QUANDO uma collection `profile` é declarada ENTÃO ela DEVE conter bio, posicionamento, stack, trajetória, serviços, disponibilidade e canais de contato como fonte única.
6. **[REQ-006]** QUANDO o perfil é atualizado em um único lugar ENTÃO todas as superfícies que o consomem DEVEM refletir a mudança no próximo build, sem edição adicional.
7. **[REQ-007]** QUANDO qualquer superfície precisa de dado de projeto ou de perfil ENTÃO ela DEVE obtê-lo pela camada de acesso desta feature, e NÃO PODE ler o conteúdo por outro caminho nem manter cópia própria.
8. **[REQ-008]** QUANDO `images` é fornecido ENTÃO cada entrada DEVE conter caminho e texto alternativo não vazio.
9. **[REQ-009]** QUANDO um projeto tem `confidential: true` ENTÃO a camada de acesso DEVE omitir nome de cliente e métrica sigilosa das superfícies públicas.
10. **[REQ-010]** QUANDO dois projetos declaram o mesmo `slug` ENTÃO a validação DEVE falhar, porque o slug é a chave de rota e de referência cruzada.
11. **[REQ-011]** QUANDO a disponibilidade é consultada ENTÃO a fonte DEVE fornecer também a data da última atualização desse campo, que `check_availability` do MCP precisa devolver.

### P2 (Should Have)

 1. **[REQ-012]** QUANDO um projeto declara `featured: true` ENTÃO a camada de acesso DEVE oferecer uma consulta que retorne apenas os destacados, em ordem estável.
 2. **[REQ-013]** QUANDO os projetos são listados ENTÃO a camada de acesso DEVE oferecer agrupamento pelos quatro blocos, em ordem declarada e não alfabética.
 3. **[REQ-014]** QUANDO `repoUrl` ou `liveUrl` é fornecido ENTÃO ele DEVE ser uma URL absoluta válida.

### P3 (Nice to Have)

 1. **[REQ-015]** QUANDO o conjunto de projetos é validado ENTÃO um aviso DEVE ser emitido se algum dos quatro blocos tiver menos de dois cases, que é a Definition of Done do MVP.

## Edge Cases

- **Projeto sem nenhum link (EC-002)** — Build falha por REQ-003. É a regra de integridade que protege o Flow 1.
- **Projeto sem imagem (EC-003)** — Válido. O fallback determinístico de `design-system-foundation` cobre a renderização. `images` é opcional de propósito.
- **Campo obrigatório ausente (EC-004)** — Build falha por REQ-004, com o nome do campo e o arquivo no erro.
- **Repositório privado (EC-001)** — `repoUrl` ausente, `liveUrl` presente. Válido, e o card omite o link em vez de renderizar um quebrado.
- **Case sob confidencialidade (EC-011)** — `confidential: true` mantém o case publicável, mas a camada de acesso filtra nome de cliente e métrica antes de entregar à superfície pública.
- **Slug duplicado** — Falha por REQ-010. Sem isso, a rota `/projetos/<slug>` fica ambígua e o `get_project` do MCP passa a devolver o projeto errado.
- **`alt` vazio numa imagem de case** — Falha por REQ-008. Imagem de case é conteúdo, nunca decoração, então `alt=""` é sempre erro aqui.
- **Perfil com disponibilidade sem data** — Falha por REQ-011. `check_availability` sem data de atualização entrega ao agente um dado que ele não consegue qualificar.
- **Markdown malformado em `problem`, `decisions` ou `outcome`** — O conteúdo é markdown e o schema só garante presença, não semântica. Erro de formatação aparece na renderização, não no build. Aceito.

## Architecture Decisions

1. **Astro Content Collections com Zod em vez de CMS** — Schema validado em build, conteúdo versionado com o código, sem serviço externo nem custo. Alternativa descartada: qualquer CMS headless, que adicionaria dependência de disponibilidade a um site que precisa ser estático por decisão.
2. **Uma camada de acesso em `src/lib/content/` em vez de consumo direto** — REQ-007 só é verificável se existir um único ponto de entrada. Consumo direto de `getCollection` espalhado pelas páginas tornaria impossível aplicar a filtragem de confidencialidade e o agrupamento de forma consistente.
3. **Filtragem de confidencialidade na leitura, não na escrita** — O arquivo do case mantém o dado completo; quem filtra é a camada de acesso ao servir superfície pública. Assim o autor não precisa manter duas versões do texto.
4. **`slug` explícito no frontmatter, não derivado do nome do arquivo** — O slug é chave de rota, de JSON-LD e do `get_project` do MCP. Deixá-lo implícito no nome do arquivo cria acoplamento silencioso entre renomear um arquivo e quebrar uma URL pública.
5. **Ordem dos blocos declarada em constante** — Ordem alfabética colocaria `ai-product` antes de `ai-tooling`, o que inverte a hierarquia de posicionamento que o BRIEF quer comunicar.
6. **Regra de integridade de link como refinamento Zod, não como convenção** — `PRD.md` a chama de "regra de integridade", e uma regra que só existe em documento não impede o commit.

## Grilling Log

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Onde vive a regra "não pode ter os dois links nulos" | Refinamento Zod no schema da collection | Documento não bloqueia commit. O build tem que falhar |
| 2 | Confidencialidade filtra na escrita ou na leitura | Leitura | Manter duas versões do texto do case é convite a divergência, que é exatamente o que F3 existe para evitar |
| 3 | Slug derivado do arquivo ou explícito | Explícito no frontmatter | Renomear arquivo não pode quebrar URL pública nem `get_project` |
| 4 | Como garantir REQ-007 na prática | Camada de acesso única em `src/lib/content/`, mais teste que reprova `getCollection` fora dela | Sem portão, a primeira página com pressa importa direto e a fonte única deixa de ser única |
| 5 | Validar contagem mínima de cases por bloco no build | Aviso, não erro (REQ-015, P3) | Falhar o build por conteúdo incompleto impediria trabalhar de forma incremental na sprint 3 |
| 6 | Disponibilidade dentro de `profile` ou em collection própria | Dentro de `profile` | É um campo de perfil. Collection própria para um objeto único é cerimônia sem ganho |

## Constraints

- Astro Content Collections nativas, Zod 3.x, TypeScript 5.x.
- Sem CMS, sem banco de dados para conteúdo. Firestore é só para `hire_requests` (F7).
- Todo dado desta camada é público por natureza: nada aqui pode conter segredo, e a filtragem de confidencialidade protege terceiros, não credenciais.
- Compartilha os 4 dias da sprint 2 com `design-system-foundation` e `project-catalog`.
- É pré-requisito de F1, F2, F4, F5 e F6. Um erro aqui se propaga para cinco features.

## Out of Scope

| Item | Reason |
|------|--------|
| O conteúdo dos 8 cases | Sprint 3 (`case-content`). Aqui entra apenas o schema e um case real de exemplo |
| Renderização de card e de página de case | Sprint 2, feature `project-catalog` |
| Serialização para JSON Resume | Sprint 4 (`structured-resume`), que consome esta camada |
| Serialização para as tools do MCP | Sprint 5 (`mcp-server`), que consome esta camada |
| Geração de `llms.txt` e JSON-LD | Sprint 4 (`aeo-base`), que consome esta camada |
| Otimização e processamento de imagem | `project-catalog` decide o tratamento; aqui só o schema do caminho e do `alt` |
| Internacionalização do conteúdo | F15, P2, v1.2 |

## Test Strategy

- **Unit:** o schema Zod exercitado direto, sem passar pelo Astro. Cada regra de REQ-001 a REQ-003, REQ-008, REQ-010 e REQ-014 vira um caso: entrada válida passa, entrada inválida falha com a mensagem esperada. É onde a maior parte da confiança é construída, porque é rápido e determinístico.
- **Unit:** a camada de acesso com uma fixture de projetos em memória. Cobre agrupamento por bloco (REQ-013), filtro de destaque (REQ-012) e a omissão do confidencial (REQ-009).
- **Integration:** um build real com um projeto deliberadamente inválido em fixture, confirmando código de saída diferente de zero e a mensagem de schema (REQ-004). É o único teste que prova que a validação está de fato acoplada ao build, e não só disponível.
- **Contract:** teste que varre `src/` reprovando qualquer chamada a `getCollection` fora de `src/lib/content/` (REQ-007).
- **Não testar:** a semântica do markdown dentro de `problem`, `decisions` e `outcome`. É conteúdo, e o portão dele é a leitura humana na sprint 3.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Schema de `projects` com campos obrigatórios e opcionais | P1 | Pending |
| REQ-002 | `block` restrito aos quatro valores | P1 | Pending |
| REQ-003 | `repoUrl` e `liveUrl` não podem ser ambos ausentes | P1 | Pending |
| REQ-004 | Build falha com erro de schema | P1 | Pending |
| REQ-005 | Collection `profile` como fonte única | P1 | Pending |
| REQ-006 | Alteração no perfil propaga a todas as superfícies | P1 | Pending |
| REQ-007 | Acesso exclusivamente pela camada de acesso | P1 | Pending |
| REQ-008 | Imagem exige caminho e `alt` não vazio | P1 | Pending |
| REQ-009 | `confidential: true` omite nome e métrica sigilosa | P1 | Pending |
| REQ-010 | `slug` único entre projetos | P1 | Pending |
| REQ-011 | Disponibilidade acompanha data de atualização | P1 | Pending |
| REQ-012 | Consulta de projetos em destaque, em ordem estável | P2 | Pending |
| REQ-013 | Agrupamento pelos quatro blocos, em ordem declarada | P2 | Pending |
| REQ-014 | URLs absolutas válidas | P2 | Pending |
| REQ-015 | Aviso quando um bloco tem menos de dois cases | P3 | Pending |
