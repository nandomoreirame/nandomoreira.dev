---
slug: i18n-sales
phase: none
spec_path: docs/specs/i18n-sales/SPEC.md
plan_path: docs/plans/2026-10-19-i18n-sales.md
depends_on: [i18n-foundation]
updated: 2026-11-14
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

| 5. Layout e SEO | validada | 861 testes sales/i18n; check sem erros; alternados condicionados à bandeira | e12873c |
| 6. Componentes por idioma | validada | 899 testes sales/i18n; 19 snapshots pt-BR intactos; check sem erros | 6f03ce8 |
| 7. Páginas inglesas | validada | 904 testes sales/i18n; snapshot pt-BR intacto; 404 verificado nas cascas HTTP; check sem erros | 8cceef9 |
| 8. Retorno do formulário | validada | 1019 testes sales/i18n/api; handler real rejeita entrada inválida com redirect inglês; check sem erros | 3570002 |
| 9. OG inglesa | validada | 914 testes sales/i18n; check sem erros; landing e detalhe com cards em /og/en/services | 59521de |
| 10. Sitemap sem vendas | validada | 915 testes sales/i18n; mutação /en/services reprovou como esperado; fonte restaurada; check sem erros | 302a66a |

| 11. HTTP e documentação | validada | verify aprovado; HTTP produção/staging aprovado; cobertura 97,66% das linhas | 1f57187 |

## Validação final

- `npm run verify`: aprovado, 453 arquivos e 4.062 testes unitários, 9 arquivos e 43 testes do build; check sem erros.
- HTTP real: `I18N ROUTES PASSED` nos builds de produção e staging; `/en`, `/en/website`, detalhe desconhecido, redirect entre hosts e POST inválido cobertos. Firestore isolado no emulador `demo-i18n-sales`, encerrado após a verificação.
- Correções de validação preexistente em `483d503`: fixtures de confetti, contraste e CLI do autowriter; formatação sem alteração de comportamento. Os 20 testes das três fixtures passaram após o vermelho inicial (9 falhas).
- Instrumentação de cobertura adicionada com piso de 80% de linhas em `src/lib/**/*.ts`. Medição aprovada: 97,66% de linhas, 94,11% de branches e 96,03% de funções; 4.062 testes aprovados. Portões finais em execução.
- `npm audit`: base com 13 high e 4 critical, sem aumento nessas severidades; duas moderate adicionais em dependências de desenvolvimento da cobertura. Nenhum deploy solicitado ou realizado.
- Primeira rodada independente do Grok: 2 High e 2 Medium (rótulos do detalhe, variante compacta, links habilitados e teste de leftovers). Correções com quatro falhas reproduzidas antes da implementação; segunda rodada solicitada, julgamento pendente.

- Tier1 final aprovado antes da correção da revisão: formatter, tipos, testes e build. ESLint indisponível e explicitamente ignorado pelo helper. Tier3 sem portões declarados. Tier1 e tier2 reexecutados após as correções da revisão.

## Fechamento de 2026-11-14

- Rodadas de correção do Claude sobre os achados abertos (barra final nos hosts, seletor em rollback, índice de busca só com detalhe, rótulo Budget, prop ociosa, testes com copy concreta, `docs/lessons.json` no `.prettierignore`). `npm run verify` aprovado: 455 arquivos e 4.070 testes, 9 arquivos e 43 testes do build.
- Revisão independente do Grok: 2 rodadas, 1 Medium (barra final no redirect do host principal) e 1 Low (teste pt-BR), ambos corrigidos com teste vermelho antes. `validate_verification.py` sai 0; revisão registrada em `docs/reviews/i18n-sales.md`.
