---
slug: forja
title: Forja
block: ai-tooling
art: panels
summary: "Cliente desktop que reúne Claude Code, Codex e Gemini numa só interface, para não perder contexto alternando entre três terminais. Feito em Tauri e Rust, pelo peso do binário, com uma camada de adaptação por CLI em vez de impor um protocolo comum às três. É o meu cliente principal no dia a dia."
problem: |
  Alternar entre três CLIs de agente em terminais separados custa contexto a cada
  troca, e nenhuma delas mostra o estado das outras.
decisions: |
  Tauri em vez de Electron, pelo peso do binário e por já haver Rust no acervo.
  Uma camada de adaptação por CLI, em vez de um protocolo comum imposto às três.
outcome: |
  11 estrelas no GitHub e uso diário próprio como cliente principal.
tech:
  - Rust
  - Tauri
  - TypeScript
repoUrl: https://github.com/nandomoreirame/forja
liveUrl: https://forja.web.app
featured: true
confidential: false
date: "2026-01-15"
updatedAt: "2026-08-01"
---
