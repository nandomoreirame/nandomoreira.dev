# Spec: Fundação do design system

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 2
> **PRD:** sem ID próprio. Derivada de `DESIGN-GUIDELINES.md`; sustenta F1 e F2
> **Status:** implemented
> **Criado:** 2026-08-08
> **Concluído:** 2026-08-08 — P1 e P2 atendidos, salvo REQ-013 e REQ-014 (fora do plano das 14 tarefas)

## Problem Statement

`DESIGN-GUIDELINES.md` define tokens, escala tipográfica, componentes e regras de
acessibilidade, mas nada disso existe em código. Sem essa camada, `project-catalog`
(F2) e `home-page` (F1) começariam inventando cor, espaçamento e estado componente a
componente, que é a causa mais comum de um site parecer inacabado sem que se saiba
dizer por quê.

Há também uma restrição de acessibilidade que não sobrevive à improvisação: o token
`border` (`#262626`) tem contraste de 1,31:1 sobre o fundo e reprova WCAG AA. Ele não
pode ser o único delimitador de alvo interativo, e isso precisa estar codificado nos
componentes, não numa recomendação em documento.

## Goals

- Todo valor de cor, tipografia, espaçamento, raio e duração acessível por nome de token, sem literal solto em componente.
- Sete componentes base em Astro cobrindo os cinco estados obrigatórios de elemento interativo.
- Zero JavaScript de cliente enviado ao navegador, verificável no build.
- Contraste de cada par novo conferido, e o par reprovado (`border`) impossível de usar como único delimitador.

## Context

O `infra-deploy-spike` deixou um Astro 7 SSR funcionando com uma home placeholder sem
estilo algum. Esta feature é a primeira camada de produto sobre aquele terreno.

`DESIGN-GUIDELINES.md` já fez as escolhas: modo escuro exclusivo, temperatura neutra
fria com um único acento quente âmbar (`#f59e0b`), personalidade de terminal técnico,
duas famílias (Inter para interface, JetBrains Mono para código e dado). As
referências são Linear (hierarquia tipográfica), Vercel (superfície escura com borda
em vez de sombra), Raycast (densidade sem poluição).

Tailwind CSS 4 é a escolha de estilização, com os tokens declarados no CSS. O Tailwind
4 define o tema em `@theme` dentro do próprio arquivo CSS, o que casa com a exigência
de "tokens definidos no CSS e usados por nome" sem um arquivo de configuração à parte.

A decisão de arquitetura mais consequente do `MVP-SCOPE.md` para esta feature: nenhuma
feature P0 exige interatividade de cliente, então não entra biblioteca de UI e não
entra framework de componente. Tudo é Astro puro. A primeira ilha só aparece em F11,
na v1.2.

## Verified Claims

Esta feature é construída sobre o que o `infra-deploy-spike` deixa. As claims sobre o
repositório só se tornam verificáveis depois que a sprint 1 fechar; até lá são
assumptions ancoradas no plano que as cria.

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| Existe um projeto Astro 7 em `output: 'server'` com adapter Node standalone | `docs/plans/2026-08-08-infra-deploy-spike.md` (Task 2) | assumption |
| O build roda por `npm run build` e os testes por `npm test` (Vitest) | `docs/plans/2026-08-08-infra-deploy-spike.md` (Task 1, Task 3) | assumption |
| `src/pages/index.astro` existe como placeholder sem estilo | `docs/plans/2026-08-08-infra-deploy-spike.md` (Task 5) | assumption |
| Os contrastes declarados em `DESIGN-GUIDELINES.md` foram calculados pela fórmula WCAG 2.1 | `docs/DESIGN-GUIDELINES.md:88` | assumption (recalculados como parte de REQ-004) |
| Tailwind CSS 4 declara o tema via `@theme` no CSS, sem arquivo de configuração | n/a | assumption |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO a folha de estilo global é carregada ENTÃO ela DEVE declarar como token nomeado toda cor, tamanho de fonte, altura de linha, espaçamento, raio, duração e easing listados em `DESIGN-GUIDELINES.md`.
2. **[REQ-002]** QUANDO um componente é escrito ENTÃO ele DEVE referenciar os valores exclusivamente por token, e nenhum literal de cor, espaçamento ou raio fora da escala PODE aparecer em `src/`.
3. **[REQ-003]** QUANDO a página é renderizada ENTÃO o sistema DEVE aplicar o esquema escuro como único tema, sem alternância claro/escuro.
4. **[REQ-004]** QUANDO um par de cor texto-sobre-fundo é introduzido ENTÃO ele DEVE atingir no mínimo 4,5:1, e o par reprovado `border` sobre `background` (1,31:1) NÃO PODE ser usado como único meio de delimitar um alvo interativo ou de transmitir informação.
5. **[REQ-005]** QUANDO as fontes são carregadas ENTÃO elas DEVEM ser servidas do próprio domínio com `font-display: swap` e subset latino, sem nenhuma requisição a host externo.
6. **[REQ-006]** QUANDO um elemento interativo é renderizado ENTÃO ele DEVE oferecer os estados `default`, `hover`, `focus-visible`, `active` e `disabled`, com o foco visível usando `primary` como indicador.
7. **[REQ-007]** QUANDO um alvo de toque é renderizado ENTÃO sua área clicável DEVE ter no mínimo 44 por 44 pixels.
8. **[REQ-008]** QUANDO o build conclui ENTÃO o sistema NÃO PODE enviar JavaScript de cliente ao navegador em nenhuma rota.
9. **[REQ-009]** QUANDO `prefers-reduced-motion: reduce` está ativo ENTÃO o sistema DEVE suprimir o movimento e preservar a mudança de estado.
10. **[REQ-010]** QUANDO uma animação é declarada ENTÃO ela DEVE usar duração de 150ms (`fast`) ou 250ms (`base`) e easing `ease-out`, e NÃO PODE animar propriedades que disparam layout ou reflow (`width`, `height`, `top`, `left`, `margin`, `padding`); `transform`, `opacity` e propriedades de cor (`color`, `background-color`, `border-color`) SÃO permitidas.
11. **[REQ-011]** QUANDO o layout base é renderizado ENTÃO ele DEVE expor um link de pular para o conteúdo como primeiro elemento focável e um marco `main` único.
12. **[REQ-012]** QUANDO o site é renderizado em qualquer viewport a partir de 320px ENTÃO ele NÃO PODE produzir scroll horizontal no corpo da página.

