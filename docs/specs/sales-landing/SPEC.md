# Spec: sales-landing

> **Status:** aprovada em 2026-10-18 (research + grilling)
> **Profundidade:** deep
> **Fonte visual:** Stitch, projeto 3626158459540278205, telas `c0a0c46dd2aa4a62944aec66b75a746a`
> (landing desktop), `1cda02f890eb48b090398883134c42f6` (landing mobile),
> `df811c3ca67e4a868f0365e814654773` (site institucional desktop) e
> `5983629069cc4cf4b6f1c5e797b27fbb` (site institucional mobile).

## Objetivo

Uma landing de vendas para clientes não técnicos (pequenos negócios, autônomos,
empreendedores) que explica, sem jargão, o que o Fernando faz: site institucional, landing
page, blog, loja virtual, produto web completo e automação com IA. Ela mostra o fluxo de
trabalho em 7 etapas, as ferramentas do Firebase por analogia e quatro projetos reais, e
termina num formulário e num botão de WhatsApp. Uma página de detalhe por serviço aprofunda
cada oferta; nesta entrega só a do Site institucional existe.

A landing é uma superfície separada do site: moldura própria, servida em
`contrate.nandomoreira.dev` pelo mesmo app Astro e o mesmo backend do App Hosting.

## Decisões de arquitetura

| Tema | Decisão | Descartado e por quê |
|---|---|---|
| Endereço | `contrate.nandomoreira.dev`, mesmo repo, roteado por host no middleware | Repo novo (manutenção duplicada); reaproveitar o ascode.com.br (stack e identidade diferentes) |
| Rotas internas | `/servicos` e `/servicos/<slug>`; o subdomínio as serve em `/` e `/<slug>` por reescrita | |
| Ativação do subdomínio | `SALES_HOST = 'contrate.nandomoreira.dev'` em `src/lib/sales/host.ts`, mais a flag `SALES_HOST_LIVE` no mesmo arquivo, `false` até o domínio responder no App Hosting. Reescrita, 301 e canonical no subdomínio só valem com a flag `true` | Ligar o 301 antes do DNS mandaria visitante e crawler para um host morto |
| Moldura | `SalesLayout` próprio: header com âncoras e botão Conversar, footer mínimo; sem `SiteHeader`, `SiteFooter` nem `PointerField` | Moldura do site (deixaria de ser landing de vendas) |
| Detalhe de serviço | Template dirigido por dados; publicado só para `site-institucional` | As 6 agora (5 textos sem design); só a landing |
| Dados dos serviços | Módulo TS validado por Zod (`src/lib/sales/catalog.ts`) e textos fixos em `src/lib/sales/copy.ts` | Collection nova obrigaria a abrir o portão de fonte única |
| Formulário | Reusa `POST /api/hire` com o campo opcional `service` | Endpoint novo (duplicaria rate limit, store e notificação); só WhatsApp (sem registro) |
| WhatsApp | Novo `kind: whatsapp` em `profile.contacts` (`5511917493331`); o clique passa pelo `/go`; o número fica fora das rotas de máquina | Constante só da landing (sem medir clique); expor aos agentes |
| Imagens dos projetos | Screenshots reais dos 4 sites no ar, capturados uma vez e versionados em `public/servicos/projetos/` | Imagens do Stitch (falsas); arte generativa (não mostra o produto); ascode (não tem as imagens) |
| Foto | Foto real `~/dev/projects/ascode.com.br/src/images/team/fernando-moreira.jpg`, copiada como `public/servicos/fernando.webp` | `Portrait` ilustrado |
| Conteúdo do Stitch | Textos do prompt aprovado e da tela; **todo número, métrica, preço, prazo e selo inventado pelo Stitch fica fora** | `99.98% no ar`, `R$ 14.890 hoje`, `< 1.5s`, `R$ 0`, `99.99% Uptime`, `100 pontos de presença`, `Retorno em 24 horas úteis`, `© 2025`, "Termos de Serviço" (RISK-004) |
| Preço | Nenhuma página promete valor fechado, faixa ou prazo; tudo vem da proposta, depois da conversa | |

