---
slug: forja-plugins
title: Forja Plugins
block: ai-tooling
art: orbit
summary: "Registro oficial e monorepo de plugins do Forja: relógio, Pomodoro e tarefas em Markdown, sobre um SDK compartilhado com tipos da API de plugins. Cada plugin declara as permissões que usa, e um script gera o registro que o Forja consulta para instalar."
problem: |
  O Forja precisava crescer sem que cada recurso novo entrasse no núcleo do
  app. Um sistema de plugins resolve isso só se houver plugins de verdade
  exercitando a API, e um jeito de distribuí-los.
decisions: |
  Monorepo com pnpm, um plugin por pasta e um SDK compartilhado, para todos
  falarem a mesma API tipada. Cada plugin declara num manifest as permissões
  que pede (tema, notificações, leitura e escrita de arquivo), e um script
  valida os manifests antes do build. Os estilos usam só as variáveis CSS do
  Forja, para o plugin acompanhar o tema do app. O registro é um JSON gerado e
  publicado no GitHub Pages, com o link de download de cada versão.
outcome: |
  Três plugins publicados, com vinte releases ao todo e testes em Vitest. O
  Pomodoro e as tarefas em Markdown aparecem na própria tela do Forja.
tech:
  - TypeScript
  - Vite
  - pnpm
  - Vitest
repoUrl: https://github.com/nandomoreirame/forja-plugins
liveUrl: null
images:
  - src: /lab/forja-plugins/pomodoro-and-tasks.webp
    alt: "Painel lateral do Forja com dois plugins abertos: o Pomodoro Timer com 25:00 e o botão Start, e o Markdown Tasks com uma tarefa do projeto"
    width: 470
    height: 1076
featured: false
confidential: false
date: "2026-03-26"
---
