---
slug: criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos
title: "Criei quatro plugins para o Noctalia 100% com IA no meu CachyOS"
summary: "Quatro plugins para a barra e a área de trabalho do Noctalia: captura rápida e agenda, uso do plano do Claude Code e do Grok, gists do GitHub e notas adesivas. Todos feitos com IA, no fluxo RPI, e o que mais deu trabalho foi a interface."
date: "2026-10-11"
publishedAt: "2026-10-11T00:25:05-03:00"
art: timeline
markers:
  - linux
  - noctalia
  - produtividade
---

Eu uso muito o teclado. O meu `config.kdl` do Niri tem mais de 140 linhas de atalho: abro os apps que mais uso direto pela tecla, e o que não tem atalho próprio vai pelo launcher do Noctalia (`Ctrl+Space`). Obsidian, WhatsApp e YouTube Music ficam em scratchpads, janelas que aparecem e somem com um atalho sem ocupar uma coluna. A barra é a outra metade: fica sempre à vista, então o que eu consultava várias vezes por dia fazia sentido estar ali, a um atalho ou a um clique.

O que ainda me tirava do que eu estava fazendo era o resto. Anotar uma tarefa ou marcar uma reunião era abrir um app diferente para cada coisa, saber quanto do plano do Claude Code já tinha ido era abrir uma página, e achar um trecho de código antigo era ir ao GitHub caçar o gist certo.

O CachyOS foi instalado neste notebook em 1º de junho de 2026. Oito dias depois eu já estava criando o primeiro plugin para o Noctalia, a barra que veio junto com o Niri. Hoje são quatro, e uso todos os dias.

Este texto não é um tutorial de QML. É o relato de como cheguei até aqui, como eu uso essas ferramentas e como elas foram feitas, com IA do começo ao fim.

## Antes do CachyOS, muita distro

