---
slug: fluxo-rpi-claude-code-grok-codex
title: "Fluxo RPI com três agentes: o Claude Code planeja, o Grok implementa e o Codex revisa"
summary: "Como montei Research, Plan e Implement em três slash commands do Claude Code, delegando a escrita do código ao Grok e a revisão ao Codex, com fallback para o Claude quando um deles cai."
date: "2026-10-10"
publishedAt: "2026-10-10T12:08:11-03:00"
art: flow
markers:
  - claude code
  - rpi
  - agentes
---

Pedir para um agente "implementar a feature" funciona até a feature ter mais de três arquivos. Daí em diante o agente começa a decidir sozinho o que você não decidiu, esquece o que combinou duas mensagens atrás e entrega um diff que você precisa ler linha por linha para saber se confia.

Depois de um tempo nisso, separei o trabalho em três fases, cada uma num slash command do Claude Code:

```bash
/rpi:research ai-view     # entrevista e escreve a spec
/rpi:plan ai-view         # transforma a spec em tarefas atômicas
/rpi:implement ai-view    # executa as tarefas, uma por vez
```

RPI é Research, Plan, Implement. A ideia não é nova; o que mudou no meu fluxo foi distribuir as fases entre modelos diferentes. O Claude Code conduz as três e decide. O Grok escreve o código de cada tarefa. O Codex revisa o diff. E o Claude fecha a conta: commita cada tarefa revisada e, no fim, roda lint, type-check, testes e build sobre a feature inteira.

Este site foi construído assim, e os exemplos abaixo saem dele.

## Por que separar em fases

O problema de pedir tudo de uma vez não é capacidade do modelo. É que as decisões ficam implícitas. "Adiciona uma visão para IA em cada página" carrega umas trinta decisões escondidas: qual rota, o que acontece com página que não tem markdown, se precisa de JavaScript, como copiar o conteúdo, o que entra no sitemap. Se ninguém pergunta, o agente escolhe, e você descobre as escolhas no code review.

Separar em fases é inverter onde o esforço vai. Gasto o tempo **antes** de existir código, quando mudar de ideia custa uma linha de texto. Na hora de implementar, não sobra decisão para o agente tomar.

## Os comandos são finos de propósito

Cada slash command é um arquivo markdown curto em `~/.claude/commands/rpi/`, e quase não tem conteúdo:

```markdown
---
name: rpi:research
description: "Phase R of RPI - explore requirements and produce a spec"
---

Invoke the `rpi-research` skill and follow it exactly as presented to you.

User's input: $ARGUMENTS
```

A lógica mora em skills (`rpi-research`, `rpi-plan`, `rpi-implement`), e os passos mecânicos em scripts shell. O comando só roteia. Isso me deixa evoluir o processo sem mexer na interface: o comando que eu digito continua o mesmo enquanto o que ele faz por baixo muda.

## Research: a spec é a fonte da verdade

O `/rpi:research` não começa escrevendo. Ele começa lendo: procura no código, nos documentos do projeto e nas specs existentes tudo o que dá para descobrir sozinho. Só pergunta o que não está escrito em lugar nenhum, uma pergunta por vez.

Para features médias e grandes, ele roda uma etapa que chamo de grilling, adaptada do `grill-me` do Matt Pocock: percorre a árvore de decisões da feature, um nó por vez, e para cada decisão propõe uma resposta recomendada com a justificativa. Eu reajo a uma proposta em vez de pensar do zero. A regra que mais importa ali é separar fato de decisão: se a resposta está no código, o agente vai buscar; se é escolha minha, ele pergunta e espera.

O resultado é `docs/specs/<slug>/SPEC.md`, com requisitos que dá para testar. Neste site eles são escritos em português, no formato `QUANDO [evento] ENTÃO o sistema DEVE [resposta]`:

```markdown
1. [REQ-001] QUANDO qualquer página coberta renderiza ENTÃO o sistema DEVE
   exibir um switcher fixo no canto inferior direito, **Humano | IA**, com
   "Humano" marcado como atual e "IA" como link para `<página>/ia`.
```

Cada requisito tem um ID, e esse ID vai acompanhar a tarefa, o teste e o commit. A spec também registra o que ficou de fora e por quê, o que evita a mesma discussão voltar na semana seguinte.

Nenhuma spec é salva sem eu aprovar.

## Plan: tarefas que qualquer agente consegue executar

