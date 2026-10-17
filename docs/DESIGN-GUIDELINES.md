# nandomoreira.dev - Design Guidelines

> **Status:** approved
> **Criado:** 2026-08-07
> **Documentos relacionados:** BRIEF.md, PRD.md, MVP-SCOPE.md

---

## Design Philosophy

### Princípios

1. **A evidência vem antes da afirmação.** Todo bloco visual existe para sustentar
   um case, um número ou um artefato. Seção sem evidência por trás não entra.
2. **Uma ação primária por dobra.** Dois botões de mesmo peso dividem a atenção e
   derrubam a conversão dos dois.
3. **Densidade técnica é a estética.** O público lê código o dia inteiro. Texto
   monoespaçado, tabela e dado concreto comunicam competência melhor que
   ilustração.
4. **Sem JavaScript de cliente até que uma feature exija.** O P0 é estático e SSR.
   Performance aqui não é otimização posterior, é decisão de arquitetura.

Cada princípio permite dizer não a alguma coisa. É esse o teste.

### Estilo visual

| Atributo | Escolha | Descartado |
|----------|---------|------------|
| Modo | Escuro exclusivo | Alternância claro/escuro, que dobra o teste visual sem servir ao público |
| Densidade | Confortável, com respiro generoso entre seções | Compacta, que dificulta o escaneamento |
| Temperatura | Neutra fria, com um único acento quente | Paleta multicolorida |
| Personalidade | Terminal técnico | Editorial minimalista; brutalista verde fósforo; claro editorial |

**Sobre o risco assumido:** terminal escuro com acento âmbar é o clichê do
portfólio de desenvolvedor. A diferenciação aqui não vem da paleta e sim do
conteúdo (cases com decisão explicada) e da camada de máquina. A escolha é
deliberada por coerência com o acervo de CLI e tooling, não por falta de
alternativa.

### Referências

| Produto | O que aproveitar |
|---------|------------------|
| Linear | Hierarquia tipográfica e contenção no uso de cor |
| Vercel | Tratamento de superfícies escuras com borda em vez de sombra |
| Raycast | Densidade de informação sem poluição |
| `rubenmarcus.dev` | Estrutura de navegação e a existência de uma seção dedicada a agentes |

---

## Color System

Tokens semânticos. Nenhuma cor solta em componente.

### Paleta base

Desde 2026-10-16 a paleta é a **Terminal Noir**, do redesign feito no Stitch
(`docs/specs/terminal-noir-redesign/`), no lugar da rampa quente do tema
Exquisitus. Superfícies neutras e frias, separadas por degraus de luminância, e
todo o calor concentrado no acento âmbar. Os valores são hex sRGB porque o portão
de contraste lê hex.

Duas cores do arquivo do Stitch reprovam e **não foram copiadas**: o `text-muted`
(`#71717A`, 4,07:1) e o `border-strong` (`#3F3F46`, 1,88:1). O texto secundário
usa o `text-secondary` do Stitch, e o contorno forte foi clareado até passar de 3:1.

| Token | Valor | Uso |
|-------|-------|-----|
| `background` | `#0b0b0c` | Fundo da página |
| `surface` | `#121214` | Cards, painéis |
| `surface-elevated` | `#18181b` | Popovers, elementos flutuantes |
| `border` | `#222226` | Divisores e contornos decorativos |
| `border-strong` | `#6b6b74` | Contorno de elemento em foco ou hover, campo de formulário |
| `foreground` | `#f4f4f5` | Texto primário |
| `muted-foreground` | `#a1a1aa` | Texto secundário, metadados |

### Acento

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#f5a623` | CTA, links, comandos, indicador de foco |
| `primary-foreground` | `#0b0b0c` | Texto sobre o acento |

**Por que âmbar:** continuidade com a identidade original. O Terminal Noir voltou
ao âmbar saturado, mais perto do `#f59e0b` original do que do mel do Exquisitus.
Continua sendo a decisão mais barata de trocar, já que existe num único token.

### Semânticas

| Token | Valor | Uso |
|-------|-------|-----|
| `success` | `#34d399` | Estado disponível, build passando |
| `warning` | `#facf9e` | Aviso, projeto arquivado |
| `destructive` | `#ffb7b0` | Erro de formulário, estado de falha |

