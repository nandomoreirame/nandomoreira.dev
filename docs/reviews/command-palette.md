# Revisão — command-palette

- **Rodada:** 2026-10-19
- **Achados abertos:** 3
- **Estado:** aguardando correção
- **Implementado por:** claude

> Arquivo reescrito por inteiro a cada `/rpi-review`. Um achado só desaparece
> daqui por ter deixado de existir no código: quem corrige não marca resolvido.

<!-- findings:begin -->

| Severidade | Arquivo:linha | Problema | Correção sugerida |
|------------|---------------|----------|-------------------|
| Critical | (portão) | prettier (5 arquivos já fora do formato em 18944ac: package-lock.json, firebase.json, 3 *.rounds.jsonl), tsc (178 erros TS2307 de import .astro, pré-existentes; astro check: 0 erros) e npm test (tests/design-system/code-contrast.test.ts, vermelho antes da feature). Nenhum causado por command-palette. | corrigir antes de tudo |
| Low | src/components/art/PointerField.astro:125 | Na primeira sequência G da sessão, a letra seguinte só é encaminhada depois que o import() do módulo resolve; uma letra fora de [glemi] digitada antes disso (G B rápido em rede lenta) se perde em silêncio. | Guardar a última letra pendente enquanto o import resolve e repassá-la a press() quando o módulo chegar. |
| Low | src/scripts/palette.ts:163 | Ctrl+K com a paleta já aberta zera o que o visitante digitou: input.value = '' roda antes da guarda de dialog.open. | Limpar o campo só dentro do ramo !dialog.open, junto do showModal(). |

<!-- findings:end -->
