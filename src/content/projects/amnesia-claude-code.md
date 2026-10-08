---
slug: amnesia-claude-code
title: Amnesia
block: ai-tooling
art: orbit
summary: "Camada de memória persistente e determinística para o Claude Code. Merge, deduplicação e validação saem do modelo e vão para um CLI em Python, então o resultado é o mesmo em toda execução e o agente para de responder com um dado lembrado errado. Uso diário no meu próprio fluxo de trabalho."
problem: |
  Memória de agente delegada ao próprio modelo erra em merge e deduplicação, e o
  erro só aparece quando o agente já respondeu com o dado errado.
decisions: |
  Operações de merge, dedup e validação num CLI Python, fora do modelo. O agente
  chama o CLI; o resultado é o mesmo em toda execução.
outcome: |
  Uso próprio diário no fluxo de trabalho com Claude Code. Sem tração pública:
  o repositório é aberto e não tem estrelas.
tech:
  - Python
  - Claude Code
repoUrl: https://github.com/nandomoreirame/amnesia-claude-code
liveUrl: null
featured: false
confidential: false
date: "2026-04-03"
---