`success` é o esmeralda do Stitch; `warning` e `destructive` mantêm as rampas
claras anteriores, que leem bem sobre quase preto.

### Contraste verificado

Calculado sobre `background` (`#0b0b0c`), fórmula de luminância relativa WCAG 2.1.

| Par | Razão | Situação |
|-----|-------|----------|
| `foreground` sobre `background` | 17,90:1 | Aprova AA e AAA |
| `muted-foreground` sobre `background` | 7,68:1 | Aprova AA e AAA |
| `muted-foreground` sobre `surface` | 7,30:1 | Aprova AA e AAA |
| `primary` sobre `background` | 9,71:1 | Aprova AA e AAA |
| `primary` sobre `surface` | 9,23:1 | Aprova AA e AAA |
| `primary-foreground` sobre `primary` | 9,71:1 | Aprova AA e AAA (texto do botão) |
| `success` sobre `background` | 10,23:1 | Aprova AA e AAA |
| `warning` sobre `background` | 13,57:1 | Aprova AA e AAA |
| `destructive` sobre `background` | 11,85:1 | Aprova AA e AAA |
| `border-strong` sobre `background` | 3,73:1 | Aprova 3:1 para componente gráfico |
| `border` sobre `background` | **1,24:1** | **Reprova.** Ver regra abaixo |

**Regra decorrente:** `border` (`#222226`) tem contraste de 1,24:1 e portanto
**nunca pode ser o único meio de transmitir informação ou delimitar um alvo
interativo**. Serve como separador decorativo. Contorno que precisa ser percebido
(campo de formulário, elemento em foco) usa `border-strong` ou `primary`.

### Regras de uso

- O acento é reservado para ação, link e foco. Nunca decoração.
- Nenhuma informação transmitida apenas por cor: bloco do catálogo e estado de
  projeto sempre acompanham rótulo textual.
- Texto secundário nunca abaixo de `muted-foreground`. Cinzas mais escuros que
  isso reprovam sobre `surface`.

### Modo leitura (2026-10-16)

O post tem um modo leitura: um switch sob o título esconde cabeçalho, menu,
trilha, imagem principal, posts relacionados, rodapé e a grade de pontos, e fixa
no canto os controles de fundo, tamanho do texto, entrelinha e largura. É a
única exceção ao escuro exclusivo, e vale só dentro do modo.

| Fundo | `background` | `foreground` | `primary` |
|---|---|---|---|
| Escuro | o do site | o do site | o do site |
| Preto | `#000000` | `#e6e2d9` | `#f5a623` |
| Sépia | `#f4ecd8` | `#3b2f22` | `#8a5300` |
| Claro | `#fbfaf7` | `#1c1a17` | `#865700` |

- Cada fundo reaponta os tokens de cor, então links, código inline e controles
  acompanham. Os blocos de código mantêm as cores do Shiki.
- O estado é CSS (switch e radios com `:has()`). O script do site só guarda as
  escolhas no `localStorage` e sai do modo com Esc; sem JavaScript, o modo
  funciona e esquece as escolhas ao recarregar.
- Tamanho, entrelinha e largura são steppers: − à esquerda, + à direita e o
  valor em px no meio. Cada passo é um radio, e − e + são rótulos dos vizinhos;
  no teclado, as setas andam pelos passos.
- Tamanho do texto de 14 a 28px, de 2 em 2 (padrão 18): escala a fonte da raiz,
  como o zoom do navegador, para o texto cair no px escolhido.
- Entrelinha de 1,3 a 2,1 vezes o texto (padrão 1,7), mostrada em px do tamanho
  escolhido, arredondada pelo contador do CSS.
- Largura da coluna de 480 a 960px, de 80 em 80 (padrão 640), nunca maior que a
  tela.

---

## Typography

### Famílias

