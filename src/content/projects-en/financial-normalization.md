---
translationOf: financial-normalization
title: Financial data normalization
summary: "Service that normalizes the heterogeneous financial data of the real estate developers served by Liquid AI, more than 20 active datasets. Each developer's rule enters as an adapter in a hexagonal architecture, not as a branch in the core. Cut the prep of a dataset from about five days to up to 30 minutes, protected by more than 4,800 test cases."
problem: |
  Each real estate developer delivers financial data in its own format,
  and manual normalization cannot keep up with the number of active
  datasets.
decisions: |
  Domain-Driven Design with hexagonal architecture, so each developer's
  rule enters as an adapter and not as a branch in the core. Single-purpose
  Python API, with the frontend in a separate repository.
outcome: |
  In production at Liquid AI, over the datasets of more than 20 real
  estate developers. The interval between receiving a dataset and
  delivering it pre-normalized into the pipeline dropped from about five
  days to up to 30 minutes, and a suite of more than 4,800 test cases
  (unit, integration, regression and parity) protects every transformation
  change against silent breakage. The code and the developer names are
  not public.
---
