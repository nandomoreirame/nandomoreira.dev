---
slug: coachbot-cli
title: CoachBot
block: systems-cli
art: terminal
summary: "Coach antimotivacional para o terminal: a cada shell aberto, uma frase sarcástica num balão, dita por um robozinho em pixel art. São mais de cem frases em inglês e outras tantas em português, e instala com uma linha só."
problem: |
  Frase motivacional no terminal é um clichê que ninguém lê depois do segundo
  dia. A versão sarcástica faz o contrário: arranca um sorriso justamente
  porque não leva o dia a sério.
decisions: |
  Um script de shell sem dependência além do que já existe no sistema, com as
  frases em JSON separadas por idioma, para acrescentar uma língua sem tocar no
  código. O idioma sai de uma flag ou da variável COACHBOT_LANG, e o instalador
  de uma linha coloca tudo em ~/.local/bin. Funciona em bash, zsh, fish e
  PowerShell.
outcome: |
  Projeto pequeno e de humor, em uso no meu próprio terminal. Duas estrelas no
  GitHub.
tech:
  - Shell
  - JSON
repoUrl: https://github.com/nandomoreirame/coachbot-cli
liveUrl: null
images:
  - src: /lab/coachbot-cli/terminal.webp
    alt: "Terminal recém-aberto com o CoachBot dizendo, num balão, que tudo acontece por uma razão e que às vezes a razão é uma decisão péssima, acima de um robozinho em pixel art"
    width: 911
    height: 460
featured: false
confidential: false
date: "2026-02-19"
---
