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
  Em produção sobre dezenas de bases ativas. Números e nome do cliente não são
  públicos.
tech:
  - Python
  - DDD
  - Arquitetura hexagonal
repoUrl: null
liveUrl: null
featured: false
confidential: true
clientName: Liquid
date: "2025-03-01"
---
