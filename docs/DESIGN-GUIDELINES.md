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

A paleta vem do tema `Exquisitus for Starlight` (OFL/MIT, `anaxite/starlight-theme-exquisitus`),
adotada em 2026-08-09 no lugar dos cinzas neutros originais. A rampa é escrita
em OKLCH na origem e convertida para hex sRGB aqui, porque o portão de contraste
lê hex: a razão que ele calcula é a que o browser renderiza, não uma aproximação.
A lógica da paleta é que **as superfícies são quase neutras e o calor mora na
tinta e no acento**, nunca no papel. Sem creme, sem areia.

| Token | Valor | OKLCH de origem | Uso |
|-------|-------|-----------------|-----|
| `background` | `#110f0d` | `0.17 0.006 80` | Fundo da página |
| `surface` | `#191714` | `0.205 0.006 80` | Cards, painéis |
| `surface-elevated` | `#211f1c` | `0.24 0.007 80` | Popovers, elementos flutuantes |
| `border` | `#332f2c` | `0.31 0.007 80` | Divisores e contornos |
| `border-strong` | `#6c6863` | `0.52 0.01 82` | Contorno de elemento em foco ou hover |
| `foreground` | `#efebe2` | `0.94 0.012 85` | Texto primário |
| `muted-foreground` | `#a29e96` | `0.7 0.012 82` | Texto secundário, metadados |

### Acento

| Token | Valor | OKLCH de origem | Uso |
|-------|-------|-----------------|-----|
| `primary` | `#f0c36f` | `0.84 0.115 82` | CTA, links, comandos, indicador de foco |
| `primary-foreground` | `#110f0d` | `0.17 0.006 80` | Texto sobre o acento |

**Por que âmbar:** continuidade com a identidade original. O tom mudou do âmbar
saturado (`#f59e0b`) para o mel do Exquisitus, que é mais claro e sobe o contraste
sobre o fundo quase preto de 9,22:1 para 11,60:1. **É ajustável**, e continua sendo
a decisão mais barata de trocar em todo o projeto, já que existe num único token.
Q3 do PRD.

### Semânticas

Vêm das rampas `-high` do Exquisitus, que são as calibradas para superfície escura.

| Token | Valor | OKLCH de origem | Uso |
|-------|-------|-----------------|-----|
| `success` | `#a9ddb2` | `0.85 0.08 150` | Estado disponível, build passando |
| `warning` | `#facf9e` | `0.88 0.08 70` | Aviso, projeto arquivado |
| `destructive` | `#ffb7b0` | `0.85 0.09 25` | Erro de formulário, estado de falha |

### Contraste verificado

Calculado sobre `background` (`#110f0d`), fórmula de luminância relativa WCAG 2.1.

| Par | Razão | Situação |
|-----|-------|----------|
| `foreground` sobre `background` | 16,08:1 | Aprova AA e AAA |
| `muted-foreground` sobre `background` | 7,17:1 | Aprova AA e AAA |
| `muted-foreground` sobre `surface` | 6,70:1 | Aprova AA e AAA |
| `primary` sobre `background` | 11,60:1 | Aprova AA e AAA |
| `primary` sobre `surface` | 10,85:1 | Aprova AA e AAA |
| `primary-foreground` sobre `primary` | 11,60:1 | Aprova AA e AAA (texto do botão) |
| `success` sobre `background` | 12,45:1 | Aprova AA e AAA |
| `warning` sobre `background` | 13,19:1 | Aprova AA e AAA |
| `destructive` sobre `background` | 11,52:1 | Aprova AA e AAA |
| `border-strong` sobre `background` | 3,46:1 | Aprova 3:1 para componente gráfico |
| `border` sobre `background` | **1,44:1** | **Reprova.** Ver regra abaixo |