### P2 (Should Have)

 1. **[REQ-013]** QUANDO um ícone é renderizado sem texto acompanhante ENTÃO ele DEVE receber `aria-label`, e os ícones DEVEM ser importados individualmente da Lucide, nunca o pacote inteiro.
 2. **[REQ-014]** QUANDO uma listagem é renderizada sem itens ENTÃO o sistema DEVE apresentar um estado vazio explícito em vez de área em branco.
 3. **[REQ-015]** QUANDO o container principal é renderizado acima de seu teto ENTÃO sua largura DEVE ser limitada a 768px. *(Emendado em 2026-08-09: o valor original era 1200px. Ver REQ-023 de `theme-restyle` para a razão.)*

### P3 (Nice to Have)

 1. **[REQ-016]** QUANDO um componente é alterado ENTÃO uma página interna de referência visual DEVE permitir conferir seus estados lado a lado.

## Edge Cases

- **Texto longo em `TechBadge`** — Nome de tecnologia extenso não pode quebrar o card nem estourar a largura. O badge trunca ou quebra, nunca empurra o layout.
- **`ProjectCard` sem imagem** — Recebe o fallback determinístico: fundo `surface`, borda, iniciais em monoespaçado derivadas do slug. Nunca espaço vazio nem ícone de imagem quebrada.
- **Mesmo projeto renderizado duas vezes** — O fallback precisa ser determinístico: mesmo slug produz o mesmo visual sempre. Um gerador aleatório quebraria a percepção de estabilidade entre visitas.
- **Fonte ainda não carregada** — `font-display: swap` mostra o fallback do sistema. A métrica do fallback deve ser próxima o suficiente para não causar salto de layout que estoure o CLS de 0,1.
- **`Prose` com tabela larga dentro do case** — A tabela rola dentro do próprio container com `overflow-x: auto`. O corpo da página nunca rola na horizontal (REQ-012).
- **Botão desabilitado** — Precisa continuar legível: `disabled` não pode derrubar o contraste abaixo de 4,5:1 nem depender só de opacidade para comunicar o estado.
- **Foco em elemento sobre `surface`** — O indicador usa `primary`, que tem 8,35:1 sobre `surface` e 9,22:1 sobre `background`. Ambos aprovam, então o mesmo token serve os dois fundos.
- **`StatItem` com número sem contexto** — O componente não pode renderizar número solto. Número e rótulo de contexto são a mesma unidade, por decisão de RISK-004 (a prova social precisa de narrativa).

## Architecture Decisions

1. **Tokens em `@theme` do Tailwind 4 em vez de arquivo de configuração** — Mantém a definição no CSS, que é onde `DESIGN-GUIDELINES.md` pede que ela esteja, e evita uma segunda fonte de verdade em JavaScript. Alternativa descartada: `tailwind.config.ts` com o tema em objeto.
2. **Componentes em Astro puro, sem biblioteca de UI** — Nenhum componente do P0 precisa de estado no cliente. Alternativa descartada: shadcn/ui ou similar, que arrastaria React e contradiria REQ-008.
3. **Borda em vez de sombra para elevação** — Sobre fundo `#0a0a0a` a sombra praticamente não aparece e só custa pintura. Vem direto da referência Vercel em `DESIGN-GUIDELINES.md`.
4. **Fontes locais em vez de CDN** — Elimina requisição a terceiro, o que serve tanto à performance quanto a não vazar a visita. Alternativa descartada: Google Fonts, que adiciona conexão externa e dependência de disponibilidade.
5. **Escala fechada, sem valor ad hoc** — Um teste automatizado varre `src/` procurando literal de cor e espaçamento fora da escala. Sem esse portão, a regra vira recomendação e é violada na primeira pressa.
6. **`border-strong` para qualquer contorno que precise ser percebido** — Consequência direta do contraste de 1,31:1 de `border`. Codificado nos componentes, não deixado a critério de quem usa.
7. **Duas durações de motion apenas** — Mais que isso ninguém aplica com consistência, conforme `DESIGN-GUIDELINES.md`.

