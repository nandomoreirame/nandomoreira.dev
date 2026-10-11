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
| 1 | O falso verde: quando o portão diz PASS e nada rodou | Validação com agentes falha sempre do mesmo jeito: verde sem evidência | Portão que ignorava a suíte (7 testes vermelhos com `PASS`), `rpi-gates.sh` rodando da pasta errada com zero verificações, `cmd \| tail` mascarando o exit code, `prettier --write` que diz sucesso sem gravar | Roteiro: [`o-falso-verde`](#o-falso-verde) |
| 2 | Memória para agentes: um backbone em 4 camadas | Como o Claude lembra entre sessões sem inflar o contexto | Camadas Self, Workspace, Entity e Project, `memory-recall` lazy, migração do amnesia com `--finalize`, detecção de drift | Roteiro: [`memoria-para-agentes-em-4-camadas`](#memoria-para-agentes-em-4-camadas) |
| 3 | Revisão cruzada entre modelos | Por que um segundo modelo acha o que o primeiro não vê, e como agregar os achados | `review_aggregate.py`, o Codex achando o vazamento no fechamento do MCP, achados corroborados como sinal | Roteiro: [`revisao-cruzada-entre-modelos`](#revisao-cruzada-entre-modelos) |
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
| Desktop Linux sob medida: CachyOS, Niri e Noctalia | Daybar, Sticky Notes, hypr-switcher e flipclock como ecossistema | Rascunho: `criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos` (os quatro plugins do Noctalia) |
| Radares que publicam no Discord | job-radar e home-radar: Python puro, sem dependência, rodando sozinho | Ideia |
| Homelab com Tailscale | Import de música com scan de vírus e rsync, backup com `btrfs send`. Combina com o tema 5 | Ideia |

## Sementes no arquivo (2015 a 2019)

Textos antigos que viram post novo. O original fica intacto e linkado; o post novo é escrito do zero, com o olhar de hoje. Esses são os textos em que a voz dele aparece sem filtro, então são também a melhor fonte de tom.

| Original | Ideia de post novo | Material |
|---|---|---|
| `8-meses-de-malapronta-e-o-fim` (2015) | O que o fim de uma startup me ensinou, onze anos depois | Startup vista por dentro, o primeiro desafio de performance (quase 4 mil arquivos CSS e JS minificados, mais de 3 mil imagens comprimidas com Gulp), o fim numa sala de reunião de hotel |
| `nao-seja-apenas-um-recortador-de-psd` (2015) | Não seja só quem cola o que a IA devolve | O mesmo argumento de 2015 trocando o PSD pelo prompt: o profissional precisa entender as áreas em volta, agora incluindo o que o agente faz |
| `retro-2016-planing-2017` | Retro 2026, planning 2027 | O formato de retrospectiva de volta, com o ano de 2026: Liquid AI (encerrada em 30/09), o site novo, o framework |
| `como-um-time` (2016) | Trabalhar como um time quando metade do time é agente | O "não é X... é Y" original virou estrutura do post; agora com agentes que implementam, revisam e não podem commitar |

## Roteiros

Ideias que já têm título, resumo e roteiro, mas nenhum texto escrito. Ficam aqui, e não
em `src/content/posts/`, para não poluir os rascunhos em revisão na homologação. Quando
for escrever, o post nasce em `src/content/posts/<slug>.md` com `draft: true`, a partir
do roteiro e de uma entrevista (`docs/ideas/reescrita-posts-ia.md`).

### o-falso-verde

- **Título:** O falso verde: quando o portão diz PASS e nada rodou
- **Resumo:** Em fluxo com agentes, o erro perigoso não é o teste vermelho, que alguém investiga. É o verde que ninguém questiona.
- **Marcadores:** qualidade, agentes

Roteiro:

- O portão que rodava lint, type-check e build, mas não a suíte: `PASS` com sete testes vermelhos.
- Rodando da pasta errada: todas as ferramentas puladas com aviso, zero verificações, `result: PASS`.
- `cmd | tail -12` e o exit code do último estágio do pipeline.
- `prettier --write` que imprime sucesso e não grava.
- A regra: um passo pulado não é um passo verde; evidência é a linha de marca, nunca o exit code.

### memoria-para-agentes-em-4-camadas

- **Título:** Memória para agentes: um backbone em quatro camadas
- **Resumo:** Como o Claude Code lembra decisões entre sessões sem carregar tudo no contexto: o que é sempre lido, o que só entra quando alguém pergunta.
- **Marcadores:** claude code, memória, agentes

Roteiro:

- O problema: cada sessão começa do zero, e jogar tudo no contexto custa caro.
- As quatro camadas: Self, Workspace, Entity e Project, e o que mora em cada uma.
- Eager contra lazy: o `recall` só quando uma entidade é mencionada.
- A migração do sistema anterior e o `--finalize`.
- Drift: memória que mente quando o código muda, e como detectar.

### revisao-cruzada-entre-modelos

- **Título:** Revisão cruzada entre modelos: por que um segundo agente acha o que o primeiro não vê
- **Resumo:** Modelos diferentes erram em lugares diferentes. Como pôr o Codex para revisar o código que outro modelo escreveu, e como agregar os achados dos dois.
- **Marcadores:** code review, agentes

Roteiro:

- O ponto cego de um modelo revisando o próprio código.
- Codex em sandbox somente leitura, com as regras de revisão embutidas no prompt.
- Achados em linhas com severidade, e o agregador que cruza Claude e Codex.
- Corroboração: o achado que os dois modelos apontam pesa mais.
- O caso do fechamento do servidor MCP, que o implementador não viu.

## Ordem sugerida

1. O falso verde (1): conversa com o post do RPI e reforça o argumento de qualidade do site.
2. Memória em 4 camadas (2): o tema mais diferenciado.
3. De 5 dias para 30 minutos (6): o case com número de negócio, depois de revisar a confidencialidade.