| Papel | Fonte | Token | Fallback | Pesos |
|-------|-------|-------|----------|-------|
| Títulos | Newsreader | `--font-serif` | Georgia, Times New Roman, serif | 400 a 500 (variável) |
| Corpo, interface e registro | Inter | `--font-sans` | system-ui, sans-serif | 400 a 600 (variável) |
| Código, comando, dado | JetBrains Mono | `--font-mono` | ui-monospace, monospace | 400, 500 |

Desde 2026-10-16 (Terminal Noir), no lugar de Literata e Alegreya Sans. **Uma
fonte por trabalho**: a serifada editorial dá peso aos títulos, a sem serifa
carrega o corpo e o chrome, a monoespaçada carrega a voz de máquina.

Newsreader e Inter são fontes variáveis, um arquivo cada, cortadas aos eixos que o
site usa: Newsreader com peso de 400 a 500 e tamanho óptico de 24 a 72 (o menor
título tem 20px), Inter de 400 a 600. **Título em serifa pede peso 400 ou 500**:
um `font-semibold` cai para 500, o teto do arquivo.

**Onde cada uma aparece:**

| Superfície | Família |
|------------|---------|
| `h1` do hero, título de página, de post e de case, títulos de seção do texto longo | Newsreader |
| Corpo de post, de case e de página de texto (via `Prose`), parágrafos de apoio, resumos, rótulos de botão, texto de interface | Inter |
| Navegação, sobrescrito de seção, data, tecnologias, contador, código | JetBrains Mono |

**Carregamento:** fontes servidas localmente com `font-display: swap` e subset
latino. Nenhuma requisição a host externo, tanto por performance quanto por não
vazar visita a terceiros.

### Escala

| Token | Tamanho | Line-height | Uso |
|-------|---------|-------------|-----|
| `display` | 3rem / 3.75rem em desktop | 1.1 | Headline do hero |
| `h1` | 2.25rem | 1.2 | Título de página |
| `h2` | 1.5rem | 1.3 | Seção |
| `h3` | 1.25rem | 1.4 | Subseção, título de card |
| `body` | 1rem | 1.625 | Corpo |
| `prose` | 1.125rem | 1.7 | Corpo de texto longo (`Prose`) |
| `code-inline` | 0.875em | herda | Código em linha dentro do texto |
| `small` | 0.875rem | 1.5 | Metadado, legenda |
| `mono` | 0.875rem | 1.6 | Código e endpoint em linha |

O corpo de texto longo é sem serifa, 18px/1.7, desde 2026-10-15 (o autor comparou
com o corpo em serifa e a sem serifa leu melhor no fundo escuro). Desde 2026-10-16
a sem serifa é a Inter.

**Medida de linha:** 65 a 75 caracteres no corpo dos cases. É o texto que a persona
principal realmente lê, e é onde a legibilidade decide se ela termina a leitura.

---

## Spacing Scale

| Token | Valor | Uso típico |
|-------|-------|------------|
| `xs` | 0.25rem | Entre ícone e rótulo |
| `sm` | 0.5rem | Interno de badge |
| `md` | 1rem | Padding padrão de componente |
| `lg` | 1.5rem | Padding de card, entre parágrafos |
| `xl` | 2.5rem | Entre blocos dentro de uma seção |
| `2xl` | 4rem | Entre seções em mobile |
| `3xl` | 6rem | Entre seções em desktop |

Nenhum valor fora da escala. Espaçamento ad hoc é a causa mais comum de um site
parecer inacabado sem que se saiba dizer por quê.

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `sm` | 0.25rem | Badge, tag de tecnologia |
| `md` | 0.375rem | Botão, input, card |
| `lg` | 0.5rem | Painel, bloco de código |
| `full` | 9999px | Avatar, indicador de status |

---

## Elevação

| Nível | Técnica | Uso |
|-------|---------|-----|
| 0 | Sem borda | Fundo da página |
| 1 | `surface` com borda 1px `border` | Card de projeto |
| 2 | `surface-elevated` com borda 1px `border-strong` | Popover, tooltip |
| 3 | `surface-elevated`, borda e overlay no fundo | Modal |

Em interface escura, borda comunica elevação melhor que sombra: sombra sobre fundo
quase preto praticamente não aparece e só custa pintura.

---

## Componentes

