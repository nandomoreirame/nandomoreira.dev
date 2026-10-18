---
slug: scripts-que-automatizam-meu-linux
title: "Os scripts que automatizam meu Linux: um compilado pra você roubar ideias"
summary: "Áudio que troca sozinho, notificação que some quando eu entro em call, backup que roda sem eu lembrar. Um passeio pelos scripts do meu dotfiles, sem entrar em detalhe, pra servir de inspiração."
date: "2026-10-17"
markers:
  - linux
  - shell
  - produtividade
draft: true
---

Quando eu entro numa call, as notificações somem e a tela para de apagar. Quando eu tiro o fone do notebook, o som volta pro alto-falante. Quando eu ligo o notebook na tomada, o perfil de energia vai pra performance. Eu não aperto nada disso: são scripts do meu dotfiles rodando em segundo plano.

Este post é uma vitrine, sem tutorial de cada um. Alguns já ganharam post próprio (o link está no item), os outros cabem em uma ou duas frases. A ideia é você bater o olho e pensar "isso eu também faço na mão toda semana". **Se você digita a mesma coisa duas vezes por semana, ela merece virar script**, e quase sempre o script é menor do que você imagina. O meu dotfiles é privado, então não tem link pro código; o que vale aqui é a ideia.

## Onde um script mora decide como ele roda

Antes da lista, o que mais me ajudou a automatizar foi entender que cada script tem uma "porta de entrada", e ela muda tudo:

