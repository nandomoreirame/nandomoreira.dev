---
slug: scratchpad-no-niri-janelas-que-somem-com-um-atalho
title: "Scratchpad no Niri: janelas que somem e voltam com um atalho"
summary: "O Niri não sabe minimizar janela. Um script de 199 linhas e um workspace escondido fazem o WhatsApp, o Obsidian e o YouTube aparecerem e sumirem com uma tecla, e o Discord, o Spotify e o LocalSend voltarem para a bandeja."
date: "2026-10-16"
publishedAt: "2026-10-16T13:50:45-03:00"
markers:
  - niri
  - wayland
  - shell
  - linux
art: panels
extras:
  - "7 atalhos, 1 script, 15 testes em BATS"
  - "Niri · Bash · jq"
keyPoints:
  - "O Niri não minimiza janela: um workspace nomeado e escondido faz o papel do scratchpad do i3 e do Sway."
  - "A janela volta no monitor em foco com move-window-to-monitor, e não num índice de workspace, que se repete por monitor."
  - "Apps com bandeja fecham para ela; o resto vai para o scratch, e quem decide é uma linha no preset."
snapshot:
  items:
    - label: OS
      value: CachyOS
    - label: Compositor
      value: Niri
    - label: Testes
      value: 15 testes em BATS
    - label: Consulta
      value: niri msg --json
    - label: Filtro
      value: jq
---

Eu aperto `Mod+Shift+A` e o WhatsApp aparece flutuando, centralizado no monitor em que eu estou. Aperto de novo e ele some, e o foco volta para o terminal de onde eu saí. São sete atalhos assim no meu Niri: YouTube no `Y`, YouTube Music no `U`, WhatsApp no `A`, Obsidian no `O`, Discord no `D`, Spotify no `S` e LocalSend no `L`, todos com `Mod+Shift`.

Procurar "como minimizar janela no Niri" não leva a lugar nenhum, porque o Niri não tem minimizar nem esconder. Ele organiza tudo em colunas roláveis, e uma janela existe numa coluna de algum workspace ou não existe. O que eu fiz foi emular um scratchpad (a área de rascunho do i3 e do Sway): um workspace que eu nunca visito, e um script que leva a janela para lá e traz de volta.

## Um workspace que ninguém visita

O esconderijo é um workspace nomeado, declarado no `config.kdl`:

```kdl title="config.kdl"
workspace "scratch" {
    open-on-output "eDP-1"
}
```

Ele fica preso ao painel do notebook, para nunca ficar órfão quando eu desligo os monitores externos e para não entrar na navegação de workspaces do monitor principal. E precisa estar declarado: **mandar uma janela para um workspace nomeado que não existe no config é uma operação que não faz nada e não reclama de nada.** O comentário em cima do bloco está lá para eu não descobrir isso de novo.

A outra metade é a regra de janela. Cada app do scratchpad abre flutuando (`open-floating true`), então quando ele aparece fica por cima das colunas, sem empurrar o layout para o lado.

## Achar a janela certa pelo app-id

Tudo começa em descobrir se a janela já existe. O script pergunta ao Niri (`niri msg --json windows`) e filtra pelo app-id com `jq`. Cada app é um preset com um regex e um comando de lançamento, e os regex são todos ancorados:

| Preset | app-id | Por quê |
|---|---|---|
| `discord`, `localsend`, `obsidian` | `^discord$`, `^localsend$`, `^obsidian$` | Nome exato, nada parecido entra |
| `spotify` | `(?i)^spotify$` | O flatpak chama a janela de `spotify`, o pacote nativo de `Spotify` |
| `youtube`, `youtube-music`, `whatsapp` | `^chrome-<host>__-` | O sufixo do perfil do Chrome muda (`Default`, `Profile_1`), então casa só o host |

A âncora tem motivo: sem ela, uma janela qualquer com `discord` no meio do app-id seria escondida no lugar de abrir o Discord. Tem teste para isso, com uma janela falsa chamada `discord-overlay-helper`: o toggle não pode mexer nela e precisa lançar o app.

O WhatsApp me ensinou a parte do Chrome. O script nasceu em 2 de junho, um dia depois de eu instalar o CachyOS, e nesse primeiro dia o WhatsApp era uma PWA instalada, e o app-id de uma PWA instalada é um hash (`chrome-<id-da-extensão>-Default`). Funcionava, mas amarrava o atalho ao `chrome://apps`: se eu removesse a PWA de lá, o atalho morria. Na tarde do dia seguinte troquei por `google-chrome-stable --app=https://web.whatsapp.com`, o mesmo formato do YouTube e do YouTube Music, e o app-id passou a ser derivado do endereço.

## Mostrar no monitor certo, esconder sem roubar o foco

A lógica inteira do toggle cabe numa função:

