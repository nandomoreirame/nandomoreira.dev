---
slug: do-zero-ao-meu-sistema-uma-reinstalacao-na-pratica
title: "Do zero ao meu sistema, uma reinstalação na prática"
summary: "O passo a passo para um dotfiles reinstalar o sistema inteiro: o que fazer antes do clone, listas de pacotes, detecção do sistema, scripts que rodam uma vez e chaves por comando. E as três coisas que quebraram mesmo assim."
date: "2026-10-17"
markers:
  - dotfiles
  - linux
  - shell
draft: true
---

Em junho de 2026 eu formatei o notebook e instalei um CachyOS limpo, com Niri e Noctalia. Antigamente isso me custava um dia inteiro e uma semana lembrando do que faltou. Desta vez, em poucas horas a máquina era a minha de novo.

Na [parte 1](/seu-sistema-tem-memoria-por-que-manter-um-dotfiles) eu mostrei a metade das configs: o repositório, os symlinks e o mapa de links. Esta é a outra metade, a que instala as coisas. Vou na ordem em que acontece numa máquina zerada, e em cada passo mostro como fiz no meu.

## Antes do clone: o ovo e a galinha

Se o seu dotfiles é privado (o meu é), o `git clone` por SSH precisa de uma chave. E a chave, numa máquina recém-formatada, não existe.

A minha saída é deixar as chaves fora da máquina. Antes de qualquer outro programa, eu instalo dois na mão: o Chrome e o 1Password. Com o 1Password logado e o GitHub logado no Chrome, já tenho todo o acesso de que preciso. As minhas chaves SSH moram no 1Password, e o agent SSH dele é o que uso para clonar qualquer repositório privado meu. Nenhuma chave precisa ser copiada de um pendrive ou gerada de novo.

Daí em diante, o roteiro cabe em cinco linhas (o repo é privado, o roteiro serve de modelo):

```bash
git clone git@github.com:nandomoreirame/.dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./bin/dotfiles links --all
./bin/dotfiles apps:install
source ~/.zshrc
```

## Uma lista por gerenciador de pacotes

O que antes era "ir baixando e instalando um por um" vira uma lista por gerenciador. No meu, cada uma é uma função em `lib/` que devolve os nomes, agrupados por finalidade e comentados:

| Gerenciador | Lista padrão |
|---|---|
| pacman | 70 pacotes: zsh, git, ghostty, fzf, ripgrep, btop, Podman, codecs de vídeo |
| AUR | 15: Chrome, Zen, VS Code, Cursor, 1Password e a CLI dele, Google Cloud CLI, espanso |
| Flatpak | 3: Flatseal, Slack e DevToolbox |
| npm global | 8 pacotes |
| instaladores próprios | oh-my-zsh, mise, eza, Docker, AWS CLI e Terraform |

O instalador pula o que já está instalado, então rodar duas vezes não faz mal:

```bash
local to_install=()
for pack in "${_packages[@]}"; do
    if pacman -Q "$pack" &>/dev/null; then
        echo "⏭️  $pack já instalado, pulando"
    else
        to_install+=("$pack")
    fi
done
```

Essa é a parte em que eu rodo o comando e espero alguns minutos. Uma dica que me poupou trabalho: separe a lista de pacotes do código que instala. Adicionar um app novo vira editar uma linha, e o `git diff` daquele arquivo é o histórico do que você usa.

## Descubra onde está rodando

O mesmo repositório já rodou em Ubuntu, Pop!_OS, macOS e Arch, e cada um tem o seu gerenciador. Antes de instalar qualquer coisa, o `lib/environments.sh` descobre onde está. O `uname` separa macOS de Linux, e para o Linux o `/etc/os-release` diz se é Arch ou um derivado:

```bash
if [ "$_os_id" = "arch" ] || echo "$_os_id_like" | grep -q "arch"; then
    DOTFILES_IS_ARCH=true
fi
```

O CachyOS se declara derivado do Arch no `ID_LIKE`, então cai no mesmo caminho sem eu escrever uma linha a mais. Com essas variáveis, cada lista vai para o gerenciador certo, e as seções `[paths:arch]` do mapa de links só carregam onde fazem sentido.

## Scripts que rodam uma vez

Algumas coisas não são pacotes: cedilha no teclado US-international, tema escuro do GTK, apps padrão por tipo de arquivo, storage do Podman em btrfs. São scripts que rodam uma vez por máquina e nunca mais.

Eles moram em `scripts/setup/`, e um registro em `lib/setup.sh` diz quando cada um roda:

