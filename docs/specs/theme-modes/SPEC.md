# Spec: theme-modes

> Aprovada em 2026-10-20. Fonte das cores: `palette/palette.json` do Terminal Noir
> (`~/dev/projects/terminalnoir`), variantes `dark` (Noir) e `light` (Paper).
> Depende de `contrast-gate` do Terminal Noir (`docs/specs/contrast-gate/SPEC.md` lá), que
> corrige a Paper para AA em todas as superfícies e publica o port Shiki. Primeiro uso real
> da Paper: todo par de cor do site precisa passar AA, não só os blocos de código
> (Fernando, 2026-10-20).

## Problema

O site só tem o tema escuro, por uma restrição registrada no `CLAUDE.md` ("Tema escuro
único, sem `prefers-color-scheme`"). O Terminal Noir, extraído deste site, já tem a
variante clara Paper, e quem lê de dia ou com o sistema em modo claro recebe o Noir de
qualquer jeito. O autor revoga a restrição: o site passa a ter Noir e Paper.

## Objetivos

- Paper como segundo tema do site inteiro, com as cores do Terminal Noir.
- Primeira visita segue o sistema; a escolha manual fica lembrada.
- Nenhum flash do tema errado, inclusive nas rotas pré-renderizadas (posts e cases).
- Contraste AA medido nos dois temas, inclusive nos blocos de código.

## Afirmações verificadas

| Afirmação | Fonte | Verificada |
|---|---|---|
| Os tokens de cor moram no `@theme` | `src/styles/global.css:52-73` | sim |
| O tema "claro" do modo leitura já é a paleta Paper | `src/styles/global.css:279-290` | sim |
| Nenhum hex fora do arquivo de tokens | `tests/design-system/no-ad-hoc-values.test.ts` | sim |
| O portão de contraste lê os tokens do CSS | `tests/design-system/contrast.test.ts:12-21` | sim |
| Shiki usa `github-dark-default` com cores inline | `astro.config.mjs:100` | sim |
| O portão de código lê `color:#hex` inline | `tests/design-system/code-contrast.test.ts:27-32` | sim |
| Todo script passa por lista de permissão com marcador | `tests/helpers/client-scripts.ts:33-52` | sim |
| Posts e cases são pré-renderizados | `src/pages/[slug].astro`, `src/pages/lab/[slug].astro`, `src/pages/portfolio/[slug].astro` | sim |
| Dois layouts com `<head>` e header próprios | `src/layouts/BaseLayout.astro:76`, `src/layouts/SalesLayout.astro:46,76` | sim |
| O modo leitura lembra escolhas via `localStorage` no script do ponteiro | `src/components/art/PointerField.astro:49-60` | sim |
| A paleta de comandos tem atalhos de uma letra; `T` está livre | `src/lib/search/controller.ts:33-39` | sim |

## Contraste medido (WCAG 2.1, valores Paper depois de `contrast-gate`)

Pior caso entre `background`, `surface` e `surface-elevated`.

| Token | Noir | Paper | Piso |
|---|---|---|---|
| foreground | `#f4f4f5` 16,12 | `#1c1a17` 13,93 | 4,5 |
| muted-foreground | `#a1a1aa` 6,91 | `#5e5a53` 5,50 | 4,5 |
| primary | `#f5a623` 8,74 | `#865700` 4,99 | 4,5 |
| success | `#34d399` 9,22 | `#0b7656` 4,51 | 4,5 |
| warning | `#facf9e` 12,22 | `#8a5300` 5,08 | 4,5 |
| destructive | `#ffb7b0` 10,67 | `#b42318` 5,27 | 4,5 |
| border-strong | `#6b6b74` 3,36 | `#88837a` 3,02 | 3 |
| whatsapp (botão contra a página) | `#25d366` 8,93 | `#075e54` 6,15 | 3 |
| primary-foreground sobre primary | 9,71 | `#fbfaf7` 5,96 | 4,5 |
| whatsapp-foreground sobre whatsapp | `#0b0b0c` | `#fbfaf7` 7,35 | 4,5 |
| foreground sobre selection | 7,03 | `#d6d2c8` 11,50 | 4,5 |
| border (decorativo) | 1,24 | `#dcd8cf` 1,36 | nunca delimita sozinho |

Antes da `contrast-gate`, a Paper reprovava em `success` (`#047857`, 4,40 sobre
`surface-elevated`) e `border-strong` (`#8a857c`, 2,94), e o verde da marca do WhatsApp
dava 1,90:1 no papel.

## Requisitos

### P1

1. [REQ-001] QUANDO o tema efetivo for Paper ENTÃO o sistema DEVE re-apontar todos os tokens de cor para a paleta Paper (tabela acima), com `--color-success: #0b7656`, `--color-border-strong: #88837a`, `--color-whatsapp: #075e54`, `--color-whatsapp-foreground: #fbfaf7`, `--color-primary-foreground: #fbfaf7` e `color-scheme: light`; no Noir, o sistema DEVE manter os tokens atuais e o `scheme-dark` que o `html` já declara.
2. [REQ-002] QUANDO não houver escolha salva ENTÃO o sistema DEVE usar Paper se `prefers-color-scheme: light` e Noir nos demais casos, inclusive sem JavaScript (regra CSS sob `@media`).
3. [REQ-003] QUANDO qualquer página carregar ENTÃO um script inline no `<head>` de `BaseLayout` e de `SalesLayout`, antes do primeiro paint, DEVE ler `localStorage.theme` (`noir` ou `paper`), cair para `matchMedia('(prefers-color-scheme: light)')` sem escolha válida, gravar o resultado em `<html data-theme>` e marcar `<html data-theme-ready>`; falha de storage DEVE ser ignorada sem erro.
4. [REQ-004] QUANDO o header renderizar (os dois layouts) ENTÃO o sistema DEVE mostrar um botão de tema com ícone de lua no Paper e de sol no Noir, nome acessível "Usar tema escuro" ou "Usar tema claro" conforme o tema efetivo (alternado por CSS, sem JS), foco visível e alvo de ao menos 44px; sem `data-theme-ready` o botão DEVE ficar oculto.
5. [REQ-005] QUANDO o visitante acionar o botão (clique, Enter ou Espaço) ENTÃO o sistema DEVE trocar `data-theme` entre `noir` e `paper` e gravar a escolha em `localStorage.theme`; sem storage a troca DEVE valer para a página atual.
6. [REQ-006] QUANDO não houver escolha salva e o sistema mudar de esquema com a página aberta ENTÃO o sistema DEVE acompanhar a mudança.
7. [REQ-007] QUANDO um bloco de código renderizar ENTÃO o Shiki DEVE emitir os temas `terminal-noir` e `terminal-noir-paper` do port Shiki do Terminal Noir como variáveis CSS (`defaultColor: false`), e o CSS DEVE aplicar a variante do tema efetivo, inclusive o fundo do bloco; o portão de contraste de código DEVE medir as duas variantes.
8. [REQ-008] QUANDO o portão de contraste rodar ENTÃO ele DEVE medir, nos dois temas, cada token de texto (foreground, muted-foreground, primary, success, warning, destructive) a 4,5:1 e border-strong e whatsapp a 3:1 sobre `background`, `surface` e `surface-elevated`, mais os pares invertidos da tabela, lendo os valores do CSS; e DEVE reprovar se os dois blocos Paper (o da `@media` e o de `[data-theme="paper"]`) divergirem.
9. [REQ-009] QUANDO o modo leitura estiver ativo com preto, sépia ou claro ENTÃO a paleta do modo DEVE prevalecer sobre o tema do site; ao sair do modo, o tema do site volta.
10. [REQ-010] QUANDO o portão de JavaScript rodar ENTÃO ele DEVE aceitar o script de tema como quarta exceção nomeada (marcador `data-theme-boot`), em todas as páginas, inline no `<head>`, em até 512 B gzip; o handler do botão DEVE morar nesse script (delegação no `document`) para não tocar no orçamento do script do ponteiro.

13. [REQ-013] QUANDO o repositório do Terminal Noir existir ao lado (`../terminalnoir`) ENTÃO um teste DEVE reprovar se `src/lib/code/themes/*.json` diferir de `ports/shiki/*.json` de lá; sem o repositório, o teste DEVE ser pulado com o motivo.

### P2

11. [REQ-011] QUANDO a paleta de comandos abrir ENTÃO o grupo Geral DEVE ter a ação "Usar tema claro" ou "Usar tema escuro" (conforme o efetivo), com atalho `T` fora do toque, que faz a mesma troca do REQ-005.
12. [REQ-012] QUANDO a feature fechar ENTÃO o `CLAUDE.md` DEVE trocar a restrição "Tema escuro único" pelos dois temas e listar a exceção de JS, e o `docs/DESIGN-GUIDELINES.md` DEVE documentar a paleta Paper com as razões medidas.

## Casos de borda

- `localStorage.theme` com valor desconhecido: tratado como sem escolha (segue o sistema).
- Janela privada ou storage bloqueado: segue o sistema; o botão troca só a página atual.
- Sem JavaScript: segue o sistema pela `@media`; o botão não aparece.
- Modo leitura no Paper com tema "preto": o modo vence (REQ-009); os blocos de código seguem o tema do site, não o do modo.
- Rotas pré-renderizadas: o script do `<head>` roda antes do paint, então não há flash.

## Decisões

| Pergunta | Decisão |
|---|---|
| Primeira visita | Segue o sistema (autor, 2026-10-20) |
| Persistência sem flash | Script inline bloqueante no `<head>`, `localStorage` (autor, 2026-10-20) |
| Blocos de código | Dual theme do Shiki com os temas do próprio Terminal Noir (autor, 2026-10-20) |
| Escopo do contraste | Todo par de cor do site nos dois temas, não só código (autor, 2026-10-20) |
| Modo leitura | Mantém preto, sépia e claro, independentes (autor, 2026-10-20) |
| WhatsApp na Paper | `#075e54` com ícone `#fbfaf7`: o verde da marca dá 1,90:1 no papel |
| Onde mora o handler | No script do `<head>`, por delegação: o do ponteiro mede 2202 B gzip de 2304 (102 B de folga, build de 2026-10-20) |
| Nome do token salvo | `theme`, valores `noir` e `paper` |

## Grilling Log

| Pergunta | Resposta |
|---|---|
| Primeira visita | Segue o sistema |
| Persistência sem flash | Script inline no `<head>` |
| Blocos de código | Dual theme |
| Modo leitura | Mantém as três opções |
| WhatsApp na Paper | Verde-petróleo `#075e54` |
| Ação na paleta | Entra como P2 |

## Restrições

- Nenhum hex fora de `global.css`; nenhum portão relaxado.
- Texto visível em pt-BR; identificadores e comentários em inglês.
- Nenhuma diretiva `client:*`.

## Fora do escopo

| Item | Motivo |
|---|---|
| Imagens OG (`/og/*.png`) | Geradas no servidor, continuam Noir |
| E-mails | Clientes de e-mail não leem o tema do site |
| `manifest.webmanifest` | `theme_color` é um valor único |
| Screenshots dos cases e retrato | Imagens, não tokens |
| Terceira opção "seguir o sistema" no botão | Botão de dois estados; limpar a escolha não é pedido |

## Estratégia de testes

- Unit: contraste dos dois temas lido do CSS; igualdade dos dois blocos Paper; lógica pura de resolução do tema (`resolveTheme(stored, prefersLight)`).
- Componente (AstroContainer): botão de tema nos dois headers, rótulos e `data-theme-toggle`; script de boot no `<head>` dos dois layouts.
- Build: portão de JS com a nova exceção e orçamento; código com as duas variantes medidas.
- Fim: `npm run verify` e conferência no navegador nos dois temas, em 1280 e 390px.

## Rastreabilidade

| ID | Descrição | Prioridade | Status |
|---|---|---|---|
| REQ-001 | Tokens Paper | P1 | Pendente |
| REQ-002 | Padrão pelo sistema, sem JS | P1 | Pendente |
| REQ-003 | Script de boot no `<head>` | P1 | Pendente |
| REQ-004 | Botão de tema no header | P1 | Pendente |
| REQ-005 | Troca e persistência | P1 | Pendente |
| REQ-006 | Acompanha o sistema ao vivo | P1 | Pendente |
| REQ-007 | Shiki dual theme | P1 | Pendente |
| REQ-008 | Portão de contraste nos dois temas | P1 | Pendente |
| REQ-009 | Modo leitura prevalece | P1 | Pendente |
| REQ-010 | Exceção de JS nomeada | P1 | Pendente |
| REQ-011 | Ação na paleta de comandos | P2 | Pendente |
| REQ-012 | Documentação | P2 | Pendente |
| REQ-013 | Cópia dos temas Shiki igual à fonte | P1 | Pendente |
