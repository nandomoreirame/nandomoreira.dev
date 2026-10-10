---
slug: noctalia-daybar
title: Daybar
block: systems-cli
art: panels
summary: "Plugin para o Noctalia Shell que reúne o dia numa barra: um campo de captura rápida que entende texto livre (\"comprar pão amanhã 9h\" vira tarefa, \"/e reunião sexta 15h-16h\" vira evento no Google Calendar), além de checklist de hoje, timer de foco, favoritos com prévia da página e notas em Markdown."
problem: |
  Registrar uma tarefa, um compromisso, um link ou uma ideia exigia abrir um app
  diferente para cada um e sair do que eu estava fazendo no desktop.
decisions: |
  Plugin do próprio shell, em QML, em vez de um app à parte: tudo abre por
  atalho, a partir da barra. A captura identifica o tipo pelo prefixo (/e
  evento, /l lembrete, /n nota), por uma URL ou por uma conta. O Google Calendar
  é lido e escrito pelo khal e sincronizado pelo vdirsyncer, com as credenciais
  OAuth guardadas no keyring do sistema e não em arquivo.
outcome: |
  Uso próprio no meu desktop com CachyOS e Niri, publicado em licença MIT.
  Testado no Noctalia 4.7.7; ainda não roda no Noctalia v5, que tem outro
  sistema de plugins, e o port está planejado.
tech:
  - QML
  - JavaScript
  - Noctalia Shell
  - Google Calendar
repoUrl: https://github.com/nandomoreirame/noctalia-daybar
liveUrl: null
featured: false
confidential: false
date: "2026-10-09"
updatedAt: "2026-10-09"
---