Sem biblioteca de UI no P0. Componentes escritos em Astro, já que nenhum precisa de
estado no cliente. Quando F11 introduzir a primeira ilha, ela é isolada e não
arrasta uma biblioteca inteira junto.

| Componente | Uso | Variantes | Observação |
|------------|-----|-----------|------------|
| `Button` | CTA, download | primary, secondary, ghost | Alvo de toque mínimo 44px; `primary` acende o halo `--shadow-glow` no hover (único brilho do sistema); `arrow` põe uma seta que avança no hover |
| `ProjectCard` | Item do catálogo | com imagem, sem imagem | Fallback determinístico quando não há imagem |
| `TechBadge` | Tecnologia no card | — | Sempre com rótulo textual, nunca só cor |
| `SectionHeader` | Título de seção | — | Numeração opcional no estilo terminal |
| `CodeBlock` | Endpoint, payload de exemplo | — | Monoespaçado, com rótulo de linguagem |
| `StatItem` | Número da trajetória | — | Número em Newsreader (`text-h1`, acento), mais rótulo e contexto; nunca número solto |
| `Prose` | Corpo do case | — | Medida de linha limitada |
| `Card` | Superfície elevada (camada 1) | `interactive` | `surface` com fio `border`; interativo sobe o fio para `border-strong` no hover. Sem sombra |
| `TerminalWindow` | Janela de terminal (camada 2) | — | Barra com três pontos, nome do arquivo e slot `actions`; corpo em `background` |
| `StatusDot` | Ponto de disponibilidade | status | Cor do status por `currentColor`; pulsa só enquanto disponível |

### Tags globais são estilizadas no CSS, não na marcação

`html` e `body` recebem seu estilo por `@apply` dentro de `@layer base`, em
`src/styles/global.css`. Nenhum componente pode colocar `class` nessas duas tags.

```css
@layer base {
  html {
    @apply scheme-dark;
  }

  html,
  body {
    @apply min-h-dvh font-sans overflow-x-hidden bg-background text-foreground;
  }
}
```

**Por quê:** `html` e `body` existem uma vez por página e não têm variante. Quando o
estilo delas mora numa string de classe dentro do layout, ele vira invisível para
quem lê o CSS, some junto se alguém editar a marcação por outro motivo (foi o que
aconteceu ao remover `overflow-x-hidden` sem querer), e não há como um segundo
layout herdar a mesma base sem duplicar a string. No CSS a regra é única, legível e
impossível de perder de vista.

**Escopo da regra:** vale **apenas** para tags puras e globais, ou seja, elementos
sem variante que existem uma única vez no documento (`html`, `body`, e o reset de
`*`). Não vale para componente. Um `Button` com três variantes e cinco estados
continua compondo utilitários na marcação, que é onde a variação é legível. `@apply`
em componente recria o problema que o Tailwind existe para resolver: uma segunda
camada de nomes que precisa ser mantida em paralelo com o uso.

O portão está em `tests/design-system/global-tags.test.ts`.

### Estados obrigatórios

Todo elemento interativo: `default`, `hover`, `focus-visible`, `active`,
`disabled`.

Toda listagem: `com conteúdo`, `vazio`. O catálogo nunca renderiza vazio em
produção, porém o estado existe para desenvolvimento e para falha de dado.

### Fallback de imagem

Card sem imagem recebe um bloco gerado a partir do slug do projeto: fundo `surface`,
borda, e as iniciais em monoespaçado. Determinístico, ou seja, o mesmo projeto
sempre produz o mesmo visual. Nunca um espaço vazio ou um ícone genérico de imagem
quebrada.

---

## Motion

| Token | Duração | Easing | Uso |
|-------|---------|--------|-----|
| `fast` | 150ms | ease-out | Hover, mudança de cor |
| `base` | 250ms | ease-out | Entrada de elemento, revelação em scroll |
| `slow` | 500ms | ease-out | Transição de página, entrada dos blocos da página, sublinhado do menu |

Três durações apenas (a `slow` entrou em 2026-10-15, porque 250ms deixava a entrada e o sublinhado rápidos demais). Mais que isso ninguém aplica com consistência.

**Regras:**

