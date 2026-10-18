---
slug: dotfiles-parte-1-a-memoria-do-meu-sistema
title: "Dotfiles, parte 1: a memória do meu sistema"
summary: "Em 2015 eu reinstalava o Sublime e digitava a lista de pacotes de cabeça. Hoje o meu sistema inteiro mora num repositório Git, e o histórico dele lembra o que eu esqueci."
date: "2026-10-17"
markers:
  - dotfiles
  - linux
  - shell
draft: true
---

Em 2015 eu escrevi aqui sobre o [meu ambiente de trabalho](/meu-ambiente-de-trabalho-em-7-itens): Ubuntu 15.04, GNOME Shell 3.14 e Sublime Text 3. No meio do post tem esta frase: "Eu costumo sempre que instalar meu Sublime Text, já sair instalando meus pacotes, segue a lista". E vinha a lista, Emmet, Sass, GitGutter e por aí vai.

A lista estava num post de blog. A configuração de verdade estava na minha cabeça, e a cada formatação eu reconstruía tudo de memória (e esquecia metade). Esta série é sobre o que eu uso hoje no lugar da memória: o meu `~/.dotfiles`. Não vou comparar stow, chezmoi e yadm. O meu é Bash com symlink, e a ferramenta nunca foi o problema. O problema é que eu esqueço.

## O que some numa formatação

[[PREENCHER: uma cena real de antes do dotfiles. Qual config se perdeu numa formatação, como você percebeu e quanto tempo levou para deixar a máquina como estava?]]

Config de app é o tipo de coisa que você ajusta numa tarde e nunca mais olha. Um ano depois você não lembra que mexeu. Só percebe quando ela some: o atalho que não existe mais, o tema que voltou para o padrão, o terminal com a fonte errada.

## Um arquivo que diz onde tudo mora

O primeiro commit do repositório é de 19 de março de 2025: `feat: add home dotfiles and zsh configurations`. Hoje são 614 commits. [[PREENCHER: você tinha dotfiles antes de março de 2025? Se sim, por que recomeçou?]]

O centro de tudo é o `configs/links.conf`. Ele diz o que vai para onde, em três seções: `[files]` para os arquivos soltos da home, `[paths]` para pastas inteiras (com destino diferente no Linux e no macOS quando precisa) e `[paths:arch]`, que só carrega no Arch:

```ini
[paths:arch]
configs/niri/config.kdl | .config/niri/config.kdl |
configs/niri/monitor.kdl | .config/niri/monitor.kdl |
configs/noctalia | .config/noctalia |
configs/espanso | .config/espanso |
```

O `dotfiles links --all` lê esse arquivo e cria os symlinks. Se já existe um arquivo de verdade no destino, ele não apaga nada: move para `<arquivo>.bak.<timestamp>` e só depois cria o link. O app continua lendo do lugar de sempre, só que o arquivo mora no repositório. **Mudei uma opção no app, o `git diff` mostra.**

## Snapshot com mensagem de commit

Um backup guarda o estado. O Git guarda o estado e o motivo, e é aí que o dotfiles vira memória.

Quando eu migrei para o Niri com o Noctalia, em 1º de junho de 2026, o commit que versionou a config do shell diz exatamente o que eu queria dele:

```text
✨ feat(noctalia): version shell config for reinstall portability

Track settings, colors, plugins.json and user-templates so the shell
config (bar, widgets, wallpaper) survives a clean install.
```

São 791 linhas de `settings.json` que eu nunca vou lembrar de cabeça (nem quero).

O motivo também mora nos comentários. A lista de pacotes do pacman em `lib/pacman-packages.sh` é agrupada por finalidade, e cada bloco explica por que está ali. O do Podman avisa que o `fuse-overlayfs` é obrigatório nesta máquina, porque o root é btrfs e o driver overlay nativo do kernel falha com `'overlay' is not supported over btrfs`. Daqui a dois anos, quando eu olhar para esse pacote achando que é lixo, o comentário vai estar lá.

## O que sobreviveu a quatro sistemas

O `git log` conta a história melhor que eu:

| Quando | O que mudou |
|---|---|
| mar/2025 | primeiro commit: zsh, git, VS Code e Zed |
| out/2025 | sai o nvm, o mise vira o único gerenciador de runtime |
| nov/2025 | suporte oficial a macOS |
| jan/2026 | `bin/` reorganizado e sistema de profiles |
| mar/2026 | Arch Linux com Omarchy e Hyprland, listas do pacman e do AUR |
| jun/2026 | CachyOS, Niri e Noctalia; as referências ao Hyprland saem no dia seguinte |

A camada do desktop é a que mais muda: Hyprland e Waybar entraram em março e saíram em junho. O resto atravessou tudo: zsh, git, mise, os scripts e o próprio `links.conf`. Quando troquei de distro, comecei do último commit.

[[PREENCHER: uma frase sua sobre por que saiu do Omarchy/Hyprland para o Niri.]]

## A receita e a foto

Muita gente trata dotfiles como backup, e ele não faz esse papel. Ele é a receita: o que instalar, como configurar e onde cada arquivo mora. A foto do sistema é outra coisa, e eu mantenho as duas. No CachyOS o snapper tira um snapshot btrfs antes e depois de cada transação do pacman, e o `sys-btrfs-backup` (que mora, claro, no dotfiles) manda o sistema inteiro para o homelab todo dia. O OS completo dá uns 26 GiB.

A foto serve para voltar a ontem quando um update quebra alguma coisa. A receita serve para recriar o sistema numa máquina que nunca o viu, e só ela explica por que o `fuse-overlayfs` está instalado.

Se você ainda não tem um, comece pelo arquivo que mais te daria raiva de perder. O meu seria o `.zshrc`. Põe num repositório, cria o symlink e commita. Na próxima config que você ajustar, vai lembrar que ela também pode sumir.

Na [parte 2](/dotfiles-parte-2-do-zero-ao-meu-sistema) eu conto o que aconteceu quando essa receita encontrou uma máquina zerada.

`git log --reverse`
