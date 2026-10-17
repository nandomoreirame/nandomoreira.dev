# Spec: terminal-noir-fixes

> Ajustes pedidos pelo autor em 2026-10-17, depois de `terminal-noir-pages`. REQ-001 a REQ-004 implementados e revisados (zero achados); REQ-005 a REQ-012 acrescentados e aprovados no mesmo dia, e implementados pelo Grok (rodadas 2 e 3 da revisão). REQ-013 a REQ-016 pedidos pelo autor depois de ver o resultado, ainda em 2026-10-17; o REQ-016 substitui partes do REQ-005 e do REQ-012.

## Requisitos

1. [REQ-001] QUANDO a `/contato` renderizar ENTÃO o campo "Mensagem" DEVE ter cerca de 25% menos altura: `rows="4"` no lugar de `rows="6"` (172px para 120px, o mais perto de 25% que o atributo permite).
2. [REQ-002] QUANDO um checkbox de "Tenho interesse em" estiver marcado ENTÃO a caixa DEVE ficar âmbar com o check escuro visível no meio. Causa: o `<span class="check-box">` carrega a utility `bg-background`, que vence as regras de `@layer components`; o fundo de repouso DEVE ir para a regra `.check-box` e a utility DEVE sair do span.
3. [REQ-003] QUANDO a listagem do blog renderizar ENTÃO o resumo do `PostRow` DEVE ocupar a largura da linha, sem o `max-w-[68ch]`.
4. [REQ-004] QUANDO a `/now` renderizar ENTÃO o bloco "Foco" DEVE seguir o padrão das outras seções (texto e listas, sem `Card`); só o "Disponibilidade" continua em card (o `Alert`).

5. [REQ-005] QUANDO a home renderizar ENTÃO o hero NÃO DEVE ter o link "Disponível para novos projetos · conectar via MCP" e o título DEVE começar a 120px do topo no desktop (`lg:pt-3xl` mais `lg:mt-lg`, sem token novo). A disponibilidade continua na pill do header.
6. [REQ-006] QUANDO o hero renderizar ENTÃO a linha abaixo dos botões DEVE ser `STACK: TS, Py, Rust, LLM ops` (rótulo no acento) e `LOCATION: São Paulo / Remote` (rótulo em `success`), em mono, como no Stitch; o texto vem de `HERO_FACTS` em `src/lib/home/hero.ts`, e a prop `stack` derivada do perfil sai.
7. [REQ-007] QUANDO uma página com `PageHeader`, ou a `/sobre`, renderizar ENTÃO o eyebrow DEVE ser o caminho da página em minúsculas, mono e no acento (`~/contato`, `~/posts`, `~/posts/arquivo/2018`, `~/now`, `~/sobre`), calculado da URL por `terminalPath` em `src/lib/layout/terminal-path.ts`.
8. [REQ-008] QUANDO a `/posts` renderizar ENTÃO o fim da página DEVE ter o card "Novidades no terminal" (`id="novidades"`): ícone de e-mail, eyebrow "Novidades no terminal", título "Assine o feed de artigos técnicos", a frase "Zero marketing. Apenas novos artigos quando saem no ar.", campo de e-mail com rótulo, botão "Assinar" e uma linha com link para `/privacidade#novidades`. Texto do Stitch, a revisar pelo autor.
9. [REQ-009] QUANDO o formulário do card for enviado ENTÃO o sistema DEVE fazer `POST /api/subscribe` (form-urlencoded, sem JavaScript), validar o e-mail com Zod, descartar em silêncio o honeypot, limitar a 5 envios por IP a cada 10 minutos e responder 303 para `/posts?assinatura=ok|invalido|limite|erro#novidades`; a página DEVE mostrar a mensagem do resultado no card.
10. [REQ-010] QUANDO o e-mail for válido ENTÃO o sistema DEVE gravar em `newsletter_subscribers` um documento com id igual ao SHA-256 do e-mail normalizado (minúsculas, sem espaços nas pontas) e os campos `email`, `subscribedAt` e `source: 'posts'`, sem IP nem user agent; quem já assinou DEVE receber o mesmo "ok".
11. [REQ-011] QUANDO a feature entrar ENTÃO o `firestore.rules` DEVE negar explicitamente `newsletter_subscribers`, e a política de privacidade DEVE ganhar a seção `novidades` ("Novidades por e-mail"): consentimento (art. 7º, I da LGPD), o que é guardado, que fica até a pessoa pedir para sair e como sair.
12. [REQ-012] QUANDO a 404 renderizar ENTÃO a página DEVE ser um card central com: eyebrow `~/404`; "404" grande em Newsreader no acento, com brilho; chip `STATUS: 404 NOT_FOUND`; título "Página não encontrada" e a descrição atual; uma `TerminalWindow` com `$ curl -I https://nandomoreira.dev<caminho pedido>` e `HTTP/2 404 Not Found`, com Copiar; e as ações "Voltar para a home" (primário, `/`), "Explorar portfólio" (secundário, `/portfolio`) e "Ver laboratório" (link, `/lab`). Continua `noindex` e com status 404. O caminho pedido aparece escapado e cortado em 200 caracteres.
13. [REQ-013] QUANDO a 404 renderizar ENTÃO a página NÃO DEVE ter o card de fundo nem o eyebrow `~/404`, e o "404" grande DEVE ter 1,5 vez o tamanho atual (`calc(var(--text-display) * 3)`). O resto do REQ-012 continua: chip, título, descrição, janela do `curl` com Copiar, as três ações, `noindex` e status 404.
14. [REQ-014] QUANDO uma página mostrar a disponibilidade ENTÃO ela DEVE usar o componente `AvailabilityCard` (o bloco atual da `/contato`: ponto de status ao lado do rótulo de `AVAILABILITY_LABEL`, o detalhe embaixo, borda hairline sobre `surface`). A `/contato` passa a usar o componente, e a `/now` troca o `Alert` "Disponibilidade" por ele, no mesmo lugar (fim do bloco Foco).
15. [REQ-015] QUANDO o hero renderizar no desktop ENTÃO o bloco de texto DEVE ter 200px de respiro no topo e 120px embaixo, por dois tokens novos de espaçamento (`--spacing-hero-top: 12.5rem`, `--spacing-hero-bottom: 7.5rem`), sem valor arbitrário. O `lg:mt-lg` do h1 sai.
16. [REQ-016] QUANDO a home renderizar ENTÃO NÃO DEVE haver `SectionRule` entre o hero e a seção de posts; as demais seções continuam separadas por ela.
## Decisões

