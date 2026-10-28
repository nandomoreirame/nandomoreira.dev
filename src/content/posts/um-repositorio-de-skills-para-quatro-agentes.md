---
slug: um-repositorio-de-skills-para-quatro-agentes
title: "Um repositório de skills para quatro agentes: o que cada um passou a ver"
summary: "Juntei as skills do Claude Code, do Grok, do Codex e do agy numa pasta só, com um repositório e dois symlinks. A parte fácil foi o link; a difícil foi descobrir que cada agente segue o que está escrito ao pé da letra."
date: "2026-10-28"
markers:
  - agentes
  - claude code
  - skills
  - produtividade
extras:
  - "154 skills em cada agente; hoje são 57"
  - "Claude Code · Grok · Codex · agy"
keyPoints:
  - "Uma pasta compartilhada faz todo agente ver tudo: o que era de um passa a valer como instrução pros outros três."
  - "Em vez de esconder skill por ferramenta com um manifesto, apaguei o que ninguém usava. Sobraram 54, hoje são 57."
  - "A regra do git deixou de dizer qual CLI pode rodar e passou a dizer quem pediu: só o usuário, em qualquer agente."
snapshot:
  items:
    - label: "Repositório"
      value: "~/.skills (privado)"
    - label: "Links"
      value: "2 symlinks pro ~/.skills"
    - label: "Agentes"
      value: "Claude Code, Grok, Codex, agy"
    - label: "Skills hoje"
      value: "57"
    - label: "Sincronia"
      value: "sync-cli-artifacts.sh"
draft: true
---

Num sábado de manhã, 17 de outubro, eu movi todas as minhas skills de `~/.claude/skills` e de `~/.agents/skills` pra uma pasta só, `~/.skills`, iniciei um git lá dentro, subi como repositório privado com o `gh` e deixei as duas pastas antigas como symlink apontando pra nova. Três minutos depois eu perguntei pro Claude: "qual o efeito colateral no claude, grok, codex e antigravity fazendo dessa forma?". Devia ter perguntado antes.

