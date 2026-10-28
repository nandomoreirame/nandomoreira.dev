---
slug: scripts-que-automatizam-meu-linux
title: "Automatize os seus próprios problemas: um guia com os scripts que rodam no meu Linux"
summary: "Como achar o que vale automatizar, escrever a versão mais simples que funciona, escolher entre shell, Python e Rust e fazer o script rodar sem você. Com os scripts do meu dotfiles como exemplo e uma lista de ideias pra roubar."
date: "2026-10-17"
markers:
  - linux
  - shell
  - produtividade
extras:
  - "66 linhas que ligam o Não perturbe sozinhas na call"
  - "bash · systemd · PipeWire · Niri"
keyPoints:
  - "O primeiro script só precisa fazer o que você fazia na mão; tratar erro e aceitar opção vêm depois."
  - "Script que você precisa lembrar de rodar ainda depende de você: dê a ele um atalho, o login, um timer ou um hook."
  - "Um vigia só age quando o estado muda, e antes de escrevê-lo vale perguntar o que mais no sistema parece com o que ele vigia."
snapshot:
  items:
    - label: "Vigia"
      value: "niri-mic-dnd"
    - label: "Intervalo"
      value: "2 s"
    - label: "Áudio"
      value: "PipeWire (pw-dump)"
    - label: "Compositor"
      value: "Niri"
    - label: "Timer"
      value: "systemd"
art: watcher
draft: true
---

Quando eu entro numa call, as notificações somem e a tela para de apagar. Quando acaba, volta tudo. Eu não aperto nada: um script de 66 linhas olha o microfone a cada dois segundos e faz isso por mim.

Esse script não é especial. Ele resolve um problema meu, do jeito mais simples que funcionou, e é isso que eu quero que você faça com os seus. **Ferramenta pronta resolve o problema de todo mundo; script resolve o seu**, e o seu problema quase nunca está numa ferramenta pronta. Não importa se você escreve em shell, Python, Rust ou outra coisa: o caminho é o mesmo.

## Ache o problema que se repete

Um bom candidato a script tem uma destas caras:

- A sequência de comandos que você digita igual toda vez. Abra o histórico do terminal (`history | less`) depois de uma semana de trabalho e procura o que se repete. Os meus [scripts de Gitflow](/meus-scripts-de-gitflow-de-31-linhas-a-uma-skill) nasceram assim, lá por 2019: eram a sequência que eu digitava toda vez que abria uma branch.
- O que você esquece de fazer: backup, limpar cache, apagar screenshot velho. Se depende de você lembrar, não vai acontecer.
- Irritação pequena de todo dia: ligar o "Não perturbe" antes da call, trocar a saída de áudio quando pluga o fone, procurar a janela do Spotify. Cada uma custa segundos, e elas se repetem o dia inteiro.
- Tarefa de uma vez por ano, que você sempre tem que pesquisar de novo: gerar chave SSH, instalar um AppImage direito. O script vira a documentação que você não escreveu.

## Escreva a versão mais burra que funciona

O primeiro script não precisa tratar erro, ter ajuda nem aceitar opção; precisa fazer o que você fazia na mão, e só. O meu de Gitflow tinha 31 linhas. Validava o argumento e rodava, na mesma ordem, os comandos que eu já digitava, e eu usei aquilo por anos antes de ele crescer.

Em shell, o mínimo é isto:

```bash
#!/usr/bin/env bash
set -euo pipefail

[ -n "${1:-}" ] || { echo "uso: $(basename "$0") <nome>" >&2; exit 1; }

# os comandos que você já digita, na mesma ordem
```

O `set -euo pipefail` faz o script parar no primeiro erro, em vez de seguir executando o resto em cima de um estado quebrado. É a linha que mais vale no shell.

## Escolha a linguagem pelo problema

Eu escrevo muito shell porque gosto, mas não é a única ferramenta da caixa. A régua que eu uso:

