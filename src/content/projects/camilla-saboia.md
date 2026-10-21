---
slug: camilla-saboia
title: Camilla Saboia
block: professional
art: wireframe
summary: "Site institucional e portfólio de uma profissional de Customer Experience e eventos corporativos, que trocou o currículo em PDF por um endereço próprio. Todo o texto mora num único arquivo validado no build, e o mesmo conteúdo gera os dados estruturados para buscadores e agentes de IA. No ar em camillasaboia.com.br."
problem: |
  Uma profissional de Customer Experience e eventos corporativos apresentava a
  carreira em PDFs de currículo e portfólio, sem um endereço próprio para mandar
  a recrutadores e clientes nem algo que um buscador conseguisse ler.
decisions: |
  Página única em Astro, estática, com todo o texto num JSON validado por Zod:
  e-mail inválido, link sem https ou foto sem texto alternativo quebram o build
  em vez de ir para o ar. Os dados estruturados (pessoa, um serviço por tipo de
  evento e o FAQ visível), o sitemap e o llms.txt saem desse mesmo conteúdo,
  então não divergem da página. O único JavaScript fecha o menu no celular; a
  revelação no scroll é CSS e respeita quem reduz o movimento. O deploy roda a
  cada push em main pelo GitHub Actions, autenticado por Workload Identity
  Federation, sem chave de serviço guardada no repositório.
outcome: |
  No ar em camillasaboia.com.br desde outubro de 2026, com as fotos reais dela
  recortadas em volta da palavra gigante do topo. O repositório é fechado, então
  a evidência é o site publicado.
tech:
  - Astro
  - TypeScript
  - Zod
  - Vitest
  - Firebase Hosting
  - GitHub Actions
repoUrl: null
liveUrl: https://www.camillasaboia.com.br
images:
  - src: /lab/camilla-saboia/hero.webp
    alt: "Topo do site sobre fundo verde-sálvia: a palavra PORTFÓLIO em letras condensadas gigantes, sólidas atrás e só contorno na frente, ao redor do recorte da foto da Camilla sorrindo com camisa de oncinha"
    width: 1400
    height: 860
  - src: /lab/camilla-saboia/mobile.webp
    alt: "Dois celulares lado a lado sobre o verde-sálvia do site: à esquerda o topo com a palavra PORTFÓLIO reduzida em volta da foto e o menu num botão quadrado; à direita a seção Customer Experience com o título em duas linhas e os itens com check empilhados"
    width: 1400
    height: 860
  - src: /lab/camilla-saboia/cx.webp
    alt: "Seção Customer Experience | CX: título em letras condensadas, um parágrafo sobre o ciclo de vida do cliente, quatro itens com ícone de check (jornada, expectativas, indicadores e churn) e a foto de perfil dela em preto e branco à direita"
    width: 1400
    height: 860
  - src: /lab/camilla-saboia/eventos.webp
    alt: "Seção Eventos sobre fundo creme: título grande, uma frase sobre assessoria de eventos e três cartões numerados, eventos corporativos, eventos particulares e experiência do convidado"
    width: 1400
    height: 860
  - src: /lab/camilla-saboia/perguntas.webp
    alt: "Seção Perguntas frequentes: título à esquerda e, à direita, o acordeão com a primeira pergunta aberta, Quem é Camilla Saboia, e outras quatro fechadas"
    width: 1400
    height: 860
  - src: /lab/camilla-saboia/contato.webp
    alt: "Fechamento do site: a palavra OBRIGADA em letras gigantes, sólidas e em contorno, em volta de três recortes de fotos da Camilla, um colorido e dois em preto e branco"
    width: 1400
    height: 800
featured: false
confidential: false
date: "2026-10-18"
updatedAt: "2026-10-19"
---