## Grilling Log

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Como impedir literal solto na prática | Teste que varre `src/` por hex, `rem` fora da escala e `px` fora da escala | Regra sem portão automatizado é violada na primeira pressa. É a diferença entre design system e sugestão |
| 2 | Onde vive o fallback de imagem | Dentro de `ProjectCard`, derivado do slug | O consumidor nunca decide se há fallback. Se a decisão vazar para quem usa o componente, um card quebrado aparece em produção |
| 3 | Como provar REQ-008 (zero JS) | Asserção sobre a saída do build: nenhum `<script>` de módulo nas rotas P0 | Auditoria manual não sobrevive a seis sprints |
| 4 | O `border` reprovado sai da paleta | Não. Permanece como separador decorativo | Ele tem uso legítimo entre seções. O que muda é a regra de onde não pode aparecer, codificada nos componentes |
| 5 | Página de referência visual entra no P0 | Não, é P3 (REQ-016) | Sete componentes ainda cabem na cabeça. A página se paga quando o catálogo crescer |
| 6 | Modo claro entra por acessibilidade | Não | Contraste do tema escuro aprova AA e AAA em todos os pares usados. Alternância dobraria o teste visual sem servir ao público |

## Constraints

- Tailwind CSS 4.x, TypeScript 5.x, Astro 7.2.0 já configurado pela sprint 1.
- Sem framework de UI no cliente e sem biblioteca de componentes (`MVP-SCOPE.md`, "Decisões de Simplificação").
- Modo escuro exclusivo. Não existe tema claro nem alternância.
- WCAG AA é requisito não funcional do PRD, não meta.
- Esforço declarado da sprint 2 é 4 dias, compartilhado com `content-data-layer` e `project-catalog`.
- Depende do ADR `docs/adr/001-hosting-platform.md` existir. A feature é de build e não muda entre plano A e plano B, mas a sprint 1 precisa ter fechado.

## Out of Scope

| Item | Reason |
|------|--------|
| Tema claro e alternância | Decisão explícita de `DESIGN-GUIDELINES.md` |
| Biblioteca de componentes de terceiro | Contradiz REQ-008 e a decisão de simplificação do MVP |
| Ilha interativa | Primeira só em F11 (v1.2) |
| Animação de scroll reveal elaborada | O token `base` cobre a entrada de elemento; nada além disso |
| Storybook | Peso desproporcional para sete componentes. REQ-016 cobre o essencial em P3 |
| Componentes específicos de case ou catálogo | São de `project-catalog` (F2); aqui só a base compartilhada |
| Ícones além dos usados | Importação individual, sob demanda |

## Test Strategy

- **Unit:** funções puras do fallback de imagem (mesmo slug produz sempre o mesmo par de iniciais e a mesma variação) e o cálculo de contraste usado para validar a paleta.
- **Integration:** renderização de cada componente via `experimental_AstroContainer`, exercitando as variantes e conferindo os atributos que carregam acessibilidade (`aria-label`, `disabled`, alvo de toque, ordem de foco).
- **Contract/lint:** um teste que varre `src/**/*.{astro,css,ts}` reprovando cor hexadecimal, `rem` e `px` fora da escala declarada. É o que transforma REQ-002 de recomendação em portão.
- **Build assertion:** varredura da saída do build confirmando ausência de JavaScript de cliente nas rotas (REQ-008).
- **Manual, uma vez por sprint:** conferência em 320px e navegação por teclado real. Lighthouse fica para `launch-hardening`.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Todos os tokens declarados no CSS | P1 | Done |
| REQ-002 | Nenhum literal fora da escala em `src/` | P1 | Done |
| REQ-003 | Tema escuro único, sem alternância | P1 | Done |
| REQ-004 | Contraste mínimo 4,5:1; `border` nunca como único delimitador | P1 | Done |
| REQ-005 | Fontes locais, `font-display: swap`, subset latino | P1 | Done |
| REQ-006 | Cinco estados obrigatórios, foco em `primary` | P1 | Done |
| REQ-007 | Alvo de toque mínimo de 44px | P1 | Done |
| REQ-008 | Zero JavaScript de cliente | P1 | Done |
| REQ-009 | `prefers-reduced-motion` respeitado | P1 | Done |
| REQ-010 | Sem layout/reflow; cor/transform/opacity ok; 150ms ou 250ms | P1 | Done |
| REQ-011 | Skip link e marco `main` único | P1 | Done |
| REQ-012 | Sem scroll horizontal a partir de 320px | P1 | Done |
| REQ-013 | Ícones com `aria-label`, importados individualmente | P2 | Pending (fora do plano das 14 tarefas) |
| REQ-014 | Estado vazio explícito em listagem | P2 | Pending (fora do plano das 14 tarefas) |
| REQ-015 | Container limitado a 768px (era 1200px) | P2 | Done |
| REQ-016 | Página interna de referência visual | P3 | Pending (P3) |
