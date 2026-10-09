---
slug: rdo-solo
title: rdo-solo
block: systems-cli
art: terminal
summary: "Controlador de sessão solo para Red Dead Online e GTA Online, que bloqueia o tráfego peer-to-peer do jogo no gateway Linux por onde o console passa. Começou como script de iptables e ganhou uma TUI em Rust, com jogadores na sessão e GeoIP, e um painel web para ligar e desligar o modo solo pelo celular."
problem: |
  Ficar sozinho numa sessão pública do jogo dependia do "tic-tac", desligar e
  religar o cabo de rede na hora certa, que é manual, impreciso e precisa ser
  repetido a cada sessão.
decisions: |
  O bloqueio acontece no gateway, e não no console nem num PC: todo o tráfego do
  console passa por ali, então derrubar as portas UDP de P2P (6672 e
  61455-61458) basta, e missões privadas do bando continuam funcionando. O
  valor está na topologia, não no binário. A TUI em Rust é compilada estática
  (musl) e enviada por SSH; o painel web em Next.js usa PIN e sessão assinada e
  foi pensado para rede local ou Tailscale, nunca para a internet aberta.
outcome: |
  Ferramenta pessoal extraída de um dotfiles privado e publicada como está, em
  licença MIT. O próprio README avisa que bloquear o tráfego do jogo pode violar
  os termos de serviço da Rockstar e Take-Two.
tech:
  - Rust
  - Ratatui
  - Shell
  - iptables
  - Next.js
repoUrl: https://github.com/nandomoreirame/rdo-solo
liveUrl: null
featured: false
confidential: false
date: "2026-09-29"
updatedAt: "2026-10-08"
---
