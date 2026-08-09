---
slug: forja
title: Forja
block: ai-tooling
summary: Cliente GUI multi-CLI para Claude Code, Codex e Gemini
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
liveUrl: null
featured: true
confidential: false
updatedAt: "2026-08-01"
---
