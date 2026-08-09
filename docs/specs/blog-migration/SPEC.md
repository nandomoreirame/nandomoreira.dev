# Spec: Migração do blog antigo

> **Roadmap:** `docs/specs/00-roadmap.md` — fora das seis sprints; sucede `notes` (F14)
> **PRD:** F14 (notas) reestruturada em blog com arquivo
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

A feature `notes` está implementada e **vazia**: existe só `exemplo.md`, marcado
`draft: true`. Ao mesmo tempo há 40 textos publicados fora do projeto, sem
nenhuma superfície própria: 38 no repositório Gatsby (2015-2019) e 2 exportados
do Notion (2024).

Trazer os 40 para dentro quebra a premissa sobre a qual `notes` foi construída.
REQ-002 daquela spec proíbe qualquer data em superfície humana, o que é correto
para nota atemporal e **enganoso** para um acervo histórico: um tutorial de
instalar o Gulp 4 sem data lê como se fosse de hoje. A decisão do autor foi
inverter o requisito, não contorná-lo.

## Goals

- Publicar os 40 textos, com a origem e a época legíveis.
- Renomear `/notas` para `/posts`, com o detalhe do artigo na raiz (`/<slug>`).
- Separar conteúdo corrente do arquivo, e paginar o arquivo por ano sem JavaScript.
- Trazer as 77 imagens para o projeto, com caminhos corretos e otimização de build.

## Context

### O acervo

| Origem | Anos | Textos | Imagens |
|---|---|---|---|
| Gatsby (`content/blog`) | 2015-2019 | 38 | 55 referenciadas + 15 co-locadas |
| Notion (export) | 2024 | 2 | 8 |

Distribuição: 2015 (17), 2016 (11), 2017 (4), 2018 (4), 2019 (2), 2024 (2).

O frontmatter do Gatsby é uniforme nos 38: `path`, `title`, `date`,
`datePublished`, `description`, `image`, `category`, `tags`, mais `keywords` em
17 e `comments` em 3. O schema de `notes` tem `slug`, `title`, `summary`, `date`,
`markers` e `draft`, então três campos do acervo não têm destino.

As imagens são referenciadas como `../../../assets/<ano>/<mês>/<arquivo>`,
apontando para uma pasta que vive **fora** de `content/blog`. Das 55, **54
existem** e uma não: `eu-ambiente-gulpjs.png`.

### O que a mudança atravessa

`/notas` aparece em 16 arquivos entre rotas, biblioteca e testes: as duas páginas,
`llms-txt.ts`, `sitemap.ts`, `note-ld.ts`, `rss.ts`, `SiteNav.astro` e nove suítes.

**`/notas` nunca foi publicada.** O sitemap de produção tem zero ocorrências, ao
contrário de `/projetos`, que exigiu 301. A renomeação não quebra nada indexado.

### Colisão de rota na raiz

