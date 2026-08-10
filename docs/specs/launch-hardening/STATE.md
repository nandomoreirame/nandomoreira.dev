---
slug: launch-hardening
phase: implement-partial
spec_path: docs/specs/launch-hardening/SPEC.md
plan_path: docs/plans/2026-08-09-launch-hardening.md
updated: 2026-08-10
---

# Estado: launch-hardening

Lotes 1 e 2 concluidos em 2026-08-10 (T1 a T6, T9, T11 preparado). O lote 3, o cutover em
si, esta escrito como runbook e **nao foi executado**: mexe em DNS de producao e derruba o
site antigo.

## Feito

| Tarefa | Resultado |
|---|---|
| T1 auditoria | `scripts/audit-lighthouse.sh`, Lighthouse por `npx` |
| T2 medir | `docs/audits/2026-08-10-lighthouse.md` |
| T3 teclado | `scripts/verify-keyboard.sh`, 11 rotas, `KEYBOARD WALK PASSED` |
| T4 320px | `scripts/verify-viewport-320.sh`, 11 rotas, `VIEWPORT 320 PASSED` |
| T5 a11y | contraste do codigo destacado corrigido e travado por portao |
| T6 perf | capa do post deixou de ser `loading=lazy` |
| T9 inventario | site antigo tem **uma unica rota**; nenhum redirect legado necessario |

## Medicao (T2)

| Rota | Performance | Acessibilidade | SEO |
|---|---|---|---|
| `/` | 97 | 100 | 100 |
| `/lab/amnesia-claude-code` | 99 | 100 | 100 |
| `/criar-site-completo-com-o-notion` | 75 | 96 | 100 |

Os dois achados do post viraram tarefa, nao nota renegociada. Detalhe completo em
`docs/audits/2026-08-10-lighthouse.md`.

## Decisoes tomadas na implementacao

- **`@lhci/cli` foi descartado como dependencia.** Ele arrasta `tmp <=0.2.5`, aviso HIGH de
  path traversal, e o checklist de pre-deploy exige `npm audit` limpo de high e critical.
  O Lighthouse roda por `npx` sob demanda, que era o proposito de qualquer forma.
- **O portao de 320px nao usa `scrollWidth`.** A camada base poe `overflow-x: hidden` no
  `body`, entao a rolagem e suprimida e o documento nunca a reporta: com um
  `<div style="width:900px">` na pagina, `scrollWidth` continuou 320 e a primeira versao do
  portao passou. O criterio virou geometrico, e ai morde.
- **O portao de teclado captura a aparencia sem foco antes de tabular.** Aceitar "tem
  box-shadow" como prova de indicador deixaria passar um elemento com sombra decorativa e
  o foco removido, que e a regressao que o portao existe para pegar. Achado do Codex,
  provado depois com essa sabotagem exata.
- **O tema do Shiki foi medido, nao escolhido.** Doze candidatos, tabela em
  `docs/audits/2026-08-10-lighthouse.md`.

## O que falta, e e seu

O lote 3 inteiro, passo a passo em **`docs/runbooks/cutover.md`**: baixar o TTL, adicionar
o dominio no App Hosting com o proxy do Cloudflare cinza e SSL em Full (strict), apontar,
confirmar, e so entao desativar o antigo.

Os dois bloqueios que o PRD amarra ao cutover **estao liberados**: o MCP foi validado com
cliente real e a medicao esta registrada.

## Limitacao registrada, nao mascarada

A verificacao de teclado confirma que o foco avanca, volta e e visivel. Ela **nao** julga
se a ordem de tabulacao corresponde a ordem de leitura de cada composicao; isso continua
sendo inspecao humana.

O post com capa animada de 2,2 MB seguira com LCP alto ate voce decidir trocar a midia.
Reduzir o GIF ou substitui-lo por video e decisao de conteudo, e a spec poe mudanca de
arquitetura de midia fora do escopo.