Skill aqui é uma pasta com um `SKILL.md` (nome, descrição e as instruções) que o agente carrega quando a descrição bate com o pedido. Eu uso quatro agentes no terminal: o [Claude Code](https://www.anthropic.com/claude-code) conduz, o Grok implementa, e o Codex e o agy (a CLI do [Antigravity](https://antigravity.google/product/antigravity-cli)) revisam conforme a fase, como contei no [fluxo RPI](/fluxo-rpi-claude-code-grok-codex) e na [revisão cruzada entre modelos](/revisao-cruzada-entre-modelos). Se você também usa mais de um agente, o link resolve a parte de manter uma cópia só. **O que ele não resolve é que uma pasta compartilhada vira regra pra todo mundo que lê, e cada agente lê o texto ao pé da letra.**

## O link funcionou, e todo mundo passou a ver tudo

A resposta veio numa tabela. Antes, cada agente via um conjunto diferente de skills; depois do link, os quatro passaram a enxergar as mesmas 154, inclusive as que tinham sido escritas pensando num agente só.

| Agente | Onde lê | Antes | Depois |
|---|---|---|---|
| Claude Code | `~/.claude/skills` | 75 | 154 |
| Grok | as duas pastas, sem repetir nome | as duas, com 36 skills em versão antiga em `~/.agents` | a mesma pasta duas vezes |
| Codex | `~/.agents/skills` | 117 | 154 |
| agy | `.agents/skills` | 117 | 154 (não testei se ele lê a da home) |

O Grok foi o único que saiu ganhando: as 36 versões velhas sumiram e a lista de skills desligadas que eu mantenho no `config.toml` dele continuou valendo. Os outros três ficaram piores, cada um de um jeito.

No Claude Code, a lista de skills tem um limite de espaço. Com 154, umas 45 apareceram só com o nome, sem a descrição, e skill sem descrição não dispara sozinha. Entre elas estavam skills escritas por mim, como a `home-radar`, a `job-radar` e a `technical-writer`. Junto vieram skills de terceiros que brigam com o meu fluxo: a `using-superpowers` e a `brainstorming` dizem "You MUST use this before any creative work", e pelo menos cinco outras de planejamento e execução concorriam com o RPI.

No Codex o problema era mais feio. Ele passou a ver as skills `project-*` do meu fluxo, e a `project-review` manda quem a lê chamar o script que dispara o Codex como revisor. Se o Codex acionasse essa skill pela descrição, ele ia chamar a si mesmo em loop. Revisor revisando o revisor.

## Em vez de esconder, eu apaguei

A recomendação que eu recebi foi manter o `~/.skills` como fonte única, mas voltar com pastas reais em cada agente, com um link por skill e um manifesto dizendo o que cada ferramenta pode ver. Funciona. Mas é mais um arquivo pra manter toda vez que uma skill nasce.

Eu fui pelo outro lado. Já tinha apagado umas 30 na mão, enquanto a conversa rolava, e pedi uma revisão pra apagar mais e conferir se as minhas exclusões estavam certas. Das 30, 27 estavam certas. Uma foi engano: a `tailwind-conventions`, que eu tinha escrito em agosto a partir de bug real e que nenhuma outra skill cobria. Ela voltou. Durou minutos: saiu de novo quando eu mandei apagar também as que estavam em dúvida.

O critério pro resto foi uso e dependência: a skill foi chamada nos históricos de sessão? Algum agent, hook, script ou outra skill depende dela? Os históricos do Claude cobriam de 22/09 a 17/10, e o de prompts, de junho pra cá. Dava pra contar as leituras nas sessões do Codex também, e foi aí que apareceu o caso mais engraçado: a `output-adapter` tinha zero uso no Claude e 86 leituras no Codex. A descrição dela dizia "use when generating any user-facing output", e o Codex, obediente, abria a skill em quase toda resposta.

Saíram em várias levas:

- o marketing inteiro, de CRO e growth, em três partes (anúncio, pop-up, onboarding, pricing, cold e-mail, essas coisas que eu nunca usei);
- as skills de fluxo que competiam com o RPI;
- as de SEO que a skill `seo` já cobria;
- as de documento que já vêm nos plugins do próprio Claude;
- as integrações com Google que esperavam variáveis de ambiente que eu nunca configurei;
- as da época da Liquid AI, de relatórios e análise de commits.

Na mesma manhã eram 54. Hoje são 57, porque algumas voltaram ou nasceram depois: a `copywriting` saiu nesse corte e voltou cinco dias depois como uma skill nova, de copy pra página de venda. Quem decide o que cada agente vê agora é o que existe na pasta, e o que não existe não atrapalha ninguém.

## Comando também virou skill

Os slash commands moravam em `~/.claude/commands`. Só o Claude Code lê essa pasta, então o Grok e o agy enxergavam as skills mas não os meus `/git`, `/dev:implement` ou `/post-publish`. No agy nem existe slash command em arquivo (a documentação dele marca os workflows como obsoletos e migra cada um pra uma skill). Então, na mesma leva, eu pedi pra mover todos os commands pra skills, pra rodar os mesmos pontos de entrada no Grok e no agy.

A regra que ficou no documento do framework é curta: ponto de entrada é sempre uma skill, nunca `commands/`. As exceções são duas, e as duas são só do Claude Code: o `/session`, porque a statusline lê os arquivos que ele grava, e o `/release-day`.

O preço apareceu em dois lugares. Primeiro, o nome: uma skill só é chamada pelo nome da pasta dela, então o `/imoveis` virou `/home-radar`, o `/vagas` virou `/job-radar` e o `/ws` virou `/workspace`. Segundo, o controle: no agy não existem `$ARGUMENTS`, `disable-model-invocation` nem `allowed-tools`, então uma skill que no Claude só roda quando eu digito pode ser disparada lá pela descrição. As skills que dependem de coisa que só o Claude Code faz (subagente, disparar outra CLI) ganharam uma tabela "Which CLI are you?" no topo, que diz o que cada agente faz com elas.

Sobrou um pedaço que não dá pra resolver com link: as regras gerais. O Grok e o Codex não leem as minhas `rules/` do Claude, então um script, o `sync-cli-artifacts.sh`, injeta um bloco com as regras compartilhadas no `AGENTS.md` de cada um e tem um `--check` que falha quando o bloco ficou pra trás. O cabeçalho dele explica por que existe:

```bash
# The Grok and the agy read the RPI skills straight from ~/.claude/skills and
# ~/.agents/skills (both link to ~/.skills), so no command or skill is generated
# for them anymore. What they still need from here is the shared-rules block in
# their AGENTS.md, GENERATED from the versioned source in ~/.claude and verified
# by test (AD-003): editing a destination by hand is the failure mode this script
# exists to prevent.
```

## O Grok e o Codex fizeram exatamente o que estava escrito

Cinco dias depois, numa quinta, eu tentei usar o `/git` no Grok e no Codex, e nenhum dos dois fez. Fui ver a skill, e lá estava a seção que tinha entrado quando ela deixou de ser command:

```markdown
## In Grok or agy

Iron Law #15 keeps git writes with Claude Code: in any other CLI run only the read-only
subcommands (`status`, `log`, `diff`). For `commit`, `push`, `pull`, `release`, `branch` or
`stash`, say it belongs to Claude Code and stop.
```

A skill mandava dizer que aquilo era do Claude Code e parar. Eles pararam. Na hora eu achei "interessante eles seguirem as regras na skill à risca", e é isso mesmo: a regra tinha sido escrita pensando no caso em que o Claude dispara o Grok como implementador, e ali ninguém deve commitar além do Claude. Só que, com a skill na pasta de todo mundo, ela também valia pra quando eu abro o Grok e peço o commit com a minha própria mão.

E não era só a skill. O bloco de regras que o `sync-cli-artifacts.sh` injeta no `AGENTS.md` do Grok e do Codex tinha como regra número 1 "Nenhuma operação de git fora do Claude Code". Corrigir só a skill não bastava; eles iam continuar recusando pela outra regra.

A correção mudou a pergunta. Em vez de dizer qual CLI pode rodar git, a skill agora diz quem pediu:

```markdown
## Who may run git (any CLI: Claude Code, Grok, Codex, agy)

- **User-invoked:** the user typed `/git <subcommand>` or explicitly asked for a git
  operation in their own message. That is consent: run every named operation in full,
  including writes (`commit`, `push`, `pull`, `release`, `branch`, `stash`), in any CLI.
- **Not user-invoked:** never run any git operation, read-only included. That covers your own
  initiative, a step inside another skill (`/rpi-implement`, `/rpi-review`...), and any prompt
  dispatched by another agent or script (Iron Law #15): leave changes in the working tree and
  report them.
```

A regra número 1 do bloco compartilhado ganhou a mesma exceção ("sem pedido do usuário"), o script regravou os dois `AGENTS.md` e o `--check` passou. A proibição que importava continua de pé: um agente que foi chamado por outro agente, ou que está no meio de um passo do RPI, não toca no git. [[PREENCHER: se o /git commit funcionou no Grok e no Codex depois da mudança, e quando você testou]]

## O que ficou

Uma pasta, um repositório privado e dois symlinks. O `~/.claude/skills` e o `~/.agents/skills` apontam pro mesmo lugar, e o Claude Code, o Grok, o Codex e o agy leem as mesmas 57 skills. O que eu levei disso:

- skill compartilhada é instrução pra todos os agentes que a leem, então toda regra que vale só pra um precisa dizer pra qual, e por quê;
- regra de permissão se escreve por quem pediu, não por qual ferramenta está rodando;
- o que ninguém usa sai da pasta, em vez de ganhar um manifesto pra ficar escondido.

`readlink -f ~/.claude/skills`
