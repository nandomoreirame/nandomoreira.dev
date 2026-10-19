---
slug: i18n-content
status: approved
depth: deep
created: 2026-10-18
depends_on: [i18n-foundation]
siblings: [i18n-foundation, i18n-sales]
---

# SPEC: i18n-content

Tradução para o inglês de todo o conteúdo não arquivado do nandomoreira.dev: os 26
cases e os 22 posts não arquivados (16 publicados e 6 rascunhos), mais a troca das
rotas de máquina para o conteúdo inglês. No fim, a bandeira `EN_LIVE` é ligada.

## Contexto

- A `i18n-foundation` entrega o roteamento `/en`, o dicionário, o `hreflang`, o perfil inglês e as rotas `/en/portfolio/<slug>`, `/en/lab/<slug>` e `/en/<slug-en>`, todas vazias até haver tradução.
- O Fernando escolheu que **a IA traduz e publica direto**, sem revisão humana por arquivo. A qualidade, então, depende de portões automáticos e de um guia de tradução, nunca de alguém lendo antes do push.
- Os 37 posts arquivados (2015 a 2019) ficam fora por pedido explícito.

## Decisões

| # | Decisão | Descartado | Por quê |
|---|---------|-----------|---------|
| C1 | Tradução como **sobreposição**: coleções `postsEn` (`src/content/posts-en/`) e `projectsEn` (`src/content/projects-en/`). Cada arquivo traz `translationOf` e só os campos traduzíveis; os estruturais vêm da fonte pt-BR na camada de acesso | cópia completa do frontmatter | Num arquivo copiado inteiro, data, capa, `art`, links, `tech`, imagens e `draft` derivam na primeira edição do pt-BR. Na sobreposição eles só existem num lugar |
| C2 | O estado de rascunho é herdado: post pt-BR em `draft: true` gera tradução também em rascunho | `draft` próprio na tradução | Publicar o pt-BR publica o en no mesmo push, coerente com "publica direto" |
| C3 | Campos traduzíveis do post: `slug`, `title`, `seoTitle`, `summary`, `markers`, `extras`, `keyPoints`, `snapshot`, `coverAlt` e o corpo. Do case: `title`, `summary`, `problem`, `decisions`, `outcome`, `imageAlts` (na ordem das `images`), `shortcutActions` (na ordem dos `shortcuts`) e `confidentialMetrics` | traduzir `tech` e nomes de cliente | `tech` é nome de tecnologia. Nome de cliente confidencial nunca sai do fonte |
| C4 | Links internos no corpo inglês apontam para o par inglês quando ele existe; sem par, mantêm o link pt-BR | sempre pt-BR | Um leitor inglês que segue um link e cai em português sai do site |
| C5 | O guia de tradução (`docs/specs/i18n-content/TRANSLATION-GUIDE.md`) é parte da feature, e cada tarefa de tradução o segue | traduzir sem guia | Sem revisão humana, o guia e os portões são o único controle de voz e de terminologia |
| C6 | As rotas de máquina preferem o inglês por item, com fallback para o pt-BR quando o item não tem tradução, e listam a URL `/en` quando existe | trocar só os rótulos | Escolha do Fernando: completa a regra "camada de máquina em inglês", que até aqui só valia para rótulos |
| C7 | `EN_LIVE = true` só na última tarefa, depois do portão de cobertura verde | ligar na fundação | Ligar antes publicaria `/en` com portfólio e blog vazios |
| C8 | Cobertura inicial é um portão com a lista fixa dos slugs de 2026-10-18 | portão "todo não arquivado tem par" | A D6 da fundação permite post novo só em pt-BR. A lista fixa garante a migração inicial sem proibir isso depois |

## Requisitos

### Modelo de sobreposição

- **REQ-001** QUANDO um arquivo de `posts-en` ou `projects-en` declara `translationOf` que não existe na coleção pt-BR ENTÃO o build DEVE falhar nomeando o arquivo.
- **REQ-002** QUANDO um arquivo de `posts-en` aponta para um post pt-BR arquivado ENTÃO o build DEVE falhar.
- **REQ-003** QUANDO dois arquivos traduzem a mesma fonte, ou dois posts ingleses têm o mesmo `slug` ENTÃO o build DEVE falhar.
- **REQ-004** QUANDO um post pt-BR tem `cover` e a tradução não tem `coverAlt` ENTÃO o build DEVE falhar; o mesmo vale quando `imageAlts` ou `shortcutActions` de um case têm tamanho diferente de `images` ou `shortcuts` da fonte.
- **REQ-005** QUANDO a camada de acesso entrega um post ou case inglês ENTÃO os campos estruturais (`date`, `publishedAt`, `draft`, `archived`, `art`, `cover.src`, `block`, `tech`, `repoUrl`, `liveUrl`, `images[].src/width/height`, `featured`, `confidential`, `discontinued`, `updatedAt`) DEVEM vir da fonte pt-BR, e a redação de confidencialidade DEVE ser aplicada exatamente como no pt-BR.
- **REQ-006** QUANDO uma tradução de post usa `slug` igual a `ia` ou `en`, ou fora do kebab-case ENTÃO o build DEVE falhar.