**Regra decorrente:** `border` (`#332f2c`) tem contraste de 1,44:1 e portanto
**nunca pode ser o único meio de transmitir informação ou delimitar um alvo
interativo**. Serve como separador decorativo. Contorno que precisa ser percebido
(campo de formulário, elemento em foco) usa `border-strong` ou `primary`. A troca
de paleta subiu esse valor para 1,91:1 e o fio passou a competir com o conteúdo
nos divisores de cabeçalho, título e rodapé; foi recuado para 1,44:1, entre o
1,31:1 original e o pico do tema. A regra não muda: 1,44 continua abaixo de 3:1.

### Regras de uso

- O acento é reservado para ação, link e foco. Nunca decoração.
- Nenhuma informação transmitida apenas por cor: bloco do catálogo e estado de
  projeto sempre acompanham rótulo textual.
- Texto secundário nunca abaixo de `muted-foreground`. Cinzas mais escuros que
  isso reprovam sobre `surface`.

---

## Typography

### Famílias

| Papel | Fonte | Token | Fallback | Pesos |
|-------|-------|-------|----------|-------|
| Leitura e títulos de peso | Literata | `--font-serif` | Georgia, Times New Roman, serif | 400, 600 |
| Interface, corpo e registro | Alegreya Sans | `--font-sans` | system-ui, sans-serif | 400, 500, 700 |
| Código, comando, dado | JetBrains Mono | `--font-mono` | ui-monospace, monospace | 400, 500 |

Três famílias desde 2026-08-09, adotadas do tema `Exquisitus for Starlight`, que
substituiu a Inter. **Uma fonte por trabalho**: a serifada carrega a leitura e o
peso editorial, a sem serifa carrega o registro e o chrome, a monoespaçada carrega
a voz de máquina. As duas primeiras são humanistas e compartilham DNA caligráfico,
então contrastam no eixo serifa/sem-serifa sem colidir.

**Atenção ao peso 600:** Alegreya Sans não tem corte 600. Ênfase em texto sem
serifa mapeia para 500 ou 700, nunca 600, sob pena de o browser sintetizar o peso.
A Literata tem 600 e é onde ele é usado.

**Onde cada uma aparece:**

| Superfície | Família |
|------------|---------|
| Marca do cabeçalho, `h1` do hero, título de post e de case, títulos de seção do texto longo | Literata |
| Corpo de post, de case e de página de texto (via `Prose`), parágrafos de apoio, resumos, rótulos de botão, texto de interface | Alegreya Sans |
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

Desde 2026-10-15 o corpo de texto longo é Alegreya Sans 18px/1.7: o autor comparou
lado a lado com o corpo em Literata 16px e a sem serifa leu melhor no fundo escuro;
a caixa mais estreita também mantém cerca de 40 caracteres por linha num telefone
de 390px, onde a Literata dava 36.

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
| `md` | 0.5rem | Botão, input, card |
| `lg` | 0.75rem | Painel, bloco de código |
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
| `Button` | CTA, download | primary, secondary, ghost | Alvo de toque mínimo 44px |
| `ProjectCard` | Item do catálogo | com imagem, sem imagem | Fallback determinístico quando não há imagem |
| `TechBadge` | Tecnologia no card | — | Sempre com rótulo textual, nunca só cor |
| `SectionHeader` | Título de seção | — | Numeração opcional no estilo terminal |
| `CodeBlock` | Endpoint, payload de exemplo | — | Monoespaçado, com rótulo de linguagem |
| `StatItem` | Número da trajetória | — | Número mais contexto; nunca número solto |
| `Prose` | Corpo do case | — | Medida de linha limitada |

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

Duas durações apenas. Mais que isso ninguém aplica com consistência.

**Regras:**

- Não animar propriedades que disparam layout ou reflow (`width`, `height`, `top`,
  `left`, `margin`, `padding`). Permitido: `transform`, `opacity` e propriedades de
  cor (`color`, `background-color`, `border-color`), que é o que o token `fast`
  existe para cobrir. Alvo de 60fps.
- `prefers-reduced-motion: reduce` remove o movimento e mantém a mudança de estado.
  Não é opcional: é requisito de acessibilidade e o site já se compromete com WCAG AA.
- Nenhuma animação atrasa a leitura do conteúdo. Texto não entra com fade a partir
  do invisível.

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
