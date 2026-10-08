# Spec: Arte generativa dos cases

> **Roadmap:** fora das sprints do MVP, feature visual pós-lançamento
> **PRD:** sem ID (derivada da identidade visual, como `theme-restyle`)
> **Status:** aprovada
> **Criado:** 2026-10-07

## Problem Statement

Nenhum dos 15 cases tem imagem, e as listagens são linhas de texto. O site vende um
engenheiro de ferramental de agentes e CLI, mas visualmente não mostra nada disso: o
visitante só encontra texto até abrir um case, e lá também não há nada além de texto.
Produzir e manter imagens à mão para cada case é caro, pesa no LCP (o post com GIF de
2,2 MB já tem Performance 75) e quebra a consistência da série a cada case novo.

## Goals

- Cada case tem uma arte única, gerada a partir do próprio conteúdo, sem arquivo de imagem.
- O tipo de trabalho é legível pelo desenho: um motivo por bloco.
- `/portfolio` e `/lab` passam a ser um grid de cards com a arte; a página do case ganha a arte no topo.
- Um efeito de ponteiro discreto (grade de pontos e paralaxe) dá vida ao site com no máximo 1,5 KB gzip de JavaScript.
- Sem JavaScript, em tela de toque e com movimento reduzido, a arte aparece completa e parada.
- Os portões existentes continuam passando, e o portão de JavaScript deixa de exigir zero script para aceitar só a exceção nomeada, com orçamento.

## Context

### O que existe

- O schema aceita `images` (`src/content/schemas/project.ts:34`), mas nenhum case o preenche.
- `/portfolio` e `/lab` renderizam `ListRow` dentro de `CollectionListing`, ordenados por data.
- A página do case (`CaseArticle`) abre com rótulo do bloco, título e resumo, sem visual.
- `ProjectCard` e `BlockSection` não são usados por nenhuma página. O `ProjectCard` ainda aponta
  para `/projetos/<slug>`, a rota legada que responde 301.
- O site não envia nenhum `<script>` executável ao navegador; os únicos são JSON-LD. O portão
  `tests/design-system/no-client-js.build-test.ts` exige zero `.js` em `dist/client/_astro`, mas não
  enxerga script inline no HTML. O CLAUDE.md o cita com a extensão errada (`no-client-js.test.ts`).
- O `global.css` zera animações e transições sob `prefers-reduced-motion: reduce`.

### O que esta feature reverte

- **`theme-restyle`** substituiu o grid de cards por linhas nas três listagens, chamando o grid
  de "a estrutura mais previsível possível". O argumento era contra o card genérico. Um card
  cuja arte é gerada a partir do próprio case não é genérico, então a decisão é revogada **só em
  `/portfolio` e `/lab`**. A home continua em linhas.
- **"Zero JavaScript de cliente no P0"** (CLAUDE.md) passa a "zero JavaScript exceto o efeito de
  ponteiro autorizado", por decisão do autor em 2026-10-07, com orçamento e lista de permissão
  verificados por portão.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| O schema de projeto aceita `images` opcional | `src/content/schemas/project.ts:34` (`images: z.array(imageSchema).optional()`) | sim |
| Os quatro blocos são `ai-tooling`, `ai-product`, `systems-cli`, `professional` | `src/content/blocks.ts:6` (`export const BLOCKS`) | sim |
| As listagens usam `ListRow` | `src/components/catalog/CollectionListing.astro:47` (`<ListRow`) | sim |
| Um teste trava "linhas, nunca cards" | `tests/catalog/collection-listing.test.ts:33` (`lists rows, never cards`) | sim |
| `theme-restyle` declarou a troca de cards por linhas | `docs/specs/theme-restyle/SPEC.md:25` (`Substituir o grid de cards`) | sim |
| `ProjectCard` aponta para a rota legada | `src/components/ui/ProjectCard.astro:18` (`href={\`/projetos/${slug}\`}`) | sim |
| O portão de hex reprova cor fora do arquivo de tokens | `tests/design-system/no-ad-hoc-values.test.ts:31` (`never hardcodes a hex color`) | sim |
| Movimento reduzido já zera animações globalmente | `src/styles/global.css:169` (`@media (prefers-reduced-motion: reduce)`) | sim |
| A página do case abre num `<header>` sem visual | `src/components/catalog/CaseArticle.astro:21` (`<header>`) | sim |
| O portão de JS exige zero `.js` em `dist/client/_astro` e não olha script inline | `tests/design-system/no-client-js.build-test.ts:11` (`ships no client-side JavaScript`) | sim |
| O CLAUDE.md cita o portão como `no-client-js.test.ts`, extensão errada | `CLAUDE.md:139` | sim |
| Astro empacota um `<script>` de componente como módulo próprio em `dist/client/_astro/` | comportamento documentado do Astro, conferir no primeiro build | assumption |

