---
slug: job-radar
title: job-radar
block: systems-cli
art: map
summary: "Varre sites de vagas, descarta o que não combina com o seu perfil e publica as compatíveis no Discord, rodando sozinho algumas vezes por dia. Python puro, sem dependências: filtros duros decidem o que passa, uma pontuação de 0 a 100 ordena o resto, e as qualificações saem do próprio currículo em markdown."
problem: |
  Procurar vaga é rolar listas longas em vários sites, repetindo os mesmos
  cortes de senioridade, modalidade e salário a cada visita, e reencontrando a
  mesma vaga anunciada em duas fontes.
decisions: |
  Filtros duros e pontuação separados: o filtro responde "eu me candidataria a
  isso?" e descarta, a pontuação só ordena o que sobrou, para uma vaga ruim não
  subir somando critérios secundários. As qualificações vêm do currículo, e não
  de uma lista paralela que envelheceria escondida. Quando nada passa, o canal
  recebe o funil da varredura, para silêncio nunca confundir "não achou" com
  "não rodou". Os testes de conector usam respostas reais gravadas, e os
  conectores respeitam robots.txt e pausam entre requisições.
outcome: |
  Publicado no GitHub, com conectores para Gupy, repositórios de vagas no
  GitHub, Programathor e Sólides. Roda por timer do systemd ou cron.
tech:
  - Python
  - pytest
  - Discord
  - systemd
repoUrl: https://github.com/nandomoreirame/job-radar
liveUrl: null
images:
  - src: /lab/job-radar/discord.webp
    alt: "Canal #job-radar no Discord com duas vagas de engenharia de IA publicadas pelo bot, cada uma com modalidade, local, as qualificações que casaram, o link de candidatura e a nota de compatibilidade (90/100 na primeira)"
    width: 756
    height: 996
featured: false
confidential: false
date: "2026-09-28"
---
