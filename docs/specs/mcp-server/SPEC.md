# Spec: Servidor MCP

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 5
> **PRD:** F6 (F6.1–F6.5) · **User stories:** US-008
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

A tese do produto é que o agente de IA faz a triagem em nome do avaliador. As rotas da
`aeo-base` e o currículo servem esse agente **lendo**: ele baixa, interpreta e resume.
Nenhuma delas permite que um cliente MCP conecte e pergunte.

`/api/mcp` responde **404** em produção. Enquanto responder, o argumento central do
posicionamento ("construo ferramental de agentes") não tem demonstração no próprio site.

## Goals

- Servir MCP em `/api/mcp` com o SDK oficial, na revisão estável do protocolo.
- Expor cinco tools que respondem da mesma fonte que alimenta o site.
- Errar como um servidor JSON-RPC bem comportado, sem vazar detalhe interno.

## Context

### O transporte, verificado no pacote

`@modelcontextprotocol/sdk@1.30.0` traz
`server/webStandardStreamableHttp.js`, exportando
`WebStandardStreamableHTTPServerTransport` com:

```ts
handleRequest(req: Request, options?: HandleRequestOptions): Promise<Response>
```

A assinatura é `Request` → `Response` da Web API, que é exatamente o que uma rota Astro
SSR recebe e devolve. Não há adaptação de `IncomingMessage`/`ServerResponse`.

`sessionIdGenerator: undefined` liga o modo **stateless**, no qual nenhum Session ID é
emitido. A documentação do SDK exige criar **uma instância nova de transporte e de
servidor por requisição** nesse modo, porque uma instância compartilhada colide IDs de
requisição entre clientes concorrentes.

### A revisão do protocolo

A revisão `2026-07-28` existe no SDK, mas é **opt-in**: nada põe um byte dela na rede
por padrão, e o SDK fala a revisão de 2025 salvo negociação explícita. F6.1 pede "a
versão estável suportada pelos clientes em produção", e o PRD já exclui a revisão em
release candidate. Portanto: o padrão do SDK, sem opt-in.

### A fonte dos dados

`src/lib/content/` expõe `getProfile`, `getAllProjects`, `getProject`. O currículo virá
de `structured-resume`, que esta feature consome em vez de reimplementar. `availability`
já vive no perfil com `updatedAt`.

### Concorrência

O App Hosting roda com `concurrency: 80` e `maxInstances: 2` (`apphosting.yaml`). Uma
instância atende várias requisições simultâneas, o que torna o modo stateless não uma
preferência e sim um requisito de correção.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| `/api/mcp` responde 404 em produção | `curl` contra o backend | sim |
| `@modelcontextprotocol/sdk` está em 1.30.0 | `npm view` | sim |
| O pacote traz `server/webStandardStreamableHttp.js` | `npm pack` + `tar -tzf` | sim |
| `handleRequest(req: Request): Promise<Response>` | `.d.ts` extraído do tarball | sim |
| `sessionIdGenerator: undefined` documenta o modo stateless | mesmo `.d.ts` | sim |
| A revisão 2026-07-28 é opt-in; o padrão é a de 2025 | documentação de migração do SDK | sim |
| `McpServer` vive em `server/mcp.js` | listagem do tarball | sim |
| `concurrency: 80`, `maxInstances: 2` | `apphosting.yaml` | sim |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um cliente MCP conecta a `/api/mcp` ENTÃO o sistema DEVE responder conforme o protocolo na revisão estável, sem opt-in para revisão em release candidate.
2. **[REQ-002]** QUANDO um cliente lista tools ENTÃO o sistema DEVE expor exatamente `get_profile`, `list_projects`, `get_project`, `get_resume` e `check_availability`.
3. **[REQ-003]** QUANDO uma tool é chamada ENTÃO ela DEVE retornar dado derivado da camada de acesso, e NÃO PODE divergir do que o site publica.
4. **[REQ-004]** QUANDO uma requisição é malformada ENTÃO o sistema DEVE responder erro JSON-RPC padronizado, sem stack trace, caminho de arquivo ou mensagem interna.
5. **[REQ-005]** QUANDO `check_availability` é chamada ENTÃO ela DEVE retornar o status declarado na fonte de verdade junto da data da última atualização.
6. **[REQ-006]** QUANDO duas requisições chegam simultaneamente ENTÃO cada uma DEVE usar sua própria instância de servidor e transporte, sem compartilhar estado.
7. **[REQ-007]** QUANDO `get_project` recebe um slug inexistente ENTÃO o sistema DEVE responder erro de tool bem formado, e NÃO PODE lançar exceção não tratada.
8. **[REQ-008]** QUANDO uma tool expõe um case `confidential: true` ENTÃO o nome do cliente NÃO PODE aparecer na resposta.
9. **[REQ-009]** QUANDO a rota responde ENTÃO o conteúdo DEVE estar em inglês.

