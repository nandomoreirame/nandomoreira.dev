---
slug: seu-sistema-tem-memoria-por-que-manter-um-dotfiles
title: "Seu sistema tem memória? Um dotfiles do primeiro symlink à reinstalação"
summary: "Formatar me custava um dia inteiro e uma semana lembrando do que faltou. Como montar um dotfiles que guarda as configs e o porquê de cada uma, e como ele reinstala o sistema inteiro numa máquina zerada, com o que quebrou mesmo assim."
date: "2026-10-28"
publishedAt: "2026-10-28T18:49:49-03:00"
markers:
  - dotfiles
  - linux
  - shell
extras:
  - "De um dia inteiro pra poucas horas por formatação"
  - "Bash · Git · 1Password · CachyOS"
keyPoints:
  - "O dotfiles começa com um symlink: o arquivo mora no repositório, e toda mudança passa pelo Git."
  - "Segredo fica fora do repositório: o versionado tem a estrutura, e o valor mora num arquivo local que o Git ignora."
  - "Cada reinstalação deixa a próxima mais curta, porque o que eu tive que lembrar vira linha de código ou de roteiro."
snapshot:
  items:
    - label: "Linguagem"
      value: "Bash"
    - label: "Mapa de links"
      value: "configs/links.conf"
    - label: "Chaves SSH"
      value: "1Password (agent)"
    - label: "Pacotes"
      value: "pacman · AUR · Flatpak · npm"
    - label: "Sistema"
      value: "CachyOS + Niri + Noctalia"
art: symlinks
---

Em 2015 eu escrevi aqui sobre o [meu ambiente de trabalho](/meu-ambiente-de-trabalho-em-7-itens): Ubuntu 15.04, GNOME Shell 3.14 e Sublime Text 3. No meio do post tem esta frase: "Eu costumo sempre que instalar meu Sublime Text, já sair instalando meus pacotes, segue a lista". E vinha a lista, Emmet, Sass, GitGutter e por aí vai.

A lista estava num post de blog. A configuração de verdade estava na minha cabeça. Formatar era ir baixando e instalando um por um, gerar as chaves SSH e GPG de novo na mão e refazer as configs conforme eu esbarrava em cada uma. Levava um dia inteiro, às vezes mais, porque eu passava a semana seguinte lembrando do que faltou instalar.