O `/rpi:plan` lê a spec e quebra a feature em tarefas de dois a cinco minutos. Cada tarefa diz qual requisito atende, quais arquivos cria ou altera, qual teste escrever primeiro e qual comando prova que passou:

```markdown
### Task 1: `marked` e `renderMarkdown`

**Requirement:** REQ-002 · **Files:** Create `src/lib/ai-view/render.ts`;
Modify `package.json`; Test `tests/ai-view/render.test.ts`
**Team:** backend · implementer `backend-engineer` · reviewers security-reviewer, test-reviewer

- `npm install marked@18.1.0 --save-exact`; rodar `npm audit --omit=dev`.
- `renderMarkdown(source: string): string` usa `marked.parse(source, { async: false, gfm: true })`.
- Antes de renderizar, remover um frontmatter YAML inicial, que não é conteúdo.
- Testes: título vira `<h1>`, lista vira `<ul>`, frontmatter some, link mantém `href`.
```

O critério do plano é este: **um engenheiro sem nenhum contexto precisa conseguir executar a tarefa**. Esse engenheiro, na prática, é outro modelo, que não leu a conversa, não conhece o projeto e vai receber só o texto da tarefa. Se o plano depende de algo que só está na minha cabeça, ele está incompleto.

Antes de salvar, o plano confere se todo arquivo marcado como "Modify" existe de verdade. Um caminho errado no plano vira um arquivo novo criado no lugar errado durante a implementação.

## Implement: cada modelo no que faz melhor

Aqui entram os três agentes. Para cada tarefa do plano, em sequência:

| Etapa | Quem | Como |
|---|---|---|
| Implementa código e teste | Grok | `grok-implement.sh`, headless |
| Revisa o diff da tarefa | Codex | `codex-review.sh`, sandbox somente leitura |
| Commita a tarefa e, no fim, valida a feature | Claude Code | commit por tarefa; lint, type-check, testes e build no final |

O Claude Code nunca sai do papel de orquestrador. Ele lê a tarefa no plano, monta o prompt com o texto completo dela, o contexto do projeto e a regra de TDD, e entrega ao Grok:

```bash
grok-implement.sh --prompt-file /tmp/grok-task-3.md --cwd ~/dev/projects/nandomoreira.dev
```

Quando o Grok termina, o Claude monta um segundo prompt com o diff daquela tarefa e as regras de revisão (segurança, acessibilidade, performance) embutidas no texto, porque o Codex não lê as skills do Claude:

```bash
codex-review.sh --mode panel --cwd ~/dev/projects/nandomoreira.dev \
  --prompt-file /tmp/codex-task-3.md --out /tmp/codex-task-3.rows
```

O Codex devolve achados classificados por severidade. Achado crítico ou alto volta para o Grok com o problema anexado, no máximo duas rodadas. Se depois disso ainda houver problema, o fluxo para e me chama. Achado médio ou baixo segue adiante.

Passou na revisão, o Claude faz o commit daquela tarefa, só dela, com o ID do requisito na mensagem. Depois da última tarefa, ele roda os portões do projeto sobre a feature inteira: lint, formatação, type-check, a suíte de testes e o build. Se algo falhar ali, a feature não está pronta, por mais que cada tarefa tenha passado na revisão.

Ter um modelo revisando o código de outro foi a parte que mais me surpreendeu. No servidor MCP deste site, o Codex achou um problema que o implementador não viu e eu também não teria visto: fechar o servidor MCP num `finally` esvaziava a resposta antes de ela sair, e não fechar vazava um servidor por requisição. A correção foi adiar o fechamento para o fim do stream. Modelos diferentes erram em lugares diferentes, e é exatamente isso que torna a revisão cruzada útil.

## Nenhum agente externo faz commit

Grok e Codex nunca tocam no git. Não é só uma instrução no prompt, que um modelo pode ignorar: o script do Grok passa uma lista de comandos proibidos para a própria CLI.

```bash
DENY_RULES=(
  "Bash(git commit:*)"
  "Bash(git push:*)"
  "Bash(git add:*)"
  "Bash(git merge:*)"
  "Bash(git reset:*)"
  # ...
)
```

O Grok pode rodar `git status` e `git diff` para entender o contexto, mas qualquer escrita é bloqueada. O Codex roda num sandbox somente leitura. Quem commita é sempre o Claude, depois dos portões, e push só acontece quando eu peço.