Já usei muito sistema operacional na vida. Windows XP, Vista e Seven entre 2010 e 2014, Ubuntu lá por 2015, e macOS de 2016 até 2024. Depois do Mac voltei para o Linux e passei pelas distros base Ubuntu: Linux Mint, Pop!_OS, ZorinOS e o próprio Ubuntu, que usei por anos até ir para o ZorinOS em 2025. Ainda testei o [Omarchy](https://omarchy.org) por uns meses, até encontrar o [CachyOS](https://cachyos.org).

O que me prendeu foi a combinação do CachyOS com o [Niri](https://github.com/YaLTeR/niri), um compositor Wayland que organiza as janelas em colunas roláveis, e o [Noctalia](https://github.com/noctalia-dev/noctalia), que faz o papel de shell inteiro: barra, launcher, notificações, tela de bloqueio. E o Noctalia tem um sistema de plugins.

**Daí veio a ideia: trazer para a barra o que me fazia sair do que eu estava fazendo.** Procurei na comunidade e não achei plugin para quase nada disso. A exceção foi o [Model Usage](https://github.com/noctalia-dev/noctalia-plugins), que usei por uns meses até criar o meu próprio.

![Meu desktop no CachyOS com o Niri: a barra do Noctalia no topo, com os botões do Gistbar e dos favoritos do Daybar à esquerda e o uso do Claude Code do AI Bar no centro, e abaixo uma fileira de colunas com terminais rodando o Claude Code e o papel de parede de uma montanha](../../assets/posts/2026/desktop-niri-noctalia.webp)

## Os quatro plugins

### Desktop Sticky Notes

O primeiro, começado em 9 de junho. Notas adesivas presas na área de trabalho como widgets: cada uma com cor de post-it, texto em Markdown e tamanho próprio. O clique abre um editor, e uma nota pode ficar ligada a um arquivo `.md` no disco, atualizando quando o arquivo muda. O renderizador de Markdown e o layout do editor vieram do plugin sticky-notes de sapjax, também MIT, com o crédito no repositório.

![Nota adesiva amarela na área de trabalho com o painel de configurações aberto: arquivo Markdown vinculado, cor de fundo, cor do texto e tamanho da fonte](/lab/noctalia-desktop-sticky-notes/settings.webp)

[Ver o Desktop Sticky Notes no lab](/lab/noctalia-desktop-sticky-notes)

### Daybar

`Mod+Space` abre um campo de captura no centro da tela que entende texto livre: "comprar pão amanhã 9h" vira tarefa, "/e reunião sexta 15h-16h" vira evento no Google Calendar, uma URL vira favorito com prévia da página, "=200\*15%" vira conta com o resultado copiado. `Mod+Shift+Space` abre o painel com o calendário, o checklist do dia, o pomodoro, os favoritos e as notas.

O Google Calendar é lido e escrito pelo `khal` e sincronizado pelo `vdirsyncer`, com as credenciais no keyring do sistema, e não num arquivo.

![Captura rápida do Daybar transformando "/e reunião com o time sexta 15h-16h" em um evento com data e horário](/lab/noctalia-daybar/capture-event.webp)

Na v0.3.0, de 12 de outubro, o Daybar ganhou um timer. Eu queria uma coisa simples: digitar quanto tempo quero, ver a contagem regressiva e receber o alarme no fim. Ele virou uma quarta aba do Foco, ao lado de Foco, Pausa curta e Pausa longa, e também começa pela captura: `/t 10m chá` já sai contando, e `/p` inicia ou pausa o pomodoro. Só um relógio conta por vez (começar o timer pausa o pomodoro, e o contrário também, sem perder o tempo que faltava), e os quatro últimos timers ficam ali como atalho de um clique.

![Aba Foco do Daybar no modo Timer: contagem regressiva de 01:41 dentro de um círculo de progresso, com o rótulo "Pausa para o café", e a barra mostrando o mesmo tempo com o ícone de alarme](/lab/noctalia-daybar/timer.webp)

O relógio também sai do painel. Um clique abre a contagem numa janela do Niri, que eu movo e redimensiono, e outro fixa um relógio pequeno num canto da tela, por cima das janelas e em todos os workspaces. Os dois voltam abertos quando o shell reinicia.

![Relógio do Daybar aberto numa janela própria: contagem de 01:17 em um círculo grande, com os botões de reiniciar e pausar e as abas do Foco embaixo](/lab/noctalia-daybar/clock-window.webp)

[Ver o Daybar no lab](/lab/noctalia-daybar)

### AI Bar

Feito em 10 de outubro, para substituir o Model Usage. Mostra na barra quanto do plano do Claude Code e do Grok já foi usado: a porcentagem da janela mais crítica, o tempo até ela reiniciar e uma barra de progresso. No painel, cada janela aparece com o ritmo de uso, que compara a porcentagem gasta com a porcentagem do tempo que já passou. Se estou adiantado, sei antes de bater no limite no meio do trabalho.

As credenciais das CLIs são só lidas, nunca gravadas nem renovadas. Os endpoints e as armadilhas vieram do [ai-usagebar](https://github.com/akitaonrails/ai-usagebar), do Fabio Akita (que conta como fez o dele [neste post](https://akitaonrails.com/2026/05/24/criei-widget-waybar-omarchy-monitorar-uso-llms-ai-usagebar/)), sem reaproveitar o código.

![Barra mostrando o uso do Claude Code em 69% com reinício em 40 minutos, e o painel aberto com as janelas de sessão e semanal do Claude Code, o uso extra e a janela semanal do Grok, cada uma com a porcentagem, o tempo até reiniciar e o ritmo](/lab/noctalia-aibar/panel.webp)

[Ver o AI Bar no lab](/lab/noctalia-aibar)

### Gistbar

Feito no mesmo dia. Tenho 95 gists no GitHub, e achar um trecho era abrir o navegador, lembrar em qual gist estava e copiar à mão. Agora `Mod+G` abre a busca, que olha descrição, nome de arquivo, linguagem e o conteúdo, e o Enter copia o primeiro arquivo. `Mod+Ctrl+G` cria um gist com o que está na área de transferência, e ele nasce secreto, porque publicar por engano é a pior coisa que esse plugin poderia fazer.

Todo acesso ao GitHub passa pelo `gh`, então o plugin nunca toca num token.

![Painel do Gistbar com o campo de busca, o botão Novo gist, os filtros Todos (95), Público (70) e Secreto (25) e a lista de gists, cada um com a descrição, os arquivos, o selo da linguagem e há quanto tempo foi atualizado](/lab/noctalia-gistbar/panel.webp)

[Ver o Gistbar no lab](/lab/noctalia-gistbar)

## 100% IA, no fluxo RPI

Eu não escrevi o código desses plugins à mão. Todos saíram do mesmo fluxo que uso em qualquer projeto: pesquisa e spec no Claude Code (`/rpi:research`), plano com tarefas pequenas e teste antes do código (`/rpi:plan`), e implementação no Grok (`/rpi:implement`), com o Claude Code conferindo e commitando. Contei como funciona em [Fluxo RPI com três agentes](/fluxo-rpi-claude-code-grok-codex).

O `git log` mostra o ritmo. O Daybar teve 107 commits num dia só, das 11h31 às 21h52, passando por três specs (o MVP, depois favoritos e notas, depois apagar evento do calendário). O AI Bar foi do primeiro ao último commit em cerca de uma hora e meia, e o Gistbar em menos de uma hora, os dois reaproveitando a base que o Daybar deixou.

A v0.3.0 do Daybar, a do timer e do relógio destacado, foi mais 42 commits, das 19h28 do dia 11 até a tag no começo da tarde do dia 12. Essa rodada saiu sem dois dos três agentes: o Grok respondeu `402 Payment Required: Grok Build usage balance exhausted` já na primeira tarefa, e o Codex bateu o limite de uso. O fluxo prevê isso (cada etapa cai para o Claude Code quando a ferramenta não responde), então ele implementou e revisou tudo sozinho.

## O que um plugin precisa

Um plugin do Noctalia é uma pasta com um `manifest.json` e alguns arquivos QML. Este é o manifesto inteiro do Gistbar:

```json
{
  "id": "gistbar",
  "name": "Gistbar",
  "version": "0.1.0",
  "minNoctaliaVersion": "4.6.0",
  "author": "Fernando Moreira Costa",
  "license": "MIT",
  "repository": "https://github.com/nandomoreirame/noctalia-gistbar",
  "description": "Search, copy, create and edit your GitHub gists from the bar, through the gh CLI.",
  "tags": ["Bar", "Panel", "Development", "Productivity"],
  "entryPoints": { "main": "Main.qml", "barWidget": "BarWidget.qml", "panel": "Panel.qml", "settings": "Settings.qml" },
  "dependencies": { "plugins": [] },
  "metadata": { "defaultSettings": { "listMinutes": 15 } }
}
```

Os `entryPoints` dizem o que o plugin tem. O mínimo para aparecer na barra é `main` e `barWidget`: o `Main.qml` guarda o estado e roda os comandos (um `Process` do Quickshell com um `Timer`), e o `BarWidget.qml` é o que você vê. Painel e configurações são opcionais. O Sticky Notes troca a barra por `desktopWidget`, porque vive na área de trabalho.

Para instalar o meu durante o desenvolvimento, um symlink basta:

```bash
ln -s ~/dev/projects/noctalia-gistbar ~/.config/noctalia/plugins/gistbar
```

Depois é ativar em Configurações > Plugins e pôr o widget na barra.

Nos quatro, a lógica mora em funções JavaScript puras, testadas com Vitest, e o QML fica só como tela. O Daybar tem 440 testes, o Gistbar 151 e o AI Bar 36. É o que deixa a IA mexer no código sem eu precisar conferir cada linha.

Se isso é simples, eu não sei dizer: escrevi tudo com IA e não tenho com o que comparar. O que eu sei é onde o tempo foi.

## O que mais deu trabalho foi a interface

O código funcionava. O que voltava toda hora era a UI dos painéis da barra: sempre tinha alguma inconsistência que eu precisava corrigir até ficar visualmente aceitável. Somando os quatro repositórios, foram 19 commits só de ajuste visual e de correção de interface, 11 deles no Daybar.

Os títulos contam a história: "show a pointer cursor on note and bookmark rows", "dim and italicize the empty-day message", "center the timer, controls and task picker", "keep lists stable while a delete bubble is open and reachable by Tab". Nenhum deles é bug de lógica. É o tipo de detalhe que a IA não vê, porque ela não olha a tela (quem olha sou eu).

A saída foi juntar esses acertos num kit de componentes (`components/ui/`: card, chip, campo, linha de lista, botão com confirmação, estado vazio) dentro do Daybar. Como o Noctalia não tem um jeito de um plugin importar componentes de outro, o kit foi copiado para o AI Bar e para o Gistbar, e foi por isso que os dois já nasceram com a aparência certa e saíram em uma tarde.

Com o timer foi igual. O contador do Foco ficou achatado dentro do círculo, e na janela grande os botões de pausar e reiniciar cresciam junto com ela até ficarem gigantes. Eu mandava o print, a IA corrigia, e o print seguinte mostrava o próximo detalhe: o traço do círculo grosso demais, os botões empurrando os números para fora do centro, o rótulo do timer que aparecia no painel e não na janela.

Um bug dessa rodada não era de tela. A primeira versão da janela logava `Binding loop detected for property "progress"` ao subir o shell. A janela nascia junto com o serviço principal do plugin, e o cálculo do círculo lia a configuração do pomodoro pela primeira vez no meio do próprio binding, o que reescrevia o tempo restante que ele mesmo usava. A correção foi criar o mostrador só quando a janela está visível, com um `Loader`.

Uma armadilha de brinde: o Noctalia não recarrega plugins sozinho. Mudou um QML ou o `settings.json`, reinicia o shell (criei um atalho só para isso, `Super+Alt+B`).

## Próximo passo

Os quatro rodam no Noctalia 4.7.7. O Noctalia v5 trocou o sistema de plugins (os novos são escritos em Luau, com outro manifesto), então nenhum deles roda lá ainda. O port está planejado, um por vez, assim que eu tiver a v5 instalada e testada aqui.

E não devem ficar só nesses quatro: estou pensando em criar mais coisas para o Noctalia e, quem sabe, publicar no repositório de plugins da v5.

Os quatro são MIT e estão no GitHub: [noctalia-daybar](https://github.com/nandomoreirame/noctalia-daybar), [noctalia-aibar](https://github.com/nandomoreirame/noctalia-aibar), [noctalia-gistbar](https://github.com/nandomoreirame/noctalia-gistbar) e [noctalia-desktop-sticky-notes](https://github.com/nandomoreirame/noctalia-desktop-sticky-notes). Achou bug ou sentiu falta de alguma coisa, abre uma issue ou manda um pull request.

`qs -c noctalia-shell kill`
