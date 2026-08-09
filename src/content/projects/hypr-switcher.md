---
slug: hypr-switcher
title: Hypr Switcher
block: systems-cli
summary: Alt+Tab visual para o Hyprland, em Rust sobre layer-shell
problem: |
  O Hyprland não traz um alternador visual de janelas, e trocar entre workspaces
  às cegas custa mais tempo que a troca em si.
decisions: |
  Camada layer-shell do Wayland em vez de uma janela comum, para o overlay
  aparecer acima de tudo sem roubar foco. Rust pela latência de abertura, que é
  o que decide se a ferramenta é usada ou abandonada.
outcome: |
  Uso próprio diário no ambiente Hyprland. Três estrelas, a maior contagem entre
  as ferramentas de sistema do acervo recente.
tech:
  - Rust
  - Wayland
  - Hyprland
repoUrl: https://github.com/nandomoreirame/hypr-switcher
liveUrl: null
featured: false
confidential: false
date: "2026-03-03"
---
