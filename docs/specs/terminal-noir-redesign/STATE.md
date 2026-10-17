---
feature: terminal-noir-redesign
phase: research
started_at: 2026-10-16
depth: deep
source: "Stitch, projeto 3626158459540278205 (Nando Moreira Portfolio Redesign), design system Terminal Noir"
decisions:
  - "Hero: retrato ilustrado e animação do PointerField ficam como estão; o card 'terminal' com foto P&B do Stitch não entra"
  - "Fontes: Newsreader nos títulos e Inter no corpo, em todo o site, posts incluídos; Literata e Alegreya Sans saem"
  - "Fundo pontilhado com efeito de ponteiro fica por enquanto; pode trocar pelo brilho radial do Stitch depois"
  - "Escopo: só o visual do Stitch, com o mínimo de estrutura; nenhum texto ou conteúdo do Stitch entra (2026-10-16)"
  - "Arte dos cases fica nas listagens de portfólio e lab (não mexer na estrutura)"
  - "Marca: o ponto, escolhido em 2026-10-16 depois de comparar com o ícone de prompt e o til; tem a cor da disponibilidade e pulsa enquanto ela está aberta (StatusDot)"
  - "Eyebrows: versões diferentes para comparar, deixadas para o fim"
  - "Filtros por tag do blog: feature à parte, fora desta entrega (o autor gostou do menu de chips do Stitch)"
  - "Cores do Stitch que reprovam AA são corrigidas, não adotadas: text-muted #71717A (4,07:1) e border-strong #3F3F46 (1,88:1)"
  - "Dados decorativos do Stitch sem fonte (92%_COV_ENFORCED, Live v2026.10, RUNTIME_PROTOCOL) não entram (RISK-004)"
blockers: []
transitions:
  - "2026-10-16: research, leitura do Stitch via MCP e comparação com a home em produção"
  - "2026-10-17: fase 7, páginas internas (terminal-noir-pages) implementadas"
---

# Estado: terminal-noir-redesign

O autor desenhou no Stitch um redesign da home (uma tela, mesmo texto do site) e quer
aplicar a maior parte, não tudo. Só a home existe no Stitch; as demais páginas estão
sendo desenhadas e herdam os tokens até lá.

## Diferenças medidas

Contraste sobre `#0B0B0C` (surface-base do Stitch):

| Cor | Papel no Stitch | Contraste | Destino |
|---|---|---|---|
| `#F4F4F5` | texto principal | 17,90:1 | entra |
| `#A1A1AA` | texto secundário | 7,68:1 | entra |
| `#71717A` | texto apagado | 4,07:1 | **reprova**; trocar por `#8B8B94` (5,83:1) |
| `#F5A623` | acento | 9,71:1 | entra; `#0B0B0C` sobre ele dá 9,71:1 no CTA |
| `#34D399` | status | 10,23:1 | entra como `success` |
| `#222226` | hairline | 1,24:1 | só decorativo, como o `border` de hoje |
| `#3F3F46` | contorno forte | 1,88:1 | **reprova** para delimitar alvo; manter um `border-strong` acima de 3:1 |

## Fases

