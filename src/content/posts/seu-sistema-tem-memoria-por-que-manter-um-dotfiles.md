---
slug: seu-sistema-tem-memoria-por-que-manter-um-dotfiles
title: "Seu sistema tem memória? Por que manter um dotfiles"
summary: "Formatar me custava um dia inteiro e uma semana lembrando do que faltou. Como montar um dotfiles que guarda as configs, os scripts e o porquê de cada coisa, mostrando como eu fiz o meu."
date: "2026-10-17"
markers:
  - dotfiles
  - linux
  - shell
draft: true
---

Em 2015 eu escrevi aqui sobre o [meu ambiente de trabalho](/meu-ambiente-de-trabalho-em-7-itens): Ubuntu 15.04, GNOME Shell 3.14 e Sublime Text 3. No meio do post tem esta frase: "Eu costumo sempre que instalar meu Sublime Text, já sair instalando meus pacotes, segue a lista". E vinha a lista, Emmet, Sass, GitGutter e por aí vai.

A lista estava num post de blog. A configuração de verdade estava na minha cabeça. Formatar era ir baixando e instalando um por um, gerar as chaves SSH e GPG de novo na mão e refazer as configs conforme eu esbarrava em cada uma. Levava um dia inteiro, às vezes mais, porque eu passava a semana seguinte lembrando do que faltou instalar.