| Porta | Como eu uso | Exemplo |
|---|---|---|
| PATH | Tudo em `bin/` vira comando no terminal | `git-release`, `hd-backup` |
| Atalho de teclado | O [Niri](https://github.com/YaLTeR/niri) chama o script com `spawn-sh` | `niri-scratchpad`, `rdo-solo-toggle` |
| Ao iniciar a sessão | O Niri sobe com `spawn-at-startup` e o script fica vigiando algo | `niri-mic-dnd`, `audio-jack-autoswitch` |
| Timer do systemd | Roda num horário, sem terminal nenhum | `sys-btrfs-backup` |
| Hook | O git ou o shell chamam num evento | `git-strip-ai-signatures`, `podman-shutdown` |

Um script que você precisa lembrar de rodar ainda depende de você. Os que mais me ajudam são os das três últimas linhas, que rodam sozinhos.

## Git

- **`git-feature`, `git-bugfix`, `git-hotfix`, `git-release`:** o Gitflow inteiro num comando, de criar a branch até o merge, a tag e o changelog. Ele nasceu lá por 2019, e contei a história dele em [meus scripts de Gitflow](/meus-scripts-de-gitflow-de-31-linhas-a-uma-skill).
- **`git-push`:** manda a branch pra todos os remotos configurados de uma vez (útil quando o projeto tem espelho).
- **`git-rollback`:** volta a `master` pra uma tag, quando uma versão dá ruim.
- **`git-strip-ai-signatures`:** um hook global de `commit-msg` que tira as assinaturas automáticas que as ferramentas de IA colocam na mensagem de commit.

## Instalar e configurar

- **`dotfiles`:** cria os symlinks das configs, instala os pacotes de cada gerenciador e roda os scripts de setup de máquina nova. Tem uma série inteira sobre ele, começando por [seu sistema tem memória?](/seu-sistema-tem-memoria-por-que-manter-um-dotfiles).
- **`sys-ssh-keys` e `sys-gpg-keys`:** geram a chave, adicionam no agent, copiam a pública e configuram o git pra assinar commits.
- **`appimage-install`:** pega um AppImage, guarda em `~/.local/opt`, cria o link no PATH e o atalho no lançador de apps.
- **`webapp-install`, `webapp-launch`, `webapp-remove`:** transformam um site num "app" com janela própria e ícone no lançador (o Chromium em modo app por baixo).

## Um desktop que reage sozinho

Esses rodam desde o login e vigiam alguma coisa:

- **`niri-mic-dnd`:** microfone em uso liga o "Não perturbe" e impede a tela de apagar. Acabou a call, volta tudo.
- **`niri-dnd-screenshare`:** mesma coisa quando a tela está sendo compartilhada ou gravada, pra nenhuma notificação aparecer no meio da apresentação.
- **`niri-dnd-retroarch`:** "Não perturbe" enquanto o emulador está em foco.
- **`niri-keepawake-tasks`:** segura a tela acordada enquanto uma tarefa longa roda.
- **`niri-power-autoprofile`:** na tomada, perfil de performance; na bateria, economia.
- **`niri-hdmi-automode`:** a TV e o monitor ultrawide dividem o mesmo cabo HDMI, e o script aplica a resolução certa conforme o aparelho que respondeu.
- **`nocta-hold`:** o juiz dos scripts acima. Quando dois pedem o "Não perturbe" ao mesmo tempo, o primeiro a terminar não pode desligar o que o outro ainda precisa, então ele conta quantos pedidos estão ativos (e não mexe num "Não perturbe" que eu liguei na mão).

## Janelas e atalhos

- **`niri-scratchpad`:** um atalho mostra e esconde Spotify, WhatsApp, Discord e companhia, mesmo o Niri não tendo minimizar. Virou o post [scratchpad no Niri](/scratchpad-no-niri-janelas-que-somem-com-um-atalho).
- **`niri-workspace-wrap`:** chegou no último workspace, o próximo é o primeiro.
- **`niri-browser-focus`:** abre o link no Chrome e puxa a janela pro foco (link de login que abria escondido atrás de tudo).
- **`gsr-toggle`:** um atalho começa e para a gravação de tela.

## Áudio

- **`audio-jack-autoswitch`:** plugou o fone no P2, perfil de fone; tirou, alto-falante. O [PipeWire](https://pipewire.org) não fazia isso sozinho nesse notebook, e a caçada virou [o fone mudo e o jack P2](/o-fone-mudo-e-o-jack-p2-no-pipewire).
- **`bt-audio`:** joga a saída e o microfone pro fone Bluetooth conectado, ignorando mouse e teclado que também são Bluetooth.

## Modos de uso

- **`game-mode`:** congela os apps de trabalho pra liberar CPU e memória pro jogo, sem fechar nada. Quando eu volto, está tudo onde eu deixei: [game mode com o freezer do cgroup](/game-mode-congelando-o-trabalho-com-o-cgroup-freezer).
- **`focus-mode`:** o irmão do `game-mode` ao contrário. Congela só uma lista curta de distrações (Steam, Telegram), liga o "Não perturbe" e deixa a música tocando.

## Backup e faxina

- **`sys-btrfs-backup`:** todo dia, um snapshot do sistema vai incremental pro meu [homelab](/meu-homelab-num-mac-mini-de-2018) pelo [Tailscale](https://tailscale.com).
- **`hd-backup`:** compacta uma pasta e manda pra outro disco ou outra máquina por SSH, com uma barra de progresso pra compressão e outra pra cópia. Fiz pra tirar dados de um HD antes de formatar.
- **`sys-clean-cache`:** limpa cache de gerenciador de pacotes, miniaturas, navegador, ferramentas de build, logs do journald e do pacman.
- **`clean-screenshots`:** apaga screenshots com mais de uma semana.
- **`clean-claude-sessions`:** apaga sessões antigas do Claude Code do projeto atual (ou de todos), mostrando a lista e pedindo confirmação antes.
- **`podman-shutdown`:** para os containers com calma antes de desligar a máquina, em vez de deixar o desligamento matar tudo.

## Pequenos utilitários

- **`downloads`:** recebe um `.txt` com uma URL por linha e baixa tudo em paralelo (com o `aria2c`), com uma barra de progresso por arquivo.
- **`utils-password`:** gera uma senha aleatória e já copia pro clipboard.
- **`utils-tempo`:** a previsão do tempo no terminal, via [wttr.in](https://wttr.in).

## Homelab e jogo

- **`rdo-solo`:** controla do notebook o filtro que deixa o Red Dead Online numa sessão só minha, rodando no gateway do homelab. Tem atalho de teclado e widget na barra. Contei em [Red Dead Online sozinho pelo gateway](/rdo-solo-red-dead-online-sozinho-pelo-gateway).

## Por onde começar o seu

Não comece pelo script mais legal da lista. Comece pelo mais chato da sua semana. Os meus primeiros instalavam o básico de uma máquina nova (git, curl, PHP), e o de Gitflow era só a sequência de comandos que eu já digitava, colada num arquivo. Os que reagem sozinhos vieram anos depois. Quando um script já funciona no terminal, a pergunta seguinte é se ele pode rodar sem você: num atalho, no login, num timer.

`exit 0`
