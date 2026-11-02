---
slug: meu-harness-de-ia-com-rpi
title: "Meu harness de IA com RPI: do Superpowers e do TLC ao Forja 2.0"
seoTitle: "Meu harness de IA com RPI e o Forja 2.0"
summary: "Harness é tudo que roda em volta do modelo. O meu saiu de quase um ano de projetos, testes e estudos em cima do Superpowers e do tlc-spec-driven, e agora está virando o Forja 2.0."
date: "2026-11-01"
publishedAt: "2026-11-01T18:49:28-03:00"
art: harness
markers:
  - harness
  - rpi
  - agentes
  - claude code
extras:
  - "424 specs em 26 repositórios, um harness só"
  - "Superpowers · tlc-spec-driven · Forja 2.0"
keyPoints:
  - "Harness é tudo que não é o modelo: regra, skill, spec, teste, revisão. O meu levou quase um ano de projetos e estudo."
  - "O plano que deu nome ao meu RPI mandava usar o Superpowers e, na tarefa 3, apagava o próprio Superpowers."
  - "O Forja 2.0 recomeçou do zero pra levar esse harness pra um app, com as aprovações na mão de quem usa."
snapshot:
  items:
    - label: "Fases"
      value: "Research, Plan, Implement"
    - label: "Specs"
      value: "424 em 26 repositórios"
    - label: "Primeira base"
      value: "Superpowers"
    - label: "Ideias de memória"
      value: "tlc-spec-driven"
    - label: "Em construção"
      value: "Forja 2.0"
---

Hoje são 424 specs em 26 repositórios, entre projetos meus e de cliente, e quase todas passaram pelo mesmo fluxo RPI. Esse fluxo é o meu harness, e levei quase um ano de projetos, testes e estudos pra chegar nele.

## O que é um harness