## Requisitos

### Rotas, host e moldura

- **REQ-001** QUANDO alguém acessar `/servicos` ENTÃO o sistema DEVE responder 200 com a landing de vendas renderizada no servidor, dentro do `SalesLayout`, sem o header, o footer e o script do site principal.
- **REQ-002** QUANDO alguém acessar `/servicos/<slug>` com um slug que tem página de detalhe ENTÃO o sistema DEVE responder 200 com a página do serviço; com qualquer outro slug, DEVE responder 404.
- **REQ-003** QUANDO `SALES_HOST_LIVE` for `true` e a requisição chegar com o host `contrate.nandomoreira.dev` ENTÃO o middleware DEVE reescrever `/` para `/servicos` e `/<slug>` para `/servicos/<slug>`, sem redirecionar; `/api/hire`, `/go/*`, `/v.gif` e os assets DEVEM passar sem reescrita.
- **REQ-004** QUANDO `SALES_HOST_LIVE` for `true` e alguém acessar `/servicos` ou `/servicos/<slug>` no host principal ENTÃO o sistema DEVE responder 301 para o endereço equivalente no subdomínio.
- **REQ-004a** QUANDO alguém acessar `/servicos` ou `/servicos/<slug>` no host principal de dev (`localhost`) ou da homologação (`nandomoreira.home`) ENTÃO o sistema DEVE responder 301 para o mesmo endereço no host de vendas daquele ambiente, qualquer que seja a flag, e os links "Ver os serviços" DEVEM apontar direto para esse host. Pedido do Fernando em 2026-10-18.
- **REQ-005** QUANDO o build rodar ENTÃO `security.allowedDomains` do `astro.config.mjs` DEVE incluir `contrate.nandomoreira.dev` com `https`, senão o formulário recebe 403 do checkOrigin.
- **REQ-006** QUANDO `SALES_HOST_LIVE` for `false` ENTÃO nada no site principal DEVE mudar de comportamento por causa do host, e o canonical das páginas de vendas DEVE apontar para `https://nandomoreira.dev/servicos...`; com a flag `true`, para `https://contrate.nandomoreira.dev/...`.
- **REQ-035** QUANDO a requisição chegar com o host `contrate.nandomoreira.local` (só desenvolvimento local) ENTÃO o middleware DEVE reescrever como no subdomínio real, mesmo com `SALES_HOST_LIVE` desligada, nunca redirecionar para produção, e o `astro dev` DEVE aceitar esse host (`server.allowedHosts`). Pedido do Fernando em 2026-10-18 para revisar o conteúdo no endereço próprio.
- **REQ-007** QUANDO a home e o `/contato` renderizarem ENTÃO cada um DEVE ter um link discreto "Para o seu negócio" para a landing (endereço conforme REQ-006), sem novo item no menu principal e sem segundo CTA primário na home.

### Landing (`/servicos`)