### Paridade e qualidade da tradução

- **REQ-007** QUANDO a suíte roda ENTÃO cada par post pt-BR/en DEVE ter o mesmo número de títulos `##` e `###`, os mesmos blocos de código cercados com conteúdo idêntico byte a byte, as mesmas imagens (`src`) na mesma ordem e os mesmos destinos de link externo.
- **REQ-008** QUANDO o corpo, o `title`, o `summary`, os `extras` ou os `keyPoints` ingleses contêm travessão (—) ou meia-risca (–) fora de código ENTÃO a suíte DEVE falhar.
- **REQ-009** QUANDO o texto inglês fora de código contém palavras de uma lista de marcadores pt-BR (`não`, `você`, `também`, `então`, `porque`, `isso`, `está`, `são`, `já`, `mas`, `quando`, `para`, `com`) acima de 3 ocorrências por arquivo ENTÃO a suíte DEVE falhar apontando o arquivo; nomes próprios e citações entram numa lista de exceções no próprio teste.
- **REQ-010** QUANDO um link interno do corpo inglês aponta para uma página que tem par inglês ENTÃO ele DEVE apontar para o par; a suíte DEVE falhar se apontar para o pt-BR.
- **REQ-011** QUANDO uma tradução é escrita ENTÃO ela DEVE seguir o `TRANSLATION-GUIDE.md`: inglês americano, primeira pessoa, frases curtas, termos do glossário, nomes de produto e de comando intocados e nenhum número alterado.

### Cobertura

- **REQ-012** QUANDO a suíte roda ENTÃO cada um dos 26 cases e dos 22 posts não arquivados listados em `tests/i18n/coverage.test.ts` DEVE ter tradução.
- **REQ-013** QUANDO um post pt-BR novo é publicado sem tradução ENTÃO o build DEVE passar, e o post DEVE existir só em pt-BR, sem `hreflang`.

### Rotas de máquina em inglês

- **REQ-014** QUANDO um agente consulta `llms.txt`, `llms-full.txt`, `ai-index.json` ou `AGENTS.md` ENTÃO os títulos, resumos e textos de case e de post DEVEM vir da tradução inglesa quando ela existe, com URL `/en/...`; sem tradução, o item DEVE sair em pt-BR com a URL pt-BR.
- **REQ-015** QUANDO um agente chama as tools do MCP de projetos ou de perfil ENTÃO as respostas DEVEM usar o conteúdo inglês (perfil inglês, case traduzido ou fallback pt-BR por item).
- **REQ-016** QUANDO um agente consulta `/api/resume.json` ou `/api/resume.txt` ENTÃO o sistema DEVE servir o perfil inglês.
- **REQ-017** QUANDO qualquer rota de máquina é gerada ENTÃO o portão `tests/aeo/no-leak.test.ts` DEVE continuar verde; nenhum `clientName` nem `confidentialMetrics` de case confidencial pode aparecer.

### Lançamento

- **REQ-018** QUANDO o portão de cobertura passa ENTÃO `EN_LIVE` DEVE ser ligado, e o build de produção DEVE servir `/en/...` com `hreflang` nos pares pt-BR, o seletor de idioma e as URLs inglesas no sitemap.

## Fora de escopo

- Posts arquivados.
- Revisão humana arquivo por arquivo (decisão do Fernando). Ele pode revisar depois do push, e uma correção é só uma edição do `.md` inglês.
- Tradução automática contínua de posts novos: cada post novo em inglês é uma tarefa manual (ou do `post-autowriter`) usando o mesmo guia.

## Critérios de aceite

- `npm run verify` verde e os portões de paridade, de dash, de marcadores pt-BR e de cobertura verdes.
- `bash scripts/verify-aeo-routes.sh` com `AEO ROUTES PASSED`.
- No build de produção: `/en/portfolio` e `/en/lab` listam juntos os 26 cases, `/en/posts` lista os 16 publicados, e cada página tem `hreflang` recíproco com o par pt-BR.

## Grilling Log

| Pergunta | Resolução | Fonte |
|----------|-----------|-------|
| Quem traduz? | IA, publicação direta | Fernando, 2026-10-18 |
| Rascunhos atuais entram? | sim | Fernando |
| Rotas de máquina em inglês? | sim, por item com fallback | Fernando |
| Sobreposição ou cópia? | sobreposição | padrão (C1) |
| Como garantir qualidade sem revisor? | guia, portões de paridade, dash e marcadores | padrão (C5, REQ-007 a REQ-010) |
| Quando ligar `EN_LIVE`? | última tarefa, depois da cobertura | padrão (C7) |