| Fase | Entrega | Escopo | Estado |
|---|---|---|---|
| 1. Tokens | Paleta corrigida, raios (6px cards, 8px terminal), Newsreader + Inter variáveis auto-hospedadas e preload (`--shadow-glow` fica para a fase 3, junto do primeiro uso) | site inteiro | feita em 2026-10-16, `npm run verify` verde; imagens OG ainda em Literata e Alegreya |
| 2. Moldura | Header (marca em mono, nav, pill de disponibilidade) e footer em uma linha | site inteiro | feita em 2026-10-16, `npm run verify` verde; marca escolhida: ponto de status que pulsa enquanto disponível; `/design` removida, volta para os eyebrows |
| 3. Componentes compartilhados | `PageHeader` em Newsreader 400, `Button` com halo e seta, `Card`, `TerminalWindow`, `StatusDot`; primeiros usos nos cards de serviço e no AGENTS.md | site inteiro | feita em 2026-10-16, `npm run verify` verde; numeração `01 //` do `SectionHeader` adiada para Setup e Agora |
| 3b. Hero | Só a coluna de texto: título em serifa 400, lead de 18px (`--text-lead`), CTA primário com seta e halo, "Dizer olá" com borda, linha de stack (os cinco primeiros de `profile.stack`) | home | feita em 2026-10-17, `npm run verify` verde; localização fora (o perfil não tem o campo) |
| 4. Linhas | Conteúdo em 1104px (igual à moldura), coluna de lista de 848px, marcadores em chips, seta em ícone, `TechBadge` menor, "Ver todos" em mono; arte dos cases mantida | blog, portfólio, lab | feita em 2026-10-17, `npm run verify` verde |
| 5. Cards | Trajetória 3x2 com números em Newsreader; Serviços com ícone e link uniforme | home | feita em 2026-10-17; ícone também em `/sobre`, porque `ServiceCards` e `StatItem` são compartilhados |
| 6. AGENTS.md | Janela de terminal com realce no servidor (`src/lib/aeo/brief-highlight.ts`) e Copiar do script existente; título em Newsreader 400 | home e /contato | feita em 2026-10-17, `npm run verify` verde |
| 7. Propagação | Páginas internas no visual do Stitch: Setup, Agora, Sobre, Contato, blog, portfólio, lab, post e case (`terminal-noir-pages`) | site inteiro | feita em 2026-10-17 |
| 8. Verificação | Comparação com o Stitch em 1280 e 390px; `npm run verify` | site inteiro | a planejar |

## Telas lidas em 2026-10-16 (segunda leitura)

Home, Blog, Portfólio, Laboratório, Setup, Agora, Sobre e Contato. O screenshot do Setup
volta 400 na API do Stitch; a tela foi renderizada a partir do HTML.

**O Stitch inventou boa parte do texto das telas internas.** Entra só o padrão visual; o
conteúdo continua vindo das collections e de `src/lib/`, pela regra de fonte única.
Exemplos do que não entra: posts que não existem (TDD com 4.800 testes, TUIs com
Ratatui), datas e tempos de leitura errados, métricas sem fonte (99,4%, "Zero regressões
em 8 meses", "< 4 horas", "NDA Ready", "18ms cold start"), um case "Financial
Normalization Engine" da Liquid AI, comandos de instalação inexistentes, newsletter por
e-mail, `Authorization: Bearer` no contrato do `/api/hire`, Fish, Alacritty, Neovim, Stow
e hardware que não são os do autor, a seção "Vida pessoal" da /now e a biografia da
/sobre.

O Stitch também é inconsistente entre telas: a marca muda (`●`, `~`, `λ`, sem nada), a
nav alterna caixa alta e caixa normal, e o título do Setup sai em itálico. Fixar uma
versão de cada.

Padrões que se repetem e viram componente:

| Padrão | Telas | Componente |
|---|---|---|
| Cabeçalho de página: eyebrow em mono (prompt ou caminho), H1 em Newsreader, lead, faixa de metadados em mono | todas | `PageHeader` |
| Seção numerada: `01 //` em âmbar, título em Inter, rótulo mono à direita, hairline embaixo | Setup, Agora | `SectionHeader` |
| Card: `surface-raised`, hairline, badge de categoria à esquerda e status à direita, rodapé com chips e link | Portfólio, Lab, Setup, Agora, Sobre | `Card` novo |
| Janela de terminal: semáforo, nome de arquivo, Copiar | Home, Portfólio, Setup, Contato | `TerminalWindow` novo |
| Ponto de status verde ou âmbar | todas | `StatusDot` |
| Linha de post: data e leitura em mono, tags à direita, título grande em Newsreader, resumo | Blog | `ListRow` |
| Bloco de CTA de fim de página | Portfólio | composição com `Button` |
| Linha do tempo com marcador e faixa de anos | Sobre | `Experience` |

Portões que cada fase precisa manter verdes: contraste, valor fora da escala (halo e
brilho viram token), JavaScript de cliente (nada novo; Copiar já está no script do
PointerField), CTA primário único, `StatItem` com contexto obrigatório, no-leak.