- **REQ-008** QUANDO a landing renderizar ENTÃO ela DEVE ter, nesta ordem: hero, "Comece pela sua situação", serviços, como eu trabalho, ferramentas, projetos reais, sobre, dúvidas frequentes, chamada final com formulário e rodapé, com os textos do Anexo A.
- **REQ-009** QUANDO o hero renderizar ENTÃO a composição visual (janelas de navegador) DEVE ser estática, sem JavaScript, e sem número, valor em reais, percentual ou domínio de cliente inventado.
- **REQ-010** QUANDO alguém escolher um dos 6 cartões de situação ENTÃO o link DEVE levar à âncora do serviço correspondente na própria landing.
- **REQ-011** QUANDO os serviços renderizarem ENTÃO cada um dos 6 DEVE vir de `src/lib/sales/catalog.ts` com título, frase, "para quem é" e de 3 a 4 itens de "o que você recebe"; "Entender em detalhes" só DEVE aparecer para serviço com página de detalhe.
- **REQ-012** QUANDO "Como eu trabalho" renderizar ENTÃO DEVE listar as 7 etapas numeradas (Entrevista, Pesquisa, Design, Aprovação, Desenvolvimento, Testes, Entrega) com "o que você faz", destacando 03 e 04 com um rótulo em texto, não só por cor.
- **REQ-013** QUANDO a seção de ferramentas renderizar ENTÃO DEVE mostrar Firebase Hosting, App Hosting, Firestore, Authentication, Cloud Functions, Cloud Storage e Gemini, cada um com a analogia da loja e uma frase de benefício, sem métrica.
- **REQ-014** QUANDO os projetos reais renderizarem ENTÃO DEVEM aparecer só Encantos Brincantes, PortfolioSnap, BragStack e Mousai, com nome e `liveUrl` lidos da collection `projects` via `src/lib/content/index.ts`, tipo e frase curta (texto para leigo) do catálogo de vendas, screenshot real em `public/servicos/projetos/<slug>.webp` com `alt` descritivo e link de saída pelo `/go`.
- **REQ-015** QUANDO a seção Sobre renderizar ENTÃO ela DEVE mostrar a foto real e o texto aprovado: desenvolvedor de software sênior em São Paulo, 15 anos, Itaú Unibanco, Pipefy e Skyone, contato direto sem intermediário, acompanhamento depois da entrega.
- **REQ-016** QUANDO as dúvidas frequentes renderizarem ENTÃO cada pergunta DEVE ser um `<details>`/`<summary>` nativo, com as respostas do Anexo B.

- **REQ-036** QUANDO a landing renderizar ENTÃO, depois dos projetos reais, DEVE haver a seção "O que dizem" com os dois depoimentos reais publicados no site antigo (`svelte-nandomoreira.dev`, `src/lib/data/testimonials.ts`), com texto, nome e empresa exatos, marcados com `<figure>`, `<blockquote>` e `<figcaption>`: Yara Santiago (Ateliê éh Pique) e Edson Luiz (Contador).
- **REQ-037** QUANDO a landing renderizar ENTÃO, depois dos depoimentos, DEVE haver a galeria "Outros trabalhos" com projetos de cliente do site antigo: imagem real em `public/servicos/trabalhos/<slug>.webp`, nome e tipo, sem ano (as datas do site antigo não são confiáveis) e sem link nenhum: é amostra, não lista de sites no ar (ajuste do Fernando em 2026-10-18). Ficam fora templates, temas, projetos pessoais e páginas "em construção" (Nutritionist, GRGit, temas Nuxt e WordPress, blog pessoal, Sob Medida, Beholddy), porque apresentá-los como trabalho de cliente seria enganoso (RISK-004).

- **REQ-038** QUANDO alguém clicar numa imagem da galeria "Outros trabalhos" ENTÃO ela DEVE abrir ampliada num lightbox sem JavaScript (Popover API, mesmas classes `.lightbox` dos posts), com rótulo "Ampliar imagem: <nome>", `role="dialog"`, botão Fechar e fechamento por Esc e clique fora; a versão ampliada (`<slug>-ampliada.webp`) só carrega quando o lightbox abre.

### Página de detalhe (`/servicos/site-institucional`)

- **REQ-017** QUANDO a página de detalhe renderizar ENTÃO ela DEVE ter: migalha, hero, "O que é, na prática" (4 partes), "É para você se...", "O que está incluso", "O que pode ser adicionado", "Como funciona por baixo", as 7 etapas compactas, a tabela comparativa, dúvidas e chamada final com formulário, tudo a partir do catálogo.
- **REQ-018** QUANDO a tabela comparativa renderizar ENTÃO ela DEVE ser uma `<table>` com `<caption>` e cabeçalhos com `scope`, e a 390px DEVE ficar legível sem rolagem horizontal da página.
- **REQ-019** QUANDO "Como funciona por baixo" renderizar ENTÃO DEVE explicar o Firebase Hosting pela analogia da vitrine, sem os números do Stitch (`< 1.5s`, `R$ 0`, `99.99%`, `100 pontos`, "menos de 2 segundos", "R$ 0,00").
- **REQ-020** QUANDO "O que pode ser adicionado" renderizar ENTÃO o painel de edição DEVE constar como opcional, coerente com a resposta do FAQ sobre atualização.

