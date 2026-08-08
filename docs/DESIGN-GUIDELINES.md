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

| Token | Valor | Uso |
|-------|-------|-----|
| `background` | `#0a0a0a` | Fundo da página |
| `surface` | `#171717` | Cards, painéis |
| `surface-elevated` | `#262626` | Popovers, elementos flutuantes |
| `border` | `#262626` | Divisores e contornos |
| `border-strong` | `#404040` | Contorno de elemento em foco ou hover |
| `foreground` | `#fafafa` | Texto primário |
| `muted-foreground` | `#a3a3a3` | Texto secundário, metadados |

### Acento

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#f59e0b` | CTA, links, comandos, indicador de foco |
| `primary-foreground` | `#0a0a0a` | Texto sobre o acento |

**Por que âmbar:** continuidade com a identidade atual, e legibilidade alta sobre
fundo quase preto. **É ajustável**, e é a decisão mais barata de trocar em todo o
projeto, já que existe num único token. Q3 do PRD.

### Semânticas

| Token | Valor | Uso |
|-------|-------|-----|
| `success` | `#22c55e` | Estado disponível, build passando |
| `warning` | `#eab308` | Aviso, projeto arquivado |
| `destructive` | `#ef4444` | Erro de formulário, estado de falha |

### Contraste verificado

Calculado sobre `background` (`#0a0a0a`), fórmula de luminância relativa WCAG 2.1.

| Par | Razão | Situação |
|-----|-------|----------|
| `foreground` sobre `background` | 18,97:1 | Aprova AA e AAA |
| `muted-foreground` sobre `background` | 7,85:1 | Aprova AA e AAA |
| `muted-foreground` sobre `surface` | 7,11:1 | Aprova AA e AAA |
| `primary` sobre `background` | 9,22:1 | Aprova AA e AAA |
| `primary` sobre `surface` | 8,35:1 | Aprova AA e AAA |
| `primary-foreground` sobre `primary` | 9,22:1 | Aprova AA e AAA (texto do botão) |
| `success` sobre `background` | 8,69:1 | Aprova AA |
| `destructive` sobre `background` | 5,26:1 | Aprova AA |
| `border` sobre `background` | **1,31:1** | **Reprova.** Ver regra abaixo |

**Regra decorrente:** `border` (`#262626`) tem contraste de 1,31:1 e portanto
**nunca pode ser o único meio de transmitir informação ou delimitar um alvo
interativo**. Serve como separador decorativo. Contorno que precisa ser percebido
(campo de formulário, elemento em foco) usa `border-strong` ou `primary`.

### Regras de uso

- O acento é reservado para ação, link e foco. Nunca decoração.
- Nenhuma informação transmitida apenas por cor: bloco do catálogo e estado de
  projeto sempre acompanham rótulo textual.
- Texto secundário nunca abaixo de `muted-foreground`. Cinzas mais escuros que
  isso reprovam sobre `surface`.

---

## Typography

### Famílias

| Papel | Fonte | Fallback | Pesos |
|-------|-------|----------|-------|
| Interface e corpo | Inter | system-ui, sans-serif | 400, 500, 600 |
| Código, comando, dado | JetBrains Mono | ui-monospace, monospace | 400, 500 |

Duas famílias, sem display separada. Os títulos usam Inter em peso alto, e o
monoespaçado carrega a identidade técnica onde ele tem função (comando, endpoint,
nome de pacote, número).

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
| `small` | 0.875rem | 1.5 | Metadado, legenda |
| `mono` | 0.875rem | 1.6 | Código e endpoint em linha |

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

- Animar somente `transform` e `opacity`. Alvo de 60fps.
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
| xl | 1280px | Container com largura máxima de 1200px |

Mobile-first. Nenhum scroll horizontal em nenhum viewport suportado, verificado a
partir de 320px.

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
