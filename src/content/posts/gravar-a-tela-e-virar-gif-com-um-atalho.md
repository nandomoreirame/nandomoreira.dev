---
slug: gravar-a-tela-e-virar-gif-com-um-atalho
title: "Gravar a tela e virar GIF com um atalho, com contador na barra"
seoTitle: "Gravar a tela e virar GIF com um atalho no Niri"
summary: "Eu já gravava a tela com Ctrl+Alt+1 e queria GIF. Saíram dois atalhos novos, um script de ffmpeg com paleta própria e um plugin do Noctalia que mostra REC e o tempo de gravação na barra."
date: "2026-10-28"
markers:
  - linux
  - niri
  - noctalia
  - shell
extras:
  - "Ctrl+Alt+5 grava GIF; Ctrl+Alt+6 converte o último vídeo"
  - "gpu-screen-recorder · ffmpeg · Noctalia · Luau"
keyPoints:
  - "O GIF do ffmpeg sem paleta sai com cor lavada; palettegen e paletteuse montam uma paleta tirada do próprio vídeo."
  - "O script grava uma linha num arquivo e a barra só lê esse arquivo uma vez por segundo, sem rodar processo nenhum."
  - "Com o seletor de tela abrindo toda vez, o contador começa no atalho e sai alguns segundos maior que o vídeo."
snapshot:
  items:
    - label: "Gravador"
      value: "gpu-screen-recorder"
    - label: "Conversão"
      value: "ffmpeg (palettegen)"
    - label: "GIF padrão"
      value: "15 fps · 960 px"
    - label: "Compositor"
      value: "Niri"
    - label: "Barra"
      value: "Noctalia v5 · recbar"
draft: true
---

Desde junho eu gravo a tela com `Ctrl+Alt+1`: aperto uma vez, escolho o que gravar, aperto de novo e o `.mp4` está salvo. Em 27 de outubro eu quis um trecho em GIF e perguntei ao Claude Code, do jeito que me veio na cabeça: "eu tenho um atalho que inicia a gravação da tela, mas existe alguma maneira dessa gravação feita virar um gif?". No mesmo dia eu tinha mais dois atalhos e um plugin novo na barra.

Dá pra resolver isso instalando mais um gravador que já sai em GIF. Eu não quis trocar o que funcionava: **prefiro um script meu e um arquivo de estado de uma linha a trocar de gravador só pra ganhar um recurso.** Se você usa Wayland com um compositor que não é GNOME nem KDE, provavelmente já montou o seu gravador na mão também, e o caminho abaixo encaixa nele.

## O atalho que já existia