### Formulário, WhatsApp e contrato

- **REQ-021** QUANDO alguém enviar o formulário da landing ou da página de detalhe ENTÃO ele DEVE ir para `POST /api/hire` sem JavaScript, com nome, contato (`type="text"`, rótulo "E-mail ou WhatsApp"), serviço e mensagem opcional, mais o honeypot `hp_ref` e o campo oculto `origem`.
- **REQ-022** QUANDO o payload trouxer `service` ENTÃO o `hireSchema` DEVE aceitá-lo só entre `website`, `landing-page`, `blog`, `online-store`, `web-product`, `automation` e `undecided`; payload sem `service` DEVE continuar válido.
- **REQ-023** QUANDO o formulário de vendas chegar com um contato que não é e-mail válido nem telefone de 10 a 13 dígitos (ignorando espaço, parênteses, hífen e `+`) ENTÃO o sistema DEVE responder como inválido; o `/contato` e a API JSON não ganham essa regra.
- **REQ-024** QUANDO a mensagem vier vazia no formulário de vendas ENTÃO o mapeamento DEVE preencher `brief` com o rótulo do serviço escolhido, porque `brief` é obrigatório no schema.
- **REQ-025** QUANDO o formulário de vendas for processado ENTÃO a resposta DEVE redirecionar (303) para a página de origem com `?envio=<resultado>#envio`, escolhida de uma lista fechada pelo campo `origem`; valor fora da lista DEVE cair em `/contato` (sem redirect aberto). A página de origem DEVE mostrar a mensagem do resultado num `role="status"`.
- **REQ-026** QUANDO a notificação de um briefing com `service` for enviada ENTÃO ela DEVE incluir a linha `Service:`.
- **REQ-027** QUANDO o AGENTS.md e o hire-brief forem gerados ENTÃO DEVEM documentar o campo opcional `service` e seus valores, em inglês. (O MCP não tem tool de hire; só aponta para `POST /api/hire`, então não muda.)
- **REQ-028** QUANDO o perfil tiver o contato `whatsapp` ENTÃO o `/go` DEVE resolvê-lo para `https://wa.me/5511917493331` com mensagem pronta, e as rotas de máquina (`llms.txt`, `llms-full.txt`, MCP, `resume.json`, `resume.txt`, AGENTS.md) NÃO DEVEM expor o número; o portão `tests/aeo/no-leak.test.ts` DEVE reprovar o número nessas rotas.
- **REQ-029** QUANDO a política de privacidade renderizar ENTÃO a seção do formulário DEVE citar o campo serviço e o contato por WhatsApp.

### Regras transversais

- **REQ-030** QUANDO as páginas de vendas forem renderizadas ENTÃO um teste DEVE reprovar percentual, valor em `R$` e métrica de tempo no HTML, para que nenhum número inventado entre por conteúdo.
- **REQ-031** QUANDO o build rodar ENTÃO o portão de JavaScript de cliente DEVE continuar verde: as páginas de vendas não carregam script nenhum, nem o do `PointerField`.
- **REQ-032** QUANDO as páginas de vendas renderizarem ENTÃO DEVEM ter skip link, landmarks, um único `h1`, foco visível, rótulo em todo campo, alvos de toque de 44px e só pares de cor aprovados no portão de contraste.
- **REQ-033** QUANDO as páginas de vendas renderizarem ENTÃO DEVEM ter `title`, `description`, canonical (REQ-006), imagem OG e JSON-LD `Service` serializado por `serialiseJsonLd`, e entrar no `sitemap.xml`.
- **REQ-034** QUANDO a largura for 390px ENTÃO as duas páginas DEVEM seguir a versão mobile do Stitch sem rolagem horizontal.

## Casos de borda

