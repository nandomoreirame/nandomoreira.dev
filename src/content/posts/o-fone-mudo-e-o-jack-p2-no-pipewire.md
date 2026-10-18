---
slug: o-fone-mudo-e-o-jack-p2-no-pipewire
title: "O fone mudo por 78 dias: um script que segue o jack P2 no PipeWire"
summary: "No meu notebook, fone e alto-falante moram em perfis diferentes da placa de som, e o WirePlumber nunca troca sozinho. O conserto de março era justamente o que travava o fone. Hoje um vigia de 164 linhas escuta o conector e decide o perfil por mim."
date: "2026-10-09"
publishedAt: "2026-10-09T09:00:00-03:00"
markers:
  - linux
  - pipewire
  - shell
art: wave
extras:
  - "78 dias de fone mudo, 164 linhas de vigia"
  - "PipeWire · WirePlumber · bats"
keyPoints:
  - "Fone e alto-falante ficam em perfis diferentes da placa, e o WirePlumber não troca de perfil quando o jack muda."
  - "Escolher o perfil na mão grava a escolha, e o WirePlumber para de trocar sozinho: foi isso que deixou o fone mudo."
  - "O vigia escuta o alsactl monitor, compara o jack com o perfil ativo e só troca quando os dois divergem."
snapshot:
  items:
    - label: "Notebook"
      value: "Dell Latitude 3450"
    - label: "Codec"
      value: "Realtek ALC3204"
    - label: "Áudio"
      value: "PipeWire"
    - label: "Compositor"
      value: "Niri"
    - label: "Testes"
      value: "bats"
---

O fone de ouvido do meu notebook ficou sem som de 3 de junho a 20 de agosto de 2026. Foram 78 dias com a entrada P2 de um Dell Latitude 3450 sem saída nenhuma, e o comando que travou tudo era o mesmo que eu tinha guardado num script, em março, pra consertar o áudio.