```bash
scratchpad_toggle() {
  local wid
  wid="$(scratchpad_window_id)"
  if [[ -z "$wid" ]]; then
    scratchpad_launch
    return 0
  fi
  if [[ "$HIDE" == tray ]]; then
    niri msg action close-window --id "$wid"
    return 0
  fi
  if scratchpad_in_scratch "$wid"; then
    scratchpad_show "$wid"
  else
    scratchpad_hide "$wid"
  fi
}
```

Sem janela, ele lança o app com `setsid`, desacoplado, para o processo sobreviver ao fim do script. No Obsidian isso importa: se eu chamar `obsidian` com ele já aberto, aparece a janela de escolher cofre. Por isso o script só lança quando não acha janela nenhuma.

Para mostrar, eu movo a janela para o **monitor** em foco, e não para um índice de workspace. Os índices do Niri se repetem por monitor, e ele resolvia o índice a partir do monitor onde a janela estava (o do scratch). O resultado era a janela reaparecendo sempre na mesma tela, não importava onde eu estivesse olhando. Com `move-window-to-monitor` ela vem para onde eu estou; depois o script foca e centraliza.

Para esconder, `move-window-to-workspace --focus false scratch`. Só que, se a janela escondida era a única do workspace e estava com o foco, o Niri não tem onde deixar o foco e vai junto com ela para o scratch. O script confere o workspace em foco depois de mover e, se caiu no scratch, volta com `focus-workspace-previous`.

Tem ainda o modo `start`, que lança o app já escondido, para o login: o app fica aberto, só que fora de vista. Hoje o meu login sobe só a Steam e o 1Password, então a linha do WhatsApp está comentada no config, pronta para voltar.

## Alguns apps não precisam de esconderijo

Discord, Spotify e LocalSend fecham para a bandeja do sistema. Mesmo assim, o script mandava o Discord e o Spotify para o scratch, como qualquer outro app. Hoje eu pedi o contrário, com essas palavras: "eu quero que feche ele para a gaveta de apps e não mande para a workspace oculta".

Virou uma linha por preset, `HIDE=tray`, e o desvio no toggle que aparece ali em cima: em vez de mover, `niri msg action close-window --id`. O processo continua vivo na bandeja. Na próxima vez que eu aperto a tecla, não há janela, então o script cai no ramo de lançar e roda o comando de novo. Como os três são de instância única, o comando não cria um processo novo: a instância que está na bandeja reabre a janela. Conferi ao vivo, com o mesmo PID antes e depois do toggle no Discord e no Spotify, e o LocalSend reabriu no mesmo PID depois de fechar.

O LocalSend tem uma história própria. Ele sobe no login com `--hidden`, então depois do reboot fica só na bandeja, sem janela, e o atalho precisa saber abrir a partir daí. Ele também tinha sumido da máquina na migração do Omarchy para o CachyOS, porque nunca esteve nas listas de pacotes do dotfiles (agora está, e a porta dele foi liberada no firewall). O `Mod+Shift+L` voltou hoje.

WhatsApp, YouTube, YouTube Music e Obsidian continuam no scratch.

## Testar um script que conversa com o compositor

Um script que só faz sentido com o Niri rodando é chato de testar, e eu escrevi os testes antes da mudança de hoje. São 15 testes em BATS, e o truque é não deixar o Niri real chegar perto. Dois stubs vão no `PATH`: um `niri` falso responde às consultas `--json` com o JSON que cada teste define e anota toda chamada de `msg action` num log, e um `setsid` falso anota o comando em vez de abrir o app. O teste então confere o log:

```bash
@test "discord toggle closes a visible window back to the tray, never into scratch" {
    FAKE_WINDOWS='[{"id":7,"app_id":"discord","workspace_id":2}]' \
    FAKE_WORKSPACES='[{"id":2,"idx":1,"name":null,"is_focused":true}]' \
        run_scratchpad toggle discord

    assert_success
    run grep -F -- "close-window --id 7" "$CALL_LOG"
    assert_success
    run grep -cF -- "move-window-to-workspace" "$CALL_LOG"
    assert_output "0"
}
```

Duas armadilhas moram no helper dos testes. A primeira: na minha máquina o `BASH_ENV` aponta para o `~/.bashrc`, que coloca o `PATH` original de volta na frente, e o bash filho acharia o `niri` de verdade antes do stub. Por isso o script roda com `env -i` e um `PATH` montado na mão. A segunda: o lançamento vai para o background, então a linha do `setsid` falso pode cair no log depois que o script já terminou. O teste espera por ela em vez de olhar o log na hora.

Também há teste para o caso torto: um Discord que ficou no scratch por causa de um toggle antigo precisa ir para a bandeja com um aperto, e não reaparecer na tela. Com os 15 passando, `shellcheck` e `niri validate` limpos, a mudança entrou.

## O que ficou de fora

O ZapZap abre flutuando, mas não tem toggle. O TickTick teve atalho até 11 de outubro, quando desinstalei o app. E o atalho do Discord era do DroidCam até o fim de agosto.

A regra que ficou: app que tem bandeja fecha para a bandeja, o resto vai para o scratch, e quem decide é uma linha no preset.

`focus-workspace-previous`