```text
fix-cedilla.sh|auto|Cedilha (ç) no teclado US-international
gtk-dark.sh|auto|Aparência escura GTK/libadwaita (agnóstico de DE)
podman-storage.sh|auto|Storage rootless do Podman em btrfs/zfs (fuse-overlayfs)
tailscale.sh|manual|VPN mesh Tailscale (instala + ativa; requer login no navegador)
local-ai.sh|manual|IA local (Ollama + modelos de código + OpenCode + Aider)
```

`auto` roda na instalação completa. `manual` espera eu pedir com `dotfiles setup:run <nome>`: o Tailscale abre o navegador para login, e a IA local baixa gigas de modelo que eu nem sempre quero.

Eles já moraram em `bin/`, e tirei de lá de propósito. Tudo em `bin/` entra no PATH, e um script que roda uma vez por máquina não merece virar comando para sempre.

## Chaves e assinatura por comando

Para as chaves que não estão no 1Password, há dois comandos. O `sys-ssh-keys` gera a chave, adiciona no agent, copia a pública para o clipboard e testa a conexão com GitHub, GitLab ou Bitbucket. O `sys-gpg-keys` faz o mesmo com GPG, inclusive configurar o Git para assinar commits. Sem argumento, os dois abrem um menu.

No meu dia a dia eu assino commits com a chave SSH do 1Password, e quem liga isso é o `dotfiles profile` (o `.gitconfig.local` da parte 1). Esse é o passo que eu não posso esquecer: até rodar o profile, todo commit morre com `gpg: signing failed: no secret key`.

## A ordem importa

A instalação completa roda numa sequência fixa: apps, fontes, symlinks, as pastas do ambiente de desenvolvimento e, por fim, os scripts de setup marcados como `auto`. Quando eu adiciono um passo novo, a pergunta é sempre do que ele depende. Um script de setup que configura o Podman precisa do Podman instalado, então ele vem depois dos apps.

## O que quebrou mesmo assim

Três coisas no primeiro dia, e cada uma virou prevenção no repositório.

### O terminal abriu em fish

O CachyOS vem com o fish como shell de login. Todo o meu setup é zsh: é o `.zshrc` que coloca os scripts do dotfiles no PATH e carrega os aliases. O sintoma foi "nenhum comando do dotfiles existe". Na investigação apareceu um segundo problema: o symlink do `~/.zshrc` apontava para a raiz do repositório, de antes de eu mover as configs para `configs/`. Um `chsh -s /usr/bin/zsh` e a correção do caminho no script de links resolveram.

Se a sua distro escolhe o shell por você, coloque o `chsh` no seu roteiro.

### O Niri ignorou todos os meus atalhos

A primeira linha do meu `config.kdl` é `include "monitor.kdl"`, um arquivo que o `nwg-displays` gera com a disposição dos monitores. Eu não versionava esse arquivo, porque cada máquina tem os seus monitores. Sem ele, o Niri rejeita a config inteira com `failed to read included config` e volta para os atalhos padrão. O symlink do `config.kdl` estava certo; faltava o arquivo que ele inclui.

Hoje o `monitor.kdl` é versionado e está no mapa de links. Se a sua config inclui outro arquivo, garanta que ele exista em toda máquina, nem que seja vazio.

### O Noctalia apagou a minha config

Essa doeu. O Noctalia sobe no login, antes de o `dotfiles links` criar o symlink de `~/.config/noctalia`, e não relê o `settings.json` depois. Fiz o óbvio e reiniciei o processo. Só que ele grava a config quando recebe SIGTERM, e agora `~/.config/noctalia` era um symlink para o repositório. A instância velha, com a config padrão na memória, morreu escrevendo por cima dos meus ajustes.

**Foi aí que versionar tudo se pagou.** Um `git checkout -- configs/noctalia/{settings,plugins,colors}.json` trouxe a config de volta. Hoje a ordem para reiniciar o shell numa máquina nova é fixa: matar o processo, restaurar do Git, subir de novo.

## Cada reinstalação deixa a próxima mais curta

As três correções foram parar no repositório. A próxima formatação não tropeça nelas, e é assim que o "um dia inteiro" virou "poucas horas": a cada reinstalação, o que eu tive que lembrar vira linha de código.

Na [parte 3](/tratando-dotfiles-como-software) eu mostro como testo esses scripts, para que eles funcionem no dia em que eu precisar.

`chsh -s /usr/bin/zsh`
