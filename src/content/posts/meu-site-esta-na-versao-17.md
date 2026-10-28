---
slug: meu-site-esta-na-versao-17
title: "Meu site está na versão 17, e algumas versões duraram um dia"
seoTitle: "Meu site está na versão 17: dez anos de recomeços"
summary: "Fui contar quantas vezes refiz meu portfólio achando que eram dez. Pelos repositórios que sobreviveram no GitHub, são dezessete, de Jekyll em 2015 a Astro em 2026."
date: "2026-10-28"
markers:
  - carreira
  - astro
  - front-end
  - open source
extras:
  - "17 versões desde 2015, 10 delas com preview no ar"
  - "Jekyll · Nuxt · Gatsby · Next.js · SvelteKit · Astro"
keyPoints:
  - "Uma tentativa que parou no primeiro commit também é versão: foi ali que eu testei a ideia e desisti dela."
  - "Versão que guardava o conteúdo no Notion ou no Sanity não voltou ao ar: o token morreu e levou os posts junto."
  - "Um .env apagado num commit continua no histórico: antes de abrir 16 repositórios, todos passaram por scan de segredo."
snapshot:
  items:
    - label: "Versão atual"
      value: "v17 (Astro 7)"
    - label: "Primeira"
      value: "Jekyll, nov/2015"
    - label: "Versões antigas"
      value: "16, públicas e arquivadas"
    - label: "Previews"
      value: "Firebase Hosting"
    - label: "Scan de segredos"
      value: "gitleaks"
    - label: "Lançamentos"
      value: "um arquivo por dia"
art: ascent
draft: true
---

No rodapé deste site tem um número pequeno: `v17.832`. O 17 é quantas vezes eu refiz meu portfólio desde 2015, contando só as que deixaram rastro no GitHub. O 832 é quantos commits a versão atual tinha no dia em que escrevi isto (ele sobe sozinho).

Esse número nasceu de uma piada. Em 19 de outubro eu pedi pro Claude levantar o histórico do site nos meus repositórios, porque eu queria pôr uma tag de versão aproximada no rodapé, "algo como `v10.67.821781` hahahahaha". Eu chutei que era a décima versão. Errei por sete (e provavelmente por mais, já explico). Se você tem um portfólio, aposto que ele também tem mais versões do que você lembra: o que muda é se você conta as que não deram certo.

## Eu achava que era a décima

A primeira lista que voltou tinha dez sites, um por stack. Pra chegar nesse número, ela deixava de fora os repositórios com um ou dois commits, os blogs paralelos e o `nandomoreira.dev-chat`, o portfólio em formato de conversa, tratado como "um projeto à parte".

Não concordei. A minha resposta foi: "todos são versões do meu portfolio, uns com poucos commits porque era uma ideia que não se seguiu". O chat, inclusive, foi a última versão antes desta. Com tudo dentro, a conta foi pra vinte. Aí tirei três que nunca foram o site (um pacote npm, um redirecionamento do GitHub Pages e o meu currículo antigo) e fechou em **dezessete**.

E dezessete é aproximado pra baixo: é o que sobreviveu em repositório, e outras versões se perderam no caminho. Por isso a página de versões começa dizendo: "Não sei ao certo quantas versões este site já teve; provavelmente mais de vinte."

## Dezessete recomeços em quase onze anos

O primeiro commit que sobreviveu é de 12 de novembro de 2015, num tema Jekyll. Daí pra frente:

