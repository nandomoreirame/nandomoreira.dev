---
slug: mcp-server
phase: none
spec_path: docs/specs/mcp-server/SPEC.md
plan_path: docs/plans/2026-08-09-mcp-server.md
updated: 2026-08-10
---

# Estado: mcp-server

Fase atual: none. Implementado em 2026-08-10, 12 tarefas, 7 commits.

## Evidencia do criterio de aceite de F6

Cliente MCP real (SDK oficial, transporte Streamable HTTP) contra o **build**, nao contra
o fonte. Reproduzivel por `PORT=<livre> bash scripts/verify-mcp-client.sh`:

```
server:   nandomoreira-dev 0.1.0
protocol: 2025-11-25
tools:    check_availability, get_profile, get_project, get_resume, list_projects
get_profile:        Fernando Moreira Costa — Engenheiro de produto com agentes de IA
check_availability: open, updated 2026-08-08
list_projects:      8 cases in lab
get_project:        amnesia-claude-code — Amnesia
get_resume:         Fernando Moreira Costa, 15 projects, x_agent open
unknown slug:       tool error, connection intact
leak scan:          no e-mail, no confidential client
MCP CLIENT PASSED
OK GET /api/mcp answered 406
OK malformed body answered 400 with no internal detail
MCP SERVER PASSED
```

A revisao negociada e **2025-11-25**, estavel, e nao a `2026-07-28` em release candidate,
como REQ-001 exige.

## Decisoes tomadas na implementacao

- **O servidor fecha depois que o corpo e entregue, nao antes.** Fechar num `finally` em
  volta do `handleRequest` e a forma obvia e esta errada: o `handleRequest` resolve assim
  que a `Response` existe, antes de o consumidor ler, entao o fechamento derruba o stream
  e o cliente recebe corpo vazio (observado). Nao fechar vaza um servidor por requisicao
  com `concurrency: 80`. `src/lib/mcp/lifecycle.ts` pendura o fechamento no fim do stream,
  disparando uma unica vez em conclusao, cancelamento ou erro. Achado do Codex.
- **`enableJsonResponse: true`.** Uma requisicao serverless nao tem conexao longa para
  manter aberta; a resposta precisa estar completa quando a rota retorna.
- **`structuredContent` de `list_projects` e `{ projects, total }`.** O protocolo rejeita
  array cru com `-32602`. Descoberto pelo teste, nao presumido.
- **A URL do site e constante em `src/lib/mcp/server.ts`.** O transporte MCP nao tem
  `Astro.site`, e derivar de cabecalho seria forjavel pelo cliente.
- **`export const ALL`, nao so `POST`.** Um cliente que sonda a rota com GET recebe 406 do
  transporte, e nao 404 da rota.
- **`src/lib/mcp/catalog.ts` e a declaracao unica das tools.** O servidor registra dela e o
  `AGENTS.md` documenta dela, entao a lista anunciada nao diverge da servida.

## Achado que precisa de decisao sua

**REQ-009 (conteudo em ingles) esta parcialmente atendido, e isso e anterior a esta
feature.** A moldura das rotas de maquina e inglesa (secoes, descricoes de tool, chaves),
mas o conteudo do autor sai na lingua em que foi escrito: `get_profile` devolve
`headline: "Engenheiro de produto com agentes de IA"`, e o mesmo vale para
`/api/resume.json` (`basics.label`), `llms.txt` e `AGENTS.md`, que ja se comportavam assim
antes. Servir isso em ingles exige um campo de traducao no schema do perfil, que e
**conteudo do autor** e nao pode ser inventado. Ate voce decidir, o comportamento segue
consistente com o que o site ja fazia.
