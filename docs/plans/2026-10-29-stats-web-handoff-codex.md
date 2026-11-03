# Handoff: `stats-web` para o Codex (tarefas 18 a 21)

> **Plano:** docs/plans/2026-10-29-stats-web.md
> **Spec:** docs/specs/stats-web/SPEC.md
> **Estado:** docs/specs/stats-web/STATE.md (ledger por tarefa)
> **Escrito em:** 2026-10-29, depois que o Grok parou no limite semanal de tokens

## Onde o Grok parou (verificado)

| Item | Situação | Evidência |
|---|---|---|
| T1 a T17 | Implementadas e commitadas, de `1817cb9` a `4e33f1b` | `git log --oneline 5bb598d..HEAD` |
| Portão da feature em `4e33f1b` | Verde | `cargo fmt --check` ok, `cargo clippy --all-targets -- -D warnings` ok, `cargo test`: `test result: ok. 185 passed` |
| T18 | Step 1 feito, Step 2 não rodado: `tools/stats/e2e/check_web.py` existe sem commit e é idêntico ao do plano | `diff` contra o bloco do plano: nenhuma diferença |
| T19, T20, T21 | Não começadas | `deploy/stats/`, `scripts/deploy-stats.sh` e `tests/config/stats-deploy.test.ts` não existem |
| Revisão | Nenhuma tarefa revisada | coluna "Revisão" do ledger |

### A T18 já está vermelha, e a causa foi encontrada

```
AssertionError: FAIL: live/last30 scrolls sideways by 534px at 360px
```

Medido a 360 px, depois de a página assentar (cerca de 600 ms), as abas rolam para o lado:

| Aba | Rolagem lateral |
|---|---|
| `live` (`day` e `last30`) | 534 px |
| `funnel&span=last30` | 48 px |
| `traffic&span=last30` | 227 px |

**Causa raiz:**
1. Os `<span class="sr-only">` ficam dentro de links nas tabelas: "(abre em outra aba)", "(filtrar)" e "o lead de ...".
2. Eles são `position: absolute`.
3. O bloco de contenção de um elemento absoluto é o ancestral posicionado mais próximo, e nenhum ancestral é posicionado. Então o `span` escapa do `overflow-x: auto` do `.scroll` e alarga o documento inteiro.

**Correção, provada no navegador:** acrescentar `position: relative` ao `.scroll` em `tools/stats/assets/app.css`. Com isso a rolagem cai para 0 px em `live`, `funnel` e `traffic`.

```css
.scroll { position: relative; overflow-x: auto; }
```

**Ponto de atenção do teste:** a primeira medição, feita logo depois do `goto`, deu 0 px na aba `live`. O layout não tinha assentado, então o `check_web.py` pode passar por sorte. Antes de medir, espere o `load` e meça duas vezes, com 500 ms de intervalo, ficando com o maior valor:

```python
page.goto(f"{base}?tab={tab}&span={span}")
page.wait_for_load_state("load")
measure = "document.documentElement.scrollWidth - window.innerWidth"
first = page.evaluate(measure)
page.wait_for_timeout(500)
wide = max(first, page.evaluate(measure))
assert wide <= 0, f"FAIL: {tab}/{span} scrolls sideways by {wide}px at 360px"
```

A CSP do painel bloqueia estilo inline (`style-src 'self'`), então `page.add_style_tag` falha. Para experimentar CSS no navegador, use o CSSOM (`el.style.position = 'relative'`) ou edite o `app.css` e recompile.

## Regras para o Codex

1. **NÃO rode nenhum comando git** (commit, push, branch, merge, add, stash, checkout, reset). **NÃO invoque a skill git-commit.** Quem commita é o Claude, depois de conferir o seu relatório. O "Step 5: Commit" de cada tarefa do plano não é seu: pule-o.
2. Leia antes de começar: `CLAUDE.md` da raiz do repositório, a spec e as tarefas 18 a 21 do plano (seções "Task 18" a "Task 21").
3. Tudo roda da raiz do repositório (`~/dev/projects/nandomoreira.dev`).
4. TDD em toda tarefa: o teste fica vermelho antes da implementação. A T18 já está vermelha pela causa acima.
5. Portão depois de cada tarefa. A evidência é a linha impressa, nunca o código de saída de um pipeline:
   - `cargo fmt --manifest-path tools/stats/Cargo.toml --check`
   - `cargo clippy --manifest-path tools/stats/Cargo.toml --all-targets -- -D warnings`
   - `cargo test --manifest-path tools/stats/Cargo.toml` (`test result: ok`)
   - `npm test`, nas tarefas que criam `tests/config/*.test.ts`
6. Nunca relaxe um portão ou um teste para fazê-lo passar. Corrija o código.
7. Não mexa em arquivos fora das tarefas. `src/content/posts/aeo-vs-seo-sera-que-o-seo-morreu.md` e `src/assets/posts/2026/aeo-painel-ao-vivo.webp` são rascunhos do autor, sem commit.
8. Nunca leia, imprima ou copie uma chave de conta de serviço. Ela não existe nesta máquina e não deve existir no repositório.