O `gsr-toggle` é um script que liga e desliga o [gpu-screen-recorder](https://git.dec05eba.com/gpu-screen-recorder/about/), um gravador que codifica o vídeo na GPU. No [Niri](https://github.com/YaLTeR/niri) ele não consegue capturar a tela direto, então pede pelo [portal do xdg-desktop-portal](https://flatpak.github.io/xdg-desktop-portal/), aquela janela que pergunta se você quer gravar a tela inteira, uma janela ou uma área.

A lógica é um toggle com arquivo de PID: se tem uma gravação rodando, manda `SIGINT` (pra ele fechar o `.mp4` direitinho) e avisa onde salvou; se não tem, começa uma.

```bash
setsid gpu-screen-recorder \
  -w portal \
  -restore-portal-session no \
  -f "$fps" \
  "${audio_args[@]}" \
  -cursor yes \
  -o "$out_file" >>"$log_file" 2>&1 &

echo $! >"$pid_file"
```

O vídeo cai em `Recordings`, dentro da pasta de vídeos do `xdg-user-dir` (no meu caso `~/Vídeos`, com acento), com nome `recording_<data>_<hora>.mp4`.

## Dois atalhos novos

Na primeira resposta vieram as opções: o ffmpeg puro, o [gifski](https://gif.ski) e o Kooha (um app gráfico que já grava em GIF). Fiquei no ffmpeg, que já estava instalado, e pedi dois atalhos:

```kdl
Ctrl+Alt+1 hotkey-overlay-title="Record video (start/stop)" { spawn-sh "~/.dotfiles/bin/utils/gsr-toggle"; }
Ctrl+Alt+5 hotkey-overlay-title="Record GIF (start/stop)" { spawn-sh "~/.dotfiles/bin/utils/gsr-toggle --gif"; }
Ctrl+Alt+6 hotkey-overlay-title="Convert last video to GIF" { spawn-sh "~/.dotfiles/bin/utils/video-to-gif"; }
```

O `Ctrl+Alt+5` grava sem áudio, a 30 fps, num arquivo `gif_<data>.mp4`. Quando eu aperto de novo, ele para, entrega o vídeo pro conversor e apaga o `.mp4` temporário: sobra só o `.gif`. O `Ctrl+Alt+6` é pra quando eu gravei um vídeo normal e só depois decidi que queria GIF: ele pega o `recording_*.mp4` mais recente e converte.

Qualquer um dos dois atalhos para qualquer gravação. O script guarda qual arquivo está gravando, então não importa se comecei com o 1 e parei com o 5.

## A paleta é o que salva o GIF

Um `ffmpeg -i in.mp4 out.gif` funciona, mas sai com aquela cor lavada de GIF antigo. GIF só tem 256 cores, e o ffmpeg, sem saber quais, usa uma paleta genérica. O conserto é gerar a paleta a partir do próprio vídeo com o [`palettegen`](https://ffmpeg.org/ffmpeg-filters.html#palettegen) e aplicar com o `paletteuse`, tudo num filtro só:

```bash
ffmpeg -hide_banner -loglevel error -y -i "$input" \
  -vf "fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5" \
  "$output"

wl-copy "$output" 2>/dev/null || true
```

O `split` duplica o vídeo: uma cópia vira paleta, a outra é desenhada com ela. O `stats_mode=diff` monta a paleta olhando o que muda entre os quadros, que numa gravação de tela é o que interessa: o fundo parado gasta pouca cor e a parte que se mexe ganha o resto. No fim o caminho do GIF vai pro clipboard com o `wl-copy`, pronto pra colar onde eu for mandar.

O padrão é 15 fps e 960 px de largura, e dá pra mudar sem editar o script:

```bash
GIF_FPS=10 GIF_WIDTH=720 video-to-gif meu-video.mp4 saida.gif
```

Pra ter uma régua: um vídeo de teste de 2 segundos em 1280x720 virou um GIF de 960x540 com 721 KB. GIF cresce rápido, então pra gravação longa vale baixar o fps ou a largura.

## Mostrar na barra que está gravando

Com o GIF resolvido, veio a segunda pergunta: "como faço pra exibir na barra que está gravando algo? com a contagem dos segundos/minutos?".

O [Noctalia](https://docs.noctalia.dev/) v5, a barra que eu uso no Niri, não tem um widget nativo que rode algo e se atualize sozinho: o botão customizado e o texto são estáticos. O plugin oficial de gravação usa o gravador dele e não mostra o tempo. Então virou um plugin novo, o [recbar](https://github.com/nandomoreirame/noctalia-recbar).

O contrato entre o script e a barra é um arquivo de uma linha. Quando a gravação começa, o `gsr-toggle` escreve em `$XDG_RUNTIME_DIR/gsr-toggle.state`:

```bash
echo "$mode $(date +%s) $out_file" >"$state_file"
```

Ao parar, apaga. O [`widget.luau`](https://github.com/nandomoreirame/noctalia-recbar/blob/main/widget.luau) lê esse arquivo uma vez por segundo com `noctalia.readFile`, sem abrir processo nenhum, e se esconde quando ele não existe:

```lua
local function render()
	local raw = noctalia.readFile(STATE_FILE)
	local m = present.bar(present.parse(raw), nowS())
	-- ...
	barWidget.setTooltip(m.tooltip)
	barWidget.setVisible(m.visible)
end
```

O resto mora no [`lib/present.luau`](https://github.com/nandomoreirame/noctalia-recbar/blob/main/lib/present.luau), que é só função pura: lê o modo e a hora de início, escolhe `REC` ou `GIF` e formata o tempo em `mm:ss`, ou `h:mm:ss` depois de uma hora. Separar assim deixa testar a parte que importa sem o Noctalia rodando. O resultado é uma pílula vermelha com `● REC 01:28` ao lado da bandeja ([o screenshot está no repositório](https://github.com/nandomoreirame/noctalia-recbar/blob/main/screenshot.png)), e clicar nela para a gravação.

Um aviso honesto pra quem for pegar o plugin: o clique roda o `gsr-toggle` pelo caminho do meu dotfiles. O que vale reaproveitar é o formato do arquivo de estado; qualquer script seu que escreva aquela linha ao começar e apague ao terminar acende a pílula. [[PREENCHER: como instalar um plugin de terceiro no Noctalia v5, se quiser dar o passo a passo]]

## O que quebrou no caminho

### O seletor de tela sumiu

Na primeira vez que testei o `Ctrl+Alt+5`, o portal perguntou qual dos meus três monitores gravar. Depois disso, gravava sempre o mesmo, sem perguntar. O atalho novo não tinha culpa: o `gsr-toggle` rodava com `-restore-portal-session yes` desde junho e guardava a escolha num token em `~/.cache`, valendo pro `Ctrl+Alt+1` e pro `Ctrl+Alt+5`. Troquei pra `-restore-portal-session no`, apaguei o token, e agora o seletor de tela, janela ou área abre toda vez.

Essa troca tem um preço. O arquivo de estado nasce quando eu aperto o atalho, e não quando a captura começa, então os segundos que eu passo escolhendo a tela entram na conta e o contador da barra sai maior que o vídeo. Dá pra fazer o contador esperar a captura começar de verdade; ainda não mexi nisso.

### A pasta vazia derrubava o script

Pra achar a gravação mais recente, o script pega o último item da lista de `recording_*.mp4` (o nome tem data e hora, então a ordem alfabética é a cronológica). A versão de junho fazia `${files[-1]:-$out_dir}`, e com o array vazio o bash não usa o valor padrão: estoura com "bad array subscript", e o script morre antes de mostrar qualquer notificação. A correção conta antes de indexar, nos dois scripts:

```bash
shopt -s nullglob
files=("${videos_dir}/Recordings"/recording_*.mp4)
input=""
((${#files[@]})) && input="${files[-1]}"
```

### O plugin não apareceu na barra

O código estava certo e os testes passavam. Nada na barra. Os ajustes que a interface do Noctalia salva sozinha substituem por inteiro a lista de plugins habilitados e a ordem dos widgets da barra, então editar só os arquivos do dotfiles não bastava. Habilitei o plugin pelo comando do próprio Noctalia, pus o `recbar` nesses ajustes também, e hoje a configuração da barra está toda versionada no dotfiles, com o `recbar` no lado direito.

### O teste que nunca falhava

Os testes do `gsr-toggle` em bats tinham asserções do tipo `! grep ...` no meio do teste, pra garantir que algo não acontecia. No bats, essa linha nunca reprova o teste. Quando corrigi, uma delas passou a falhar na hora: ela procurava o `-a` (de áudio) no log inteiro e casava com o `-a` do `notify-send`. O script estava certo; a asserção ficou restrita à linha do gravador.

## Onde parou

Ficou assim: `Ctrl+Alt+1` grava vídeo com som, `Ctrl+Alt+5` grava direto em GIF, `Ctrl+Alt+6` transforma o último vídeo em GIF. A barra mostra o que está gravando e há quanto tempo.

O gravador é o mesmo de junho. O que mudou foram um script de 44 linhas, uma linha de estado num arquivo e um plugin que só sabe ler essa linha. Tem [mais scripts como esse](/scripts-que-automatizam-meu-linux) rodando aqui, e o recbar está no GitHub pra quem quiser pegar de onde eu parei.

`kill -SIGINT "$pid"`
