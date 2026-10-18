---
slug: dotfiles-parte-3-tratando-como-software
title: "Dotfiles, parte 3: testes, specs e uma TUI em Rust para scripts de shell"
summary: "O meu dotfiles tem 506 testes em BATS. Parece exagero para um monte de scripts, até o backup do sistema passar nove dias sem fazer um único envio incremental."
date: "2026-10-17"
markers:
  - dotfiles
  - shell
  - qualidade
draft: true
---

O backup do meu sistema rodou todo dia durante nove dias e não fez nenhum envio incremental. O `sys-btrfs-backup` chamava `ssh` dentro de um `while read` para achar o snapshot anterior no homelab. O `ssh` lia o stdin, drenava o pipe do loop, e o script só testava o primeiro candidato. Sem snapshot anterior, cada execução virava um envio completo: um deles tem 48,65 GiB no homelab, quando um incremental de verdade é uma fração disso. O envio completo estourava o timeout de duas horas do serviço, a limpeza local nunca rodava, e eu tinha 12 snapshots acumulados no disco quando percebi.

A pergunta que me faziam (e que eu me fazia) era "precisa testar script de dotfiles?". Esse bug respondeu. Na [parte 2](/dotfiles-parte-2-do-zero-ao-meu-sistema) eu mostrei a reinstalação; aqui é o que mantém essa receita funcionando entre uma formatação e outra.

## Script que ninguém vê falhar

O meu dotfiles tem 7.494 linhas de Bash só em `lib/` e 63 arquivos em `bin/`. Boa parte deles não roda num terminal. Roda num atalho do Niri, num timer do systemd, num hook do Git ou quando o microfone liga. Quando um desses quebra, não aparece mensagem de erro em lugar nenhum. A funcionalidade só para.

O backup era assim: um timer às 12h, rodando como root, sem ninguém olhando. **Um erro que não aparece só é pego por teste.**

O BATS entrou no repositório em 2 de fevereiro de 2026. Hoje são 31 arquivos em `tests/unit` com 506 casos, e o `shellcheck` está na lista de pacotes que toda máquina instala.

## Como testar um script que fala com o mundo

Script de dotfiles quase sempre mexe em coisa de verdade: SSH, btrfs, o shell da barra, o PipeWire. O truque é deixar cada dependência trocável por variável de ambiente, com o valor real como padrão. O `nocta-hold` (que controla o "Não perturbe" quando vários scripts pedem ao mesmo tempo) chama o `nocta` assim:

```bash
# Overridable so tests can inject a stub; default is sibling nocta binary.
: "${NOCTA_BIN:=$SCRIPT_DIR/nocta}"
```

No teste, `NOCTA_BIN` aponta para um stub curto que anota cada chamada num arquivo e responde o status que o teste mandar. O teste então confere o log: quem pediu, quem soltou, se o último a sair desligou o que devia.

A correção do backup seguiu o mesmo caminho. Toda chamada de SSH dentro de loop passou por uma função com `-n`, que impede o `ssh` de ler o stdin:

```bash
# ssh_rn: -n keeps ssh from reading stdin. Mandatory for every call inside a
# `while read` loop, otherwise ssh drains the loop's input pipe and the loop
# ends after a single iteration.
ssh_rn() { ssh -n "${SSH_OPTS[@]}" "$REMOTE_HOST" "$@"; }
```

E o script ganhou `BTRFS_BACKUP_SOURCE` e `BTRFS_BACKUP_LOCAL_DIR`, para o teste apontar para um diretório temporário em vez do meu root. Foram sete testes. O primeiro é o próprio bug escrito como teste: "prova todos os snapshots locais até achar o parent presente no homelab".

## Spec antes de script

Os scripts maiores agora nascem num documento. `docs/specs/` e `docs/plans/` têm 19 entradas, da TUI à migração do Noctalia para a v5. Essa migração está quebrada em fatias (`s04` a `s11`), uma por plugin, e cada plano carrega a mesma regra: o plugin continua funcionando na v4 enquanto a v5 não chega.

Quem escreve boa parte disso comigo é o Claude Code, no fluxo que descrevi em [pesquisa, plano e implementação](/fluxo-rpi-claude-code-grok-codex). A spec é o que me deixa revisar a intenção antes do código.

[[PREENCHER: quanto do dotfiles hoje é escrito por IA e quanto por você? O que você nunca deixa a IA fazer sozinha aqui?]]

## Uma TUI em Rust por cima do Bash

Em 6 de abril de 2026 eu fiz uma TUI em Rust (ratatui) para o dotfiles. A regra principal foi não reescrever nada: ela chama os scripts Bash que já existem via `std::process::Command` e lê o `links.conf` e os profiles nos formatos que já tinham. O tema e os caminhos vêm de um `config.yaml`. O MVP fechou em 20 tarefas e 50 testes, num binário de 1,6 MB.

O motivo principal foi aprender Rust num projeto de verdade, que eu uso. O segundo foi sair do whiptail: o `lib/interactive.sh` tinha virado 42 KB de menus em Bash.

[[PREENCHER: você usa a TUI no dia a dia ou ela ficou como projeto de estudo? O que aprendeu de Rust que não teria aprendido num tutorial?]]

## O que eu decidi

- Script que roda sem ninguém olhando tem teste, ou não entra.
- Toda dependência externa é trocável por variável de ambiente.
- Mudança grande começa numa spec dentro do próprio repositório.
- A TUI chama o Bash; reescrever em Rust só quando o Bash atrapalhar.

`./tests/run-tests`
