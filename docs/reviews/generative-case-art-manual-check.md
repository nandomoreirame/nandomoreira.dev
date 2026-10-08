# generative-case-art: verificação final e checagem manual

Data: 2026-10-08

> **Feature:** `generative-case-art` · Task 13 do plano `docs/plans/2026-10-07-generative-case-art.md`

## Ambiente

| | |
|---|---|
| Commit | `3f2cd1e` (Tasks 1 a 12 commitadas) |
| Build | `npm run build` local, servido por `node ./dist/server/entry.mjs` em `127.0.0.1:8091` |
| Sistema | CachyOS, kernel 7.2.8, Node 24.16.0 |
| Navegador | Google Chrome 155.0.8059.39 headless |
| Automação | Playwright 1.63.0 (Python, venv temporário fora do repositório) dirigindo o Chrome do sistema |
| Lighthouse | `lighthouse@12` via `npx`, pelo `scripts/audit-lighthouse.sh` |

Nada foi medido contra `astro dev`. Os servidores e navegadores abertos foram encerrados
por PID ao fim.

## Portões automatizados

### `npm run verify`

```bash
npm run verify > /tmp/verify.log 2>&1; echo EXIT=$?; grep -E "errors|Test Files|Tests |FAIL|Complete!" /tmp/verify.log
```

| Etapa | Linha de marca |
|---|---|
| `astro check` | `Result (227 files): 0 errors, 0 warnings, 7 hints` |
| Suíte unitária | `Test Files 115 passed (115)` · `Tests 770 passed (770)` |
| Build | `[build] Complete!` |
| Suíte de build | `Test Files 4 passed (4)` · `Tests 11 passed (11)` |

`EXIT=0`, nenhuma linha `FAIL`.

### Verificações por HTTP

Porta 8090 conferida livre por `ss -ltn` antes de rodar.

| Script | Linha de marca | Rotas |
|---|---|---|
| `PORT=8090 bash scripts/verify-keyboard.sh` | `KEYBOARD WALK PASSED` | 11 rotas, incluindo `/portfolio` (17 paradas), `/lab` (36 paradas) e `/lab/amnesia-claude-code` (24 paradas), todas com skip link primeiro e foco visível |
| `PORT=8090 bash scripts/verify-viewport-320.sh` | `VIEWPORT 320 PASSED` | as mesmas 11 rotas, `nothing past 320px` em todas |

## Lighthouse

Medido contra o build local (`http://127.0.0.1:8091`), com o aquecimento de duas
requisições do próprio script. Linha de marca: `LIGHTHOUSE AUDIT COMPLETE`.

| Rota | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 98 | 100 | 96 | 100 | 2,1 s | 0,042 |
| `/lab` | 99 | 100 | 96 | 100 | 2,0 s | 0 |
| `/lab/amnesia-claude-code` | 99 | 100 | 96 | 100 | 1,8 s | 0,001 |
| `/criar-site-completo-com-o-notion` | 75 | 100 | 96 | 100 | 17,6 s | 0,019 |

Total Blocking Time em 0 ms nas quatro rotas.

**Comparação com 2026-08-10** (`docs/audits/2026-08-10-lighthouse.md`):

| Rota | 2026-08-10 (P / A / BP / SEO) | 2026-10-08 (P / A / BP / SEO) |
|---|---|---|
| `/` | 97 / 100 / 96 / 100 | 98 / 100 / 96 / 100 |
| `/lab/amnesia-claude-code` | 99 / 100 / 96 / 100 | 99 / 100 / 96 / 100 |
| `/criar-site-completo-com-o-notion` | 75 / 96 / 96 / 100 | 75 / 100 / 96 / 100 |

Ressalva de método: a medição de 2026-08-10 foi contra o backend de produção no App
Hosting; a de hoje, contra o build local. Os números são comparáveis em ordem de
grandeza, não ponto a ponto. Nenhuma rota caiu abaixo de 90 por causa desta feature. O
post continua limitado pela capa em GIF animado de 2,2 MB, exatamente como já registrado;
a acessibilidade dele subiu para 100 com a troca de tema do Shiki feita em agosto.

## Checagem manual

Legenda: **PASS (automatizado)** quando a condição foi medida no navegador por script;
**PASS (visual)** quando foi conferida olhando as capturas; **pede o autor** quando a
condição é perceptiva e uma captura estática não basta para julgar.