Em junho de 2026 eu troquei o Omarchy por um [CachyOS](https://cachyos.org) limpo, com Niri e Noctalia ([contei aqui por que](/tiling-dinamico-ou-janelas-sobrepostas)), e em poucas horas a máquina era a minha de novo. Este post é o caminho até isso, do primeiro symlink à reinstalação, com o que eu fiz no meu em cada passo pra você montar o seu. Não vou comparar stow, chezmoi e yadm; quem quiser esse mapa encontra no [Awesome dotfiles](https://github.com/webpro/awesome-dotfiles), uma lista curada de ferramentas, artigos e repositórios de exemplo. Eu testei alguns, mas (como bom programador) quis escrever os meus próprios scripts. Gosto muito de shell script, e o meu dotfiles é Bash do começo ao fim.

## Comece pelos arquivos que você mais usa

O meu começou num domingo de novembro de 2016, num macOS. No primeiro dia entraram a config do Git, as preferências do Sublime Text e do VS Code e um `install.sh` que instalava o Homebrew e, com ele, o zsh, o curl, o wget e os apps de sempre. Comece pelo mesmo lugar: os arquivos que você mais mexe são os que mais doem quando somem.

O mecanismo inteiro é um symlink. O arquivo de verdade passa a morar no repositório, e no lugar original fica um link apontando pra ele:

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

## Troque o symlink na mão por um mapa

Com dois ou três arquivos, `ln -s` resolve. Com dezenas, você esquece qual link criou (que é justamente o problema que o dotfiles devia resolver). A saída é escrever o mapa num arquivo e deixar um script criar os links.

O meu se chama `configs/links.conf` e tem três seções: `[files]` pra arquivos soltos que vão pra home, `[paths]` pra pastas inteiras (com um destino pra Linux e outro pra macOS quando precisa) e `[paths:arch]`, que só carrega no Arch:

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

O cuidado que mais importa nesse script é o que fazer quando o destino já existe. Numa máquina nova, o app já criou a config padrão dele, e apagar isso sem perguntar é pedir pra perder alguma coisa. O meu nunca apaga um arquivo de verdade (versão resumida):

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

Symlink antigo é recriado, arquivo de verdade vira `.bak` com data. Dá pra rodar o comando quantas vezes quiser sem estragar nada, e eu rodo de novo toda vez que adiciono uma config ao mapa.

## Escreva o porquê junto do quê

Seis meses depois, uma config sem explicação parece lixo. A lista de pacotes do pacman no meu repositório é agrupada por finalidade, e cada bloco tem um comentário dizendo por que existe. O do Podman, por exemplo:

```bash
# Bloco containers (podman..fuse-overlayfs): engine Podman + GUI Podman Desktop +
# shim que provê o comando `docker` (podman-docker) + compose nativo. fuse-overlayfs
# é OBRIGATÓRIO neste host: o root é btrfs e o driver overlay nativo do kernel
# falha ("'overlay' is not supported over btrfs"); sem ele nenhum comando podman
# roda. A storage.conf é gerada pelo setup script scripts/setup/podman-storage.sh.
```

Sem esse comentário, um dia eu ia olhar pro `fuse-overlayfs`, achar que era dependência esquecida e tirar. E nenhum comando do Podman rodava mais. Com a mensagem de commit vale o mesmo: o motivo vai junto da mudança, porque é ela que responde o "por que eu fiz isso?" quando você já não lembra.

## Deixe o segredo fora do repositório

Nem tudo da sua máquina deve ir pro Git. Chave, token e e-mail do trabalho ficam de fora, mesmo num repositório privado. O meu antigo chegou a ser público; o de hoje, que recomecei do zero em 2025, é privado, e mesmo assim a regra continua.

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

Numa máquina nova eu copio o `.example`, preencho e rodo o profile. Esse é o passo que eu não posso esquecer: até rodar o profile, todo commit morre com `gpg: signing failed: no secret key`.

## Antes do clone: o ovo e a galinha

Se o seu dotfiles é privado, o `git clone` por SSH precisa de uma chave. E a chave, numa máquina recém-formatada, não existe.

A minha saída é deixar as chaves fora da máquina. Antes de qualquer outro programa, eu instalo dois na mão, o Chrome e o 1Password, e com os dois logados já tenho todo o acesso de que preciso. As chaves SSH moram no 1Password, e o agent SSH dele é o que eu uso pra clonar qualquer repositório privado meu. Nenhuma chave é copiada de pendrive ou gerada de novo.

Pras chaves que não estão no 1Password, há dois comandos. O `sys-ssh-keys` gera a chave, adiciona no agent, copia a pública pro clipboard e testa a conexão com GitHub, GitLab ou Bitbucket. O `sys-gpg-keys` gera a chave GPG, copia a pública e configura o Git pra assinar commits e tags. Sem argumento, os dois abrem um menu.

## Uma lista por gerenciador de pacotes

O que antes era "ir baixando e instalando um por um" vira uma lista por gerenciador. No meu, cada uma é uma função em `lib/` que devolve os nomes, agrupados por finalidade e comentados:

| Gerenciador | Lista padrão |
|---|---|
| pacman | 69 pacotes: zsh, git, ghostty, fzf, ripgrep, btop, Podman, codecs de vídeo |
| AUR | 15: Chrome, Zen, VS Code, Cursor, 1Password e a CLI dele, Google Cloud CLI, [espanso](https://espanso.org) |
| Flatpak | 3: Flatseal, Slack e DevToolbox |
| npm global | 8 pacotes |
| instaladores próprios | oh-my-zsh, [mise](https://mise.jdx.dev), eza, Docker, AWS CLI, Terraform e a CLI do agy |

O instalador pula o que já está instalado, então rodar duas vezes não faz mal:

```bash
local to_install=()
for pack in "${_packages[@]}"; do
    if pacman -Q "$pack" &>/dev/null; then
        echo "$pack já instalado, pulando"
    else
        to_install+=("$pack")
    fi
done
```

Aqui eu rodo o comando e espero. A dica que mais me poupou trabalho é separar a lista de pacotes do código que instala: adicionar um app vira editar uma linha, e o `git diff` daquele arquivo passa a ser o histórico do que você usa.

O mesmo repositório já rodou em Ubuntu, Pop!_OS, macOS e Arch, e cada um tem o seu gerenciador. Antes de instalar qualquer coisa, o `lib/environments.sh` descobre onde está. O `uname` separa macOS de Linux, e no Linux o `/etc/os-release` diz se é Arch ou um derivado:

```bash
if [ "$_os_id" = "arch" ] || echo "$_os_id_like" | grep -q "arch"; then
    DOTFILES_IS_ARCH=true
fi
```

O CachyOS se declara derivado do Arch no `ID_LIKE` e cai no mesmo caminho, sem uma linha a mais. É por essas variáveis que cada lista vai pro gerenciador certo e as seções `[paths:arch]` do mapa de links só carregam onde fazem sentido.

## Scripts que rodam uma vez

Algumas coisas não são pacotes: cedilha no teclado US-international, tema escuro do GTK, apps padrão por tipo de arquivo, storage do Podman em btrfs. São scripts que rodam uma vez por máquina e nunca mais.

Eles moram em `scripts/setup/`, e um registro em `lib/setup.sh` diz quando cada um roda (um trecho):

```text
fix-cedilla.sh|auto|Cedilha (ç) no teclado US-international
gtk-dark.sh|auto|Aparência escura GTK/libadwaita (agnóstico de DE)
podman-storage.sh|auto|Storage rootless do Podman em btrfs/zfs (fuse-overlayfs)
tailscale.sh|manual|VPN mesh Tailscale (instala + ativa; requer login no navegador)
```

`auto` roda na instalação completa. `manual` espera eu pedir com `dotfiles setup:run <nome>`, como o [Tailscale](https://tailscale.com), que abre o navegador pra login.

Eles já moraram em `bin/`, e tirei de lá de propósito. Tudo em `bin/` entra no PATH, e um script que roda uma vez por máquina não merece virar comando pra sempre.

## A ordem importa

O `dotfiles` tem uma instalação completa que faz tudo de uma vez, mas eu prefiro rodar um passo de cada vez, na mesma ordem dela. Assim eu vejo onde cada coisa falha:

```bash
git clone git@github.com:nandomoreirame/.dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./bin/dotfiles pacman:install
./bin/dotfiles aur:install
./bin/dotfiles flatpak:install
./bin/dotfiles sh:install        # oh-my-zsh, mise, Docker...
./bin/dotfiles node:install
./bin/dotfiles fonts:install
./bin/dotfiles links --all
./bin/dotfiles setup:run <nome>  # um script de setup por vez
```

O repositório é privado; o roteiro serve de modelo. Quando eu adiciono um passo novo, a pergunta é sempre do que ele depende. Os pacotes do npm precisam do Node que o `mise` instala, então vêm depois do `sh:install`; o script que configura o storage do Podman precisa do Podman instalado, então roda depois dos apps.

## O que quebrou mesmo assim

Três coisas no primeiro dia do CachyOS.

### O terminal abriu em fish

O CachyOS vem com o fish como shell de login, e todo o meu setup é zsh: é o `.zshrc` que coloca os scripts do dotfiles no PATH e carrega os aliases. Abri o terminal e notei na hora que não tava no meu padrão. Foi um susto e tanto, e o primeiro pensamento foi "putz, vou ter que investigar onde e como resolver isso". Aí lembrei que existia um comando pra trocar o shell padrão e rodei o `chsh -s /usr/bin/zsh`. Faltava ainda uma coisa: o symlink do `~/.zshrc` apontava pra raiz do repositório, de antes de eu mover as configs pra `configs/`, e um `dotfiles links --files` recriou o link no lugar certo.

Se a sua distro escolhe o shell por você, põe o `chsh` no seu roteiro.

### O Niri ignorou todos os meus atalhos

A primeira linha do meu `config.kdl` é `include "monitor.kdl"`, um arquivo que o `nwg-displays` gera com a disposição dos monitores, e eu não versionava ele porque cada máquina tem os seus. Sem ele, o [Niri](https://github.com/YaLTeR/niri) rejeita a config inteira com `failed to read included config` e volta pros atalhos padrão. O symlink estava certo. Faltava o arquivo incluído.

Hoje o `monitor.kdl` é versionado e está no mapa de links. Se a sua config inclui outro arquivo, garanta que ele exista em toda máquina, nem que seja vazio.

### O Noctalia apagou a minha config

Essa doeu. Antes de formatar, eu tinha versionado a config do [Noctalia](https://github.com/noctalia-dev/noctalia-shell) que montei testando ele no Omarchy. Na máquina nova, o Noctalia subiu no login antes de o `dotfiles links` criar o symlink de `~/.config/noctalia`, e a versão da época (a v4) não relia o `settings.json` depois. Fiz o óbvio e reiniciei o processo. Só que a v4 gravava a config quando recebia SIGTERM, e agora `~/.config/noctalia` era um symlink pro repositório. A instância velha, com a config padrão na memória, morreu escrevendo por cima dos meus ajustes.

**Foi aí que versionar tudo se pagou:** um `git checkout -- configs/noctalia/{settings,plugins,colors}.json` trouxe a config de volta. Na v5, que eu uso desde outubro, isso não se repete. O que eu mudo pela interface vai pra um arquivo de estado fora do repositório, e reiniciar com SIGTERM não toca na config versionada (testei: os arquivos saem com o mesmo checksum).

## Receita e foto

Das três, só o `monitor.kdl` virou código. O `chsh` virou linha de roteiro, e o Noctalia a v5 resolveu por mim. É assim que o "um dia inteiro" virou "poucas horas": a cada reinstalação, o que eu tive que lembrar vai pro repositório, seja como código, seja como roteiro.

Dotfiles costuma ser confundido com backup, mas os dois guardam coisas diferentes. O dotfiles é a receita: o que instalar, como configurar, onde cada arquivo mora e por quê. A foto é o snapshot do sistema, e eu mantenho as duas. No CachyOS o snapper tira um snapshot btrfs antes e depois de cada atualização do pacman, e um script do próprio dotfiles manda o sistema inteiro pro meu homelab todo dia. A foto serve pra voltar a ontem quando um update quebra alguma coisa. A receita monta o sistema numa máquina que nunca o viu, e só ela explica por que o `fuse-overlayfs` está instalado.

Se você ainda não tem um dotfiles, comece hoje pelo arquivo que mais te daria raiva de perder: põe num repositório, cria o symlink e commita. Quando os scripts começarem a rodar sozinhos, em atalho e timer, vale testar eles; contei como eu faço em [tratando dotfiles como software](/tratando-dotfiles-como-software).

`ln -s`