| Se o script… | Eu uso | Exemplo meu |
|---|---|---|
| Cola comandos que já existem (git, pacman, ssh, pw-dump) | Shell | quase tudo em `bin/` do dotfiles |
| Mexe com dados, HTTP, JSON, texto de verdade | Python | o [job-radar](/job-radar-radar-de-vagas-em-python-puro), que varre sites de vaga só com a biblioteca padrão |
| Precisa de uma interface no terminal ou fica rodando muito tempo | Rust | a TUI do dotfiles, a do `rdo-solo` no homelab e o [`stats`](/analytics-sem-script-medindo-no-servidor-e-lendo-no-terminal), que lê o analytics do blog |

Quando o shell começa a ficar cheio de `sed` e `awk` pra destrinchar um formato, é hora de trocar. E não precisa escolher uma só: os meus scripts de shell chamam `jq` pra ler JSON o tempo todo, e a TUI em Rust do dotfiles chama os scripts de shell em vez de reescrever eles.

Qualquer linguagem vira comando do mesmo jeito: uma primeira linha dizendo quem executa o arquivo (o shebang), permissão de execução e uma pasta no PATH.

```bash
#!/usr/bin/env python3
```

```bash
chmod +x ~/bin/meu-script
export PATH="$HOME/bin:$PATH"   # no seu .zshrc ou .bashrc
```

No meu dotfiles, cada subpasta de `bin/` entra no PATH pelo `.zshrc`, e o script fica disponível em qualquer terminal.

## Dê uma porta de entrada pro script

Script que você precisa lembrar de rodar ainda depende de você. O que mais me ajudou foi decidir, pra cada um, quem aperta o botão: eu no terminal, um atalho, o login, um horário ou outro programa.

| Porta | Como funciona | Exemplo meu |
|---|---|---|
| Terminal | Está no PATH, você digita | `git-release`, `hd-backup` |
| Atalho de teclado | O gerenciador de janelas chama o script | `niri-scratchpad` no `Mod+Shift+S` |
| Login | Sobe com a sessão e fica vigiando algo | `niri-mic-dnd`, `audio-jack-autoswitch` |
| Timer | O systemd roda num horário, sem terminal | o backup diário do sistema |
| Hook | Um programa chama no momento certo | o `commit-msg` do git, o desligamento da máquina |

No Niri, o atalho e o login são uma linha cada no `config.kdl`:

```kdl
spawn-at-startup "sh" "-c" "~/.dotfiles/bin/utils/niri-mic-dnd"
```

No GNOME, no KDE ou em outro ambiente, o equivalente é o atalho personalizado das configurações, e pro login um `.desktop` em `~/.config/autostart/`. Pra timer, `.service` mais `.timer` do systemd (ou o bom e velho `cron`).

## Faça ele rodar sozinho

Os scripts que vigiam alguma coisa seguem quase sempre o mesmo desenho: um loop que olha o estado, compara com o anterior e só age quando ele muda. O meu do microfone, sem os comentários:

```bash
main() {
  local using prev="unknown"
  while true; do
    if mic_in_use; then using=1; else using=0; fi

    if [ "$using" = 1 ] && [ "$prev" != 1 ]; then
      hold dnd acquire mic
      hold awake acquire mic
    elif [ "$using" = 0 ] && [ "$prev" = 1 ]; then
      hold dnd release mic
      hold awake release mic
    fi

    prev="$using"
    sleep "$INTERVAL"
  done
}
```

Agir só na mudança impede o script de religar o "Não perturbe" a cada volta do loop, que roda de dois em dois segundos. Como ele sobe no login, um `flock` no começo garante uma cópia só.

O que mais importa nesse tipo de script é definir o que conta como "estado". A barra do meu desktop tem um visualizador de áudio. Ele também captura som: o que sai do alto-falante, pra desenhar as ondas. Se o script contasse qualquer captura como microfone em uso, o "Não perturbe" ficaria ligado pra sempre, como se eu estivesse numa call eterna. Por isso a consulta ao PipeWire ignora as capturas do alto-falante. Antes de escrever o seu vigia, pergunte o que mais no sistema parece com o que você está vigiando.

Script que passa a importar ganha teste. O `nocta-hold` e o `audio-jack-autoswitch` têm o deles, e contei como eu testo os meus em [tratando dotfiles como software](/tratando-dotfiles-como-software).

## Ideias pra roubar

Tudo isso mora no meu dotfiles. Ele é privado, então não tem link pro código. Alguns viraram post próprio, e o link está no item.

