---
slug: flipclock-screensaver-ascii
title: FlipClock ASCII Screensaver
block: systems-cli
art: windows
summary: "Protetor de tela para Hyprland que desenha a hora em ASCII grande dentro de um terminal em tela cheia, um por monitor, com transições do Terminal Text Effects a cada minuto. Entra pelo hypridle quando a máquina fica ociosa e sai no primeiro movimento."
problem: |
  O Hyprland não tem protetor de tela, só bloqueio. Eu queria algo que
  aparecesse quando a máquina fica ociosa, combinasse com o terminal e não
  exigisse um app gráfico a mais rodando.
decisions: |
  Um terminal em tela cheia por monitor, em vez de uma janela gráfica: o
  relógio é texto renderizado com pyfiglet, e as transições vêm do Terminal
  Text Effects, opcional. Três scripts pequenos separam as responsabilidades:
  detectar monitores e terminal, abrir uma janela em cada um, desenhar o
  quadro. A integração é pelo hypridle, e um arquivo de estado desliga o
  protetor sem desinstalar nada.
outcome: |
  Uso próprio no desktop, com testes em pytest para o renderizador e em bats
  para os scripts de shell. Suporta ghostty, alacritty e kitty.
tech:
  - Python
  - Shell
  - Hyprland
repoUrl: https://github.com/nandomoreirame/flipclock-screensaver-ascii
liveUrl: null
images:
  - src: /lab/flipclock-screensaver-ascii/screensaver.webp
    alt: "Protetor de tela com 17:18 em blocos ASCII azuis e brancos no centro de um terminal escuro, com o papel de parede desfocado atrás"
    width: 1600
    height: 900
featured: false
confidential: false
date: "2026-04-01"
---