| v | Quando | Stack principal | O que tinha de diferente |
|---|---|---|---|
| 1 | nov/2015 | Jekyll | O primeiro nandomoreira.me, compilado pelo Gulp; virou tema aberto no GitHub Pages |
| 2 | jan/2016 | Jekyll | Um portfólio separado do blog, com os links conferidos antes de publicar |
| 3 | jul/2016 | Nuxt | Site e blog em Vue.js, instalável como app; a versão mais trabalhada antes desta |
| 4 | ago/2016 | HTML | Um recomeço em HTML puro. Durou um dia e dois commits |
| 5 | out/2017 | Middleman | O blog em Ruby, com service worker pra funcionar offline |
| 6 | mai/2018 | Nuxt | De volta ao Nuxt, com tradução e meus repositórios do GitHub na página |
| 7 | ago/2018 | Jekyll | O blog voltou ao Jekyll, com Vue.js e Bootstrap por cima |
| 8 | mar/2019 | Gatsby | A mudança pro domínio nandomoreira.dev, com React e GraphQL |
| 9 | dez/2019 | Gatsby | O blog em blog.nandomoreira.dev, a primeira versão em TypeScript |
| 10 | ago/2020 | Strapi | Um CMS pra alimentar o site seguinte. Parou no primeiro commit |
| 11 | ago/2020 | Next.js | Next.js com o conteúdo no Sanity, publicado na Vercel |
| 12 | jul/2021 | Next.js | Outro recomeço em Next.js. Também parou no primeiro commit |
| 13 | abr/2022 | Remix | Remix com o Notion como CMS, feito em cinco dias |
| 14 | mai/2024 | Next.js | App Router, Tailwind e shadcn/ui, os posts ainda no Notion |
| 15 | out/2025 | SvelteKit | SvelteKit com Bun, e o primeiro `CLAUDE.md` no repositório |
| 16 | jan/2026 | Next.js | O portfólio virou uma conversa, um chat com IA respondendo por mim |
| 17 | ago/2026 | Astro | Esta aqui |

Lendo a tabela de cima pra baixo dá pra ver o que o mercado de front-end fez nesses anos (Gulp e Bower, depois SPA em Vue, depois React com GraphQL, depois CMS headless, depois IA). E dá pra ver que eu volto: o Nuxt reaparece na v6, o Jekyll na v7, o Next.js em quatro versões diferentes.

## O que ficou de cada uma

Algumas coisas que estão aqui hoje começaram numa versão antiga. O TypeScript entrou na v9, num blog em Gatsby, e nunca mais saiu. A v13, em Remix, tinha um easter egg: quem digitasse "batman" em qualquer página ganhava uma chuva de confete e um vídeo do YouTube (o confete voltou na página de versões, sem o Batman). A v15 foi a primeira com um `CLAUDE.md`, o arquivo de instruções que o agente de IA lê antes de mexer no código.

[[PREENCHER: o que cada fase te ensinou na sua palavra (Jekyll e Gulp, Nuxt, Gatsby, os CMS headless) e por que a v4, a v10 e a v12 pararam no primeiro dia]]

As versões curtas entram na conta por isso: um repositório com um commit é uma ideia testada e largada no mesmo dia, sem custo nenhum além do `git init`. Tirar esses da tabela deixaria a história mais limpa, e menos verdadeira.

## Por que a 17 é Astro

O que abriu esta versão, em agosto, foi um problema de posicionamento, não de stack. O site anterior vendia um "desenvolvedor web full-stack" genérico, enquanto o meu trabalho dos últimos doze meses era construir ferramentas com agentes de IA. E a v16, a do chat, exigia que o visitante descobrisse os comandos pra achar alguma coisa, e recrutador não explora, recrutador passa o olho. O chat saiu do ar como site e ficou como case.

