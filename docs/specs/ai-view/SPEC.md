# Spec: Visão IA das páginas

> **Status:** aprovada (2026-10-08)
> **Origem:** pedido do autor, inspirado no switcher Human/AI do aeojs.org
> **Profundidade:** standard

## Problem Statement

O site expõe a camada de máquina por arquivos que o visitante humano nunca vê
(`llms.txt`, `llms-full.txt`, os `.md` dos cases). Não há como alguém ver a página
como um agente a lê, nem copiar ou baixar esse texto, o que desperdiça a tese do
produto: o portfólio é a própria demonstração do que afirma.

## Goals

- Toda página coberta oferece um switcher **Humano | IA**.
- A visão IA mostra o markdown da página, renderizado e em fonte, com Copiar, Baixar .md e Fechar.
- Toda página coberta tem uma versão `.md` servida como `text/markdown`.
- Nenhum script novo vai ao navegador além do script único já existente, dentro de 1,5 KB gzip.

## Context

- Páginas cobertas: `/`, `/sobre`, `/portfolio`, `/lab`, cada case, `/posts`, `/posts/arquivo`,
  `/posts/arquivo/<ano>`, cada post (na raiz, `/<slug>`), `/contato`, `/conectar`. A 404 fica fora.
- Já existem: `buildCaseMarkdown` (`src/lib/aeo/case-markdown.ts`) e as rotas
  `/portfolio/<slug>.md` e `/lab/<slug>.md`; o corpo markdown cru dos posts via `getPostEntry`.
- O script único do site (efeito de ponteiro) mede 473 B gzip de um orçamento de 1.536 B.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| O markdown de cada case já é gerado por função pura | `src/lib/aeo/case-markdown.ts` (`buildCaseMarkdown`) | sim |
| O corpo cru do post está disponível pela camada de acesso | `src/lib/content/posts.ts:86` (`getPostEntry`) | sim |
| Nenhum renderizador de markdown é dependência direta | `package.json` (`dependencies`) | sim |
| `marked` 18.1.0, MIT | `npm view marked` | sim |
| Rotas genéricas `[...path]/ia` e `[...path].md` convivem com `/[slug]` pré-renderizado; as rotas `.md` explícitas de case têm prioridade; caminho desconhecido cai na rota genérica (que precisa devolver 404 sozinha) | sonda HTTP contra o build em 2026-10-08: `/ia`, `/sobre/ia`, `/<post>/ia`, `/lab/forja/ia`, `/posts/arquivo/2017/ia`, `/index.md`, `/<post>.md` → 200 | sim |

## Requirements

### P1 (MVP)

1. [REQ-001] QUANDO qualquer página coberta renderiza ENTÃO o sistema DEVE exibir um switcher fixo no canto inferior direito, **Humano | IA**, com "Humano" marcado como atual e "IA" como link para `<página>/ia` (home: `/ia`).
2. [REQ-002] QUANDO `<página>/ia` é requisitada ENTÃO o sistema DEVE responder 200 com a barra (indicador **PRONTO PARA LLM**, caminho do `.md`, abas **Renderizado | Fonte**, **Copiar**, **Baixar .md**, **Fechar**), um bloco com Título e URL, o markdown renderizado no servidor e o switcher com "IA" marcado.
3. [REQ-003] QUANDO uma página coberta existe ENTÃO o sistema DEVE servir sua versão `.md` com `text/markdown` (`/index.md`, `/sobre.md`, `/portfolio.md`, `/lab.md`, `/posts.md`, `/posts/arquivo.md`, `/posts/arquivo/<ano>.md`, `/<post>.md`, `/contato.md`, `/conectar.md`); os `.md` de case existentes continuam iguais.
4. [REQ-004] QUANDO o markdown de uma página é gerado ENTÃO o sistema DEVE produzi-lo por funções puras em `src/lib/ai-view/`, a partir da camada de acesso (cases já redigidos, rascunhos excluídos); posts usam o corpo markdown original.
5. [REQ-005] QUANDO a visão IA renderiza ENTÃO as abas Renderizado e Fonte DEVEM alternar só com CSS, com Renderizado selecionada.
6. [REQ-006] QUANDO a barra renderiza ENTÃO "Baixar .md" DEVE ser um `<a download>` para o `.md` da página e "Fechar" um link para a página humana, ambos sem JS.
7. [REQ-007] QUANDO o visitante aciona "Copiar" ENTÃO o sistema DEVE copiar a fonte markdown pelo script único do site; sem JS, o botão DEVE ficar oculto.
8. [REQ-008] QUANDO a visão IA renderiza ENTÃO ela DEVE declarar `noindex` e canonical para a página humana; nem as `/ia` nem os `.md` DEVEM entrar no sitemap.
9. [REQ-009] QUANDO o build termina ENTÃO o portão de JS DEVE continuar exigindo um único script (efeito de ponteiro + Copiar) de no máximo 1,5 KB gzip.
10. [REQ-010] QUANDO um case ou post declara o slug `ia` ENTÃO o build DEVE falhar.
11. [REQ-011] QUANDO os `.md` novos são gerados ENTÃO eles DEVEM passar pelo portão de vazamento.
12. [REQ-012] QUANDO os rótulos do switcher e da barra são exibidos ENTÃO eles DEVEM vir de um único mapa, em pt-BR nesta entrega.

