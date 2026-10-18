---
slug: game-mode-congelando-o-trabalho-com-o-cgroup-freezer
title: "game-mode: congelo o trabalho para jogar, sem fechar nenhuma janela"
summary: "Um atalho no Niri congela o Chrome, o Slack e os terminais com o freezer do cgroup v2, apaga os monitores que sobram e liga o não perturbe. A Steam e a música continuam. Chegar nisso custou uma Steam pintada de preto e um modo jogo que nem o próprio comando desligava."
date: "2026-10-17"
publishedAt: "2026-10-17T20:07:22-03:00"
markers:
  - linux
  - shell
  - niri
art: windows
extras:
  - "Script de 309 linhas com o freezer do cgroup v2"
  - "Niri · Noctalia · PipeWire"
keyPoints:
  - "Congela scope por scope em app.slice, não o slice inteiro, para o próprio atalho de saída não nascer congelado."
  - "Steam, emuladores, o Noctalia e quem está tocando som no PipeWire ficam de fora do congelamento."
  - "Abrir um app com o app.slice congelado pinta a janela de preto; por isso o script só congela e nunca abre o jogo."
snapshot:
  items:
    - label: "OS"
      value: "CachyOS"
    - label: "Compositor"
      value: "Niri"
    - label: "Shell"
      value: "Noctalia"
    - label: "Freezer"
      value: "cgroup v2"
    - label: "Script"
      value: "309 linhas"
---

Quando eu aperto `Mod+Alt+G`, o Chrome, o Slack, os terminais e o resto do meu dia de trabalho param de usar CPU, mas continuam abertos exatamente onde estavam. Os monitores que eu não estou olhando apagam, o Noctalia liga o não perturbe e segura a tela acordada. A Steam, o RetroArch e a música seguem rodando. Aperto de novo e tudo volta, inclusive as abas.