A pergunta que eu fazia em março era como forçar o alto-falante a tocar. A pergunta certa era outra: quem escolhe o perfil da placa de som (o conjunto de saídas e entradas que ela liga ao mesmo tempo), e em que momento. Se o fone do seu notebook Linux também fica mudo sem motivo aparente, é por essa pergunta que vale começar. Pra mim, quem decide é o estado do conector, e não o [WirePlumber](https://pipewire.pages.freedesktop.org/wireplumber/). A resposta virou o `audio-jack-autoswitch`, um script de 164 linhas que sobe junto com o [Niri](https://github.com/YaLTeR/niri) e troca o perfil quando eu ligo ou tiro o fone.

## Fone e alto-falante não cabem no mesmo perfil

O esperado seria fone e alto-falante serem duas portas da mesma saída de som, e ligar o fone só trocar a porta. Neste notebook, não. O UCM do `sof-hda-dsp` (Realtek ALC3204, Raptor Lake), o arquivo que descreve ao ALSA o que a placa sabe fazer, declara Speaker e Headphones como conflitantes, porque os dois dividem o mesmo DAC do codec. O [PipeWire](https://pipewire.org) então expõe os dois em perfis separados da placa:

```text
HiFi (HDMI1, HDMI2, HDMI3, Headphones, Headset, Mic1)
HiFi (HDMI1, HDMI2, HDMI3, Headset, Mic1, Speaker)
```

O segundo problema é que os quatro perfis HiFi sempre respondem `available: yes`. A disponibilidade de verdade fica nas portas, não nos perfis. O WirePlumber olha a prioridade, escolhe o perfil com Headphones (10400, contra 10300 do Speaker) e não reavalia nada quando o conector muda de estado. Ou o fone nunca toca, ou o alto-falante fica sem saída nenhuma.

## O conserto de março travava o fone

Em março eu escrevi o `fix-audio-speaker`: troca a placa pro perfil com Speaker, acha o id da saída pelo `wpctl status`, define como padrão e põe o volume em 80%.

O problema estava no efeito colateral: `pactl set-card-profile` grava a escolha em `~/.local/state/wireplumber/default-profile`. **Depois que o perfil é escolhido na mão, o WirePlumber respeita essa escolha e para de trocar sozinho.** Com o perfil do Speaker fixado, a entrada P2 ficava sem saída, sem som e sem microfone. Tanto o script quanto o painel de som do desktop fazem essa gravação, e foi nesse estado que o notebook ficou de 3 de junho a 20 de agosto.

O `fix-audio-speaker` continua no `~/.dotfiles`, mas com um aviso no topo: rodar ele é a decisão deliberada de forçar o alto-falante agora, não um conserto.

## Um vigia no lugar do botão

O script novo escuta o conector em vez de esperar que eu lembre de apertar alguma coisa. Ele lê os eventos da placa pelo `alsactl monitor`, sem polling, e a cada evento compara o estado do jack com o perfil ativo:

```bash
sync_once() {
    local desired current

    jack_is_plugged
    case $? in
        0) desired="$PROFILE_PLUGGED" ;;
        1) desired="$PROFILE_UNPLUGGED" ;;
        *) return 0 ;;   # jack ilegível: registra e não mexe em nada (trecho resumido)
    esac

    current="$(active_profile)"
    [ -z "$current" ] && return 0            # placa ainda não chegou no PipeWire
    [ "$current" = "$desired" ] && return 0  # idempotente

    pactl set-card-profile "$PW_CARD" "$desired"
}
```

Um único plug dispara vários eventos, inclusive os que a própria troca de perfil gera, e o `set-card-profile` só roda quando o perfil ativo diverge do desejado. Sem isso, cada troca provocaria outra.

O monitor roda num `coproc`, não num pipe, pro `read` poder ter timeout. Esse timeout é um heartbeat de 30 segundos. Ele existe porque um restart do WirePlumber (ou o próprio boot) escolhe o perfil de novo pela prioridade, sem evento nenhum do jack, e o alto-falante ficaria mudo até o próximo plug. O `coproc` também deixa perceber quando o monitor morre: o script espera 5 segundos e sobe outro.

No Niri, ele entra como qualquer outro serviço da sessão:

```kdl
spawn-at-startup "sh" "-c" "~/.dotfiles/bin/utils/audio-jack-autoswitch"
```

## Os detalhes que fazem o script mentir se você errar

A placa é chamada pelo nome, `sofhdadsp`, nunca pelo índice. Basta ligar um adaptador de áudio USB pra ele pegar o índice 0 e empurrar a placa interna pro 1.

O controle do jack é consultado com `iface=CARD`. O `amixer cget` usa `iface=MIXER` por padrão, onde os controles de jack não existem, e responde `Cannot find the given element`. É fácil engolir essa resposta como "nada conectado". Por isso a função que lê o jack devolve 0 para conectado, 1 para desconectado e 2 para "não sei", e o vigia registra o "não sei" uma vez por transição em vez de agir em cima dele. Na mesma função, o teste procura `values=on`, porque a linha de tipo do `amixer` também carrega um `values=1`.

E só pode haver um vigia rodando. Um segundo, iniciado na mão por cima do da sessão, brigaria com o primeiro pelo perfil. A trava é um `flock` num arquivo em `$XDG_RUNTIME_DIR`, e não um `pgrep -f`, que dentro de um script encontra a si mesmo e diz que já tem outro rodando.

Os oito testes em `bats` cobrem exatamente esses pontos, com `amixer` e `pactl` falsos no `PATH`: plugar troca pra Headphones, tirar volta pra Speaker, perfil já certo não gera troca, a placa é chamada pelo nome, placa ausente nunca troca o perfil, a consulta usa `iface=CARD` e o jack ilegível é registrado em vez de engolido.

## O preço que eu aceitei

Qualquer escolha manual de perfil no painel de som é desfeita no próximo evento ou no próximo heartbeat, em até 30 segundos. Foi de propósito: a escolha manual é justamente o que criou a fixação e matou o outro lado. Pra forçar o alto-falante por um momento, o caminho é o `fix-audio-speaker`, sabendo que o vigia desfaz isso logo depois.

O script também é deste notebook. Os nomes da placa no ALSA e no PipeWire e o do controle do jack vêm com o valor do Latitude 3450 e podem ser trocados por variável de ambiente (`AUDIO_JACK_ALSA_CARD`, `AUDIO_JACK_PW_CARD`, `AUDIO_JACK_CONTROL`). Os dois perfis estão escritos no código, porque saem do UCM desta placa. Em outra máquina, o primeiro passo é olhar o `pactl list cards` dela.

O perfil da placa agora segue o estado do conector, e escolher o perfil na mão virou exceção que dura até o próximo evento.

`kill "$MONITOR_PID"`
