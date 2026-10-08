---
slug: tumodori
title: Tumodori
block: systems-cli
art: timer
summary: "Pomodoro de terminal com dígitos grandes, legíveis de longe sem aproximar do monitor. Feito em Rust com Ratatui, para o cronômetro viver no mesmo lugar que o trabalho, e com os dígitos desenhados em bloco, para o tamanho não depender da fonte configurada no terminal de quem usa."
problem: |
  Um cronômetro em janela de terminal comum exige aproximar do monitor para ler,
  o que quebra o foco que a técnica existe para proteger.
decisions: |
  Ratatui em vez de uma GUI, para o cronômetro viver no mesmo lugar que o
  trabalho. Dígitos desenhados em bloco, não a fonte do terminal, para o tamanho
  não depender da configuração de quem usa.
outcome: |
  Uso próprio diário. Duas estrelas no GitHub, o que é interesse pontual e não
  tração.
tech:
  - Rust
  - Ratatui
repoUrl: https://github.com/nandomoreirame/tumodori
liveUrl: null
featured: false
confidential: false
date: "2026-04-08"
---
