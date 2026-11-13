---
slug: i18n-sales
phase: implement
spec_path: docs/specs/i18n-sales/SPEC.md
plan_path: docs/plans/2026-10-19-i18n-sales.md
depends_on: [i18n-foundation]
updated: 2026-11-13
---

# STATE: i18n-sales

Spec aprovada pelo Fernando em 2026-10-19. Plano revisado em 2026-10-23, ainda com 11 tarefas. Implementação: `/rpi-implement i18n-sales`.

A revisão manda traduzir a copy do disco (prazo, pagamento, orçamento e formulário), não o texto de 2026-10-18. O índice `/en/search.json` passa a usar o catálogo inglês na tarefa 2.


## Execução de 2026-11-13

- Implementador: Codex. Base da revisão: `2b158dec23dd35a0d18ae5ab578005ebed5abc76`.
- Contrato: um commit por tarefa validada; nenhuma publicação solicitada.
- Preservar os quatro artefatos de revisão existentes fora dos commits desta feature.
- Adaptação do plano: o catálogo atual possui detalhe apenas em `site-institucional`; preservar a paridade do REQ-007, traduzindo os seis cards e o detalhe existente, sem inventar ofertas para os cinco serviços sem detalhe.

| Tarefa | Estado | Evidência | Commit |
|---|---|---|---|
| 1. Slugs e pares | validada | 846 testes sales/i18n; check sem erros; vermelho registrado | d6f32a3 |
| 2. Catálogo inglês | validada | 849 testes sales/i18n; check sem erros; schema compartilhado extraído para evitar ciclo de imports | b1e6bae |
| 3. Copy e mensagens | validada | 862 testes sales/i18n/outbound; check sem erros; WhatsApp conserva destino e tracking | 453ec6b |
| 4. Roteamento inglês | validada | 859 testes sales/i18n; check sem erros; três hosts e rollback cobertos | 5c29b86 |

Checkpoint após tarefa 3: tier2 não executa cobertura porque `@vitest/coverage-v8` não está instalado. Instrumentação de validação será tratada antes do fechamento.

| 5. Layout e SEO | validada | 861 testes sales/i18n; check sem erros; alternados condicionados à bandeira | e12873c |
| 6. Componentes por idioma | validada | 899 testes sales/i18n; 19 snapshots pt-BR intactos; check sem erros | 6f03ce8 |
| 7. Páginas inglesas | validada | 904 testes sales/i18n; snapshot pt-BR intacto; 404 verificado nas cascas HTTP; check sem erros | 8cceef9 |
| 8. Retorno do formulário | validada | 1019 testes sales/i18n/api; handler real rejeita entrada inválida com redirect inglês; check sem erros | 3570002 |
| 9. OG inglesa | validada | 914 testes sales/i18n; check sem erros; landing e detalhe com cards em /og/en/services | neste commit |