Com o detalhe em `/<slug>`, cada post disputa o espaço das páginas de raiz. Hoje
existem `/sobre`, `/contato`, `/portfolio`, `/lab`, `/posts`, `/404`, `/api/*` e
as quatro rotas de máquina. **Nenhum dos 38 slugs colide hoje**, e não há
duplicata entre eles. O Astro resolve rota estática antes de dinâmica, então uma
colisão futura não daria erro: o post simplesmente ficaria inacessível, em
silêncio. É o modo de falha que exige portão.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| 38 posts no Gatsby, 2015-2019 | tarball do repositório, `content/blog` | sim |
| 2 posts no export do Notion, 2024 | `~/Downloads/posts/` | sim |
| 55 imagens referenciadas, 54 existentes | comparação ref a ref contra `content/assets` | sim |
| `eu-ambiente-gulpjs.png` não existe | mesma comparação | sim |
| 12 MB nas imagens referenciadas | `du` sobre o conjunto | sim |
| Nenhum slug colide com rota de raiz | comparação contra `src/pages` | sim |
| Nenhum slug duplicado entre posts | `uniq -d` sobre os 38 | sim |
| `/notas` ausente do sitemap de produção | `curl` ao sitemap publicado | sim |
| O portão de data proíbe 5 formatos | `tests/notes/no-date-leak.test.ts` | sim |
| `notes` tem 0 publicadas, 1 rascunho | `src/content/notes/` | sim |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um visitante acessa `/posts` ENTÃO o sistema DEVE listar os textos correntes, e NÃO PODE listar os arquivados.
2. **[REQ-002]** QUANDO um visitante acessa `/posts/arquivo` ENTÃO o sistema DEVE apresentar os anos disponíveis com a contagem de cada um.
3. **[REQ-003]** QUANDO um visitante acessa `/posts/arquivo/<ano>` ENTÃO o sistema DEVE listar os textos daquele ano, do mais recente para o mais antigo.
4. **[REQ-004]** QUANDO um visitante acessa `/<slug>` ENTÃO o sistema DEVE apresentar o texto correspondente, esteja ele corrente ou arquivado.
5. **[REQ-005]** QUANDO um slug de texto coincide com uma rota de raiz existente ENTÃO o build DEVE falhar, porque a rota estática vence e o texto ficaria inacessível sem erro.
6. **[REQ-006]** QUANDO qualquer superfície humana apresenta um texto ENTÃO ela DEVE exibir a data, revogando a proibição de `notes`.
7. **[REQ-007]** QUANDO a separação por ano é oferecida ENTÃO ela DEVE ser feita por rota estática, e NÃO PODE custar JavaScript de cliente.
8. **[REQ-008]** QUANDO um texto é importado ENTÃO seu `summary` DEVE vir do `description` de origem, e seus marcadores das `tags`, sem inventar conteúdo.
9. **[REQ-009]** QUANDO um texto referencia uma imagem ENTÃO o caminho DEVE resolver dentro do projeto, e o build DEVE falhar se o arquivo não existir.
10. **[REQ-010]** QUANDO uma imagem é servida ENTÃO ela DEVE passar pelo pipeline de otimização do Astro, e NÃO PODE ser entregue no tamanho original de 12 MB somados.
11. **[REQ-011]** QUANDO um texto declara imagem de capa ENTÃO o alternativo DEVE descrever o que a imagem mostra, mantendo a regra que o catálogo já aplica.
12. **[REQ-012]** QUANDO a coleção é renomeada ENTÃO `sitemap.xml`, `llms.txt`, o RSS e a navegação DEVEM refletir `/posts`, sem sobrar referência a `/notas`.
13. **[REQ-013]** QUANDO o build conclui ENTÃO os portões existentes DEVEM continuar passando, com exceção declarada do portão de data, que é revogado por REQ-006.

### P2 (Should Have)

14. **[REQ-014]** QUANDO um visitante acessa `/notas` ENTÃO o sistema DEVE redirecionar para `/posts`, mesmo a rota nunca tendo sido indexada.
15. **[REQ-015]** QUANDO um texto arquivado é apresentado ENTÃO ele DEVE indicar que pertence ao acervo, para o leitor calibrar a atualidade do conteúdo.
16. **[REQ-016]** QUANDO um texto arquivado é revisado ENTÃO marcá-lo como corrente DEVE bastar para ele sair do arquivo e entrar em `/posts`.
17. **[REQ-017]** QUANDO uma imagem referenciada não é encontrada na origem ENTÃO o texto DEVE ser importado sem ela, e a ausência registrada, em vez de bloquear a migração inteira.

### P3 (Nice to Have)

18. **[REQ-018]** QUANDO o arquivo cresce ENTÃO o índice de anos PODE exibir o intervalo coberto, evitando que o leitor abra ano vazio.

## Edge Cases