## O que já se sabe sobre o código (ledger do Grok)

- O askama 0.16 escapa `&` como `&#38;` e `<` como `&#60;`; os testes aceitam as duas formas.
- Os templates usam `{% call m::x(...) %}{% endcall %}`, que é a forma que compila nesta versão.
- `LeadDetail::pages` é uma tupla `(hora, caminho)`.
- `tick` e `wake` do `Hub` são `pub(crate)`.
- Módulos de teste filhos não herdam os `use` do pai: cada um importa o que usa.
- `cargo audit`: sem vulnerabilidade. Há um aviso permitido, RUSTSEC-2026-0374 (`basic-toml` sem manutenção, transitivo do askama).
- Um literal Rust com `"#` precisa de `r##"..."##`.

## Tarefas restantes

### T18: e2e no navegador

Siga a "Task 18" do plano a partir do Step 2, com o que está acima:

1. Rode o script e confirme a falha (`live/last30 scrolls sideways by 534px`).
2. Aplique a espera antes de medir no `check_web.py`. Rode de novo e confirme que continua vermelho, agora de forma estável.
3. Aplique `position: relative` no `.scroll`.
4. Rode até a última linha ser `STATS WEB E2E PASSED`.
5. Se outra asserção falhar depois da rolagem (primeira parada do Tab, contorno de foco, controle sem nome, navegação do mês, URL depois do reload), investigue a causa da mesma forma antes de mudar template ou CSS. Nenhuma dessas quatro rodou ainda.

```bash
cargo build --manifest-path tools/stats/Cargo.toml
uv run --with 'playwright>=1.48,<2' python -I tools/stats/e2e/check_web.py tools/stats/target/debug/stats 7899
```

O navegador é o Chromium do sistema (`/usr/bin/chromium`); o `uv` não baixa navegador. A porta 7899 precisa estar livre.

### T19: imagem e compose

A "Task 19" do plano vale como está: teste em `tests/config/stats-deploy.test.ts`, depois `deploy/stats/Dockerfile`, `deploy/stats/compose.yml` e a linha `tools/stats/target` no `.dockerignore`.

- Teste: `npx vitest run tests/config/stats-deploy.test.ts` (`Tests  8 passed (8)`).
- O Docker existe nesta máquina, então rode também a prova de build: `docker build -f deploy/stats/Dockerfile -t stats-web:check . && docker run --rm stats-web:check stats --help`. A ajuda precisa listar o subcomando `web`.
- Se o `aws-lc-sys` falhar no build da imagem por falta de ferramenta, o `cmake clang` do Dockerfile é a correção prevista. Registre no relatório o que precisou.

### T20: `scripts/deploy-stats.sh`

A "Task 20" do plano vale como está: os testes novos no mesmo arquivo de vitest, o script e o `chmod +x`.

- Teste: `npx vitest run tests/config/stats-deploy.test.ts && bash -n scripts/deploy-stats.sh && echo SYNTAX OK` (`Tests  13 passed (13)` e `SYNTAX OK`).
- **Não rode o `deploy-stats.sh`.** Ele precisa da chave no homelab e da rede de casa, e é um passo do autor.

### T21: documentação

A "Task 21" do plano: seção "Painel web" no `tools/stats/README.md`, com a subseção "Segurança", as linhas no `CLAUDE.md` e o parágrafo em "Homologação no homelab".

- No `STATE.md`, **não** marque `implement-complete`: deixe `phase: implement` até a revisão. Preencha as linhas T18 a T21 do ledger com `Codex`, os testes e `commit: pendente (Claude)`.
- Texto em pt-BR com acentuação correta, sem travessão ou meia-risca em apostos (use vírgula, ponto, ponto e vírgula ou parênteses).
- Depois rode a skill `docs-guardrails` no `tools/stats/README.md`, se ela estiver disponível, e corrija o que apontar.

## Relatório que o Codex devolve

Para cada tarefa (T18 a T21):

- os arquivos criados e modificados;
- a saída que prova o vermelho e a que prova o verde (as linhas `test result`, `Tests ... passed`, `STATS WEB E2E PASSED`, `SYNTAX OK`, a ajuda do `docker run`);
- qualquer desvio do plano e o motivo.

No fim, o portão completo uma última vez (fmt, clippy, `cargo test`, `npm test`), com as linhas de evidência.

## Depois do Codex (fica com o Claude e com o autor)

1. O Claude confere o relatório, roda o portão de novo e commita T18 a T21, uma tarefa por commit.
2. Revisão de T1 a T21 com `/rpi-review stats-web`, por um revisor que não implementou: nem o Grok (T1 a T17) nem o Codex (T18 a T21).
3. O autor faz os passos manuais (conta de serviço `stats-reader`, chave no homelab e split DNS no Tailscale) e roda `bash scripts/deploy-stats.sh`, que precisa terminar em `STATS DEPLOY PASSED`.
