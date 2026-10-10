# Ideias de posts

> **Criado:** 2026-10-10
> **Origem:** análise do framework `~/.claude` (109 skills, 19 agentes, hooks e lições
> aprendidas), dos currículos e dos projetos abertos.

O ativo mais valioso para escrever são as **falhas documentadas**: o framework guarda
dezenas de lições com causa, sintoma e correção. Isso é raro em blog técnico.

Já publicados (não repetir): skills no Claude Code, Claude Project, Claude Code + Cursor,
stack de ferramentas 2026, fluxo RPI com três agentes, o site que conversa via MCP, brag
document e Amazon Bedrock.

**Atenção:** o repositório `.claude` é privado. Os posts podem mostrar trechos, mas não
linkar o repositório.

## Prioridade alta (material pronto)

| # | Tema | Ângulo | Material | Status |
|---|---|---|---|---|
| 1 | O falso verde: quando o portão diz PASS e nada rodou | Validação com agentes falha sempre do mesmo jeito: verde sem evidência | Portão que ignorava a suíte (7 testes vermelhos com `PASS`), `rpi-gates.sh` rodando da pasta errada com zero verificações, `cmd \| tail` mascarando o exit code, `prettier --write` que diz sucesso sem gravar | Rascunho: `o-falso-verde` |
| 2 | Memória para agentes: um backbone em 4 camadas | Como o Claude lembra entre sessões sem inflar o contexto | Camadas Self, Workspace, Entity e Project, `memory-recall` lazy, migração do amnesia com `--finalize`, detecção de drift | Rascunho: `memoria-para-agentes-em-4-camadas` |
| 3 | Revisão cruzada entre modelos | Por que um segundo modelo acha o que o primeiro não vê, e como agregar os achados | `review_aggregate.py`, o Codex achando o vazamento no fechamento do MCP, achados corroborados como sinal | Rascunho: `revisao-cruzada-entre-modelos` |
| 4 | Auto-learning: o agente que transforma erro em regra | Ciclo erro e correção vira lição persistente, com filtro de qualidade | Regra 12 com os quatro critérios, roteamento por escopo, lições sem dono no `CLAUDE.md` global | Ideia |

## Prioridade média (mais nicho)

| # | Tema | Ângulo | Status |
|---|---|---|---|
| 5 | Armadilhas de shell que me custaram caro (série) | `ssh` dentro de `while read` que virou envio completo de 48 GB e 9 dias sem backup; `IFS=$'\t'` gerando 380 tags erradas no 1Password; `pkill -f` matando o próprio shell; `UID` readonly; `BASH_ENV` quebrando stubs de teste | Ideia |
| 6 | De 5 dias para 30 minutos: IA numa esteira de ETL de dados imobiliários | O case profissional mais forte do currículo. Sem cliente e sem dado: só arquitetura e decisões. Revisar o que pode ser dito antes de escrever | Rascunho: `de-cinco-dias-para-trinta-minutos` |
| 7 | Implementação em paralelo com worktrees | `project-fanout`: um agente por plano, worktree e branch próprios, fila de recursos para teste e build, merge sequencial | Ideia |
| 8 | Agentes CLI ignoram escopo: permissão restringe, instrução não | O Codex fazendo 5 commits quando foi pedido 1, a lista de comandos git negada ao Grok, a Iron Law #15 | Ideia |
| 9 | Hooks do Claude Code na prática | Injeção de contexto no SessionStart, roteador que só sugere, o guardrail que ficou sem evento | Ideia |

## Projetos que rendem post próprio

| Tema | Ângulo | Status |
|---|---|---|
| Desktop Linux sob medida: CachyOS, Niri e Noctalia | Daybar, Sticky Notes, hypr-switcher e flipclock como ecossistema | Ideia |
| Radares que publicam no Discord | job-radar e home-radar: Python puro, sem dependência, rodando sozinho | Ideia |
| Homelab com Tailscale | Import de música com scan de vírus e rsync, backup com `btrfs send`. Combina com o tema 5 | Ideia |

## Ordem sugerida

1. O falso verde (1): conversa com o post do RPI e reforça o argumento de qualidade do site.
2. Memória em 4 camadas (2): o tema mais diferenciado.
3. De 5 dias para 30 minutos (6): o case com número de negócio, depois de revisar a confidencialidade.