Hoje eu formato e fica tudo configurado em poucas horas. Este é o primeiro de três posts sobre como chegar nisso com um dotfiles, e a ideia é você sair montando o seu: cada passo vem com o que eu fiz no meu. Não vou comparar stow, chezmoi e yadm; quem quiser esse mapa encontra no [Awesome dotfiles](https://github.com/webpro/awesome-dotfiles), uma lista curada de ferramentas, artigos e repositórios de exemplo. Eu testei alguns, mas (como bom programador) quis escrever os meus próprios scripts. Gosto muito de escrever shell script, e o meu dotfiles é Bash do começo ao fim.

## Comece pelos arquivos que você mais usa

Eu comecei lá por 2020 com dois: a config do Sublime Text e a do shell. É um bom começo para qualquer um, porque são os arquivos que você mais mexe e que mais doem quando somem.

O mecanismo inteiro é um symlink. O arquivo de verdade passa a morar no repositório, e no lugar original fica um link apontando para ele:

```bash
mkdir -p ~/.dotfiles/configs
mv ~/.zshrc ~/.dotfiles/configs/.zshrc
ln -s ~/.dotfiles/configs/.zshrc ~/.zshrc

cd ~/.dotfiles
git init
git add configs/.zshrc
git commit -m "add zshrc"
```

O shell continua lendo `~/.zshrc` como sempre. **A diferença é que agora toda mudança passa pelo Git:** ajustou uma opção, o `git diff` mostra, e a config nunca mais some numa formatação.

Depois das configs, vieram os scripts. Os primeiros instalavam o básico de uma máquina nova: git, curl, PHP. Isso é assunto da [parte 2](/do-zero-ao-meu-sistema-uma-reinstalacao-na-pratica).

## Troque o symlink na mão por um mapa

Com dois ou três arquivos, `ln -s` resolve. Com dezenas, você esquece qual link criou (que é justamente o problema que o dotfiles devia resolver). A saída é escrever o mapa num arquivo e deixar um script criar os links.

O meu se chama `configs/links.conf` e tem três seções: `[files]` para arquivos soltos que vão para a home, `[paths]` para pastas inteiras (com um destino para Linux e outro para macOS quando precisa) e `[paths:arch]`, que só carrega no Arch:

```ini
[files]
.zshrc
.gitconfig

[paths:arch]
configs/niri/config.kdl | .config/niri/config.kdl |
configs/noctalia | .config/noctalia |
configs/espanso | .config/espanso |
```

Origem no repositório, destino relativo à home, e a seção decide em que sistema aquilo vale. O comando `dotfiles links --all` lê esse arquivo e cria tudo.

O cuidado que mais importa nesse script é o que fazer quando o destino já existe. Numa máquina nova, o app já criou a config padrão dele, e apagar isso sem perguntar é pedir para perder alguma coisa. O meu nunca apaga um arquivo de verdade:

```bash
_backup_or_remove_target() {
    local target_path=$1

    # If doesn't exist as file or link, nothing to do
    if [ ! -e "$target_path" ] && [ ! -L "$target_path" ]; then
        return 0
    fi

    # If it's a symlink, remove to recreate
    if [ -L "$target_path" ]; then
        rm -f "$target_path"
        return 0
    fi

    # If it's a real file/dir, move to .bak with timestamp
    local ts
    ts=$(date +%Y%m%d-%H%M%S)
    mv -f "$target_path" "${target_path}.bak.${ts}"
}
```

Symlink antigo é recriado, arquivo de verdade vira `.bak` com data. Dá para rodar o comando quantas vezes quiser sem estragar nada, e eu rodo de novo toda vez que adiciono uma config ao mapa.

## Versione o formato e deixe o segredo de fora

Nem tudo da sua máquina deve ir para o Git. Chave, token e e-mail do trabalho ficam de fora, mesmo num repositório privado. O meu antigo chegou a ser público; o de hoje, que recomecei do zero em 2025, é privado, e mesmo assim a regra continua.

O jeito que eu uso: o arquivo versionado tem a estrutura, e o valor fica num arquivo local que o Git ignora. O `.gitconfig` do repositório liga a assinatura de commits e termina com um include:

```ini
[include]
	path = ~/.gitconfig.local
```

O `~/.gitconfig.local` é gerado por um comando meu (`dotfiles profile`) a partir de um arquivo de profile que também fica no `.gitignore`. No repositório só vai o modelo, com valores de mentira:

```bash
# Copy this file to git-personal.conf and fill in your values.
# The .conf file is NOT tracked in git.
GIT_GPG_FORMAT="ssh"
GIT_SIGNING_KEY="ssh-rsa YOUR_PUBLIC_SSH_KEY_HERE"
GIT_GPG_SSH_PROGRAM="/opt/1Password/op-ssh-sign"
```

Numa máquina nova eu copio o `.example`, preencho e rodo o profile. O resto da config do Git já veio pelo symlink.

## Escreva o porquê junto do quê

Seis meses depois, uma config sem explicação parece lixo. A lista de pacotes do pacman no meu repositório é agrupada por finalidade, e cada bloco tem um comentário dizendo por que existe. O do Podman, por exemplo:

```bash
# Bloco containers (podman..fuse-overlayfs): engine Podman + GUI Podman Desktop +
# shim que provê o comando `docker` (podman-docker) + compose nativo. fuse-overlayfs
# é OBRIGATÓRIO neste host: o root é btrfs e o driver overlay nativo do kernel
# falha ("'overlay' is not supported over btrfs"); sem ele nenhum comando podman
# roda. A storage.conf é gerada pelo setup script scripts/setup/podman-storage.sh.
```

Sem esse comentário, eu olharia para o `fuse-overlayfs` um dia, acharia que é dependência esquecida e tiraria. Vale o mesmo para a mensagem de commit: escreva o motivo junto da mudança. É ela que vai responder o "por que eu fiz isso?" quando você não lembrar.

## Trocar de sistema vira experimento barato

Foi aqui que o dotfiles mais me pagou. Eu estava no Omarchy (Arch com Hyprland) e já usei muito gerenciador de janelas, então experimentar é meio que hobby. Testei o Niri com o Noctalia ainda no Omarchy, gostei mais, e decidi formatar com um CachyOS limpo, Niri e Noctalia, abandonando o Omarchy de vez.

Antes de formatar, versionei a config do Noctalia que eu tinha montado no teste. Na máquina nova, a barra, os widgets e o wallpaper voltaram com o `dotfiles links`. O que mudou na troca foi a camada do desktop. O zsh, o git, o mise, os scripts e o próprio mapa de links atravessaram a formatação inteiros.

## Receita e foto

Dotfiles costuma ser confundido com backup, mas os dois guardam coisas diferentes. O dotfiles é a receita: o que instalar, como configurar, onde cada arquivo mora e por quê. A foto é o snapshot do sistema, e eu mantenho as duas. No CachyOS o snapper tira um snapshot btrfs antes e depois de cada atualização do pacman, e um script do próprio dotfiles manda o sistema inteiro para o meu homelab todo dia.

A foto serve para voltar a ontem quando um update quebra alguma coisa. A receita serve para montar o sistema numa máquina que nunca o viu, e só ela explica por que o `fuse-overlayfs` está instalado.

Se você ainda não tem um dotfiles, comece hoje pelo arquivo que mais te daria raiva de perder: põe num repositório, cria o symlink e commita. Na [parte 2](/do-zero-ao-meu-sistema-uma-reinstalacao-na-pratica) eu mostro a outra metade, os scripts que instalam tudo numa máquina zerada.

`ln -s`
