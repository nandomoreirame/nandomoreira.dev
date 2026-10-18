---
slug: tratando-dotfiles-como-software
title: "Tratando dotfiles como software"
summary: "Script de dotfiles roda em atalho, timer e hook, onde ninguém vê o erro. Como eu testo os meus com shellcheck e BATS, troco dependências por stub e deixo a IA escrever quase tudo sem perder a confiança."
date: "2026-10-17"
markers:
  - dotfiles
  - shell
  - qualidade
draft: true
---

O backup do meu sistema rodou todo dia durante nove dias e não fez nenhum envio incremental. O script chamava `ssh` dentro de um `while read` para achar o snapshot anterior no homelab. O `ssh` lia o stdin, drenava o pipe do loop, e só o primeiro candidato era testado. Sem snapshot anterior, cada execução virava um envio completo, que estourava o timeout de duas horas do serviço. Quando percebi, um desses envios ocupava 48,65 GiB no homelab e havia 12 snapshots acumulados no meu disco.

Ninguém viu o erro porque não tinha ninguém olhando: era um timer do systemd rodando como root por volta do meio-dia. Nas [duas](/seu-sistema-tem-memoria-por-que-manter-um-dotfiles) [primeiras](/do-zero-ao-meu-sistema-uma-reinstalacao-na-pratica) partes eu mostrei como o dotfiles guarda e reinstala o sistema. Esta é sobre fazer os scripts funcionarem no dia em que você precisa deles.

## Script que ninguém vê falhar

Boa parte de um dotfiles maduro não roda num terminal. No meu, roda num atalho do Niri, num timer, num hook do Git, quando o microfone liga ou quando o notebook sai da tomada. Quando um desses quebra, não aparece mensagem em lugar nenhum. A funcionalidade só para.

Hoje são 63 scripts em `bin/` e quase 7.500 linhas de Bash em `lib/`. Nesse tamanho, "eu testo na mão quando mexo" deixa de funcionar.

## Comece pelo shellcheck

O primeiro passo custa zero: o [shellcheck](https://www.shellcheck.net/) pega aspas faltando, variável não declarada, `cd` sem tratamento de erro e outros clássicos do Bash. Ele está na minha lista de pacotes, então toda máquina tem, e roda no repositório inteiro:

```bash
shellcheck lib/*.sh bin/**/*
```

Ele não testa comportamento, mas tira da frente os erros que fariam o teste falhar por motivo besta.

## Monte o BATS dentro do repositório

Para comportamento, eu uso o [BATS](https://github.com/bats-core/bats-core). Um script no próprio repo (`tests/install-bats.sh`) instala localmente o `bats-core` e as bibliotecas `bats-support`, `bats-assert` e `bats-file`, numa pasta que fica no `.gitignore`. Os testes seguem a estrutura do código, `tests/unit/bin/` para os comandos e `tests/unit/lib/` para as bibliotecas, e um runner roda tudo:

```bash
./tests/run-tests                 # todos os testes
./tests/run-tests unit            # só os unitários
./tests/run-tests tests/unit/bin/nocta-hold.bats
```

Hoje são 31 arquivos e 506 casos de teste.

O motivo de ter chegado nisso é o meu framework do Claude Code, que força TDD em tudo, como contei no post sobre o [fluxo com três agentes](/fluxo-rpi-claude-code-grok-codex). Uns 90% do código do dotfiles hoje é escrito por IA. Com a IA escrevendo quase tudo, nada mais justo que testar tudo o que eu puder, e o teste vem antes do script.

## Deixe cada dependência trocável

Script de dotfiles quase sempre mexe em coisa de verdade: SSH, btrfs, o shell da barra, o PipeWire. Não dá para testar isso apontando para o sistema real. O truque é deixar cada dependência trocável por variável de ambiente, com o valor real como padrão.

O `nocta-hold` controla o "Não perturbe" quando vários scripts pedem ao mesmo tempo, e fala com a barra por um comando chamado `nocta`. A dependência fica assim:

```bash
# Overridable so tests can inject a stub; default is sibling nocta binary.
: "${NOCTA_BIN:=$SCRIPT_DIR/nocta}"
```

No teste, `NOCTA_BIN` aponta para um stub que anota cada chamada num arquivo e responde o que o teste mandar:

```bash
cat > "$STUB_DIR/nocta" <<'STUB'
#!/usr/bin/env bash
# Log every invocation; answer dnd status from FAKE_DND_STATUS (on|off).
if [ "$#" -eq 0 ]; then
    echo "nocta" >> "$CALL_LOG"
else
    echo "nocta $*" >> "$CALL_LOG"
fi
if [ "${1:-}" = "dnd" ] && [ "${2:-}" = "status" ]; then
    printf '%s\n' "${FAKE_DND_STATUS:-off}"
    exit 0
fi
exit 0
STUB
```

O teste então confere o log: quem pediu o "Não perturbe", quem soltou, se o último a sair desligou o que devia. Nenhuma barra de verdade é tocada.

## O bug do backup, agora como teste

A correção do backup seguiu esse caminho. Toda chamada de SSH dentro de loop passou a usar uma função com `-n`, que impede o `ssh` de ler o stdin:

```bash
# ssh_rn: -n keeps ssh from reading stdin. Mandatory for every call inside a
# `while read` loop, otherwise ssh drains the loop's input pipe and the loop
# ends after a single iteration.
ssh_rn() { ssh -n "${SSH_OPTS[@]}" "$REMOTE_HOST" "$@"; }
```

E o script ganhou `BTRFS_BACKUP_SOURCE` e `BTRFS_BACKUP_LOCAL_DIR`, para o teste apontar para uma pasta temporária em vez do meu root. Foram sete testes. O primeiro é o próprio bug escrito como teste: "prova todos os snapshots locais até achar o parent presente no homelab". Se alguém (eu ou a IA) colocar um `ssh` sem `-n` naquele loop de novo, ele fica vermelho.

## Spec antes de script

Mudança grande no meu dotfiles começa num documento dentro do próprio repositório, em `docs/specs/` e `docs/plans/`. A migração do Noctalia para a v5, por exemplo, está quebrada em fatias, uma por plugin, e cada plano carrega a mesma regra: o plugin continua funcionando na v4 enquanto a v5 não chega.

Com a IA escrevendo uns 90% do código, a spec é onde eu reviso a intenção antes de existir código, e os testes são o que me deixa confiar no que foi entregue.

## Uma TUI que chama os scripts

Os menus do dotfiles eram em whiptail, e o `lib/interactive.sh` tinha virado 42 KB de Bash. Em abril de 2026 eu fiz uma TUI em Rust com ratatui, para aprender Rust num projeto que eu uso de verdade.

A regra principal foi não reescrever nada. A TUI chama os scripts Bash que já existem via `std::process::Command`, lê o `links.conf` e os profiles nos formatos que já tinham, e pega tema e caminhos de um `config.yaml`. O MVP fechou com 50 testes, num binário de 1,6 MB.

Ela virou o meu jeito principal de instalar apps. Só de vez em quando eu chamo os scripts na mão, e eles continuam lá, testados, para quando eu precisar.

## O que eu levo disso

- Script que roda sem ninguém olhando tem teste.
- Toda dependência externa é trocável por variável de ambiente.
- Bug corrigido vira teste com o nome do bug.
- Mudança grande começa numa spec dentro do repositório.
- A interface chama o Bash; reescrever em Rust só quando o Bash atrapalhar.

`./tests/run-tests`
