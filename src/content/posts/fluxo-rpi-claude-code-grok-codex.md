---
slug: fluxo-rpi-claude-code-grok-codex
title: "Fluxo RPI com três agentes: o Claude Code planeja, o Grok implementa e o Codex revisa"
seoTitle: "Fluxo RPI: o Claude Code planeja, o Grok implementa"
summary: "Pesquisa e plano antes de qualquer feature, como eu já trabalhava. O Claude Code conduz, o Grok escreve, o Codex revisa, e o teste vem antes do código mesmo quando isso deixa a IA mais lenta."
date: "2026-10-10"
publishedAt: "2026-10-10T12:08:11-03:00"
art: flow
markers:
  - claude code
  - rpi
  - agentes
extras:
  - "3 modelos, 1 tarefa por vez, teste primeiro"
  - "Claude Code · Grok · Codex"
keyPoints:
  - "Pesquisa e spec antes do código: na hora de implementar, não sobra decisão para o agente tomar."
  - "O Grok implementa, o Codex revisa em sandbox e só o Claude commita; a escrita no git é bloqueada por permissão."
  - "Saída 3 é indisponibilidade e troca o executor; outra falha volta para correção, até duas rodadas."
snapshot:
  items:
    - label: Orquestrador
      value: Claude Code
    - label: Implementa
      value: Grok
    - label: Revisa
      value: Codex
    - label: Scripts
      value: shell
    - label: Formato
      value: markdown
---

Eu já criei muitos projetos em que a pesquisa e o planejamento vêm antes de qualquer feature. O RPI saiu disso. Não teve um projeto, nem um diff que eu olhei e pensei "agora vou inventar um método". Como dev sênior, essa ordem já era a minha. Passar ela para o agente foi natural.

A pergunta errada é qual modelo escreve melhor. No meu fluxo, o que muda o resultado é a ordem. O Claude Code conduz e decide. O Grok escreve o código de cada tarefa. O Codex revisa o diff. O Claude fecha a conta: commita a tarefa revisada e, no fim, roda lint, type-check, testes e build sobre a feature inteira.

Este site foi construído assim. Os exemplos abaixo saem dele.

```bash
/rpi:research ai-view     # entrevista e escreve a spec
/rpi:plan ai-view         # transforma a spec em tarefas atômicas
/rpi:implement ai-view    # executa as tarefas, uma por vez
```

RPI é Research, Plan e Implement. A ideia de separar essas fases não é nova. O que eu fiz foi distribuir cada fase entre modelos diferentes, e deixar o Claude Code no meio, conduzindo.

## A decisão fica escrita antes do código

Pedir "adiciona uma visão para IA em cada página" esconde um monte de escolha: qual rota, o que acontece com a página que não tem markdown, se entra JavaScript, como copiar o conteúdo, o que vai para o sitemap. Se ninguém pergunta, o agente escolhe, e eu descubro a escolha no code review.

Eu gasto o tempo **antes** de existir código, quando mudar de ideia custa uma linha de texto. Na hora de implementar, não sobra decisão para o agente tomar.

## O comando que eu digito quase não tem conteúdo

Cada slash command é um arquivo markdown curto, e a função dele é chamar a skill:

```markdown
---
name: rpi:research
description: "Phase R of RPI - explore requirements and produce a spec"
---

Invoke the `rpi-research` skill and follow it exactly as presented to you.

User's input: $ARGUMENTS
```

A lógica mora nas skills (`rpi-research`, `rpi-plan`, `rpi-implement`). Os passos mecânicos moram em scripts shell. O comando só roteia. Eu evoluo o processo sem mudar o que digito.

## A spec sai de pergunta, não de chute

O `/rpi:research` começa lendo. Código, documentos do projeto, specs que já existem. Só pergunta o que não está escrito em lugar nenhum, uma pergunta por vez.

Em feature média ou grande entra uma etapa que eu chamo de grilling, adaptada do `grill-me` do Matt Pocock. Ela percorre a árvore de decisões, um nó por vez, e propõe uma resposta com a justificativa. Eu reajo a uma proposta em vez de pensar do zero. Se a resposta está no código, o agente vai buscar. Se é escolha minha, ele pergunta e espera.