Se você joga no mesmo computador em que trabalha, conhece a escolha ruim: fechar tudo e reabrir depois, ou jogar com o trabalho comendo CPU no fundo. Isso é o `game-mode`, um script de 309 linhas no meu `~/.dotfiles`, que escapa das duas com o cgroup, o jeito do kernel agrupar processos e controlar o que cada grupo usa (a [documentação do kernel](https://docs.kernel.org/admin-guide/cgroup-v2.html) conta o resto). Vou mostrar como ele está configurado, por que cada lista tem o que tem, e as duas versões que eu joguei fora antes de chegar no toggle. Foram elas que me convenceram de que um modo jogo não deveria abrir o jogo: ele só congela o resto.

## Congelar em vez de fechar

O freezer do cgroup v2 para todos os processos de um grupo de uma vez: CPU vai a zero, as páginas frias podem ir pro zram e as janelas ficam onde estão. Pro compositor, a janela congelada continua existindo. Pra mim, é o trabalho em pausa sem precisar reabrir nada depois.

O systemd já separa a sessão do jeito certo. No meu CachyOS com Niri, o compositor e o áudio (`niri`, `pipewire`, `wireplumber`) moram em `session.slice`, que eu nunca toco. Os apps gráficos moram em `app.slice`, cada um num scope próprio. Esse é o alvo.

O caminho óbvio não funciona:

```bash
$ systemctl --user freeze app.slice
Unit does not support freeze/thaw
```

O `app.slice` do gerenciador de usuário responde `CanFreeze=no`, ao contrário do `session.slice`, do `background.slice` e dos scopes individuais. O kernel, por outro lado, não liga pra isso. O arquivo `cgroup.freeze` fica na subárvore delegada ao meu usuário, então dá pra escrever direto, sem `sudo`:

```bash
readonly APP_CG="/sys/fs/cgroup/user.slice/user-${_uid}.slice/user@${_uid}.service/app.slice"

freeze_work_scopes() {
    local self d playing
    self="$(my_scope)"
    playing=" $(media_pids | tr '\n' ' ')"
    for d in "$APP_CG"/*.scope; do
        [[ -d "$d" ]] || continue
        [[ "${d##*/}" == "$self" ]] && continue
        scope_is_kept "$d" "$playing" && continue
        echo 1 >"$d/cgroup.freeze" 2>/dev/null || true
    done
}
```

**O detalhe que faz o toggle funcionar é congelar scope por scope, e não o `app.slice` inteiro.** Qualquer coisa que nasce depois (o atalho pra desligar, um terminal novo, um hook do Noctalia) cai num scope novo, que herda o estado do pai, e o pai não está congelado. Se eu congelasse o slice, o próprio atalho de saída nasceria congelado. A linha do `my_scope` existe pelo mesmo motivo: o script roda dentro de `app.slice` e não pode se congelar junto.

## O que fica de fora do congelamento

A parte que eu mais mexi foram as listas de quem continua vivo. A primeira é por nome de processo:

```bash
readonly KEEP_COMMS_RE='^(steam|steamwebhelper|reaper|retroarch|gamescope|qs|pcsx2-qt|heroic|lutris)$'
```

O `qs` é o Noctalia. Se ele congela, o IPC morre e eu perco o controle do não perturbe. O nome vem de `/proc/<pid>/comm`, que o kernel corta em 15 caracteres, por isso o binário do PCSX2 aparece como `pcsx2-qt`.

Os apps em Flatpak não dão pra pegar pelo nome: vários rodam atrás de um `run.sh` genérico. Pra eles a lista é pelo app-id, que aparece no nome do diretório do scope:

```bash
readonly KEEP_SCOPES_RE='flatpak-(io\.github\.unknownskl\.greenlight|net\.studio08\.xbplay|app\.xemu\.xemu)'
```

Greenlight e XBPlay são clientes de streaming do Xbox, o xemu é o emulador do Xbox original. Essa lista entrou oito dias depois da primeira versão, junto com PCSX2, Heroic e Lutris na lista por nome.

A música deu mais trabalho. Uma lista fixa de players (`spotify`, `mpv`, `vlc` e companhia) resolve quem toca música de propósito. Só que música tocando numa aba do navegador ou num PWA não dá pra manter pelo nome sem manter o navegador inteiro. Então o script pergunta ao PipeWire quem está produzindo som agora, com `pw-dump` e `jq`, e mantém o scope dono daquele stream.

A armadilha foi descobrir quem é o dono. O nó de áudio traz `application.process.id` pra clientes que passam pela camada do PulseAudio (navegador, Spotify, RetroArch), mas esse campo vem `null` pra cliente nativo do PipeWire. Meu primeiro filtro olhava só o nó, e um `pw-cat` de teste, com o stream em `running`, saiu como "nada tocando". A correção é cair pro objeto Client do PipeWire e ler `pipewire.sec.pid`, o PID que o kernel confirma na conexão. E esse PID também engana: pra cliente do PulseAudio ele é o PID do daemon `pipewire-pulse`, não o do app. A ordem que funciona ficou assim: nó, depois o `application.process.id` do client, e só no fim o `pipewire.sec.pid`.

Ah, e o JSON é lido com `jq`, nunca com `python3`. Num processo disparado pelo Niri ou por um hook do Noctalia, o `python3` que aparece primeiro no `PATH` é um shim do mise que pode travar esperando confiança na config, e o script para no meio sem erro nenhum.

## Como eu ligo e desligo

São três entradas pro mesmo comando:

```kdl
Mod+Alt+G hotkey-overlay-title="Game mode (freeze work apps)" { spawn-sh "~/.dotfiles/bin/utils/game-mode toggle"; }
```

A segunda é o modo Desempenho do Noctalia: os hooks `performanceModeEnabled` e `performanceModeDisabled` chamam `game-mode on` e `game-mode off`, então ligar o modo de desempenho na barra também congela o trabalho. A terceira é a saída de emergência: se tudo der errado, um TTY (`Ctrl+Alt+F2`) vive fora de `app.slice`, e `game-mode off` de lá escreve `0` em cada `cgroup.freeze` sem depender do compositor. Num TTY não existe `NIRI_SOCKET`, então o script procura o socket em `$XDG_RUNTIME_DIR/niri.*.sock` pra conseguir religar os monitores.

O não perturbe e a tela acordada não são ligados direto. Eles passam pelo `nocta-hold`, um contador de referência por arquivo de marcação com `flock`: cada script pede uma "posse" com o próprio nome, o recurso liga quando a contagem vai de 0 para 1 e desliga quando volta a 0. Sem isso, o `game-mode` desligava o não perturbe que outro script (o que silencia notificação enquanto compartilho a tela, por exemplo) ainda queria ligado. E um não perturbe que eu liguei na mão antes da primeira posse é lembrado e nunca desligado pela última.

O `game-mode` tem um irmão pro trabalho, o `focus-mode` (`Mod+Alt+F`), que faz o contrário: congela só uma lista negra de distração e deixa o resto vivo. Em 12 de outubro eu tirei o Discord dessa lista, porque ele precisa ficar utilizável enquanto trabalho. Hoje a regex tem Steam, Telegram e dois clientes alternativos do Discord, o vesktop e o WebCord.

## A Steam pintada de preto

A versão do `game-mode` que eu uso hoje já nasceu como um toggle que não abre nada, e saiu numa tarde, em algumas horas com o Claude Code. Antes dela houve duas que abriam o jogo, e nenhuma chegou ao repositório.

A primeira era o script abrir o jogo. `game-mode on` lançaria a Steam no modo Big Picture e congelaria o resto. A Big Picture abriu com a tela inteira preta e um cursor gigante, de uns 60 pixels. O log da Steam entregava uma parte: `desktop: { size: 5176,1920 }`, a caixa que soma todos os meus monitores. Ela se posicionava fora da tela visível. Tentei isolar no `gamescope`, que resolve exatamente isso, e ele travou logo depois de `scriptmgr: Loading scripts`, sem nunca chegar no Vulkan. Apaguei os monitores extras antes de abrir: o cursor voltou ao normal, a janela continuou preta. Troquei a Big Picture pelo cliente comum da Steam: preto também.

O diagnóstico de multi-monitor estava errado. A mesma Steam, aberta pelo launcher do Noctalia, renderizava perfeita. **A diferença era abrir o app enquanto o `app.slice` já estava congelado: um app não consegue subir o contexto de GPU no meio do congelamento, e pinta preto.** A ordem certa seria abrir o jogo antes, esperar a janela aparecer no Niri e só então congelar.

Essa foi a segunda ideia, e ela trouxe dois travamentos que nem o `game-mode off` resolvia. O primeiro: pra saber quando o jogo terminava, o script fazia `pgrep -x steam`. Só que a Steam de trabalho, congelada no `app.slice`, continua existindo como processo. O `pgrep` achava ela, o loop esperava pra sempre e nada descongelava. O segundo: o `game-mode off` parava a unidade com `systemctl --user stop`, que manda SIGTERM, e um `trap ... EXIT` do bash não roda no SIGTERM se você não fizer `trap` do sinal também. O processo morria, o trabalho ficava congelado e os monitores apagados.

Consertei os dois (contar processos só dentro do `game.slice` e `trap 'exit 143' TERM` junto do `EXIT`) e mesmo assim desisti de lançar qualquer coisa. Eu abro a Steam, a Steam abre o RetroArch, e o `game-mode` só congela. Por isso o `game-mode on` começa conferindo se a Steam está aberta e, se não estiver, avisa e não faz nada.

## O que ainda me incomoda

O `game-mode` e o `focus-mode` não podem rodar juntos. Os dois mexem nos mesmos scopes e brigariam por eles; hoje isso é um aviso no cabeçalho do script, não uma trava.

Áudio de aba de navegador só é protegido se estiver tocando no momento em que eu ligo o modo. Se eu pausei a música do PWA antes, ela congela junto e só volta quando eu desligo.

Não há teste automatizado pro congelamento de verdade. O Claude Code, que me ajuda a escrever esses scripts, roda no Ghostty, dentro de `app.slice`, então testar o freeze real ali congelaria a própria sessão. O que eu conferi foi o congelamento num scope real, olhando `cgroup.events` ir de `frozen 0` para `frozen 1` e voltar.

E tem um freezer que não é o meu. O systemd congela as sessões de usuário ao suspender, e uma corrida pode deixar um scope pra trás com `cgroup.freeze` em 1. A Steam ficou três dias congelada assim: clicar no ícone não fazia nada, porque o launcher só manda um recado pra instância que já existe e sai com 0. O `systemctl --user show` ainda dizia `running`. Quem fala a verdade é o `cgroup.events`, e o conserto é escrever `0` no `cgroup.freeze` daquele scope.

`echo 0 > cgroup.freeze`