## Requirements

### P1 (MVP)

1. [REQ-001] QUANDO a arte de um case é gerada ENTÃO o sistema DEVE produzir um SVG a partir de `{ slug, block }` por função pura em `src/lib/art/`, sem acesso a rede, relógio ou aleatoriedade não semeada.
2. [REQ-002] QUANDO o mesmo `{ slug, block }` é gerado duas vezes ENTÃO o sistema DEVE produzir marcação idêntica byte a byte.
3. [REQ-003] QUANDO o bloco é `ai-tooling`, `ai-product`, `systems-cli` ou `professional` ENTÃO o sistema DEVE usar, respectivamente, o motivo órbita de nós, onda, linhas de terminal ou fluxo convergente, com parâmetros (contagem, raio, fase, densidade) derivados do slug.
4. [REQ-004] QUANDO a arte é gerada ENTÃO o sistema DEVE colorir os elementos só com tokens (`var(--color-*)`), nunca com hex, reservando `primary` a uma fração de 10% a 20% dos elementos, o "herói" do motivo, e o restante em `muted-foreground` e `border-strong`.
5. [REQ-005] QUANDO a arte é renderizada ENTÃO o sistema DEVE marcá-la como decorativa (`aria-hidden="true"`, sem foco), sem alterar o nome acessível do link que a contém.
6. [REQ-006] QUANDO `/portfolio` ou `/lab` renderiza ENTÃO o sistema DEVE exibir um grid de cards, um por case, cada um com a arte em 16:9, o título e a data, sendo o card inteiro um único link para a rota real do case (`/<coleção>/<slug>`).
7. [REQ-007] QUANDO a página de um case renderiza ENTÃO o sistema DEVE exibir a arte em faixa 21:9 acima do rótulo do bloco, na largura do conteúdo.
8. [REQ-008] QUANDO o visitante não tem JavaScript, usa tela de toque ou pede `prefers-reduced-motion: reduce` ENTÃO o sistema DEVE mostrar a arte completa e parada, sem efeito de ponteiro.
9. [REQ-009] QUANDO o ponteiro (`pointer: fine`) se move sobre o grid ou sobre a faixa do topo ENTÃO o sistema DEVE acender em `primary` os pontos de uma grade de fundo próximos ao cursor e apagá-los gradualmente quando o cursor se afasta, usando máscara CSS posicionada por variáveis escritas pelo script.
10. [REQ-010] QUANDO o ponteiro está sobre um card ou sobre a faixa do topo ENTÃO o sistema DEVE deslocar as camadas do SVG por `transform` proporcional à posição do cursor (`--mx`, `--my`) e à profundidade de cada camada (`--depth`), sem animar propriedade que dispare layout.
11. [REQ-011] QUANDO a página de um case está aberta e o movimento não é reduzido ENTÃO o sistema DEVE animar a faixa do topo com movimento lento e contínuo só em CSS; no grid, a arte DEVE ficar parada até o hover.
12. [REQ-012] QUANDO o build termina ENTÃO o sistema DEVE reprovar qualquer script executável em `dist/` que não seja o efeito de ponteiro, o efeito acima de 1,5 KB gzip, ou o efeito referenciado por rota fora de `/portfolio`, `/lab` e das páginas de case.
13. [REQ-013] QUANDO o portão de JavaScript é estendido ENTÃO ele DEVE ser provado vermelho com um script fora da lista de permissão, inclusive inline, antes de ser considerado pronto.

### P2 (Should Have)

14. [REQ-014] QUANDO os slugs publicados são gerados ENTÃO o sistema DEVE garantir que nenhum par de cases produza o mesmo SVG.
15. [REQ-015] QUANDO uma arte é gerada ENTÃO ela DEVE ficar abaixo de um teto de elementos (200 no card, 300 na faixa), para o HTML das listagens não inchar.
16. [REQ-016] QUANDO a feature é entregue ENTÃO o `ProjectCard` e o `BlockSection` mortos DEVEM ser removidos, e o CLAUDE.md (incluindo o nome correto do portão, `no-client-js.build-test.ts`) e o `theme-restyle` DEVEM registrar a revogação.

### P3 (Nice to Have)

17. [REQ-017] QUANDO o efeito de ponteiro é removido do componente que o carrega ENTÃO o site DEVE continuar idêntico, salvo a ausência do efeito, sem nenhuma outra alteração necessária.

