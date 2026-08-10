# Spec: Endurecimento e cutover

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 6
> **PRD:** F8 (F8.4–F8.6) · **User stories:** sustenta todas
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

O site novo está no ar em `nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app`,
completo. O domínio `nandomoreira.dev` continua servindo o site antigo, cujo título é
`Fernando Moreira | Desenvolvedor Web Full-Stack & AI Engineer`: exatamente o
posicionamento genérico que o projeto inteiro existe para substituir.

Enquanto o cutover não acontece, todo o trabalho está invisível para quem chega pelo
domínio, e a hipótese sob teste não é testada.

Faltam também os portões de qualidade que o PRD exige antes de apontar o domínio, e que
hoje ninguém mede: Lighthouse, navegação por teclado e comportamento em 320px.

## Goals

- Medir e atingir os limiares de qualidade que F8.4 e F8.5 exigem.
- Apontar `nandomoreira.dev` para o App Hosting e desativar o site antigo.
- Deixar o cutover reproduzível e reversível, em vez de um evento manual não registrado.

## Context

### O domínio hoje

`nandomoreira.dev` responde 200 atrás do Cloudflare (`server: cloudflare`,
`cf-ray: ...-GRU`), com resolução em `172.67.140.250` e `104.21.62.244`, que são faixas
do Cloudflare. Ou seja: o DNS é gerenciado lá e o tráfego passa pelo proxy.

Isso importa porque o App Hosting emite e renova o certificado do domínio customizado, e
o modo de SSL do Cloudflare interfere nesse processo.

### A estratégia escolhida

**Decisão do autor (2026-08-09):** trocar o apex direto, sem subdomínio de staging. A
validação que F8.6 exige passa a ser feita na URL `.hosted.app`, que é o mesmo build que
o domínio servirá.

### O que já está pronto e não precisa ser refeito

- Zero JavaScript de cliente nas rotas P0, com portão no build (`no-client-js`).
- Contraste da paleta com portão que lê o `global.css`.
- Skip link, `main` com `tabindex="-1"` e foco visível nos componentes.
- `overflow-x: clip` no `html, body`, com portão que proíbe reintroduzir `min-w-dvw`.
- Imagens otimizadas, com o artefato de deploy podado de 31 MB para 16 MB.

Portanto esta feature **mede** o que já foi construído e corrige o que a medição achar,
em vez de presumir trabalho.

### O que ninguém mediu ainda

Nenhum Lighthouse rodou contra o site. Nenhuma navegação por teclado foi percorrida de
ponta a ponta. Não há navegador neste ambiente, o que torna a medição um passo que exige
ferramenta nova ou execução manual do autor.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| `nandomoreira.dev` serve o site antigo | `curl` ao domínio, `<title>` lido | sim |
| O domínio resolve para faixas do Cloudflare | `dig` A record | sim |
| O tráfego passa pelo proxy do Cloudflare | cabeçalhos `server` e `cf-ray` | sim |
| O site novo está completo em `.hosted.app` | 71 rotas verificadas por `curl` | sim |
| O rollout é automático a partir de `main` | REST API do App Hosting | sim |
| Não há navegador no ambiente de desenvolvimento | `playwright` ausente | sim |
| Os portões de zero JS, contraste e overflow já existem | suíte de testes | sim |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO o site é auditado ENTÃO ele DEVE atingir Lighthouse acima de 90 em Performance, Acessibilidade e SEO, medido contra a URL servida e não em desenvolvimento.
2. **[REQ-002]** QUANDO a auditoria roda ENTÃO o resultado DEVE ser registrado em arquivo versionado, com data e URL medida, para que a próxima medição seja comparável.
3. **[REQ-003]** QUANDO um usuário navega apenas por teclado ENTÃO toda rota P0 DEVE manter foco visível e ordem de tabulação que siga a leitura.
4. **[REQ-004]** QUANDO uma página é aberta em 320px ENTÃO ela NÃO PODE apresentar rolagem horizontal.
5. **[REQ-005]** QUANDO o cutover ocorre ENTÃO `nandomoreira.dev` DEVE servir o backend do App Hosting com certificado válido.
6. **[REQ-006]** ANTES de o domínio ser apontado ENTÃO o build que servirá o domínio DEVE ter sido validado, e a validação DEVE estar registrada.
7. **[REQ-007]** QUANDO o domínio é apontado ENTÃO `www.nandomoreira.dev` DEVE resolver para o mesmo destino, ou redirecionar para o apex.
8. **[REQ-008]** QUANDO o site antigo é desativado ENTÃO nenhuma URL que ele servia PODE passar a responder 404 sem redirecionamento, se houver equivalente no site novo.
9. **[REQ-009]** QUANDO o cutover é executado ENTÃO o procedimento DEVE estar documentado passo a passo, incluindo como reverter.

