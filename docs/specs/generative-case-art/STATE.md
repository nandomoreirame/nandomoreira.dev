---
feature: generative-case-art
phase: implemented
plan_path: docs/plans/2026-10-07-generative-case-art.md
started_at: 2026-10-07
implemented_at: 2026-10-08
depth: standard
spec_path: docs/specs/generative-case-art/SPEC.md
---

# Estado: generative-case-art

Spec aprovada em 2026-10-07, depois de research e grilling (12 decisões no Grilling Log).
Plano gerado em 2026-10-07: 13 tarefas em quatro lotes. Implementação concluída em
2026-10-08 (Tasks 1 a 13); checagem manual em
`docs/reviews/generative-case-art-manual-check.md`.

Esta feature revoga parcialmente duas decisões registradas, e a revogação precisa entrar
nos documentos durante a implementação (REQ-016):

- `theme-restyle`: "linhas, nunca cards" deixa de valer em `/portfolio` e `/lab`.
- CLAUDE.md: "zero JavaScript de cliente no P0" passa a ter uma exceção nomeada, o efeito
  de ponteiro, sob portão com lista de permissão e orçamento de 1,5 KB gzip.

## Task 10: portão de build provado vermelho (2026-10-08)

O portão `tests/design-system/no-client-js.build-test.ts` lê o HTML de verdade: sobe
`dist/server/entry.mjs` na porta 4931 e busca as rotas SSR (`/`, `/sobre`, `/contato`,
`/posts`, `/posts/arquivo`, `/portfolio`, `/lab`, `/404`), e varre todo `index.html`
pré-renderizado em `dist/client`. Conta script inline e externo; JSON-LD fica de fora.

Medição: o Astro embute o script do `PointerField` inline (`<script type="module">`), sem
arquivo em `dist/client/_astro/`. São 849 B crus e **451 B gzip**, contra o orçamento de
1.536 B. Um portão que só listasse `_astro/*.js` passaria vazio.

Prova vermelha (REQ-013): `<script>console.log('gate')</script>` acrescentado ao fim de
`src/pages/sobre.astro`, depois

```bash
npm run build > /tmp/gate-build.log 2>&1; npm run test:build > /tmp/gate.log 2>&1; echo GATE=$?; grep -E "outside the allowlist" /tmp/gate.log
```

Resultado: `GATE=1`, `Tests 1 failed | 10 passed (11)`, com a linha
`"/sobre: script outside the allowlist"` no teste "ships only the pointer effect, only
where allowed, within budget". Com o script removido (arquivo conferido byte a byte por
`cmp` contra a cópia de antes), o mesmo comando voltou a `GATE=0`, `Tests 11 passed (11)`.

## Task 13: verificação final (2026-10-08)

Build local servido por `node ./dist/server/entry.mjs`, Chrome 155 headless. Detalhes,
capturas descritas e observações em `docs/reviews/generative-case-art-manual-check.md`.

| Portão | Linha de marca |
|---|---|
| `npm run verify` | `EXIT=0`; `astro check` com `0 errors`; `Tests 770 passed (770)`; `[build] Complete!`; `Tests 11 passed (11)` na suíte de build |
| `PORT=8090 bash scripts/verify-keyboard.sh` | `KEYBOARD WALK PASSED` (11 rotas) |
| `PORT=8090 bash scripts/verify-viewport-320.sh` | `VIEWPORT 320 PASSED` (11 rotas) |
| `bash scripts/audit-lighthouse.sh` (4 rotas) | `LIGHTHOUSE AUDIT COMPLETE` |

Lighthouse contra o build local (Performance / Acessibilidade / Boas práticas / SEO):

| Rota | 2026-08-10 (produção) | 2026-10-08 (build local) |
|---|---|---|
| `/` | 97 / 100 / 96 / 100 | 98 / 100 / 96 / 100 |
| `/lab` | não medida | 99 / 100 / 96 / 100 |
| `/lab/amnesia-claude-code` | 99 / 100 / 96 / 100 | 99 / 100 / 96 / 100 |
| `/criar-site-completo-com-o-notion` | 75 / 96 / 96 / 100 | 75 / 100 / 96 / 100 |

Nenhuma rota caiu abaixo de 90 por causa desta feature; o post segue limitado pela capa
em GIF animado (LCP 17,6 s), como já registrado em `docs/audits/2026-08-10-lighthouse.md`.

Checagem no navegador (Playwright): hover com `pointer: fine` liga `data-active` no campo e
escreve `--mx`/`--my` só no card sob o cursor, e tudo volta ao repouso ao sair; a faixa do
case anima (`art-drift`, 18 s); com `prefers-reduced-motion: reduce`, `animation-name: none`
e zero animações, com a arte completa; sem JavaScript, os 16 SVGs renderizam completos e o
console fica limpo; em 320px, uma coluna e `scrollWidth === 320`.

Pendente: REQ-017 não foi provado por remoção do componente (exigiria alterar código de
produção, fora do escopo da Task 13). Observações para o autor (variação fraca dentro do
mesmo motivo, brilho visível só nas frestas, alturas desiguais de card quando o título
quebra) estão no documento de checagem.
