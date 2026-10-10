---
slug: hypr-switcher
title: Hypr Switcher
block: systems-cli
art: windows
summary: "Alt+Tab visual para o Hyprland, que não traz um alternador de janelas próprio. Em Rust sobre a camada layer-shell do Wayland, para o overlay aparecer acima de tudo sem roubar o foco, e com a latência de abertura como critério principal, porque é ela que decide se a ferramenta é usada ou abandonada."
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
images:
  - src: /lab/hypr-switcher/switcher.webp
    alt: "hypr-switcher sobre o editor: faixa de janelas abertas com ícone, título e workspace, e a janela selecionada em destaque"
    width: 1600
    height: 905
featured: false
confidential: false
date: "2026-03-03"
---