### P2 (Should Have)

10. **[REQ-010]** QUANDO o certificado é emitido ENTÃO o modo de SSL do Cloudflare DEVE estar em modo que não quebre a emissão nem gere laço de redirecionamento.
11. **[REQ-011]** QUANDO a auditoria de acessibilidade roda ENTÃO ela DEVE cobrir também o estado de foco dos alvos interativos do rodapé e da navegação.
12. **[REQ-012]** QUANDO o cutover termina ENTÃO `sitemap.xml`, `llms.txt`, `AGENTS.md` e o JSON-LD DEVEM declarar o domínio final, e não a URL `.hosted.app`.

### P3 (Nice to Have)

13. **[REQ-013]** QUANDO a auditoria é repetida ENTÃO ela PODE rodar por comando único, para não depender de execução manual.

## Edge Cases

- **Cloudflare com proxy ligado durante a emissão** — o App Hosting valida o domínio por
  DNS; com o proxy laranja o registro apontado não é o que a validação espera. Pode
  exigir desligar o proxy até o certificado emitir.
- **SSL Flexible no Cloudflare** — gera laço de redirecionamento contra uma origem que
  já força HTTPS. Precisa ser Full ou Full (strict).
- **URLs do site antigo** — o acervo antigo tinha rotas próprias; as que tiverem
  equivalente precisam de redirecionamento, e as que não tiverem devem responder 404
  honesto, não redirecionar para a home.
- **`www` não configurado** — quem digita `www.` recebe erro de certificado, que é pior
  que 404.
- **Lighthouse em rota SSR fria** — a primeira requisição depois de `minInstances: 0`
  paga cold start e derruba a nota de Performance. A medição precisa aquecer antes.
- **Rollback depois do cutover** — apontar o DNS de volta leva o tempo do TTL; abaixar o
  TTL antes da troca é o que torna a reversão rápida.

## Architecture Decisions

1. **Trocar o apex direto, sem subdomínio de staging** — Decisão do autor. A alternativa
   recusada foi validar em `novo.nandomoreira.dev` antes. A mitigação é que a validação
   de F8.6 roda contra a URL `.hosted.app`, que serve exatamente o mesmo build que o
   domínio servirá, já que o rollout vem do mesmo `main`.
2. **A auditoria é registrada em arquivo versionado** — Um número dito em conversa não
   permite comparar a próxima medição. REQ-002 transforma a auditoria em artefato.
3. **Baixar o TTL antes do cutover** — Torna a reversão uma operação de minutos. É
   barato antes e impossível depois.
4. **O site antigo é desativado depois de o novo servir o domínio, não antes** — Inverter
   a ordem cria uma janela sem site.
5. **A medição de Lighthouse não vira portão de CI nesta entrega** — Não há navegador no
   ambiente e o backend tem `minInstances: 0`, então uma medição automática seria
   instável. REQ-013 deixa a automação como P3 explícito, em vez de prometer o que a
   infra não sustenta.

## Constraints

- Nenhuma mudança de arquitetura: esta feature mede e aponta, não reescreve.
- Nenhum portão existente pode ser relaxado para atingir nota.
- O cutover não acontece antes de o MCP ser validado com cliente real (critério de
  aceite de F8 no PRD, que amarra a sprint 6 à sprint 5).
- Conteúdo humano em pt-BR, rotas de máquina em inglês, como no resto do site.

## Out of Scope

- Migrar o DNS para fora do Cloudflare.
- CDN ou cache além do que o App Hosting oferece.
- Otimizações de performance que exijam mudar arquitetura, como pré-renderizar as rotas
  hoje servidas por SSR.
- Monitoramento contínuo e alertas.
- Analytics, que é F12 e está fora do MVP.

## Decisões pendentes do autor

1. **Onde o site antigo está hospedado** e como desativá-lo, o que o repositório não
   registra.
2. **Quais URLs do site antigo merecem redirecionamento**, que depende do que ele
   servia.
3. **Quem roda o Lighthouse**: o ambiente não tem navegador, então ou entra uma
   ferramenta nova, ou a medição é executada pelo autor e registrada no arquivo.