### P2 (Should Have)

13. [REQ-013] QUANDO o visitante usa teclado ENTÃO switcher, abas e botões DEVEM ser alcançáveis com foco visível; `verify-keyboard.sh` e `verify-viewport-320.sh` DEVEM incluir `/sobre/ia` e `/lab/forja/ia`.

## Edge Cases

- Slug `ia` em case ou post: o build falha (REQ-010).
- Página inexistente: 404 tanto em `/x/ia` quanto em `/x.md`.
- Case pedido na coleção errada: 404, como já acontece nos `.md` de case.
- Post com HTML embutido no markdown: renderizado na aba Renderizado como já é na página humana (conteúdo do autor, versionado no repositório).
- Prioridade de rotas: se as rotas genéricas não resolverem diante do `/[slug]` pré-renderizado, a implementação usa arquivos de rota explícitos.

## Architecture Decisions

- **Visão no servidor**, não painel no navegador: o painel exigiria biblioteca de markdown no cliente e estouraria o orçamento de JS.
- **`marked` 18.1.0**, fixado e auditado, só no servidor. O processador interno do Astro (`@astrojs/markdown-satteri`) foi descartado por ser pacote interno.
- **Um registro `markdownForPath(path)`** alimenta o `.md` e a `/ia`, para as duas visões não divergirem.
- **Rótulos em pt-BR num único mapa**: o autor vai lançar o site em inglês e troca o mapa junto.
- **Copiar no script único**: o portão de JS continua aceitando um script só.

## Constraints

- Nenhuma diretiva `client:*`; nenhum hex fora do arquivo de tokens; animar só `transform`, `opacity` e cor.
- Contraste AA em toda a barra e no switcher; alvos de toque de pelo menos 44px.

## Out of Scope

| Item | Motivo |
|------|--------|
| Site em inglês | Feature separada; aqui só os rótulos ficam prontos para a troca |
| 404 | Não é conteúdo |
| Busca dentro da visão IA | Não pedido |
| Painel sobreposto no cliente | Descartado em favor da visão no servidor |

## Test Strategy

- Unit: cada builder de markdown e o registro `markdownForPath`.
- Componente: switcher e barra (`experimental_AstroContainer`).
- Fonte: CSS das abas e do switcher.
- Build: portão de JS, portão de vazamento, sitemap.
- HTTP: `verify-aeo-routes.sh` com `/ia`, `/sobre/ia`, um post, um case e os `.md`; teclado e 320px.

## Requirement Traceability

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| REQ-001 | Switcher Humano/IA em toda página | P1 | Pending |
| REQ-002 | Visão `<página>/ia` com barra | P1 | Pending |
| REQ-003 | `.md` de toda página | P1 | Pending |
| REQ-004 | Markdown por funções puras | P1 | Pending |
| REQ-005 | Abas só com CSS | P1 | Pending |
| REQ-006 | Baixar e Fechar sem JS | P1 | Pending |
| REQ-007 | Copiar no script único | P1 | Pending |
| REQ-008 | noindex, canonical, fora do sitemap | P1 | Pending |
| REQ-009 | Portão de JS mantido | P1 | Pending |
| REQ-010 | Slug `ia` reservado | P1 | Pending |
| REQ-011 | `.md` no portão de vazamento | P1 | Pending |
| REQ-012 | Rótulos num único mapa | P1 | Pending |
| REQ-013 | Teclado e 320px | P2 | Pending |
