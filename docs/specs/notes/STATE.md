---
phase: plan-complete
spec_path: docs/specs/notes/SPEC.md
plan_path: docs/plans/2026-08-09-notes.md
started_at: 2026-08-09
updated_at: 2026-08-09
current_section: ""
decisions:
  - "Nome é 'notas', não blog: texto curto, sem periodicidade, sem compromisso de volume"
  - "Rota /notas em português; identificador interno notes em inglês"
  - "Nenhuma data em superfície humana (REQ-002), com portão automatizado contra vazamento"
  - "Data existe no frontmatter só para ordenação, RSS e lastmod"
  - "Fora da navegação principal enquanto não houver nota publicada"
  - "F14 promovida de P2/v2.0 para P0; PRD e MVP-SCOPE precisam ser reescritos"
blockers:
  - "Depende de theme-restyle: o componente de linha com coluna de data opcional vem de lá (REQ-022 daquela spec)"
transitions:
  - "2026-08-09: research (interativo)"
  - "2026-08-09: plan-complete"
---

# STATE — notes

F14 do PRD, promovida de P2 para P0 por decisão do autor. Era "Blog" e passa a "Notas".

## A tensão que essa decisão cria, e por que ela foi aceita

O `PRD.md` diz "Não é um blog" nos Non-Goals. O `MVP-SCOPE.md` lista o blog em "O que
NÃO ENTRA" e ainda o nomeia como tentação: "escrever o blog já que estou escrevendo os
cases". O argumento contra era o RISK-003, o risco de maior probabilidade do projeto: os
8 cases nunca serem escritos, porque o gargalo real é tempo de escrita, com 10 a 15
horas por semana.

Essa objeção continua válida e não deve ser esquecida. O que a atenua é o formato: uma
**nota** é texto curto, sem data exibida e sem periodicidade, então não carrega a
expectativa de volume que faz um blog competir com os cases. A armadilha que o
`MVP-SCOPE.md` descreve depende de o blog ter fim indefinido, e uma nota não tem.

Vale monitorar: se as notas começarem a ser escritas antes dos 8 cases, o RISK-003 se
materializou por outra porta.

## Consequência técnica do "sem data"

Sem nenhuma data não há ordem estável entre notas, o RSS não tem `pubDate` e o
`sitemap.xml` não tem `lastmod`. A resolução é manter a data no frontmatter como
metadado de máquina, jamais renderizada. Se o autor quiser ausência total de data, a
alternativa é um campo de ordem manual, e a decisão precisa ser revisitada antes da
implementação.

Como o campo existe e está a um passo de aparecer, REQ-002 tem portão automatizado: um
teste renderiza listagem e página com uma data conhecida e reprova se ela vazar para o
HTML. É a regressão mais provável desta feature.
