---
slug: i18n-foundation
status: approved
depth: deep
created: 2026-10-18
siblings: [i18n-content, i18n-sales]
---

# SPEC: i18n-foundation

Infraestrutura de internacionalização do nandomoreira.dev: o site passa a ter uma
versão em inglês sob `/en`, com slugs traduzidos, `hreflang`, seletor de idioma,
dicionário de interface tipado e sugestão de idioma pelo navegador. Esta feature
entrega o encanamento e o perfil traduzido; a tradução de cases e posts é a
`i18n-content`, e a landing de vendas é a `i18n-sales`.

## Contexto

- Hoje tudo é fixo em pt-BR: `<html lang="pt-BR">` em `BaseLayout` e `SalesLayout`, `inLanguage: 'pt-BR'` em `website-ld`, `webpage-ld`, `post-ld` e `mcp/clients`, `<language>pt-BR</language>` no RSS, `Intl.DateTimeFormat('pt-BR')` em `src/lib/format/date.ts`, e cerca de 110 componentes com texto literal.
- **Reversão de decisão registrada.** O `docs/MVP-SCOPE.md` (seção Idioma) descartou "bilíngue completo", e o `docs/PRD.md` deixou a F15 (`english-pages`) como P2, condicionada à H3. O Fernando pediu a versão inglesa completa em 2026-10-18. Esta spec substitui a F15 e registra a reversão no Decision Log de `docs/specs/00-roadmap.md`.
- A regra "camada humana em pt-BR, camada de máquina em inglês" passa a ser "camada humana em pt-BR **e** em inglês; camada de máquina em inglês". A troca do conteúdo das rotas de máquina para o inglês fica na `i18n-content`, porque depende das traduções.

## Decisões

| # | Decisão | Descartado | Por quê |
|---|---------|-----------|---------|
| D1 | pt-BR continua na raiz, sem mudar nenhuma URL; inglês sob `/en` | subdomínio `en.`; prefixo `/pt` | Nenhum link, backlink ou posição de busca existente se perde. Subdomínio complicaria cookie, `allowedDomains`, App Hosting e analytics |
| D2 | Slugs traduzidos: `/sobre` ↔ `/en/about`, post `/<slug-pt>` ↔ `/en/<slug-en>` | mesmo slug sob `/en` | Pedido do Fernando: URL em inglês na versão inglesa |
| D3 | Cases mantêm o slug sob `/en/portfolio/<slug>` e `/en/lab/<slug>` | slug traduzido também nos cases | Slug de case é nome de produto (`forja`, `mousai`, `tumodori`), não frase. Traduzir nome próprio não tem o que traduzir |
| D4 | Roteamento próprio (`src/lib/i18n/`), sem o `i18n` nativo do Astro | `i18n: { locales, routing }` do `astro.config.mjs` | O nativo assume o mesmo caminho por idioma, e aqui os slugs são traduzidos. O middleware dele também se intromete no rewrite do subdomínio de vendas. O único ganho seria `Astro.currentLocale`, e uma função pura de três linhas resolve isso |
| D5 | Dicionário de UI em TypeScript: `pt-BR.ts` é a fonte e `en.ts` é tipado com a mesma forma | JSON, biblioteca (i18next etc.) | Chave faltando quebra o `npm run check`, sem dependência nova e sem JS de cliente |
| D6 | Página sem tradução não existe em `/en`: sem rota, sem `hreflang`, fora do sitemap inglês | fallback que mostra o pt-BR com aviso; build falhar | Escolha do Fernando. Post novo pode sair só em pt-BR |
| D7 | Corpo de cada página humana vira um componente em `src/components/pages/`, e as rotas pt e en viram cascas de 3 linhas | duplicar a página em `src/pages/en/` | Duplicar dobra a manutenção e as duas cópias divergem na primeira mudança. "Página é casca" já é a regra do projeto |
| D8 | Bandeira `EN_LIVE`: até ser ligada, as rotas `/en` respondem 404 em produção, sem `hreflang` nem seletor. No dev e na homologação ficam sempre ligadas | publicar `/en` aos poucos | Push em `main` publica sozinho, e um `/en` com portfólio vazio iria para o ar antes da `i18n-content`. É o mesmo padrão do `SALES_HOST_LIVE` |
| D9 | Sugestão de idioma no script único (`PointerField`): um banner já no HTML, oculto, e o script compara `navigator.languages` com o idioma da página | detecção no servidor | Posts e cases são pré-renderizados, então o servidor nunca vê o `Accept-Language` deles. O banner nunca redireciona |
| D10 | Tradução do perfil (`src/content/profile-en/profile.md`) entra aqui, não na `i18n-content` | deixar o perfil para a feature de conteúdo | Home, Sobre, Currículo e Contato em inglês não renderizam sem perfil inglês |
| D11 | Perfil inglês é um arquivo completo validado pelo mesmo `profileSchema`, com teste de paridade estrutural | sobreposição só com os campos traduzíveis | É um arquivo só, com estrutura profunda (work, education, services). Uma sobreposição exigiria um schema paralelo inteiro. O teste de paridade cobre a deriva de contatos, datas e `caseSlug` |
| D12 | `/posts/arquivo` não tem versão inglesa | traduzir o arquivo | Posts arquivados estão fora do escopo por pedido do Fernando |