| Pergunta | Decisão |
|---|---|
| Envio dos e-mails | Fora desta leva: hoje só grava a lista; a política diz isso |
| Confirmação em duas etapas | Fora: exige envio, que ainda não existe |
| Aviso ao autor a cada assinante | Não: evita segredo novo |
| IP | Só no limite de taxa, em memória; nunca gravado |
| 404 do Stitch | Entra a estrutura; saem os cabeçalhos falsos, "hacker mode", código 127, órbita e o "reportar via AGENTS.md" |

## Restrições

Nenhum JavaScript novo, nenhum hex ou valor arbitrário novo, nenhum portão relaxado. Texto visível novo só o aprovado aqui. Nenhum e-mail nas rotas de máquina; a coleção nova nunca é lida por cliente.

## Estratégia de testes

Componentes e páginas por AstroContainer; o CSS do checkbox por leitura do `global.css` mais a ausência de `bg-*` no span; `npm run verify` no fim.

## Rastreabilidade

| ID | Descrição | Prioridade | Status |
|---|---|---|---|
| REQ-001 | Mensagem 25% menor | P1 | Feito |
| REQ-002 | Check visível no checkbox marcado | P1 | Feito |
| REQ-003 | Resumo do PostRow sem limite de largura | P1 | Feito |
| REQ-004 | Foco sem card na /now | P1 | Feito |
| REQ-005 | Hero sem a pill, 120px no topo | P1 | Feito |
| REQ-006 | Linha Stack / Location | P1 | Feito |
| REQ-007 | Eyebrow no padrão terminal | P1 | Feito |
| REQ-008 | Card "Novidades no terminal" | P1 | Feito |
| REQ-009 | POST /api/subscribe | P1 | Feito |
| REQ-010 | Gravação idempotente sem IP | P1 | Feito |
| REQ-011 | Regras do Firestore e política | P1 | Feito |
| REQ-012 | 404 no padrão do Stitch | P1 | Feito |
| REQ-013 | 404 sem card, sem `~/404`, número 1,5x | P1 | Pendente |
| REQ-014 | `AvailabilityCard` na /contato e na /now | P1 | Pendente |
| REQ-015 | Hero com 200px no topo e 120px embaixo | P1 | Pendente |
| REQ-016 | Sem SectionRule entre hero e posts | P1 | Pendente |