- Subdomínio ainda sem DNS: com `SALES_HOST_LIVE=false`, o host `contrate.` nunca chega, e o site principal serve `/servicos` normalmente.
- Host do subdomínio atrás do proxy: o App Hosting encerra o TLS e repassa `X-Forwarded-Host`; sem o host em `allowedDomains`, a reescrita e o formulário falham só em produção. A verificação é por HTTP real (`curl -H 'Host: contrate.nandomoreira.dev'` contra o build).
- `origem` adulterado: cai em `/contato`.
- Mensagem e serviço vazios: `brief` recebe o rótulo de "Ainda não sei".
- Contato com WhatsApp no `/contato` (que continua `type=email`): sem mudança; a regra nova é só do formulário de vendas.

## Fora do escopo

- Criar o domínio personalizado no App Hosting e o DNS de `contrate.nandomoreira.dev`, e virar `SALES_HOST_LIVE` para `true` (runbook em `docs/runbooks/sales-subdomain.md`, executado depois).
- Páginas de detalhe dos outros 5 serviços.
- Preços, faixas de valor, prazos e depoimentos.
- Visão IA (`.md` e `/ia`) das páginas de vendas.
- Painel de edição (CMS) em si: só aparece como opcional no texto.

## Verified Claims

| Afirmação | Fonte |
|---|---|
| O site é todo SSR, então o middleware roda em toda rota | `astro.config.mjs:11` (`output: 'server'`) |
| `allowedDomains` decide se o checkOrigin aceita o formulário | `astro.config.mjs:26-36` |
| O middleware já age por hostname | `src/middleware.ts`, `src/lib/seo/backend-host.ts` |
| `profile.contacts` aceita só `email`, `github`, `linkedin`, `site` | `src/content/schemas/profile.ts:26` |
| O `/go` monta a tabela de contatos e projetos | `src/pages/go/[...target].ts` |
| O formulário humano é mapeado de nomes pt-BR para o payload | `src/lib/hire/form.ts` |
| `formRedirect` hoje sempre volta para `/contato` | `src/lib/hire/form.ts` |
| `brief` é obrigatório e o schema é `.strict()` | `src/lib/hire/schema.ts` |
| A notificação lista os campos linha a linha | `src/lib/hire/notify.ts` |
| A política lista os campos do formulário | `src/lib/privacy/policy.ts:57` |
| O MCP só expõe `profile` e `projects`; não há tool de hire | `src/lib/mcp/tools/` |
| Os 4 projetos têm `liveUrl` | `src/content/projects/{encantos-brincantes,portfoliosnap,bragstack,mousai}.md` |

## Anexo A: textos

Os depoimentos e a galeria vêm do site antigo `svelte-nandomoreira.dev` (página `/sites-profissionais-lojas-virtuais-blogs-aplicativos-web`, analisada em 2026-10-18).

Os textos da landing e da página do Site institucional são os do prompt de 2026-10-18 e da
tela do Stitch, sem os números listados nas decisões. Ficam em `src/lib/sales/catalog.ts`
(serviços) e `src/lib/sales/copy.ts` (seções fixas). Abaixo do formulário, no lugar de
"Retorno comercial em até 24 horas úteis": "Respondo pessoalmente, pelo canal que você
escolher."

## Anexo B: respostas das dúvidas frequentes

### Landing

1. **Preciso entender de tecnologia?** Não. Você conta como funciona o seu negócio e o que espera do site; a parte técnica é comigo, e explico cada escolha em português claro.
2. **Quanto custa?** Depende do que o seu projeto precisa e do que você quer incluir. Depois da primeira conversa, montamos o escopo juntos e eu envio uma proposta; o valor varia conforme o que entra agora e o que fica para depois.
3. **Quanto tempo leva?** Também depende do projeto. O prazo vem na proposta, com a data de cada etapa, e você acompanha o andamento pelo link de teste.
4. **Vou conseguir atualizar sozinho?** Pequenas trocas de texto e foto ficam por minha conta no acompanhamento. Se preferir editar sozinho, o site pode ganhar um painel de edição simples, como opcional.
5. **O site fica no meu nome?** Sim. O domínio, as contas e o projeto ficam no seu nome, e você nunca fica preso a mim.
6. **E depois da entrega, você continua ajudando?** Sim. Continuo acompanhando o projeto, com suporte, ajustes e evolução conforme o seu negócio cresce.