## Mapa de rotas

| pt-BR | en |
|-------|----|
| `/` | `/en` |
| `/portfolio` | `/en/portfolio` |
| `/portfolio/<slug>` | `/en/portfolio/<slug>` (quando o case tem tradução) |
| `/lab` | `/en/lab` |
| `/lab/<slug>` | `/en/lab/<slug>` (quando o case tem tradução) |
| `/posts` | `/en/posts` |
| `/<slug-pt>` | `/en/<slug-en>` (quando o post tem tradução) |
| `/sobre` | `/en/about` |
| `/contato` | `/en/contact` |
| `/curriculo` | `/en/resume` |
| `/mcp` | `/en/mcp` |
| `/setup` | `/en/setup` |
| `/now` | `/en/now` |
| `/privacidade` | `/en/privacy` |
| `/rss.xml` | `/en/rss.xml` |
| `/<x>.md`, `/<x>/ia` | `/en/<y>.md`, `/en/<y>/ia` |
| `/posts/arquivo[/<ano>]` | (sem par) |
| `/servicos[/<slug>]` | ver `i18n-sales` |

## Requisitos

### Roteamento e idioma

- **REQ-001** QUANDO uma requisição chega a um caminho que começa com `/en/` ou é exatamente `/en` ENTÃO o sistema DEVE tratá-la como idioma `en`; qualquer outro caminho DEVE ser tratado como `pt-BR`.
- **REQ-002** QUANDO uma página pt-BR existente é servida ENTÃO o sistema DEVE manter a URL, o status e o conteúdo atuais; nenhuma URL pt-BR muda com esta feature.
- **REQ-003** QUANDO o visitante abre uma rota da coluna en do mapa de rotas ENTÃO o sistema DEVE servir a página equivalente com toda a interface (navegação, rótulos, datas, tempo de leitura, rodapé, mensagens de formulário, textos alternativos de UI) em inglês.
- **REQ-004** QUANDO o visitante abre `/en/<x>` sem par no mapa de rotas, ou cujo conteúdo não tem tradução ENTÃO o sistema DEVE responder 404 com a página 404 em inglês.
- **REQ-005** QUANDO `EN_LIVE` está desligado e o build é de produção ENTÃO o sistema DEVE responder 404 a toda rota `/en`, omitir `hreflang` e o seletor de idioma, e deixar as rotas `/en` fora do sitemap; no `astro dev` e no build `--mode staging` as rotas `/en` DEVEM funcionar com a bandeira desligada.
- **REQ-006** QUANDO um post pt-BR ou um case declara o slug `en` ENTÃO o build DEVE falhar, porque `/en` é reservado.

### Dicionário de interface

- **REQ-007** QUANDO uma chave existe no dicionário pt-BR e falta no inglês (ou o contrário) ENTÃO `npm run check` e a suíte unitária DEVEM falhar apontando a chave.
- **REQ-008** QUANDO um componente renderiza texto de interface ENTÃO o texto DEVE vir do dicionário do idioma da página, recebido como prop `locale` (padrão `pt-BR`); nenhum literal de interface em português pode sobrar num componente compartilhado pelas duas versões.
- **REQ-009** QUANDO uma data é exibida ENTÃO o sistema DEVE formatá-la no idioma da página: `11 de outubro de 2026` / `October 11, 2026` na forma longa e `16 out. 2026` / `16 Oct 2026` na curta.
- **REQ-010** QUANDO o marcador `{anos}` aparece no perfil ENTÃO o sistema DEVE substituí-lo por `+N anos` em pt-BR e `N+ years` em inglês, com N calculado a partir de 2011.

### SEO e descoberta

