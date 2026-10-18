---
slug: dotfiles-parte-2-do-zero-ao-meu-sistema
title: "Dotfiles, parte 2: do zero ao meu sistema numa reinstalação de verdade"
summary: "Na reinstalação do CachyOS, o git clone foi a parte fácil. O terminal abriu em fish, o Niri ignorou todos os meus atalhos e o Noctalia sobrescreveu a config dentro do repositório."
date: "2026-10-17"
markers:
  - dotfiles
  - linux
  - niri
draft: true
---

O roteiro de instalação do meu dotfiles cabe em cinco linhas, e está no `CLAUDE.md` do próprio repositório:

```bash
git clone git@github.com:nandomoreirame/.dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./bin/dotfiles links --all
./bin/dotfiles apps:install
source ~/.zshrc
```

Em junho de 2026 eu instalei o CachyOS do zero e rodei exatamente isso. [[PREENCHER: confirmar a data da instalação; os commits do Niri começam em 01/06/2026 e as correções abaixo são de 02/06.]] As cinco linhas funcionaram. O que veio depois delas é o assunto deste post, porque é onde um dotfiles prova (ou não) que guarda o sistema inteiro. Na [parte 1](/dotfiles-parte-1-a-memoria-do-meu-sistema) eu contei por que mantenho um.

## O que a instalação faz por mim

O `dotfiles links --all` cria os symlinks a partir do `configs/links.conf`. O `apps:install` lê as listas de pacotes, uma por gerenciador: pacman, AUR, Flatpak e mise. Cada lista é uma função em `lib/` que devolve os nomes agrupados por finalidade, com um comentário dizendo por que cada bloco existe.

Depois vêm os scripts de setup, as coisas que só rodam uma vez por máquina: cedilha no teclado US-international, tema escuro do GTK, apps padrão por tipo de arquivo, storage do Podman em btrfs. Eles moram em `scripts/setup/`, e um registro em `lib/setup.sh` diz quando cada um roda:

```text
fix-cedilla.sh|auto|Cedilha (ç) no teclado US-international
gtk-dark.sh|auto|Aparência escura GTK/libadwaita (agnóstico de DE)
podman-storage.sh|auto|Storage rootless do Podman em btrfs/zfs (fuse-overlayfs)
espanso.sh|auto|Expansor de texto espanso (Wayland: capability + serviço)
tailscale.sh|manual|VPN mesh Tailscale (instala + ativa; requer login no navegador)
local-ai.sh|manual|IA local (Ollama + modelos de código + OpenCode + Aider)
```

`auto` roda na instalação completa. `manual` espera eu pedir com `dotfiles setup:run tailscale`, porque o Tailscale abre o navegador para login e a IA local baixa gigas de modelo que eu nem sempre quero.

Esses scripts moravam em `bin/sys/` até junho, quando eu tirei de lá. Tudo dentro de `bin/` entra no PATH (o `.zshrc` adiciona cada subpasta), e um script que roda uma vez por máquina não merece virar comando para sempre.

## O que fica fora do Git de propósito

O `.gitconfig` versionado liga a assinatura de commits (`commit.gpgsign = true`), mas a chave não está nele. Ela fica no `~/.gitconfig.local`, que não é versionado e é gerado pelo `dotfiles profile` a partir de `profiles/linux-arch/git-personal.conf`. Esse arquivo também fica no `.gitignore`; no repositório só existe o `.example`. A assinatura passa pela chave SSH do 1Password (`op-ssh-sign`), então nenhum segredo encosta no repositório.

O custo disso aparece na máquina nova: até eu criar o profile, todo commit morre com `gpg: signing failed: no secret key`. É o passo manual que eu aceito pagar.

## O que quebrou

Três coisas, todas no primeiro dia.

### O terminal abriu em fish

O CachyOS vem com o fish como shell de login. Todo o meu setup é zsh: é o `.zshrc` que coloca `~/.dotfiles/bin/*` no PATH e carrega os aliases. O sintoma foi "nenhum comando do dotfiles existe". Na investigação apareceu um segundo problema: o symlink do `~/.zshrc` apontava para `~/.dotfiles/.zshrc`, que não existe desde que eu movi tudo para `configs/`. A correção foi um `chsh -s /usr/bin/zsh` e o commit `🐛 fix(lib): correct zshrc symlink`.

### O Niri ignorou todos os meus atalhos

A primeira linha do meu `config.kdl` é `include "monitor.kdl"`, um arquivo gerado pelo `nwg-displays` que eu não versionava (cada máquina tem os seus monitores). Sem ele, o Niri não carrega a config pela metade: rejeita tudo com `failed to read included config` e volta para os atalhos padrão. O symlink do `config.kdl` estava certo, e foi exatamente por isso que demorei a achar. [[PREENCHER: qual foi o seu primeiro palpite?]] Desde 2 de junho o `monitor.kdl` é versionado.

### O Noctalia apagou a minha config

Essa doeu. O shell sobe no login, antes de o `dotfiles links` criar o symlink de `~/.config/noctalia`, e ele não relê o `settings.json` depois. Fiz o óbvio e reiniciei o processo. Só que o Noctalia grava a config quando recebe SIGTERM, e agora `~/.config/noctalia` era um symlink para o repositório. A instância velha, com a config padrão na memória, morreu escrevendo por cima dos meus ajustes.

**Foi aí que versionar tudo se pagou.** Um `git checkout -- configs/noctalia/{settings,plugins,colors}.json` trouxe a config de volta, e eu subi o shell de novo. Hoje a ordem é fixa: matar, restaurar do Git, subir.

## Cada reinstalação vira commit

As três correções foram parar no repositório: o symlink do `.zshrc`, o `monitor.kdl` versionado e a ordem de restart do Noctalia, que ficou anotada. A próxima reinstalação não vai tropeçar nelas.

[[PREENCHER: quanto tempo levou do pendrive até o sistema ficar igual ao anterior?]]

Na [parte 3](/dotfiles-parte-3-tratando-como-software) eu mostro como passei a tratar esses scripts como software, com teste e tudo.

`chsh -s /usr/bin/zsh`