- Não animar propriedades que disparam layout ou reflow (`width`, `height`, `top`,
  `left`, `margin`, `padding`). Permitido: `transform`, `opacity` e propriedades de
  cor (`color`, `background-color`, `border-color`), que é o que o token `fast`
  existe para cobrir. Alvo de 60fps.
- `prefers-reduced-motion: reduce` remove o movimento e mantém a mudança de estado.
  Não é opcional: é requisito de acessibilidade e o site já se compromete com WCAG AA.
- Nenhuma animação atrasa a leitura do conteúdo. A única entrada a partir do
  invisível é a da página (decisão do autor em 2026-10-15): os elementos sobem
  1.5rem com fade, de cima para baixo, em cinco níveis. O nível soma a posição do
  bloco em `<main>` (0, 2, 3, 4; o segundo começa em 2 para que um cabeçalho curto
  termine antes do bloco de baixo) com a posição do elemento dentro do bloco, até
  4. Cada nível dura de 0,8 a 1,6 vez o `slow` (400 a 800ms) e começa 100ms depois
  do anterior, então o topo está legível em 400ms e o último nível termina em
  1,2s. Os `<script>` dentro de `<main>` não contam posição.
- **Navegação entre páginas** usa View Transitions entre documentos
  (`@view-transition { navigation: auto }`), só CSS: a página que sai some subindo,
  a que entra aparece por fade, e o cabeçalho (`view-transition-name: site-header`)
  fica parado. Navegador sem suporte navega como antes. Tudo fica sob
  `prefers-reduced-motion: no-preference`.
- **Sublinhado do menu principal** (desktop): um traço de 1px em `primary` que entra
  pela esquerda no hover e no foco e sai pela direita, animado por
  `transform: scaleX` com `transform-origin` trocado, nunca por `width`. No item da
  página atual (`aria-current="page"`) e no da seção em que o visitante está
  (`aria-current="true"`: Blog num post, Lab e Portfólio nos seus cases) o traço
  fica desenhado. O post declara a seção (`section="/posts"`), porque mora na raiz.

---

## Responsive

| Breakpoint | Largura | Mudança principal |
|------------|---------|-------------------|
| base | 320px+ | Coluna única, navegação recolhida |
| sm | 640px | Catálogo em 2 colunas |
| lg | 1024px | Catálogo em 3 colunas, navegação horizontal completa |
| xl | 1280px | Container já no teto de 768px, margens crescem sozinhas |

**Container em 768px (`--container-page: 48rem`).** Substituiu os 1200px originais
em 2026-08-09, junto com o restyle. A medida de 1200px produzia uma linha de
leitura 1,62 vez mais larga que a da referência visual do projeto, o que fazia o
site parecer outro layout mesmo com paleta, tipografia e componentes corretos. O
cabeçalho e o rodapé mantêm a régua atravessando a viewport inteira, com o
container aplicado à linha interna, e não ao elemento que carrega a borda.

**Moldura em 1104px (`--container-frame: 69rem`), desde 2026-10-16.** Desde
2026-10-17 o conteúdo (`--container-page`) tem a mesma largura, então a marca do
cabeçalho e a coluna da página alinham. As seções de lista (blog, portfólio e lab
na home, o índice do blog e o arquivo) ficam numa coluna centralizada de 848px
(`--container-list: 53rem`), como no Stitch. Portfólio e lab, com a arte dos
cases, usam a largura inteira.

**Trajetória e serviços (Terminal Noir, 2026-10-17).** Na home, os seis números
da trajetória ficam em cards `Card`, numa grade que vira 3×2 a partir de `lg`.
O valor é Newsreader 400 no acento (`StatItem`); o rótulo é semibold e o
contexto continua obrigatório. Os serviços levam um ícone Lucide de 20px numa
caixa de 32px (camadas, fluxo, terminal), escolhido pelo slug do case que
comprova a frente. O link "Ver o case que comprova" é o mesmo nos três cards.

### Cabeçalho e rodapé (Terminal Noir, 2026-10-16)

