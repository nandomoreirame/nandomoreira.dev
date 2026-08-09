---
slug: por-que-parenteses-no-tailwind
title: Por que parênteses e não colchetes no Tailwind 4
summary: A sintaxe de colchete gera CSS inválido que o browser descarta em silêncio.
date: "2026-08-09"
markers:
  - Tailwind
draft: true
---

A sintaxe de variável no Tailwind 4 usa parênteses, não colchetes.
`duration-(--token)` gera `var(--token)`; `duration-[--token]` gera CSS inválido.

Essa nota existe como rascunho de exemplo até haver conteúdo publicado.