- **Slug de 69 caracteres** — O mais longo é `como-converter-todos-arquivos-scss-de-um-diretorio-para-extensao-sass`. Válido, mas na raiz vira uma URL longa. Encurtar quebraria o link de origem sem ganho real.
- **`eu-ambiente-gulpjs.png` ausente** — REQ-017: o post entra sem a imagem. Bloquear os 40 por causa de um arquivo perdido em 2015 seria desproporcional.
- **Post do Notion duplica um do Gatsby** — "Como exibir o calendário" existe nas duas origens. A versão do Notion é a revisão de 2024; a do Gatsby é de 2016. Só uma entra, e a decisão de qual é do autor.
- **Imagem co-locada e imagem em `assets/`** — Duas convenções na mesma origem. A migração normaliza para uma só.
- **Slug futuro colidindo com rota nova** — REQ-005 protege o sentido "post colide com rota". A recíproca, criar uma página de raiz com nome de post existente, é o mesmo portão lido ao contrário e deve valer nos dois sentidos.
- **`draft: true`** — `exemplo.md` existe e não deve aparecer em nenhuma das superfícies novas.
- **Ano sem nenhum texto** — `/posts/arquivo/<ano>` só é gerada para ano que tenha conteúdo; um ano vazio não vira rota.

## Architecture Decisions

1. **Revogar REQ-002 de `notes` por completo, e remover o portão** — Decisão explícita do autor, tomada com a alternativa de exceção só para o arquivo sobre a mesa. O portão `no-date-leak.test.ts` é apagado, não afrouxado: um portão que não protege mais nada é ruído que o próximo leitor tentará satisfazer.
2. **Detalhe na raiz, listagens sob `/posts`** — Pedido do autor. O custo é a disputa por espaço de nome com as páginas de raiz, mitigada por REQ-005. Alternativa descartada: `/posts/<slug>`, que elimina o risco mas contraria o pedido.
3. **Arquivo por rota, não por filtro** — `no-client-js` é inviolável, então "filtrar por ano" vira `/posts/arquivo/<ano>` gerado no build. Ganha URL indexável por ano; perde o filtro instantâneo, que exigiria ilha.
4. **Campo explícito de arquivamento, não corte por data** — Deduzir "antigo" do ano tornaria impossível marcar um texto de 2015 como atualizado depois de revisado, que é justamente o caso de REQ-016. Um campo diz o que a data só sugere.
5. **Imagens em `src/assets/posts/<ano>/`, não em `public/`** — O autor escolheu o pipeline de otimização. O caminho usa `posts` e não `blog` para acompanhar a rota, já que a nomenclatura foi corrigida depois da escolha. Alternativa descartada: `public/images/`, que serviria os 12 MB sem tratamento.
6. **Renomear a coleção de `notes` para `posts`** — Uma coleção chamada `notes` alimentando `/posts` obriga toda leitura futura a traduzir. Alternativa descartada: manter `notes` e mapear na camada de acesso, que esconde a inconsistência em vez de resolvê-la.

## Constraints

- Zero JavaScript de cliente permanece inviolável.
- Os demais portões não podem ser relaxados para acomodar conteúdo importado.
- Conteúdo humano em pt-BR; slugs, nomes de arquivo e campos em inglês.
- O corpo dos textos é do autor e não deve ser reescrito na migração.
- A camada de acesso continua sendo o único caminho para `getCollection`.

## Out of Scope

- Reescrever ou atualizar o conteúdo dos textos importados.
- Recuperar `eu-ambiente-gulpjs.png`.
- Sistema de comentários, presente no frontmatter de 3 posts.
- Taxonomia navegável por tag ou categoria.
- Redirecionar as URLs do blog Gatsby original, que está fora do ar.

## Decisões pendentes do autor

1. **Qual versão do texto sobre o calendário entra**: a de 2016 (Gatsby) ou a de 2024 (Notion).
2. **Quais dos 40 são "atualizados"** e portanto correntes. O default do plano é tratar os 38 do Gatsby como arquivo e os 2 do Notion como correntes.