A definição que eu uso é a da Birgitta Böckeler, [no site do Martin Fowler](https://martinfowler.com/articles/harness-engineering.html): `Agent = Model + Harness`. Ou seja, harness é tudo no agente que não é o modelo: instrução, ferramenta, permissão, memória, teste e revisão, tudo o que fica entre o que você pede e o que o modelo faz. A palavra quer dizer arreio. O bicho continua forte, mas vai pra onde você aponta.

Parte disso já vem pronta, porque o Claude Code é um harness. O que me interessa é o harness externo, o que a gente monta em volta da ferramenta. E ele tem duas metades: guias, que orientam o agente antes de ele agir, e sensores, que observam o resultado e permitem corrigir depois.

| Tipo | Quando age | No meu harness |
|---|---|---|
| Guia | Antes do agente agir | `CLAUDE.md` de cada projeto, regras, skills, spec, plano, lições |
| Sensor | Depois do agente agir | Lint, type-check, testes, build, prova por requisito, validadores, revisor que não implementou |

O RPI (Research, Plan, Implement) é a ordem em que essas peças entram: a pesquisa gera a spec, o plano quebra a spec em tarefas, a implementação executa uma tarefa por vez. Como cada fase funciona eu já contei [no post do fluxo](/fluxo-rpi-claude-code-grok-codex). **Aqui a história é de onde as peças vieram, porque pesquisar antes de codar era minha ordem, mas os primeiros arquivos não foram meus.**

## O Superpowers foi a minha primeira skill de verdade

O [Superpowers](https://github.com/obra/superpowers), do Jesse Vincent, é um conjunto de skills que leva o agente de um brainstorming até o merge, passando por plano, TDD e revisão. Foi o primeiro que eu usei pra valer, em cliente e em projeto meu.

O embrião do RPI nasceu em cima dele, em janeiro, quando eu trabalhava na Liquid AI. Montei um framework interno pro time (que no fim virou meu) e, em 27 de janeiro, ele ganhou três comandos: `/liquid:research`, `/liquid:plan` e `/liquid:implement`. Já era Research, Plan e Implement. Só que cada comando apenas chamava uma skill que vinha do Superpowers ou era quase cópia dele. O de pesquisa abria com a mesma descrição do `brainstorming`, "You MUST use this before any creative work", palavra por palavra.

Quando, em março, transformei aqueles comandos nas minhas skills `rpi-*`, o Superpowers continuou sendo a base, e essa versão mostra isso sem nenhuma vergonha:

| Superpowers | Meu RPI em 31 de março |
|---|---|
| [`brainstorming`](https://github.com/obra/superpowers/tree/main/skills/brainstorming): pergunta uma coisa por vez | `rpi-research`: "Ask questions one at a time" |
| [`writing-plans`](https://github.com/obra/superpowers/tree/main/skills/writing-plans): tarefa pequena, pra quem não tem contexto | `rpi-plan`: tarefas de 2 a 5 minutos, "needs zero prior context" |
| [`subagent-driven-development`](https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development): subagente novo por tarefa, com revisão de spec e de qualidade | `rpi-implementer` e `rpi-reviewer`, com as mesmas duas revisões |
| `Announce at start`: a skill se anuncia antes de começar | O mesmo "Announce at start", copiado até nisso |

**O melhor do Superpowers é a disciplina:** teste antes do código, causa raiz antes da correção, uma tarefa por vez e revisão depois. Isso eu mantenho até hoje, e a [`systematic-debugging`](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) e a [`using-git-worktrees`](https://github.com/obra/superpowers/tree/main/skills/using-git-worktrees) continuam instaladas aqui.

O que me incomodava era o tom de lei. A descrição do `brainstorming` diz "You MUST use this before any creative work", e o texto completa que o processo vale pra todo projeto, "regardless of perceived simplicity", com uma lista de tarefas que você precisa cumprir em ordem. A skill mandava antes de eu pedir, até em coisa pequena, e competia com o meu fluxo. Pra trocar uma cor eu não quero uma reunião de design.

## Em março, skill demais e nenhuma dona do processo

Dois meses depois eu tinha skill pra tudo e nenhuma era dona do processo. Dois fluxos disputavam a mesma feature: o agente escolhia um e, depois de uma compactação (quando a conversa enche e o agente resume o que veio antes), esquecia o que tinha sido decidido.

Eu queria um caminho só, com a minha cara. O primeiro passo nem foi escrever nada: 45 skills sem uso saíram no mesmo commit, 33 só de marketing. E a primeira linha do plano que deu nome ao RPI entrega de onde eu vinha:

```markdown title="docs/plans/2026-03-31-sdd-rpi-restructure.md"
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement this plan task-by-task.
```

Na tarefa 3, o mesmo plano roda um `rm -f` no `executing-plans`, no `brainstorming` e no `using-superpowers`. O plano mandava usar o Superpowers pra tirar o Superpowers da frente (dá pra chamar de parricídio).

## O TLC me ensinou a parte da memória

O [`tlc-spec-driven`](https://github.com/tech-leads-club/agent-skills/blob/main/packages/skills-catalog/skills/%28development%29/tlc-spec-driven/SKILL.md) é uma skill open source do [Tech Leads Club](https://github.com/tech-leads-club/agent-skills), que organiza a feature em quatro fases: Specify, Design, Tasks e Implement. Eu não sou membro, peguei a skill pública. E esse eu mais estudei do que rodei: li com calma e fui puxando as ideias.

Nenhum dos dois se chama RPI, mas na essência é a mesma coisa: entender, planejar, executar. O que mais doía aqui era o agente esquecer. E pra isso o TLC tinha as melhores ideias. Um dia depois de criar as skills `rpi-*`, escrevi uma spec dizendo que ele continuaria sendo o fluxo principal e absorveria o melhor do TLC:

| Peça do TLC | O que virou aqui |
|---|---|
| `STATE.md` | Fase, decisões e caminhos ficam em arquivo, e a compactação não apaga nada |
| Cadeia de conhecimento | Antes de me perguntar, o agente lê o código, os docs e as specs; a web vem por último |
| Profundidade por tamanho | Compact, standard ou deep em todas as fases (meu RPI só fazia isso na implementação) |

E recusei duas coisas: a fase Design separada e o mapeamento de projeto existente em 7 documentos. Pra mim era cerimônia demais. Decisão de design cabe na pesquisa, e a cadeia de conhecimento cobre a descoberta de um jeito mais leve. É uma escolha pro meu uso, não um defeito do TLC, e a skill mudou bastante desde abril: a versão atual já pula o Design quando a mudança é simples.

Em 31 de outubro eu voltei nele. Queria que o erro achado na revisão de uma feature não reaparecesse na próxima, e peguei de lá, e do vídeo ["Loop Engineering"](https://www.youtube.com/watch?v=PYSyFKCvzNU) do Waldemar Neto, a ideia de lições que se promovem sozinhas: uma lição só vale quando o problema volta em duas features diferentes, porque repetir na mesma feature é um incidente só. Se a lição for penalizada duas vezes, entra em quarentena. A licença do conteúdo é CC-BY-4.0, mas reescrevi tudo do zero: peguei a ideia, não o código. Essa parte do harness é nova demais pra eu dizer se funcionou, e o relatório do piloto, nas features do Forja, ainda não existe.

## A mudança

Meu fluxo de desenvolvimento hoje está bem diferente do começo. De lá pra cá o harness foi mudando por coisa que quebrou ou incomodou aqui:

| Peça | No começo | Hoje |
|---|---|---|
| Quem implementa e quem revisa | Subagentes do Claude | CLIs diferentes, e quem revisa nunca é quem implementou |
| Estado | Um arquivo por projeto, uma sessão ativa | Um `STATE.md` por feature, desde junho, pra rodar sessões em paralelo |
| Perguntas | Uma por vez | Lê tudo antes e passa pelo grilling (mais sobre ele abaixo) |
| Validar spec e plano | Instrução pro modelo | Script que bloqueia o salvamento, porque aviso que ninguém lê é falso verde de novo |
| Se anunciar | "Announce at start" | Morreu, tenho regra proibindo |

A conta dessa escolha é esta: em março eram 4 skills e 388 linhas. Hoje são 8 skills e 2.353 linhas, sem contar scripts, hooks e referências. Quando o Claude Code muda, quando uma CLI cai, quando um portão mente, o problema é meu. Ninguém vai abrir um PR pra me salvar. Se você não quer manter isso, usa o Superpowers ou o TLC como vêm, que eles são bons e têm muito mais gente olhando.

## Menção honrosa: o grill-me do Matt Pocock

Uma peça veio de fora dos dois e merece uma seção só pra ela: o [`grill-me`](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me), do Matt Pocock. A ideia é simples: o agente te entrevista até não sobrar decisão implícita. Ele percorre a árvore de decisões, toda pergunta já vem com a resposta que ele recomenda, e tem a regra que mais me economiza tempo: fato (o que está no código, no git ou na web) é o agente que vai buscar, e decisão é minha.

Adaptei em julho. Virou a `rpi-grill`, que eu uso pra refinar o Research e o Plan: ela entra sozinha no Research das features médias e grandes, e o Plan pergunta se eu quero rodar quando recebe uma spec que nunca passou por ela. No original as perguntas vêm em rodadas. Aqui é uma por vez, porque eu reajo melhor a uma proposta do que a uma lista inteira de perguntas esperando resposta. E cada resposta vai pro `## Grilling Log` da própria spec, então a decisão não fica perdida na conversa e o plano parte de uma spec sem buraco.

## Um harness só pra muitos projetos

Eu trabalho em muitos projetos ao mesmo tempo. Cada projeto tem o próprio git, o próprio toolchain e o próprio `CLAUDE.md`, que só carrega quando eu mexo naquele projeto. O que faz isso não virar bagunça é saber em que nível cada coisa mora:

| Nível | O que mora ali |
|---|---|
| Máquina | Regras, scripts e skills, as mesmas pro Claude Code, o Codex, o Grok e o agy, mais uma memória num vault do [Obsidian](https://obsidian.md) que todos eles consultam |
| Projeto | `CLAUDE.md`, specs, planos, revisões e lições |
| Feature | `STATE.md` e, quando duas rodam no mesmo repositório, uma worktree pra cada |
| Sessão | Um contexto salvo: `/session save`, `/clear` e depois `/session start --id <id>` |

Na prática, uma sessão pode estar pesquisando uma feature enquanto outra implementa em outro projeto, e uma não sobrescreve a outra, porque o estado de cada feature mora no próprio repositório e não numa conversa. Mando vários planos pro `/rpi-implement` de uma vez, e cada um ganha sua worktree. Se uma CLI cai por cota, a tarefa desce uma cadeia (Grok, Codex, agy, Claude) e o revisor continua sendo outro.

**Eu fico onde a decisão é minha:** aprovo a spec, aprovo o plano e só eu mando dar push. A Böckeler diz algo parecido, que um bom harness não precisa eliminar a pessoa, e sim levar a atenção dela pra onde ela mais importa.

## Agora esse harness está virando um app

O [Forja](https://github.com/nandomoreirame/forja) nasceu em fevereiro como um cliente desktop pra rodar as CLIs de agente sem perder contexto alternando entre terminais, e a versão publicada é a 1.9. A [`release/2.0`](https://github.com/nandomoreirame/forja/tree/release/2.0) recomeçou do zero em 30 de outubro, redesenhada em cima desse fluxo que eu construí. As CLIs instaladas viram ferramentas de execução, e quem manda no processo é o RPI.

Boa parte das [specs](https://github.com/nandomoreirame/forja/blob/release/2.0/docs/specs/chat-workflow/SPEC.md) é o meu harness traduzido pra produto:

| No meu harness | No Forja 2.0 |
|---|---|
| O Claude Code abre em `~/dev`, que não é repositório | Abre qualquer pasta como projeto, inclusive sem git, e o exemplo da spec é o próprio `~/dev` |
| O Claude Code conduz | O Ferreiro conversa, propõe o próximo passo e passa a vez, mas não escreve arquivo nem aprova nada |
| Eu aprovo spec e plano | As aprovações continuam suas, com aceite manual antes do merge |
| Scripts bloqueiam spec e plano inválidos | O core rejeita o documento inválido |
| Skills em `~/.skills` | O catálogo lê essa pasta e as das CLIs, só leitura |
| Grok, Codex, agy e Claude | Claude, Codex, opencode, agy e Grok, com a autenticação de cada um, sem copiar credencial |

Calma jovem, ainda não dá pra baixar. Hoje é uma prévia: a interface roda com dados mock, os terminais usam shells reais e a integração com os agentes ainda não foi implementada. O MVP tem mais de 150 tarefas e a maior parte está por fazer. O número atualizado fica [no roadmap](https://github.com/nandomoreirame/forja/blob/release/2.0/ROADMAP.pt-BR.md), e a proposta está [na landing](https://forjav2.web.app/pt-br). Ele também está sendo construído com o próprio harness, spec por spec, plano por plano, então o que quebrar lá volta pra cá.

## Harness pronto se estuda, não se instala

Instalado inteiro, ele briga com o seu jeito de trabalhar. Comigo foi assim: do Superpowers e do TLC fiquei com as ideias e reescrevi os arquivos. O rastro que sobrou é a skill de worktree, que ainda cita o Jesse no texto e, quando o projeto não define outro lugar, cria em `~/.config/superpowers/worktrees/`: a da semana passada foi parar lá.

E isso vale pro meu também: não copia o meu. Lê o Superpowers, lê o TLC, usa um deles em trabalho real até incomodar, e aí escreve só o que incomodou.

`git switch release/2.0`
