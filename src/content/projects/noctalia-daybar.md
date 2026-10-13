---
slug: noctalia-daybar
title: Daybar
block: systems-cli
art: calendar
summary: "Plugin para o Noctalia Shell que reúne o dia numa barra: um campo de captura rápida que entende texto livre (\"comprar pão amanhã 9h\" vira tarefa, \"/e reunião sexta 15h-16h\" vira evento no Google Calendar), além de checklist de hoje, pomodoro e timer (que também abrem numa janela própria ou fixos num canto da tela), favoritos com prévia da página e notas em Markdown."
problem: |
  Registrar uma tarefa, um compromisso, um link ou uma ideia exigia abrir um app
  diferente para cada um e sair do que eu estava fazendo no desktop.
decisions: |
  Plugin do próprio shell, em QML, em vez de um app à parte: tudo abre por
  atalho, a partir da barra. A captura identifica o tipo pelo prefixo (/e
  evento, /l lembrete, /n nota), por uma URL ou por uma conta. O Google Calendar
  é lido e escrito pelo khal e sincronizado pelo vdirsyncer, com as credenciais
  OAuth guardadas no keyring do sistema e não em arquivo. O pomodoro e o timer
  dividem a mesma aba e só um conta por vez: começar um pausa o outro, sem perder
  o tempo que faltava. Os dois também respondem à captura (/t 10m chá inicia um
  timer, /p inicia ou pausa o pomodoro) e saem do painel com um clique, numa
  janela do Niri ou num relógio pequeno fixo no canto da tela.
outcome: |
  Uso próprio no meu desktop com CachyOS e Niri, publicado em licença MIT.
  Testado no Noctalia 4.7.7; ainda não roda no Noctalia v5, que tem outro
  sistema de plugins, e o port está planejado.
tech:
  - QML
  - JavaScript
  - Noctalia Shell
  - Google Calendar
shortcuts:
  - keys: "Mod+Space"
    action: "abre a captura rápida"
  - keys: "Mod+Shift+Space"
    action: "abre o painel com as abas"
  - keys: "Tab"
    action: "alterna o tipo da captura"
  - keys: "Enter"
    action: "salva e fecha"
  - keys: "Shift+Enter"
    action: "salva e mantém o campo aberto"
  - keys: "Esc"
    action: "fecha"
  - keys: "Ctrl+E"
    action: "troca a prévia da nota pelo editor"
  - keys: "Ctrl+S"
    action: "salva a nota na hora"
repoUrl: https://github.com/nandomoreirame/noctalia-daybar
liveUrl: null
images:
  - src: /lab/noctalia-daybar/calendar.webp
    alt: "Aba Calendário do Daybar: relógio, compromissos do dia e o mês de outubro com os dias que têm evento marcados"
    width: 700
    height: 364
  - src: /lab/noctalia-daybar/capture-event.webp
    alt: "Captura rápida do Daybar transformando \"/e reunião com o time sexta 15h-16h\" em um evento com data e horário"
    width: 680
    height: 200
  - src: /lab/noctalia-daybar/today.webp
    alt: "Aba Hoje do Daybar: checklist com horários, uma tarefa concluída e outra marcada como atrasada"
    width: 700
    height: 364
  - src: /lab/noctalia-daybar/timer.webp
    alt: "Aba Foco do Daybar no modo Timer: contagem regressiva de 01:41 dentro de um círculo de progresso, com o rótulo \"Pausa para o café\", e a barra mostrando o mesmo tempo com o ícone de alarme"
    width: 700
    height: 454
  - src: /lab/noctalia-daybar/clock-window.webp
    alt: "Relógio do Daybar aberto numa janela própria: contagem de 01:17 em um círculo grande, com os botões de reiniciar e pausar e as abas Foco, Pausa curta, Pausa longa e Timer embaixo"
    width: 520
    height: 505
featured: false
confidential: false
date: "2026-10-09"
updatedAt: "2026-10-12"
---
