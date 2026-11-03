---
slug: aeo-vs-seo-sera-que-o-seo-morreu
title: "AEO vs SEO: será que o SEO morreu?"
summary: "SEO é pra quem clica no resultado da busca; AEO é pra quem responde no lugar do leitor. Como eu preparei o meu site pras duas coisas, e o que 15 dias de dados mostraram sobre quem lê o quê."
date: "2026-10-28"
markers:
  - seo
  - ia
  - agentes
extras:
  - "3 em cada 4 leituras de agentes foram nas rotas de máquina"
  - "llms.txt · robots.txt · JSON-LD · MCP"
keyPoints:
  - "Em 15 dias, três em cada quatro leituras de agentes de IA foram na versão .md ou na visão /ia das páginas, não no HTML."
  - "O llms.txt, que todo guia de AEO manda criar, teve 6 leituras de agentes e 65 de gente."
  - "O MCP do site recebeu 149 conexões e só 2 chamadas de tool, uma delas um teste meu."
snapshot:
  items:
    - label: "Site"
      value: "Astro 7 SSR"
    - label: "Rotas de máquina"
      value: "llms.txt · AGENTS.md · .md"
    - label: "Dados estruturados"
      value: "JSON-LD"
    - label: "Agentes"
      value: "MCP · /api/hire"
    - label: "Medição"
      value: "analytics no servidor"
draft: true
---

Hoje o painel do meu site mostrou 488 pessoas, 15 agentes de IA e 1.335 robôs. E zero chamadas de tool no servidor MCP que eu deixei lá justamente pros agentes.

![Faixa do painel ao vivo do analytics do site: 488 pessoas hoje, 496 páginas vistas, 15 agentes, 1.335 robôs, 73 cliques em links de saída, 1 lead e 0 tools MCP.](../../assets/posts/2026/aeo-painel-ao-vivo.webp)

Dá pra perguntar se o SEO morreu, agora que muita gente pergunta pro ChatGPT em vez de procurar no Google. Antes de responder, vale olhar quem lê o seu site de verdade. O meu é lido por gente, por buscador e por agente, e cada um quer um formato diferente. Os números de 15 dias mostram uma coisa que eu não esperava: **pra um agente de IA, o HTML é o formato que ele menos lê no meu site.**

## SEO é pra quem clica, AEO é pra quem responde

<abbr title="Search Engine Optimization">SEO</abbr> (otimização pra mecanismos de busca) é fazer a sua página aparecer bem posicionada quando alguém busca, pra que essa pessoa clique e chegue até você. <abbr title="Answer Engine Optimization">AEO</abbr> (otimização pra motores de resposta) é fazer um assistente como o ChatGPT, o Perplexity ou o Claude ler o seu conteúdo, entender e usar na resposta que ele dá, muitas vezes sem a pessoa nunca abrir o seu site.

| | SEO | AEO |
|---|---|---|
| Quem lê primeiro | o crawler do buscador | o crawler ou o agente de um assistente |
| O que ele quer | saber do que a página trata e se ela merece posição | o conteúdo limpo, pra citar ou responder |
| Quem chega no fim | uma pessoa, pelo clique | às vezes ninguém: a resposta basta |
| Como se mede | posição e cliques vindos da busca | leituras das rotas de máquina e citações |

O meu motivo pra fazer a segunda coluna foi bem prático. Quando reescrevi o site em 2026, o meu trabalho do último ano era construir ferramenta de agente de IA, e nada no material público dizia isso pros agentes que já fazem a triagem de candidato antes de um recrutador ler qualquer coisa. Se o agente não acha, a vaga não chega.

## O SEO continua lá, e é a base das duas coisas

Antes de qualquer coisa pra IA, o site tem o SEO de sempre: `sitemap.xml`, URL canônica absoluta em toda página, imagem de compartilhamento gerada por página, RSS e um `seoTitle` quando o título do post é longo demais pro resultado da busca.