## Edge Cases

- **Slug com uma palavra ou muito curto:** a semente vem de um hash do slug inteiro, não das palavras, então `forja` e `konfi` geram desenhos distintos.
- **Bloco novo adicionado a `BLOCKS`:** o mapa bloco→motivo é exaustivo por tipo; um bloco sem motivo falha o type-check, nunca renderiza vazio.
- **Colisão de hash entre dois slugs:** REQ-014 reprova; a correção é no gerador (mais entropia), nunca renomear o case.
- **Case descontinuado ou confidencial:** recebe arte como qualquer outro; os selos continuam na página do case.
- **Case com `images` preenchido no futuro:** card e topo continuam com a arte, para a série não quebrar; as imagens reais aparecem no corpo do case.
- **Toque:** sem `:hover` persistente, a arte do card nunca anima; a faixa do topo anima, salvo movimento reduzido.
- **Cursor sai da janela ou do container:** o script devolve as variáveis ao repouso e a grade apaga pela transição CSS.
- **Muitos eventos de movimento:** o script agrega por `requestAnimationFrame` e escreve no máximo uma vez por quadro.
- **Coleção vazia:** o estado vazio explícito de `CollectionListing` continua.
- **Script empacotado inline pelo Astro** (se ficar abaixo do limiar de inline): o portão de REQ-012 precisa enxergar scripts inline no HTML também, não só arquivos em `_astro/`.

## Architecture Decisions

- **SVG no build por funções puras, não canvas no navegador.** A arte existe no HTML que agentes, Lighthouse e quem não tem JS veem; é testável como o resto de `lib/`. Canvas descartado: dezenas de KB de JS e nada visível sem ele.
- **Não um `.astro` por motivo.** Lógica de desenho dentro de template é o que o CLAUDE.md aponta como lugar errado; o componente só injeta a string.
- **Gerador pseudoaleatório semeado pelo hash do slug.** Mesma entrada, mesmo desenho, entre builds e máquinas.
- **O JS só escreve variáveis CSS (`--gx`, `--gy`, `--mx`, `--my`).** Os quatro motivos reagem por CSS e `--depth`; um script serve a todos e fica pequeno. Repulsão elemento a elemento descartada: JS por motivo e dezenas de elementos por quadro.
- **Grade de pontos por `radial-gradient` com máscara**, não canvas: zero desenho em JS.
- **Paralaxe, não repulsão.** Escolha do autor; mantém o JS desacoplado dos motivos.
- **Movimento contínuo só na faixa do topo.** Quinze animações simultâneas no grid cansam a vista e custam bateria.
- **Card mínimo (arte, título, data).** Escolha do autor; resumo e tecnologias ficam na página do case.
- **Revogação parcial de `theme-restyle`.** Cards só em `/portfolio` e `/lab`; a home mantém a densidade em linhas.
- **Portão de JavaScript estendido para lista de permissão com orçamento**, não só limite total nem portão novo: o existente passa a enxergar script inline e a aceitar uma única exceção nomeada, o que impede que o primeiro script vire precedente silencioso para o segundo.

## Constraints

- Cores só por token; nenhum hex fora do arquivo de tokens; nenhum valor arbitrário fora da escala do Tailwind além dos já aceitos pelo portão.
- Animar só `transform`, `opacity` e cor; durações dos tokens `fast` e `base` para transições; animação contínua do topo lenta o bastante para não competir com o texto.
- Contraste: a arte é decorativa, mas texto sobre ou ao lado dela continua cumprindo 4,5:1.
- Um único CTA primário na home continua; esta feature não toca a home.
- JavaScript total da feature: no máximo 1,5 KB gzip, só nas rotas permitidas.
- Lighthouse das rotas medidas em 2026-08-10 não pode cair abaixo de 90 por causa desta feature.

## Out of Scope

| Item | Motivo |
|------|--------|
| Faixa de status e cursor piscando (detalhes de terminal) | Feature separada, decidida fora desta |
| Arte como imagem de Open Graph | É a F10 (`dynamic-og-images`) |
| Arte ou grid na home | A home mantém as linhas do `theme-restyle` |
| Retrato animado do autor | Depende de foto, que não existe |
| Repulsão elemento a elemento | Descartada em favor da paralaxe |
| Links externos dentro do card | Card é um link único; links externos ficam na página do case |

## Test Strategy

