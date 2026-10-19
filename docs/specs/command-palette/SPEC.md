---
slug: command-palette
status: approved
depth: deep
created: 2026-10-19
depends_on: []
---

# SPEC: command-palette

Paleta de comandos com busca em todo o site, aberta por `Ctrl+K` (ou `⌘K`), no estilo do
zenorocha.com: um campo "Digite um comando ou busque…", ações gerais, "Ir para" com atalhos
`G` + letra, e resultados de posts, cases, páginas e serviços.

## Contexto

- O site só aceita JavaScript de cliente por exceção nomeada (`tests/design-system/no-client-js.build-test.ts`, `tests/helpers/client-scripts.ts`): o script do `PointerField` em todas as páginas (orçamento de 1536 B gzip, hoje em 1158 B) e a prévia de áudio do `/now`. Nenhuma diretiva `client:*`. A paleta não cabe no orçamento do ponteiro.
- O zenorocha.com usa kbar (React). Aqui a paleta é TypeScript puro, sem dependência nova.
- A camada de acesso já lista o conteúdo: `getCurrentPosts`, `getArchivedPosts`, `getAllProjects` (com `collectionOfBlock` para portfólio/lab), `SALES_SERVICES` e `salesUrl` para a landing. O `/ai-index.json` monta um índice parecido para máquinas.
- O plano `i18n-foundation` (não implementado) também mexe no script do `PointerField` e no `SiteHeader`. As duas features devem ser implementadas em sequência, não em paralelo.

## Decisões

| # | Decisão | Descartado | Por quê |
|---|---------|-----------|---------|
| D1 | Terceira exceção nomeada de JavaScript: o módulo da paleta, marcado por `data-command-palette`, em até 4 KB gzip, baixado sob demanda | estender o script do ponteiro; carregar sempre | Não cabe nos 378 B livres do ponteiro; sob demanda, quem nunca abre a paleta não paga nada |
| D2 | O script do ponteiro ganha só o carregador: escuta `Ctrl/⌘+K`, o clique no botão e a sequência `G`, e faz `import()` do módulo na primeira vez | um segundo script em todas as páginas | Mantém um script por página. O plano supunha que o carregador coubesse no orçamento de 1536 B gzip, mas o Vite envolve todo `import()` de cliente no auxiliar `__vitePreload` (cerca de 717 B gzip) e o ponteiro chegou a 2040 B; por decisão do Fernando em 2026-10-19, o orçamento subiu para 2304 B gzip (remover o auxiliar por plugin e um segundo script foram descartados) |
| D3 | Índice em `/search.json`, pré-renderizado no build, buscado na primeira abertura | índice embutido no HTML; busca no servidor por requisição | Não pesa no HTML de nenhuma página e funciona com cache de CDN |
| D4 | Busca sem biblioteca: normaliza (minúsculas, sem acento) e exige que todos os termos apareçam; ordena por título > marcadores > resumo | fuzzy search (Fuse.js etc.) | Algumas dezenas de itens; uma dependência estouraria o orçamento de D1 |
| D5 | Sem JavaScript, nada da paleta aparece: o botão e a dica nascem `hidden` e o carregador os mostra | página `/busca` no servidor | Escolha do Fernando: menos código; o site já navega sem a paleta |
| D6 | Atalhos globais só em sequência `G` + letra; as ações gerais não têm tecla única global | teclas únicas globais (L, E, S) como no zenorocha.com | Uma tecla solta dispararia ações sem querer enquanto se lê; dentro da paleta tudo é acessível pela lista |
| D7 | Paleta só no site principal (`BaseLayout`); a landing de serviços fica de fora, mas os serviços são resultados da busca | paleta também no `SalesLayout` | A landing tem um objetivo só (orçamento) e fala com quem não usa atalho de teclado |
| D8 | Posts arquivados entram no índice, sempre abaixo dos atuais e marcados "arquivo" | só os atuais | Escolha do Fernando |
| D10 | Transições só em CSS, no padrão do lightbox (`@starting-style` + `overlay`/`display` `allow-discrete`) | animar por JavaScript | Não custa bytes do orçamento e o fechamento espera a transição sem código |
| D11 | `happy-dom` como devDependency, só para o teste do módulo da paleta (`// @vitest-environment happy-dom`) | testar o DOM só por screenshot | Lei de ferro 5 e TDD: abrir, fechar, foco e teclado precisam de teste automatizado |
| D9 | Copy da paleta num módulo próprio (`src/lib/search/copy.ts`), em pt-BR | strings no componente | Um lugar só para a i18n traduzir depois |

## Mapa de atalhos `G` + letra

| Tecla | Destino | Tecla | Destino |
|-------|---------|-------|---------|
| `G H` | `/` (Home) | `G U` | `/setup` |
| `G B` | `/posts` (Blog) | `G N` | `/now` (Agora) |
| `G P` | `/portfolio` | `G C` | `/contato` |
| `G L` | `/lab` | `G M` | `/mcp` |
| `G S` | `/sobre` | | |

## Requisitos

### Abertura e fechamento