A peça que serve aos dois mundos são os dados estruturados, um bloco de JSON-LD ([o formato do schema.org](https://schema.org) que descreve a página em campos, não em texto) no `<head>`. O site declara quem eu sou (`Person`), o que é o site (`WebSite`), o que é cada página (`WebPage`) e cada projeto do portfólio (`SoftwareApplication` quando tem link no ar, `CreativeWork` quando não tem). Buscador usa isso pra montar o resultado. Agente usa pra não ter que adivinhar quem escreveu o quê.

Um detalhe que custa uma linha e evita dor: todo JSON-LD sai por uma função só, que escapa o `<`. Sem isso, um título com `</script>` fecha a tag no meio do conteúdo, e um teste reprova quem tentar reimplementar o escape em outro lugar.

## Libere os crawlers de IA pelo nome

O `robots.txt` com `User-agent: *` e `Allow: /` já deixa todo mundo entrar. Mesmo assim, o meu lista um por um os crawlers de IA:

```ts
export const ANSWER_ENGINE_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
] as const;
```

O comentário no código explica o porquê: a lista documenta a intenção, e sobrevive ao dia em que eu apertar a regra padrão. Se um dia o `*` virar `Disallow`, os nove continuam entrando, e ninguém precisa lembrar que eles existiam.

Só não confunda isso com segurança. O `robots.txt` é um pedido educado, e crawler mal-educado ignora. A proteção de verdade é não ter nada sensível nas rotas públicas, e o site tem um teste que varre as rotas de máquina atrás de e-mail, chave, caminho absoluto e IP privado.

## Dê uma versão em Markdown pra cada página

Essa foi a técnica que mais funcionou, e eu tenho o número.

Toda página do site tem uma irmã em Markdown: `/tratando-dotfiles-como-software` tem `/tratando-dotfiles-como-software.md`, com o texto limpo, um cabeçalho com título, URL e data, e nada de menu, rodapé ou script. Tem também uma versão `/ia`, a mesma coisa renderizada pra uma pessoa ver como o agente enxerga a página. As duas saem de uma tabela só (caminho pra Markdown), e página fora dela responde 404. O HTML anuncia a irmã no `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/tratando-dotfiles-como-software.md" />
```

O analytics do site classifica cada visita por user agent em gente, agente de IA, buscador e outros robôs, e mede no servidor, sem script no navegador. De 14 a 28 de outubro, as leituras de conteúdo feitas por agentes de IA ficaram assim:

| Formato | Leituras de agentes |
|---|---|
| `.md` | 429 |
| `/ia` | 376 |
| HTML | 245 |

Três em cada quatro leituras foram nas duas versões feitas pra máquina, e a mais lida de todas é o Markdown puro. O agente prefere o texto limpo quando você entrega, e ele acha a versão sozinho.

## O llms.txt que quase ninguém leu

Todo guia de AEO manda criar o `llms.txt`, um índice em Markdown na raiz do site, com um resumo de quem você é e links anotados pras páginas que importam ([a proposta está aqui](https://llmstxt.org)). O meu existe desde o lançamento, junto com um `llms-full.txt` com tudo num arquivo só, e os dois são gerados a partir da mesma camada de dados das páginas. Um `llms.txt` escrito à mão fica desatualizado na primeira mudança no portfólio.

No mesmo período, o `llms.txt` teve 6 leituras de agentes de IA. E 65 de visitas classificadas como gente (eu suspeito de dev curioso, mas o analytics não guarda o user agent, então não dá pra saber).

O `AGENTS.md` é a mesma ideia com outro público: um brief de contratação, com serviços, disponibilidade e como chamar os endpoints. Teve 10 leituras de agentes e 116 de gente. Os dois continuam lá, porque custam nada pra manter. Mas se eu tivesse que escolher uma coisa só pra fazer hoje, faria a versão em Markdown de cada página antes do `llms.txt`.

## O MCP que ninguém chama

O site também tem um servidor MCP (o [Model Context Protocol](https://modelcontextprotocol.io), um jeito padrão de um assistente chamar funções de um serviço) em `/api/mcp`, com cinco tools: listar projetos, detalhar um projeto, perfil, currículo e disponibilidade. E um `/api/hire`, pra um agente mandar uma proposta em nome de alguém. Contei como montei isso [no post do MCP](/como-construi-meu-site-que-conversa-com-ia-via-mcp).

No dia 17, o painel mostrava acesso de agente no "Ao vivo" e zero em "Chamadas de tool". Achei que era bug na contagem. Não era. O evento bruto mostrou só a sequência de conexão: `server/discover`, `initialize`, `notifications/initialized`, `tools/list`. É o aperto de mão que o Claude Code faz quando abre uma sessão com o MCP configurado. A tool só é chamada se o modelo decidir usar uma, e ninguém tinha decidido. Pra provar, chamei `get_profile` em produção e o contador subiu de nada pra 1.

Nos 15 dias, foram 149 conexões e 2 chamadas de tool. Uma delas foi esse meu teste. E pra piorar (pra mim), parte das conexões é minha: o cookie que marca as minhas visitas não vai junto numa chamada MCP, e as 19 conexões do cliente `claude-code` são as minhas próprias sessões.

O MCP funciona. Só que hoje um agente que chega no site lê o Markdown e vai embora, em vez de conectar e perguntar.

## Será que o SEO morreu?

Os números do meu site puxam pros dois lados. Em 15 dias, a busca trouxe pouca gente: 17 visitas do Google, 2 do Bing e 2 do DuckDuckGo, contra 168 do LinkedIn. E os agentes leram o site mais de mil vezes, sem que eu saiba quantas dessas leituras viraram resposta pra alguém. Mas tudo o que eu fiz pros agentes está em cima do que o SEO já pedia: o `sitemap.xml` com todas as páginas, a URL canônica que diz qual versão vale e o JSON-LD que diz quem escreveu.

Eu continuo fazendo os dois, no mesmo código. Cada página nova nasce com o HTML pro humano, a versão em Markdown pro agente e os dados estruturados pros dois.

`User-agent: *`