**Git**

- `git-feature`, `git-bugfix`, `git-hotfix`, `git-release`: o Gitflow inteiro num comando, da branch ao merge, à tag e ao changelog ([a história deles](/meus-scripts-de-gitflow-de-31-linhas-a-uma-skill)).
- `git-push`: manda a branch pra todos os remotos configurados de uma vez.
- `git-rollback`: volta a `master` pra uma tag.
- `git-strip-ai-signatures`: hook global de `commit-msg` que tira as assinaturas que as ferramentas de IA colocam no commit.

**Instalar e configurar**

- `dotfiles`: symlinks das configs, pacotes de cada gerenciador e scripts de máquina nova ([a série sobre ele](/seu-sistema-tem-memoria-por-que-manter-um-dotfiles)).
- `sys-ssh-keys`: gera a chave, adiciona no agent e copia a pública.
- `sys-gpg-keys`: gera a chave GPG, copia a pública e configura o git pra assinar commits e tags.
- `appimage-install`: guarda o AppImage em `~/.local/opt`, cria o link no PATH e o atalho no lançador.
- `webapp-install`: transforma um site num app com janela própria e ícone no lançador.

**Um desktop que reage sozinho**

- `niri-mic-dnd` e `niri-dnd-screenshare`: "Não perturbe" durante a call e enquanto a tela é compartilhada ou gravada.
- `niri-keepawake-tasks`: segura a tela acordada enquanto uma tarefa longa roda.
- `niri-power-autoprofile`: na tomada, perfil de performance; na bateria, economia.
- `niri-hdmi-automode`: a TV e o monitor dividem o mesmo cabo, e ele aplica a resolução certa pro aparelho conectado.
- `nocta-hold`: o juiz dos de cima. Conta quantos scripts pediram o "Não perturbe", pro primeiro que termina não desligar o que outro ainda precisa.

**Janelas, áudio e modos**

- `niri-scratchpad`: um atalho mostra e esconde Spotify, WhatsApp e Discord ([scratchpad no Niri](/scratchpad-no-niri-janelas-que-somem-com-um-atalho)).
- `audio-jack-autoswitch`: plugou o fone, perfil de fone; tirou, alto-falante ([o fone mudo e o jack P2](/o-fone-mudo-e-o-jack-p2-no-pipewire)).
- `bt-audio`: joga saída e microfone pro fone Bluetooth, ignorando mouse e teclado.
- `game-mode`: congela os apps de trabalho pra liberar a máquina pro jogo, sem fechar nada ([game mode com o freezer do cgroup](/game-mode-congelando-o-trabalho-com-o-cgroup-freezer)).
- `focus-mode`: congela só as distrações (Steam, Telegram), liga o "Não perturbe" e deixa a música tocando.

**Backup e faxina**

- `sys-btrfs-backup`: snapshot diário do sistema, incremental, pro meu [homelab](/meu-homelab-num-mac-mini-de-2018).
- `hd-backup`: compacta uma pasta e manda pra outro disco ou máquina, com barra de progresso.
- `sys-clean-cache`, `clean-screenshots` e `clean-claude-sessions`: faxina de cache, de screenshots com mais de uma semana e de sessões antigas do Claude Code.
- `podman-shutdown`: para os containers com calma antes de desligar a máquina.

**Pequenos utilitários**

- `downloads`: baixa em paralelo uma lista de URLs de um `.txt`, com barra de progresso por arquivo.
- `utils-password`: gera uma senha e já copia pro clipboard.
- `utils-tempo`: previsão do tempo no terminal, via [wttr.in](https://wttr.in).
- `rdo-solo`: controla do notebook o filtro que deixa o Red Dead Online numa sessão só minha ([Red Dead Online sozinho pelo gateway](/rdo-solo-red-dead-online-sozinho-pelo-gateway)).

## Comece pelo mais chato

Não comece pelo script mais legal da lista. Comece pelo que mais te irrita na semana. Os meus primeiros instalavam o básico de uma máquina nova (git, curl, PHP), e o de Gitflow era só a sequência que eu já digitava, colada num arquivo. Os que reagem sozinhos vieram anos depois, um problema de cada vez.

`exit 0`