### Site institucional

1. **Quantas páginas ou seções meu site institucional pode ter?** Normalmente cabe em uma página com as quatro partes (início, sobre, serviços e contato) ou em até quatro páginas. Se precisar de mais, isso entra na proposta.
2. **Eu mesmo vou conseguir trocar textos e fotos depois?** Pequenas trocas de texto e foto ficam por minha conta no acompanhamento. Se preferir editar sozinho, o site pode ganhar um painel de edição simples, como opcional.
3. **O domínio e o site ficam registrados em meu nome?** Sim. Se você ainda não tem domínio, eu registro no seu nome, e as contas do site também ficam com você.
4. **Quanto tempo leva para ficar pronto?** O prazo vem na proposta, com a data de cada etapa.

## Grilling Log

Decisões levantadas e resolvidas no grilling (2026-10-18).

| # | Decisão | Resolução | Motivo |
|---|---|---|---|
| 1 | Onde mora a landing | Subdomínio, mesmo repo, roteado por host | Um deploy, mesmos tokens e mesmo `/api/hire` |
| 2 | Qual subdomínio | `contrate.nandomoreira.dev` | Escolha do Fernando |
| 3 | Quando ativar o subdomínio | Flag `SALES_HOST_LIVE`, `false` até o domínio responder | 301 antes do DNS mandaria todos para um host morto |
| 4 | Páginas de detalhe | Template + só Site institucional | Única desenhada no Stitch |
| 5 | Formulário | `/api/hire` com `service` + botão de WhatsApp | Reusa rate limit, store e notificação |
| 6 | Onde fica o WhatsApp | `profile.contacts`, kind `whatsapp`, fora das rotas de máquina | `/go` mede o clique; número não vai para agentes |
| 7 | Link a partir do site | Discreto na seção Serviços da home e no `/contato` | O menu continua falando com recrutador e time técnico |
| 8 | Indexação antes do subdomínio | Indexa com canonical no domínio principal; o 301 migra depois | Não perde tempo de indexação |
| 9 | `service` para agentes | Documentado no AGENTS.md e no hire-brief (o MCP não tem tool de hire) | Escolha do Fernando |
| 10 | Atualização pelo cliente | Trocas pelo Fernando no acompanhamento; painel de edição opcional | Site estático no Firebase Hosting |
| 11 | Validação do contato | E-mail válido ou telefone de 10 a 13 dígitos, só no formulário de vendas | Lead sem canal de resposta é lead perdido |
| 12 | Foto do Sobre | Foto real do ascode | Cliente leigo confia mais em rosto real |
| 13 | Imagens dos projetos | Screenshots reais capturados dos sites no ar | O ascode não tem as imagens; as do Stitch são falsas |
| 14 | Preço | Sem valor fechado, faixa ou prazo em lugar nenhum | O valor varia com a negociação e o escopo |
| 17 | Depoimentos | Os dois reais do site antigo, texto exato (REQ-036) | Prova social para cliente leigo; não são inventados |
| 18 | Mais projetos | Galeria "Outros trabalhos" com os projetos de cliente do site antigo, sem links, com lightbox nas imagens (REQ-037, REQ-038) | Mostra volume de trabalho sem promover o que saiu do ar |
| 19 | Imagens | ascode.com.br para BragStack, PortfolioSnap, Encantos Brincantes e Ateliê éh Pique; screenshot do Fernando para o Mousai; site antigo para a galeria | Reaproveita capturas reais em vez de gerar novas |
| 16 | Testar no endereço próprio em localhost | `contrate.nandomoreira.local:4321`, ativo sempre, com `::1` no `/etc/hosts` | Revisar o conteúdo como o cliente vai ver, sem ligar a flag |
| 15 | Nota do formulário | "Respondo pessoalmente, pelo canal que você escolher." | Sem prometer prazo de retorno |