- **REQ-011** QUANDO uma página tem par no outro idioma ENTÃO o `<head>` DEVE trazer `<link rel="alternate" hreflang="pt-BR">`, `hreflang="en"` e `hreflang="x-default"` (apontando para o pt-BR), todos com URL absoluta; sem par, nenhum `hreflang` DEVE ser emitido.
- **REQ-012** QUANDO uma página é renderizada ENTÃO `<html lang>`, `og:locale` (`pt_BR` ou `en_US`), `og:locale:alternate` (só com par) e o `inLanguage` de todo JSON-LD da página DEVEM refletir o idioma dela.
- **REQ-013** QUANDO um crawler consulta `/sitemap.xml` ENTÃO o sistema DEVE listar também as URLs inglesas publicadas, e cada URL com par DEVE trazer os `xhtml:link` alternados dos dois idiomas.
- **REQ-014** QUANDO um leitor assina `/en/rss.xml` ENTÃO o sistema DEVE servir os posts não arquivados que têm tradução, com `<language>en</language>` e links `/en/<slug-en>`; o `/rss.xml` continua igual.
- **REQ-015** QUANDO uma página inglesa é compartilhada ENTÃO a imagem OG DEVE existir em `/og/en/<...>.png`, com título e eyebrow em inglês.
- **REQ-016** QUANDO um agente pede `/en/<y>.md` ou `/en/<y>/ia` de uma página inglesa existente ENTÃO o sistema DEVE servir a visão IA em inglês dela; o registro `markdownForPath` continua a única tabela de caminhos.

### Seletor e sugestão de idioma

- **REQ-017** QUANDO uma página é renderizada ENTÃO o header DEVE mostrar um link de troca de idioma com `hreflang` e `lang` do destino, apontando para o par da página ou, sem par, para a home do outro idioma; o link DEVE ser alcançável por teclado e ter nome acessível no idioma de destino.
- **REQ-018** QUANDO a página tem par e o primeiro idioma de `navigator.languages` que for `pt` ou `en` é diferente do idioma da página ENTÃO o script do site DEVE revelar um aviso, no idioma do visitante, com link para o par e um botão de dispensar; o sistema NUNCA DEVE redirecionar automaticamente.
- **REQ-019** QUANDO o visitante dispensa o aviso ENTÃO o sistema DEVE guardar a escolha no `localStorage` e não mostrá-lo de novo; se o storage falhar, o aviso só some na página atual.
- **REQ-020** QUANDO o script do site é medido pelo portão de JS ENTÃO ele DEVE continuar dentro de 1,5 KB gzip com a sugestão incluída; sem JavaScript, o aviso nunca aparece.

### Perfil

- **REQ-021** QUANDO o build roda ENTÃO `src/content/profile-en/profile.md` DEVE existir, passar no `profileSchema` e ter paridade estrutural com o pt-BR: mesmos `contacts`, mesmo número de `work`, `education`, `services` e `trajectory`, mesmas datas, mesmos `caseSlug`, mesmo `availability.status` e `updatedAt`.
- **REQ-022** QUANDO o pt-BR do perfil muda numa dessas chaves estruturais e o inglês não ENTÃO a suíte DEVE falhar.

### Acesso ao conteúdo

- **REQ-023** QUANDO qualquer superfície precisa de conteúdo num idioma ENTÃO ela DEVE pedir à camada de acesso (`src/lib/content/index.ts`) passando o `locale`; só os arquivos da camada de acesso podem chamar `getCollection`, incluindo as coleções inglesas.

## Fora de escopo

- Tradução de cases e posts, e troca das rotas de máquina para o inglês: `i18n-content`.
- Landing `contrate.nandomoreira.dev` e `/servicos`: `i18n-sales`.
- Posts arquivados e `/posts/arquivo`.
- Detecção de idioma no servidor e redirecionamento automático.
- Terceiro idioma. O tipo `Locale` admite mais um, mas nada é desenhado para isso.

## Critérios de aceite

- `npm run verify` verde, e os 7 portões existentes intactos.
- `bash scripts/verify-local-server.sh` com `ALL LOCAL CHECKS PASSED`.
- No build de homologação: `/en`, `/en/about`, `/en/contact`, `/en/resume`, `/en/mcp`, `/en/setup`, `/en/now`, `/en/privacy`, `/en/posts`, `/en/portfolio` e `/en/lab` respondem 200 em inglês. Os pares pt-BR trazem `hreflang`.
- Build de produção com `EN_LIVE = false`: `/en` responde 404 e o HTML pt-BR é idêntico ao de antes, salvo o link do seletor, que só aparece com a bandeira ligada.

## Grilling Log

| Pergunta | Resolução | Fonte |
|----------|-----------|-------|
| Estrutura de URL | `/en` + slug traduzido | Fernando, 2026-10-18 |
| Página sem tradução | não existe em `/en` | Fernando |
| Sugestão pelo navegador | no script do `PointerField`, sem redirecionar | Fernando |
| Slug de case traduzido? | não, porque é nome de produto | padrão (D3) |
| i18n nativo do Astro? | não, roteamento próprio | padrão (D4) |
| Como impedir `/en` incompleto em produção? | bandeira `EN_LIVE` | padrão (D8) |
| Onde fica o perfil inglês? | nesta feature, arquivo completo e teste de paridade | padrão (D10, D11) |
| Divisão do trabalho | 3 features irmãs | Fernando |
