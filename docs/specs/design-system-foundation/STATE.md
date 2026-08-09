---
phase: complete
spec_path: docs/specs/design-system-foundation/SPEC.md
plan_path: docs/plans/2026-08-08-design-system-foundation.md
started_at: 2026-08-08
updated_at: 2026-08-08
current_section: ""
decisions:
  - "Tokens em @theme do Tailwind 4, no CSS, sem arquivo de configuração"
  - "Componentes em Astro puro, sem biblioteca de UI (REQ-008: zero JS de cliente)"
  - "Borda em vez de sombra para elevação, por causa do fundo quase preto"
  - "Fontes locais, sem CDN"
  - "Teste que varre src/ reprovando literal fora da escala (REQ-002 vira portão)"
  - "border (1,31:1) nunca como único delimitador de alvo interativo"
  - "Sintaxe de variável do Tailwind 4 é parêntese, nunca colchete: duration-(--token)"
  - "Tags globais (html, body) estilizadas por @apply no global.css, nunca por class na marcação"
  - "vitest.config.ts usa getViteConfig; o tipo `test` vem de vitest-env.d.ts"
blockers: []
transitions:
  - "2026-08-08: research (autônomo, derivado de DESIGN-GUIDELINES.md + MVP-SCOPE decisões de simplificação)"
  - "2026-08-08: plan-complete"
  - "2026-08-08: implement-complete (14 tarefas, 14 commits)"
  - "2026-08-08: review (6 achados, um bloqueante)"
  - "2026-08-08: complete (achados resolvidos; npm run verify verde)"
---

# STATE — design-system-foundation

Sprint 2 do roadmap, **concluída**. Sete componentes base, tokens no CSS, layout base e
os portões que sustentam as regras que sem automação viram sugestão.

Portão do projeto verde: `npm run verify` com 0 erros de tipo, 111 testes unitários e 7
de build.

## Achados da revisão e resolução

| # | Achado | Resolução |
|---|--------|-----------|
| 1 | `npm run verify` vermelho: `astro check` rejeitava a chave `test` do `getViteConfig` | `vitest-env.d.ts` augmenta `UserConfig`. O triple-slash sozinho não resolve, comprovado nos dois sentidos |
| 2 | `duration-[--duration-fast]` e `ease-[--ease-out]` geravam CSS inválido (`transition-duration:--duration-fast`), então Button e ProjectCard perdiam duração e easing | Sintaxe de parêntese `duration-(--duration-fast)` e utilitário `ease-out` do token |
| 3 | O portão anti-literal não cobria `duration`/`ease`/`transition`, e só lê texto-fonte | Regex estendida, mais `valid-css.build-test.ts` que rejeita valor começando em `--` no CSS construído |
| 4 | `<Button href disabled>` renderizava âncora clicável anunciada como desabilitada, e ainda respondia a hover | Perde o `href`, mantém `aria-disabled` + `role="link"`, e não emite `hover:`/`active:` |
| 5 | `<main>` sem `tabindex="-1"`: o skip link rolava sem mover o foco | `tabindex="-1"` |
| 6 | Portão de zero-JS retornava cedo quando o diretório não existia | Ausência do diretório agora falha |

## Correções posteriores à revisão

- REQ-010 se contradizia com o `DESIGN-GUIDELINES.md` (proibia animar o que não fosse `transform`/`opacity`, enquanto o token `fast` era definido como "hover, mudança de cor"). Resolvido em favor de proibir propriedade que dispara layout.
- Tags globais migradas para `@apply` no `global.css`, com portão em `global-tags.test.ts`. Regra documentada no `DESIGN-GUIDELINES.md`.
- `min-w-dvw` removido: unidade de viewport na largura inclui a calha da barra de rolagem e fabricava o scroll horizontal que REQ-012 proíbe, que o `overflow-x-hidden` apenas escondia.
- `prebuild: rm -rf dist` acrescentado. `astro build` não limpa o `dist/`, e CSS obsoleto acumulado causava falha falsa no portão que varre o build.

## Dívida deixada em aberto

- **REQ-013** (ícones Lucide com `aria-label`) e **REQ-014** (estado vazio em listagem) são P2 e ficaram fora das 14 tarefas do plano. `project-catalog` precisa do estado vazio, então REQ-014 entra naturalmente lá.
- **REQ-016** (página interna de referência visual) segue P3. Reavaliar quando o catálogo passar de oito cases.
