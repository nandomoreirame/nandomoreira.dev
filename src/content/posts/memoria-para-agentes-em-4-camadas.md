---
slug: memoria-para-agentes-em-4-camadas
title: "Memória para agentes: um backbone em quatro camadas"
summary: "Como o Claude Code lembra decisões entre sessões sem carregar tudo no contexto: o que é sempre lido, o que só entra quando alguém pergunta."
date: "2026-10-10"
markers:
  - claude code
  - memória
  - agentes
draft: true
---

Rascunho. Roteiro:

- O problema: cada sessão começa do zero, e jogar tudo no contexto custa caro.
- As quatro camadas: Self, Workspace, Entity e Project, e o que mora em cada uma.
- Eager contra lazy: o `recall` só quando uma entidade é mencionada.
- A migração do sistema anterior e o `--finalize`.
- Drift: memória que mente quando o código muda, e como detectar.
