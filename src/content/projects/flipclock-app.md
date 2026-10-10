---
slug: flipclock-app
title: FlipClock
block: systems-cli
art: timer
summary: "Relógio de flip para o desktop, feito em Go com Fyne, com animação de virada em duas fases, modo tela cheia e um modo protetor de tela que cobre todos os monitores conectados. A fonte vai embutida no binário, então o app roda sem depender de nenhum arquivo externo."
problem: |
  Os relógios de flip para desktop costumam ser página web aberta numa aba ou
  app pesado de outra plataforma. Eu queria um binário pequeno, nativo, que
  ficasse na bandeja e virasse protetor de tela em todos os monitores.
decisions: |
  Go com Fyne, para um binário único sem runtime e com a mesma base em Linux e
  Windows. A fonte Bebas Neue vai embutida no executável, para o visual não
  depender do sistema. No modo protetor de tela, cada monitor ganha a própria
  janela, todas sincronizadas no mesmo segundo e fechadas juntas por qualquer
  tecla. No Wayland quem posiciona janela é o compositor, e o README documenta
  essa limitação em vez de escondê-la.
outcome: |
  Duas releases publicadas, com pacotes .deb e .zip para Linux (x86_64 e ARM64)
  e .zip para Windows. Uso próprio no desktop. Três estrelas no GitHub, o que é
  interesse pontual e não tração.
tech:
  - Go
  - Fyne
  - OpenGL
repoUrl: https://github.com/nandomoreirame/flipclock-app
liveUrl: null
images:
  - src: /lab/flipclock-app/clock.webp
    alt: "FlipClock em tela cheia mostrando 21:07 em dois cartões escuros de flip, com os segundos pequenos no canto"
    width: 1600
    height: 900
featured: false
confidential: false
date: "2026-04-01"
---