| # | Critério | Resultado | Evidência |
|---|---|---|---|
| 1 | Os quatro motivos são distinguíveis num relance em `/lab` e `/portfolio` | PASS (visual e automatizado) | `/lab` traz `terminal` (2), `orbit` (2) e `wave` (4); `/portfolio` traz `flow` (7), lidos do atributo `data-motif` de cada SVG. Nas capturas os quatro são inconfundíveis: barras horizontais com marcador à esquerda, anéis concêntricos com nó central, duas ondas pontilhadas, leque de traços convergindo num nó com uma fila de pontos. Ver observação 1 sobre a variação dentro do mesmo motivo |
| 2a | A grade acende perto do cursor e apaga ao sair | PASS (automatizado), pede o autor quanto à percepção | Com `pointer: fine`, ao mover o mouse sobre o segundo card de `/lab`: `data-active` presente no campo, `--gx: 459px`, `--gy: 90px`, opacidade do `::after` em `1`. Ao levar o mouse para fora: `data-active` ausente, opacidade `0`. Ver observação 2: o brilho só aparece nas frestas entre os cards |
| 2b | A paralaxe acompanha o cursor no card sob ele | PASS (automatizado) | No card sob o cursor, `--mx: 0.250` e `--my: 0.350`; a camada de profundidade 3 ficou em `matrix(1, 0, 0, 1, -4.5, -1.8)`, que é exatamente `(0,25 − 0,5) × 3 × 6px` e `(0,35 − 0,5) × 3 × 4px`. O card vizinho ficou sem `--mx`. Ao sair, `--mx` foi removido |
| 3 | A faixa do topo do case se move sozinha, devagar | PASS (automatizado), pede o autor quanto ao "devagar" | Em `/lab/amnesia-claude-code` sem movimento reduzido: `animation-name: art-drift`, `18s`, `running`, três animações ativas (uma por camada). O `translateX` foi de −2,99px a −2,86px em 1,5 s, ou seja, um deslocamento de ±3px em 18 s, ida e volta. No grid, sem hover e sem movimento reduzido, `/lab` e `/portfolio` têm zero animações e `animation-name: none` em todos os `.art-drift` dos cards (REQ-011) |
| 4 | Com "reduzir movimento": nada se move e a arte aparece completa | PASS (automatizado e visual) | Com `reduced_motion=reduce`: `matchMedia` confirma a preferência, `animation-name: none` em `.art-banner .art-drift`, `document.getAnimations().length === 0`, 95 elementos no SVG da faixa, com caixa visível. Passar o mouse sobre `/lab` nessa condição não ativa nada (`data-active` ausente, sem `--mx`), porque o script não se registra. Captura `banner-reduced.png` mostra a órbita inteira |
| 5 | Com JavaScript desligado: arte completa e parada, sem erro | PASS (automatizado) | Contexto com JavaScript desabilitado: 8 SVGs em `/lab` (71 a 123 elementos cada), 7 em `/portfolio` (47 a 65), 1 na faixa do case (95). Zero mensagens de erro ou aviso no console nas três rotas, com e sem JavaScript |
| 6 | Em 320px: grid em uma coluna, sem rolagem horizontal | PASS (automatizado e visual) | Viewport 320×800: `/lab` e `/portfolio` com `grid-template-columns: 272px` e todos os itens na mesma coluna; `document.documentElement.scrollWidth === 320` em `/lab`, `/portfolio` e `/lab/amnesia-claude-code`. Confirmado também pelo `VIEWPORT 320 PASSED` |

Verificações extras feitas na mesma rodada:

- **Toque:** em contexto móvel com `has_touch`, `pointer: fine` é falso e um `pointermove`
  disparado no card não ativa o campo (REQ-008).
- **Arte decorativa:** todos os 15 SVGs têm `aria-hidden="true"`; o texto acessível de cada
  link é só título e data (por exemplo, `Amnesia 04/2026`) (REQ-005).
- **Cards:** cada card é um único link para a rota real (`/lab/<slug>`, `/portfolio/<slug>`),
  com arte em 346×195 no desktop, que é 16:9 (REQ-006). A faixa do case ocupa a largura do
  conteúdo em 21:9, acima do rótulo do bloco (REQ-007).

## Observações honestas das capturas

1. **Variação fraca dentro do mesmo motivo.** Os quatro motivos se distinguem entre si sem
   esforço, mas os sete cards de `/portfolio`, todos `flow`, parecem quase o mesmo desenho:
   o nó e a fila de pontos mudam pouco de posição e o leque muda só na densidade. Em `/lab`,
   `PortfolioSnap` e `Mousai` (ambos `wave`) também ficam muito parecidos, assim como
   `Tumodori` e `Hypr Switcher` (`terminal`). Os SVGs são distintos (REQ-014 coberto por
   teste), mas a diferença é de detalhe, não de relance. Não é requisito reprovado; fica
   como candidato a ajuste de parâmetros se o autor quiser mais identidade por case.
2. **O brilho da grade só aparece nas frestas.** A grade de pontos fica atrás dos cards
   (`z-index: -1`) e os cards têm fundo opaco, então o âmbar perto do cursor aparece apenas
   no espaço entre os cards e na margem do campo. Na captura de hover, o efeito é sutil: alguns
   pontos âmbar na borda superior do card ativo. O mecanismo funciona, mas se ele "se nota"
   ao mover o mouse é julgamento do autor, com o mouse na mão. O card sob o cursor também
   ganha borda e título em âmbar, que é o sinal mais visível do hover.
3. **Alturas desiguais na mesma linha do grid.** Em `/portfolio`, quando o título quebra em
   duas linhas (`Plataforma de data insights`, `Normalização de dados financeiros`), aquele
   card fica mais alto que o vizinho da mesma linha, e as bordas inferiores não se alinham
   (843px contra 816px na segunda linha). O `<li>` estica, mas o `<a>` não preenche a altura
   dele. Cosmético, não viola requisito; registrado para o autor decidir.
4. **Órbita fora do centro na faixa.** Em `/lab/amnesia-claude-code`, a órbita fica um pouco
   à esquerda do centro da faixa 21:9. É efeito da semente, não defeito, e a composição não
   parece quebrada.
5. **Fora do escopo desta feature, notado de passagem:** em 320px, o texto do case quebra
   linhas no meio da frase (`e o` / `erro só aparece`), porque o frontmatter em bloco `|`
   preserva as quebras do arquivo; e o item `CONTATO` da navegação cai para uma segunda linha.
   Ambos são anteriores a esta feature.

Nenhum motivo apareceu vazio, cortado ou quebrado em nenhuma das capturas.

## O que ainda pede os olhos do autor

- Se o brilho perto do cursor é percebido sem procurar (observação 2).
- Se o ritmo da faixa do topo é "devagar" o bastante para não competir com o título.
- Com o sistema real em "reduzir movimento" e com o JavaScript desligado no navegador do
  dia a dia: a emulação do Playwright cobre o contrato, mas não substitui um teste com as
  preferências do próprio sistema.