Então a v17 precisava ser um site em seções, rápido de ler, e ao mesmo tempo legível por agentes de IA, que hoje fazem parte da triagem de quem contrata. O [Astro](https://astro.build) resolveu as duas metades. Ele é estático por padrão, com servidor só onde precisa, e a página chega pronta, quase sem JavaScript no navegador. O conteúdo fica em Markdown dentro do próprio repositório, e um schema confere cada post no build: campo faltando reprova antes de ir pro ar (Astro 7, TypeScript, Tailwind CSS, Zod, Firebase App Hosting).

A parte de agentes, o servidor MCP e a primeira semana de construção estão contados em [como construí meu site que conversa com IA via MCP](/como-construi-meu-site-que-conversa-com-ia-via-mcp). Não vou repetir aqui.

## Abrir dezesseis repositórios sem vazar nada

Pra página de versões fazer sentido, cada versão precisava ter um link pro código. Só que a maioria dos repositórios antigos era privada, e eu ia abrir de uma vez onze anos de código escrito por mim mesmo em várias fases da vida (algumas sem nenhum cuidado com segredo).

Antes de mudar qualquer visibilidade, eu e o Claude rodamos o [gitleaks](https://github.com/gitleaks/gitleaks) (um scanner que procura chave e senha em todo o histórico do git, não só nos arquivos de hoje) em todos os dezessete. Apareceram tokens de Sanity, Resend, Notion, Instagram e Dribbble. O caso mais didático foi um `.env` commitado em dezembro de 2024 e apagado depois: o arquivo não existia mais, mas a chave do Resend e o token do Notion continuavam lá no histórico, a um `git log -p` de distância.

A gente testou um por um. Sete estavam mortos (revogados ou de APIs que nem existem mais). Um ainda respondia 200: um token do Dribbble de 2019, que já estava em dois repositórios públicos havia anos sem eu saber. Como ele não aparecia em nenhum privado, abrir os outros não aumentava a exposição; abri e revoguei o do Dribbble logo em seguida.

O GitHub ainda deu um tropeço no final. Repositório arquivado não muda de visibilidade, e a API responde 403. Pra quatro deles foi preciso desarquivar, abrir e arquivar de novo. Hoje as dezesseis versões antigas estão públicas e arquivadas, e só a atual segue ativa.

**Se você vai abrir um repositório antigo, o que importa é o histórico, não a pasta.** Apagar o arquivo não apaga a chave; revogar, sim.

## Pôr as versões antigas no ar de novo

Link pro código é bom, mas ver o site é melhor. Das dezesseis versões antigas, três ainda estavam no ar (no GitHub Pages e na Netlify). Outras sete a gente publicou de novo no Firebase Hosting, cada uma num endereço próprio, como a [v3 em Nuxt](https://nandomoreira-v3.web.app/), a [v8 em Gatsby](https://nandomoreira-v8.web.app/) e a [v15 em SvelteKit](https://nandomoreira-v15.web.app/).

Build de 2016 não roda no Node de 2026. Cada versão foi construída num container com a versão de Node ou Ruby da época (Node 8 pra v3, Node 10 pra v4 e v7, Node 12 pra v8 e v9), e três precisaram de ajuste pra compilar: uma gem presa abaixo da versão que exige Ruby 3, um plugin de pré-carga do Google Fonts que não funciona mais, um pacote do Babel fixado numa versão de 2020. Nenhum ajuste voltou pros repositórios: eles ficam como eram.

As que não voltaram contam outra história. A v11, a v13 e a v14 buscavam o conteúdo no Sanity ou no Notion por API. Com os tokens revogados, o código ainda existe, mas não tem post nenhum pra mostrar. A v16 dependia de um modelo de IA pago pra responder. Conteúdo que mora fora do repositório some quando a chave morre, e a v17 guarda tudo em Markdown dentro dele.

## Um lançamento por dia de trabalho

A página [/releases](/releases) conta as dezessete versões. A [/releases/17](/releases/17) conta só esta, um dia de trabalho por vez: cada dia vira um arquivo com título, resumo e de duas a seis novidades, e a versão do dia é `v17.<commits no fim do dia>`. O primeiro, de 8 de agosto, é a fundação, `v17.44`.

A regra do texto é contar o que quem visita percebe, nunca commit por commit. Um script monta o rascunho do dia com os commits visíveis e a tag; eu (ou o agente, com um comando que eu reviso) escrevo em português o que mudou. Dia que não muda nada pra quem visita entra numa lista de dias pulados, com o motivo. E se um dia com feature nova ficar sem lançamento, a verificação do projeto avisa.

O código das duas páginas está no repositório, que agora é público: a lista das versões fica em [`src/lib/history/history.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/history/history.ts) e os lançamentos em [`src/data/releases/`](https://github.com/nandomoreirame/nandomoreira.dev/tree/main/src/data/releases).

Decidi contar as versões que não deram certo, deixar o código de todas aberto e dar à 17 um registro de cada dia de trabalho. Quando a 18 chegar, ela entra na tabela.

`git init`