O resultado é `docs/specs/<slug>/SPEC.md`. Neste site os requisitos são em português, no formato `QUANDO [evento] ENTÃO o sistema DEVE [resposta]`:

```markdown title="docs/specs/<slug>/SPEC.md"
1. [REQ-001] QUANDO qualquer página coberta renderiza ENTÃO o sistema DEVE
   exibir um switcher fixo no canto inferior direito, **Humano | IA**, com
   "Humano" marcado como atual e "IA" como link para `<página>/ia`.
```

Cada requisito tem um ID. Esse ID segue a tarefa, o teste e o commit. A spec também registra o que ficou de fora, para a mesma discussão não voltar na semana seguinte.

Nenhuma spec é salva sem eu aprovar.

## A tarefa tem de caber na mão de quem não leu a conversa

O `/rpi:plan` quebra a feature em tarefas de dois a cinco minutos. Cada uma diz o requisito, os arquivos, o teste que vem primeiro e o comando que prova que passou:

```markdown
### Task 1: `marked` e `renderMarkdown`

**Requirement:** REQ-002 · **Files:** Create `src/lib/ai-view/render.ts`;
Modify `package.json`; Test `tests/ai-view/render.test.ts`

- `npm install marked@18.1.0 --save-exact`; rodar `npm audit --omit=dev`.
- `renderMarkdown(source: string): string` usa `marked.parse(source, { async: false, gfm: true })`.
- Antes de renderizar, remover um frontmatter YAML inicial, que não é conteúdo.
- Testes: título vira `<h1>`, lista vira `<ul>`, frontmatter some, link mantém `href`.
```

**Um engenheiro sem o contexto da conversa precisa conseguir executar a tarefa.** Na prática esse engenheiro é outro modelo. Ele não leu o chat, não conhece o projeto e recebe só o texto. Se o plano depende de algo que só está na minha cabeça, está incompleto.

Antes de salvar, o plano confere se todo arquivo marcado como "Modify" existe. Caminho errado vira arquivo novo no lugar errado.

## Três modelos, e eu no terminal

Para cada tarefa, em sequência:

| Etapa | Quem | Como |
|---|---|---|
| Implementa código e teste | Grok | `grok-implement.sh`, headless |
| Revisa o diff da tarefa | Codex | `codex-review.sh`, sandbox somente leitura |
| Commita a tarefa e, no fim, valida a feature | Claude Code | commit por tarefa; lint, type-check, testes e build no final |

O Claude Code fica no papel de orquestrador. Ele lê a tarefa, monta o prompt com o texto dela, o contexto do projeto e a regra de TDD, e entrega ao Grok:

```bash
grok-implement.sh --prompt-file /tmp/grok-task-3.md --cwd <projeto>
```

Quando o Grok termina, o Claude manda o diff daquela tarefa para o Codex, com as regras de revisão no próprio texto, porque o Codex não lê as skills do Claude:

```bash
codex-review.sh --mode panel --cwd <projeto> \
  --prompt-file /tmp/codex-task-3.md --out /tmp/codex-task-3.rows
```

O Codex devolve achados por severidade. Crítico ou alto volta para o Grok, no máximo duas rodadas. Se ainda houver problema, o fluxo para e me chama. Médio ou baixo segue.

Eu acompanho isso de perto. Gosto de ler os pensamentos da IA direto no terminal, tarefa por tarefa. Não espero o arquivo de estado para saber que alguma coisa travou.

