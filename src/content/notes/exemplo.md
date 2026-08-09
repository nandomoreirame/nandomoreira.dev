---
slug: por-que-parenteses-no-tailwind
title: Por que parênteses e não colchetes no Tailwind 4
summary: A sintaxe de colchete gera CSS inválido que o browser descarta em silêncio.
date: "2026-08-09"
markers:
  - Tailwind
draft: true
---

No Tailwind 4, a forma correta de referenciar um token de duração usa parênteses
ao redor do nome da custom property. A forma com colchetes emite o identificador
cru no CSS, e o browser descarta a declaração em silêncio.

O build passa, o teste que só olha a classe no HTML passa, e a transição simplesmente
não existe. Quando o token já está num namespace que gera utilitário (ease, container),
prefira o utilitário direto.

Essa nota existe como rascunho de exemplo até haver conteúdo publicado.