Aprendi isso do jeito caro. Uma vez dei a uma CLI agentic uma lista de arquivos para commitar, e ela fez cinco commits: o que eu pedi e mais quatro grupos de mudanças não relacionadas que estavam sujos na árvore. Uma lista de escopo não restringe um agente; permissão restringe.

## Quando um agente cai, o Claude assume

Grok e Codex dependem de cota, autenticação e rede. Qualquer um deles pode ficar indisponível no meio de uma feature, e eu não queria que isso parasse o trabalho.

Os dois scripts classificam a falha pelo código de saída:

| Saída | Significado | O que o fluxo faz |
|---|---|---|
| `0` | Terminou | Segue |
| `3` | Indisponível: cota, auth, rate limit, rede ou timeout | O Claude assume aquela etapa até o fim da feature |
| outro | Rodou, mas falhou | Rodada de correção, até duas vezes |

A distinção importa. "O Grok não respondeu" e "o Grok escreveu código errado" pedem reações diferentes: no primeiro caso troco de executor, no segundo dou o feedback e peço de novo.

Isso aconteceu na feature da visão IA deste site, e o arquivo de estado dela conta sem maquiagem: o Grok implementou as tarefas 1 a 6, estourou o tempo limite no meio da 7, e o Claude assumiu da 7 em diante. O Codex estava sem cota naquela semana, então a revisão também foi do Claude. A feature saiu inteira, com as dez tarefas e a suíte verde.

É aí que o plano mostra o valor dele. Como cada tarefa é autocontida, o Claude pegou a tarefa 7 do ponto exato onde o Grok parou, sem precisar de nenhum contexto além do que já estava escrito.

## O estado é por feature

Cada feature tem o próprio `docs/specs/<slug>/STATE.md`, com a fase em que está e os caminhos da spec e do plano:

```yaml
---
feature: ai-view
phase: none
started_at: 2026-10-08
depth: standard
spec_path: docs/specs/ai-view/SPEC.md
plan_path: docs/plans/2026-10-08-ai-view.md
---
```

Não existe um arquivo de estado global. Isso me deixa rodar duas sessões RPI ao mesmo tempo, em terminais diferentes, uma pesquisando uma feature enquanto a outra implementa outra, sem uma sobrescrever a outra. Para duas features no mesmo repositório, cada uma vai para uma git worktree separada.

O STATE.md também serve como diário. É ali que fica registrado quem implementou o quê, o que caiu e qual foi a evidência de que terminou.

## O portão que mentia

Uma lição que custou caro: um portão de validação que reporta sucesso sem ter rodado é pior do que nenhum portão.

O script de portões do meu fluxo, numa versão antiga, rodava lint, type-check e build, mas não a suíte de testes. Uma rodada fechou com `result: PASS` enquanto sete testes estavam vermelhos, porque compilar não é passar nos testes. Em outra ocasião, rodando da pasta errada, ele não encontrou nenhuma ferramenta, pulou todos os passos com um aviso e reportou `PASS` com zero verificações executadas.

Hoje o portão roda lint, formatação, type-check, a suíte e o build, e eu não leio `PASS` sem conferir as linhas acima dele. Um passo pulado não é um passo verde. Em fluxo com agentes, o perigo nunca é o falso vermelho, que alguém investiga. É o falso verde, que todo mundo aceita.

## Como usar no dia a dia

Para uma feature nova, a sequência completa:

```bash
/rpi:research hire-endpoint            # entrevista, grilling, spec aprovada
/rpi:plan hire-endpoint                # plano com tarefas e IDs de requisito
/rpi:implement hire-endpoint           # Grok, Codex, Claude, tarefa por tarefa
```

Dá para planejar várias features e implementar todas de uma vez, sem pausa entre elas:

```bash
/rpi:implement mcp-server hire-endpoint structured-resume --agentic
```

E para uma correção pequena, que não merece spec, existe o atalho `/dev:implement`, que usa o mesmo trio numa tarefa só.

Não uso RPI para tudo. Trocar uma cor, corrigir um texto ou ajustar um espaçamento vai direto. O fluxo vale a partir do momento em que existem decisões a tomar.

## O que mudou

Deixei de revisar código linha por linha para revisar decisões. A spec e o plano são curtos o bastante para eu ler com atenção, e é ali que está o que importa: as regras de negócio, os casos de borda, o que fica de fora. O código que sai deles é escrito por um modelo, revisado por outro e validado por um terceiro contra testes que existiam antes da implementação.

Não é que eu confie mais nos agentes. É que eu parei de depender de confiar.