### P2 (Should Have)

10. **[REQ-010]** QUANDO `list_projects` é chamada com filtro de coleção ENTÃO ela DEVE aceitar `portfolio` ou `lab` e rejeitar qualquer outro valor com erro de validação.
11. **[REQ-011]** QUANDO o servidor se apresenta ENTÃO ele DEVE declarar nome e versão próprios, para o cliente registrar com o que falou.
12. **[REQ-012]** QUANDO `AGENTS.md` descreve as superfícies de máquina ENTÃO ele DEVE citar `/api/mcp` e as cinco tools.

### P3 (Nice to Have)

13. **[REQ-013]** QUANDO um agente pede a lista de tools ENTÃO cada uma PODE trazer descrição que dispense documentação externa.

## Edge Cases

- **GET em `/api/mcp`** — o transporte trata; a rota precisa encaminhar o método, não
  só POST, para não quebrar clientes que sondam a rota.
- **Requisição sem `Accept` compatível** — erro do transporte, não exceção da rota.
- **Corpo vazio** — erro JSON-RPC, não 500.
- **Slug com caractere fora do padrão** — validado antes de tocar a camada de acesso.
- **Coleção vazia** — `list_projects` devolve lista vazia, não erro.
- **Case sem link** — a tool não pode inventar URL; devolve o que existe.

## Architecture Decisions

1. **Transporte Web Standard, não o de Node** — A rota Astro já recebe `Request` e
   devolve `Response`. Usar `WebStandardStreamableHTTPServerTransport` elimina a ponte
   para `IncomingMessage`/`ServerResponse`, que é onde esse tipo de integração costuma
   quebrar. Verificado no `.d.ts` do pacote, não presumido.
2. **Modo stateless, com instância por requisição** — Exigido pela documentação do SDK
   para evitar colisão de IDs entre clientes concorrentes, e o backend serve com
   concorrência 80. Alternativa recusada: servidor único em módulo, que é o caminho
   natural e está errado aqui.
3. **Revisão estável do protocolo, sem opt-in para a de 2026-07-28** — F6.1 pede a
   versão que clientes em produção falam. A revisão nova existe mas é opt-in.
4. **As tools chamam a camada de acesso, não o Zod nem o `getCollection`** — Mesma
   regra que vale para toda superfície. É o que garante REQ-003 sem duplicar lógica.
5. **`get_resume` reusa o gerador de `structured-resume`** — Duas implementações do
   currículo divergiriam. Isso torna `structured-resume` dependência dura desta feature.
6. **Validação de entrada por schema declarado na tool** — O SDK valida antes de chamar
   o handler, então slug inválido não chega à camada de acesso.

## Constraints

- Conteúdo em inglês.
- Sem tools de escrita: o único caso de escrita é `/api/hire`.
- A camada de acesso continua sendo o único caminho para `getCollection`.
- Nenhum dado sensível na resposta: vale o mesmo portão de vazamento das demais rotas.
- Nenhuma dependência além do SDK oficial.

## Out of Scope

- Autenticação: o servidor é público e só lê.
- Migração para a revisão 2026-07-28 do protocolo.
- Tools de escrita, incluindo envio de briefing.
- Resources e prompts do MCP: só tools nesta entrega.
- Rate limit próprio: se necessário, entra junto com o de `/api/hire`.

## Decisões pendentes do autor

1. **Nome e versão que o servidor declara** ao se apresentar. O plano usa
   `nandomoreira-dev` e a versão do `package.json` como padrão.