- **REQ-001** QUANDO o visitante pressiona `Ctrl+K` ou `⌘K` em qualquer página do site principal ENTÃO o sistema DEVE abrir a paleta com o foco no campo de busca, e o atalho DEVE ser impedido de chegar ao navegador.
- **REQ-002** QUANDO o visitante clica no botão `⌘` do cabeçalho ENTÃO o sistema DEVE abrir a paleta, inclusive em telas de toque.
- **REQ-003** QUANDO a paleta está aberta e o visitante pressiona `Esc`, clica fora dela ou escolhe um item ENTÃO o sistema DEVE fechá-la e devolver o foco ao elemento que a abriu.
- **REQ-004** QUANDO o JavaScript não roda ENTÃO o botão do cabeçalho e a dica da home NÃO DEVEM aparecer, e nenhuma outra parte da página DEVE mudar.

### Conteúdo e busca

- **REQ-005** QUANDO o build roda ENTÃO o sistema DEVE gerar `/search.json` com: as páginas do site (Home, Blog, Portfólio, Lab, Sobre, Setup, Agora, MCP, Contato, Currículo), os posts atuais, os posts arquivados, os cases de portfólio e lab e as páginas da landing de serviços; cada item com tipo, título, caminho absoluto ou relativo, resumo e marcadores quando houver. Rascunhos NÃO DEVEM entrar.
- **REQ-006** QUANDO a paleta abre pela primeira vez ENTÃO o sistema DEVE buscar `/search.json` uma única vez e reaproveitá-lo nas aberturas seguintes; se a busca falhar, a paleta DEVE continuar com as ações e o "Ir para", e mostrar que a busca está indisponível.
- **REQ-007** QUANDO o campo está vazio ENTÃO a paleta DEVE mostrar os grupos "Geral" e "Ir para", nessa ordem, como no zenorocha.com.
- **REQ-008** QUANDO o visitante digita ENTÃO o sistema DEVE filtrar ações, destinos e conteúdo ignorando maiúsculas e acentos, exigindo todos os termos digitados, e agrupar os resultados por tipo (Geral, Ir para, Posts, Cases, Páginas, Serviços, Arquivo), com os posts arquivados sempre por último.
- **REQ-009** QUANDO nenhum item corresponde ENTÃO a paleta DEVE dizer que nada foi encontrado e oferecer o "Ir para o contato".

### Ações e atalhos

- **REQ-010** QUANDO a paleta é aberta ENTÃO o grupo "Geral" DEVE oferecer "Copiar link" (copia a URL atual e confirma na própria linha) e "Enviar e-mail" (abre `/go/contato/email`, que conta a conversão).
- **REQ-011** QUANDO o visitante pressiona `G` e, em até 1 segundo, uma letra do mapa ENTÃO o sistema DEVE navegar para o destino, com a paleta aberta ou fechada; o "Ir para" DEVE mostrar a combinação de cada destino.
- **REQ-012** QUANDO o foco está num campo de texto, `select` ou elemento editável, ou há `Ctrl`/`Alt`/`Meta` na tecla ENTÃO a sequência `G` NÃO DEVE disparar.

### Acessibilidade e aparência

- **REQ-013** QUANDO a paleta está aberta ENTÃO ela DEVE ser um `<dialog>` modal com o campo como `combobox` ligado a uma `listbox`; `↑`/`↓` DEVEM mover a opção ativa (`aria-activedescendant`), `Enter` DEVE escolher, e uma região `aria-live` DEVE anunciar quantos resultados há.
- **REQ-014** QUANDO a paleta é renderizada ENTÃO ela DEVE usar os tokens do design system (sem valor avulso), respeitar `prefers-reduced-motion` e mostrar as teclas com `<kbd>`, no padrão da página `/setup`.
- **REQ-018** QUANDO a paleta abre ou fecha ENTÃO o sistema DEVE fazer uma transição suave (o painel e o fundo escurecido aparecem e somem com opacidade, e o painel com uma leve escala), usando `--duration-base` e `--ease-out`, sem cortar a saída: o diálogo continua visível até a transição de fechamento terminar. Com `prefers-reduced-motion: reduce`, a paleta DEVE abrir e fechar sem animação.
- **REQ-015** QUANDO a home é aberta com JavaScript num dispositivo com teclado (`hover: hover`) ENTÃO o hero DEVE mostrar a dica "Pressione Ctrl K para começar →", que abre a paleta ao clique; em Mac, o sistema DEVE mostrar `⌘` no lugar de `Ctrl`, na dica e no botão.

### Portões

- **REQ-016** QUANDO o portão de JavaScript de cliente roda ENTÃO ele DEVE aceitar o módulo da paleta como terceira exceção nomeada (`data-command-palette`, até 4096 B gzip, só como arquivo carregado sob demanda, nunca como `<script>` direto na página), e o script do ponteiro DEVE ficar dentro de 2304 B gzip com o carregador (orçamento revisto em D2).
- **REQ-017** QUANDO o `SalesLayout` é renderizado ENTÃO ele NÃO DEVE trazer o botão nem o carregador da paleta.

## Fora de escopo

- Busca no texto completo dos posts.
- Paleta na landing de serviços.
- Página `/busca` sem JavaScript.
- Teclas únicas globais (L, E, S) e "Ver código-fonte".
- Medir o uso da paleta (não há analytics de cliente).
- Versão inglesa da copy (fica para a i18n, via D9).

## Critérios de sucesso

- `Ctrl+K` abre a paleta em qualquer página do site principal e um post é encontrado pelo título digitado sem acento.
- `G B` leva ao blog sem abrir a paleta.
- O portão de JavaScript continua verde, com o ponteiro abaixo de 2304 B gzip (D2) e a paleta abaixo de 4096 B gzip.
- Sem JavaScript, nenhuma página mostra botão ou dica da paleta.
