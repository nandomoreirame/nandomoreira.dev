---
slug: financial-normalization
title: Normalização de dados financeiros
block: professional
summary: Serviço que normaliza dados financeiros heterogêneos de incorporadoras
problem: |
  Cada incorporadora entrega dado financeiro num formato próprio, e a
  normalização manual não acompanha o número de bases ativas.
decisions: |
  Domain-Driven Design com arquitetura hexagonal, para a regra de cada
  incorporadora entrar como adaptador e não como ramificação no núcleo. API
  Python de propósito único, com o frontend em repositório separado.
outcome: |
  Em produção na Liquid AI, sobre as bases de mais de 20 incorporadoras. O
  intervalo entre receber uma base e entregá-la pré-normalizada na pipeline
  caiu de cerca de cinco dias para até 30 minutos, e uma suíte de mais de 4.800
  casos de teste (unitários, integração, regressão e paridade) protege cada
  mudança de transformação contra quebra silenciosa. O código e os nomes das
  incorporadoras não são públicos.
tech:
  - Python
  - DDD
  - Arquitetura hexagonal
repoUrl: null
liveUrl: null
featured: false
confidential: true
date: "2025-03-01"
---