- **Unit (`src/lib/art/`):** determinismo (REQ-002); um motivo por bloco (REQ-003); ausência de hex e fração de `primary` entre 10% e 20% (REQ-004); `aria-hidden` (REQ-005); teto de elementos (REQ-015); unicidade sobre os slugs publicados (REQ-014).
- **Componente (`experimental_AstroContainer`):** `CollectionListing` renderiza cards com arte, título e data e link para a rota real (REQ-006), substituindo "lists rows, never cards"; `CaseArticle` com a faixa antes do rótulo (REQ-007).
- **Build (`*.build-test.ts`):** portão de JavaScript com lista de permissão, orçamento gzip e rotas (REQ-012), provado vermelho (REQ-013).
- **CSS:** asserção de fonte de que as regras de animação e de ponteiro estão sob `@media (prefers-reduced-motion: no-preference)` e `(pointer: fine)` (REQ-008, REQ-011).
- **Manual:** checagem visual dos quatro motivos no navegador, hover no grid, faixa do topo animando e parando com movimento reduzido; registro em `docs/reviews/generative-case-art-manual-check.md`.
- **Regressão:** `npm run verify`, `verify-keyboard.sh` e `verify-viewport-320.sh` verdes; Lighthouse das três rotas de 2026-08-10 remedido.

## Grilling Log

Decisões levantadas e resolvidas na rodada de grilling (teste de pressão antes de construir).

| # | Decisão | Resolução | Racional |
|---|---------|-----------|----------|
| 1 | Onde a arte aparece | Grid em `/portfolio` e `/lab` + faixa no topo do case; home em linhas | Visível antes do clique sem tirar a densidade da home |
| 2 | Revogar "linhas, nunca cards" do `theme-restyle` | Sim, só em `/portfolio` e `/lab` | O argumento era contra o card genérico; a arte gerada é o diferencial |
| 3 | Como a arte é determinada | Um motivo por bloco, variado pelo slug | O desenho comunica o tipo de trabalho e nunca se repete |
| 4 | Conteúdo do card | Mínimo: arte, título, data | Escolha do autor; mais visual |
| 5 | Efeito de mouse | Grade de pontos que acende + paralaxe das camadas | Junção pedida pelo autor, com JS desacoplado dos motivos |
| 6 | Movimento sem interação | Contínuo só no topo do case; grid só no hover | Quinze animações simultâneas cansam e custam bateria |
| 7 | Controle do JS | Estender o portão existente: lista de permissão, 1,5 KB gzip, rotas restritas, script inline incluído | Exceção deliberada, nunca precedente acidental |
| 8 | Linguagem visual | Pontos e traços neutros, âmbar só no herói (10% a 20%) | Regra de série; o âmbar continua sendo sinal |
| 9 | Proporção do topo | Faixa 21:9 acima do título | Título e resumo continuam na primeira tela |
| 10 | Acessibilidade da arte | Decorativa (`aria-hidden`) | O título já nomeia o link; evita 15 "imagem" no leitor de tela |
| 11 | Imagens reais futuras | Arte sempre no card e no topo; imagens no corpo | A série não quebra |
| 12 | `ProjectCard` e `BlockSection` mortos | Substituídos e removidos | Código morto com link para rota legada |

## Requirement Traceability

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| REQ-001 | SVG por função pura de `{ slug, block }` | P1 | Pending |
| REQ-002 | Determinismo byte a byte | P1 | Pending |
| REQ-003 | Um motivo por bloco, parâmetros do slug | P1 | Pending |
| REQ-004 | Só tokens; `primary` em 10% a 20% | P1 | Pending |
| REQ-005 | Arte decorativa | P1 | Pending |
| REQ-006 | Grid de cards em `/portfolio` e `/lab` | P1 | Pending |
| REQ-007 | Faixa 21:9 no topo do case | P1 | Pending |
| REQ-008 | Sem JS, toque ou movimento reduzido: parada e completa | P1 | Pending |
| REQ-009 | Grade de pontos que acende perto do cursor | P1 | Pending |
| REQ-010 | Paralaxe por `--mx`, `--my`, `--depth` | P1 | Pending |
| REQ-011 | Movimento contínuo só no topo | P1 | Pending |
| REQ-012 | Portão de JS estendido: lista de permissão, 1,5 KB, rotas | P1 | Pending |
| REQ-013 | Portão provado vermelho | P1 | Pending |
| REQ-014 | Unicidade entre cases publicados | P2 | Pending |
| REQ-015 | Teto de elementos | P2 | Pending |
| REQ-016 | Remover código morto e registrar revogação | P2 | Pending |
| REQ-017 | Efeito removível por um import | P3 | Pending |