O Codex acha coisa quase toda vez. Em geral é correção de código, alucinação do implementador. No servidor [MCP](https://modelcontextprotocol.io) deste site ele achou um caso que nem o implementador nem eu tínhamos visto: fechar o servidor num `finally` esvaziava a resposta antes de ela sair, e não fechar vazava um servidor por requisição. A correção foi adiar o fechamento para o fim do stream.

## Grok e Codex não commitam

Não é um pedido no prompt, que o modelo pode ignorar. O script do Grok passa uma lista de comandos proibidos para a própria CLI:

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

O Grok pode rodar `git status` e `git diff`. Escrita é bloqueada. O Codex roda em sandbox somente leitura. Quem commita é o Claude, depois da revisão. Push só quando eu peço.

Aprendi a bloquear do jeito caro. Dei a uma CLI uma lista de arquivos para commitar e ela fez cinco commits: o que eu pedi e mais quatro grupos de mudança que estavam sujos na árvore. Lista de escopo não restringe agente. Permissão restringe.

## Quando um deles cai, eu vejo na hora

Grok e Codex dependem de cota, autenticação e rede. Os scripts separam a falha pelo código de saída:

| Saída | Significado | O que o fluxo faz |
|---|---|---|
| `0` | Terminou | Segue |
| `3` | Indisponível: cota, auth, rate limit, rede ou timeout | O Claude assume aquela etapa até o fim da feature |
| outro | Rodou, mas falhou | Rodada de correção, até duas vezes |

"O Grok não respondeu" e "o Grok escreveu código errado" pedem reações diferentes. No primeiro eu troco de executor. No segundo eu devolvo o problema e peço de novo.

Na visão IA deste site eu percebi de cara, porque estava no terminal. O Grok fez as tarefas 1 a 6, estourou o tempo no meio da 7, e o Claude assumiu dali. O Codex estava sem cota, então a revisão também foi do Claude. A feature saiu inteira, dez tarefas, suíte verde. Como cada tarefa se sustenta sozinha, o Claude pegou a 7 do ponto em que o Grok parou, sem precisar da conversa.

## Cada feature tem o próprio diário

O estado fica em `docs/specs/<slug>/STATE.md`:

```yaml title="docs/specs/<slug>/STATE.md"
---
feature: ai-view
phase: none
started_at: 2026-10-08
depth: standard
spec_path: docs/specs/ai-view/SPEC.md
plan_path: docs/plans/2026-10-08-ai-view.md
---
```

Não existe um estado global. Eu rodo duas sessões ao mesmo tempo, em terminais diferentes, uma pesquisando enquanto a outra implementa, sem uma sobrescrever a outra. Duas features no mesmo repositório vão para worktrees separadas.

É nesse arquivo que fica quem implementou o quê, o que caiu e qual evidência mostrou que terminou.

## O portão que dizia PASS sem ter rodado

Um portão que reporta sucesso sem ter rodado é pior do que portão nenhum.

Numa versão antiga, o script rodava lint, type-check e build, e não rodava a suíte. Uma rodada fechou com `result: PASS` e sete testes vermelhos. Compilar não é passar no teste. Em outra, rodando da pasta errada, ele não achou ferramenta nenhuma, pulou tudo com um aviso e reportou `PASS` com zero verificação.

Hoje o portão roda lint, formatação, type-check, a suíte e o build. Eu não leio `PASS` sem olhar as linhas acima. Um passo pulado não é um passo verde. O perigo, com agente, é o verde que ninguém questiona. O vermelho alguém vai investigar.

## No dia a dia

Feature nova:

```bash
/rpi:research hire-endpoint
/rpi:plan hire-endpoint
/rpi:implement hire-endpoint
```

Dá para planejar várias e implementar todas de uma vez:

```bash
/rpi:implement mcp-server hire-endpoint structured-resume --agentic
```

Correção pequena, que não merece spec, vai no `/dev:implement`, o mesmo trio numa tarefa só.

Não uso RPI para tudo. Trocar uma cor, corrigir um texto ou ajustar um espaçamento vai direto. O fluxo começa quando existe decisão para tomar.

## O que eu mantenho

Gosto do jeito que está. Por ora não mudaria muita coisa. Continuo mexendo na forma de trabalhar, e uma hora mudo um pedaço ou outro. O desenho de hoje eu assino.

Já discordaram de mim. Disseram que o fluxo é engessado demais, porque o teste vem antes da implementação e a IA demora mais para terminar o trabalho. Eu sigo firme. Teste é essencial em qualquer feature.

`/exit`
