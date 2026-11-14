# Review: i18n-foundation

- **Round:** 2026-11-13
- **Open findings:** 3
- **State:** awaiting independent review
- **Independent review:** pending (self-assessment)

> File rewritten whole on every `/rpi review`. A finding only disappears from here
> because it stopped existing in the code: whoever fixes it does not mark it resolved.

<!-- findings:begin -->

| Severity | File:line | Issue | Suggested fix |
|----------|-----------|-------|---------------|
| Critical | (gate) | tier1 FAIL (2): prettier --check . falha em formatação e no template tools/stats/templates/body.html; npm test tem 9 falhas em confetti, code-contrast e autowriter-run. Tipos e build aprovados; eslint ausente. | fix before anything else |
| Spec | — | — | — |
| Medium | src/components/ui/TocColumns.astro:20 | REQ-003/008: TocColumns chama PostToc sem locale, e SetupPage:111 e NowPage:133 também instanciam PostTocToggle sem locale. /en/setup e /en/now mantêm o título e aria-label Índice e o botão Índice do post em português; a sondagem renderizada de /en/setup confirmou os dois nomes acessíveis. O detector ptLeftovers não inclui Índice e ignora atributos. | Propagar locale por TocColumns até PostToc e pelos dois botões; verificar explicitamente o texto e os nomes acessíveis em inglês nas duas páginas. |
| Medium | src/layouts/ResumeLayout.astro:38 | REQ-005: o currículo emite og:locale:alternate e todos os hreflang sem consultar EN_PUBLISHED. Em cópia com EN_LIVE=false e MODE=test, a renderização de /curriculo manteve hreflang=en apontando para /en/resume, que está despublicada no rollback.; REQ-005: hreflang e og:locale:alternate saem sempre em /curriculo e /en/resume, sem consultar EN_PUBLISHED; no rollback com a bandeira desligada o par continua anunciado enquanto /en/resume responde 404, ao contrário do BaseLayout via alternatesFor | Condicionar os alternados à publicação do inglês, como no BaseLayout, e testar o head com a bandeira desligada. |

<!-- findings:end -->

## Evidências da rodada

- HEAD revisado: `c3f55ba`; correções comparadas a `ad9909b`. Planos e specs mantidos como referência da feature completa.
- Implementador não declarado no relatório anterior nem na invocação. Codex conduziu a rodada; Grok foi o segundo revisor e retornou achados. Nenhuma CLI elegível falhou antes dele. A independência em relação ao implementador permanece pendente.
- Achados atuais de código: 2, todos Medium; 1 corroborado(s) independentemente pelos dois revisores. O Critical adicional da tabela representa os portões vermelhos.
- Tier1 executado para este slug: FAIL (2), com tsc e build aprovados. Formatação reprovada com warnings e erro de parser no template de stats; ESLint indisponível. Logs: `/tmp/rpi-i18n-rereview/`.
- Execução detalhada no mesmo HEAD: 3.975/3.984 testes aprovados, 9 falhas nos mesmos três arquivos registrados na rodada anterior. Todos os 617 testes de i18n passaram. `npm run check`: 0 erros, 0 warnings, 17 hints. Testes de build: 43/43.
- Test signal do delta: 46 arquivos analisados, um alerta de interação sem resultado em `tests/newsletter/handler.test.ts`, um aviso de happy path e `tests/i18n/cases-en.test.ts` sem blocos reconhecidos. Nenhum arquivo marcado como not checked. Esses alertas são insumos e não geram achados duplicados. Glossary check sem linhas.
- Planos legados sem `## Checks`: nenhum veredicto Cn. Nenhuma invariável declarada no PRD.

## Standards

Os portões globais continuam vermelhos. As allowlists de origem agora usam Map e cobrem as chaves herdadas; não permanece o defeito de validação apontado na rodada anterior. Nenhum novo smell bloqueante comprovado.

## Spec

O corpo do currículo está localizado; foco, estudo, widgets GitHub e escrita do Now recebem inglês; os links de arquivo/RSS, captcha da newsletter, índice de busca e sitemap foram revistos. Permanecem apenas as lacunas da tabela.

Sondagem isolada em cópia temporária: com EN_LIVE=false e EN_PUBLISHED=false, o head de /curriculo ainda contém hreflang=en; /en/setup renderiza aria-label=Índice e aria-label=Índice do post. Asserções dos helpers corrigidos também confirmaram 20 ocorrências de para e query/fragmento preservados na tradução de /sobre. Log: `/tmp/rpi-i18n-rereview/probe.log`.

Sugestão de simplificação, não bloqueante: reutilizar o cálculo de alternados do BaseLayout no ResumeLayout e testar GET/artefato da busca diretamente, evitando enSearchIndexPaths sem chamador de produção.

## Encaminhamento

Lições: nenhuma registrada, promovida ou penalizada nesta rodada aberta. Correção: `/rpi implement i18n-foundation` na CLI implementadora.