- **Marca:** um ponto de status seguido do nome em JetBrains Mono, com "moreira"
  no acento. O ponto (`StatusDot`) tem a cor da disponibilidade do perfil (verde
  disponível, âmbar limitado, vermelho indisponível) e pulsa só enquanto ela
  está aberta. O mesmo componente marca as pills de disponibilidade do
  cabeçalho e do hero. A pulsação é um anel em CSS, só `transform` e `opacity`,
  e fica parada sob `prefers-reduced-motion`. Escolhido em 2026-10-16 entre
  três glifos (ponto, ícone de prompt e til).
- **Cabeçalho:** marca e navegação à esquerda, pill de disponibilidade à direita
  (só a partir de 1280px, onde a linha tem espaço; ela leva a `/mcp`, como a do
  hero). O fio inferior fica sempre visível; o fundo translúcido e o desfoque
  entram com a rolagem.
- **Rodapé:** uma linha em mono, sem ícones: copyright e Privacidade à esquerda;
  GitHub, LinkedIn, RSS, AGENTS.md e Topo à direita.

Mobile-first. Nenhum scroll horizontal em nenhum viewport suportado, verificado a
partir de 320px.

**A trava é `overflow-x: clip`, nunca `hidden`.** As duas proíbem o mesmo scroll
horizontal, mas `hidden` transforma o elemento num contêiner de rolagem, e a partir
daí `position: sticky` gruda nele em vez de grudar na viewport. O cabeçalho fixo
simplesmente para de funcionar, sem erro e sem aviso. `clip` proíbe o overflow sem
criar o contêiner, então o requisito e o cabeçalho convivem. Há portão em
`tests/design-system/global-tags.test.ts` rejeitando `overflow-x-hidden` na camada
base pela razão escrita no próprio teste.

**Cabeçalho fixo.** `sticky top-0 z-40` com `bg-background/90` e `backdrop-blur`. É
CSS puro, sem ilha. A translucidez pede o blur junto: transparente sem blur deixa
texto colidir com texto por baixo.

**Âncoras rolam suave.** `scroll-behavior: smooth` no `html`, com
`scroll-padding-top: var(--spacing-3xl)` para o alvo não parar embaixo do cabeçalho
fixo. O bloco `prefers-reduced-motion` já existente força `scroll-behavior: auto`,
então quem pediu menos movimento continua com salto instantâneo.

**Tabelas dentro dos cases** rolam dentro do próprio container com
`overflow-x: auto`. O corpo da página nunca rola na horizontal.

---

## Acessibilidade

Alvo: **WCAG AA**, declarado como requisito não funcional no PRD.

- [ ] Foco visível em todo elemento interativo, usando `primary` como indicador (9,22:1 sobre o fundo)
- [ ] Ordem de tabulação lógica; link de pular para o conteúdo no topo
- [ ] Hierarquia de heading sem salto de nível
- [ ] Imagem de case com `alt` descritivo; decorativa com `alt=""`
- [ ] Link com texto significativo; nada de "clique aqui" ou "saiba mais" isolado
- [ ] Alvo de toque de no mínimo 44px
- [ ] `prefers-reduced-motion` respeitado
- [ ] Nenhuma informação apenas por cor
- [ ] `border` nunca como único delimitador de alvo interativo (1,31:1)
- [ ] Navegação completa por teclado, testada de verdade

---

## Iconografia

- **Biblioteca:** Lucide, importada por ícone. Nenhum pacote inteiro no bundle.
- **Tamanhos:** 16px em linha, 20px em botão, 24px em destaque
- **Traço:** 1.5px
- Ícone sem texto acompanhante sempre com `aria-label`

---

## Checklist de Design

### Antes de implementar

- [ ] Tokens definidos no CSS e usados por nome
- [ ] Estados de cada componente desenhados
- [ ] Fallback de imagem definido

### Durante

- [ ] Nenhum valor de cor, espaço ou raio fora da escala
- [ ] Contraste conferido ao introduzir qualquer par novo
- [ ] Testado em 320px a cada seção concluída

### Antes de lançar

- [ ] Navegação por teclado completa
- [ ] Motion respeita a preferência do sistema
- [ ] Lighthouse acima de 90 em Performance, Acessibilidade e SEO
- [ ] Revisado em celular real
