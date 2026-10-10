---
slug: grab-sh
title: grab-sh
block: systems-cli
art: wireframe
summary: "Script mínimo de screenshot para Wayland e Hyprland que copia direto para a área de transferência, sem salvar arquivo no disco. Dois atalhos de teclado: tela inteira ou uma área escolhida com a mira."
problem: |
  As ferramentas de screenshot salvam um arquivo a cada captura, quando quase
  sempre o destino é colar a imagem numa conversa ou num documento. O resultado
  é uma pasta cheia de imagens que ninguém abre de novo.
decisions: |
  Compor três ferramentas que já existem no Wayland (grim para capturar, slurp
  para escolher a área, wl-clipboard para copiar) em vez de escrever uma nova.
  Nada vai para o disco: cada captura sobrescreve a área de transferência. O
  instalador cria um link em ~/.local/bin, e dois binds do Hyprland fazem o
  resto.
outcome: |
  Uso diário no meu desktop. Uma release publicada. É pequeno de propósito.
tech:
  - Shell
  - Hyprland
  - Wayland
repoUrl: https://github.com/nandomoreirame/grab-sh
liveUrl: null
featured: false
confidential: false
date: "2026-03-31"
---
