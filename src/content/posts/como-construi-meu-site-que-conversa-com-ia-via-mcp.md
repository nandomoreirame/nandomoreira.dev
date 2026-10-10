---
slug: como-construi-meu-site-que-conversa-com-ia-via-mcp
title: "Como eu construí meu novo site em 2026 que conversa com IA via MCP"
summary: "Casa de ferreiro, espeto de pau: um engenheiro de IA sem site que conversa com IA. Como reconstruí o meu, com servidor MCP, versão para máquina de cada página e sete portões automatizados."
date: "2026-10-10"
publishedAt: "2026-10-10T11:12:35-03:00"
art: orbit
markers:
  - astro
  - mcp
  - ia
---

Casa de ferreiro, espeto de pau. Eu trabalho com engenharia de IA e desenvolvimento de software, e o meu site não conversava com IA nenhuma. Era uma página que vendia "desenvolvedor web full-stack" para quem abrisse, e para um agente fazendo triagem era só HTML para raspar e adivinhar.

Comecei a reconstruir em agosto, fiz a base em dois dias e parei. Em outubro voltei, e dessa vez fui até o fim.

Hoje qualquer cliente MCP conecta nele:

```bash
claude mcp add --transport http nandomoreira https://nandomoreira.dev/api/mcp
```

A resposta que eu recebi quando rodei no meu terminal foi essa:

```text
Added HTTP MCP server nandomoreira with URL: https://nandomoreira.dev/api/mcp to local config
```

Sem cerimônia. A partir daí, um agente que precisa saber o que eu já coloquei em produção chama `list_projects` e responde a partir de uma lista estruturada, e não de um palpite sobre o meu HTML.

## Duas audiências, e uma delas não tem olhos

Antes de qualquer código escrevi quatro documentos: brief, PRD, escopo do MVP e guia de design. O brief cabe numa frase: um portfólio que é a própria demonstração do que ele afirma, escrito para humano e para máquina.

O leitor humano é o avaliador técnico, CTO ou tech lead, que quer ver artefato funcionando e decisão explicada. O outro é o agente que faz a triagem por ele, cada vez mais comum, e que quer extrair competência, disponibilidade e evidência sem alucinar.

O brief também listou os riscos, e o mais provável não era técnico: os cases nunca serem escritos e o site ir ao ar com placeholder (todo mundo que já refez portfólio conhece esse filme). A saída foi de processo: os oito cases entraram numa sprint **antes** da home.

## Primeiro, provar que a plataforma aguenta

O site é Astro 7 em modo SSR, publicado no Firebase App Hosting. O adapter oficial da plataforma estava na versão 0.0.1 desde janeiro de 2025, versão única. Abandonado, na prática.

Como toda a parte de máquina depende de rota de servidor, a primeira sprint foi um spike de dois dias com critério de parada escrito antes de começar: ou o plano A sobe em produção, ou vou para o plano B, site estático com Cloud Functions. O plano A subiu no primeiro dia, com `@astrojs/node` em modo standalone. A decisão ficou num ADR, com as alternativas descartadas.

## Uma fonte só, e um teste que garante isso

O conteúdo mora em duas coleções, `projects` e `profile`, validadas por schema. Delas saem a home, os cases, o `llms.txt`, o JSON-LD, o currículo e as tools do MCP.

Fonte única costuma durar até a primeira página com pressa ler direto da coleção. Aqui ela é um teste: se qualquer arquivo fora da camada de acesso chamar `getCollection`, a suíte fica vermelha.

```ts
for await (const file of glob('src/**/*.{ts,astro}')) {
  const normalized = file.replaceAll('\\', '/');
  if (ALLOWED.includes(normalized)) continue;

  if (readFileSync(file, 'utf8').includes('getCollection(')) {
    offenders.push(normalized);
  }
}

expect(offenders).toEqual([]);
```

Para este site isso pesa mais que o normal. Se a home disser uma coisa e o MCP outra, o agente responde errado com confiança, que é justamente o que o site existe para evitar.

## O servidor MCP

A ideia de pôr um servidor MCP num portfólio não é minha. Veio do [site do Ruben Marcus](https://www.rubenmarcus.dev/pt/), que expõe o portfólio para agentes e conta como fez isso num [artigo sobre construir o portfólio com agentes de IA](https://www.rubenmarcus.dev/pt/blog/como-construi-este-portfolio-com-agentes-de-ia).

O meu tem cinco tools:

| Tool | O que devolve |
|---|---|
| `get_profile` | Quem sou, o que faço, onde estou |
| `check_availability` | Disponibilidade e a data da última atualização |
| `list_projects` | Os cases, com stack e links verificáveis |
| `get_project` | Um case completo pelo slug |
| `get_resume` | O currículo estruturado |

A rota usa o SDK oficial com o transporte Streamable HTTP, que recebe um `Request` e devolve um `Response`, o mesmo formato de uma rota SSR do Astro. O detalhe que importa está no comentário:

```ts
/**
 * One server AND one transport per request.
 *
 * Hoisting either to module scope is the natural shape and the wrong one: in
 * stateless mode a shared instance collides request IDs between concurrent
 * clients, and this backend serves with concurrency 80.
 */
const handle = async (request: Request): Promise<Response> => {
  const server = await createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  return closeWhenDrained(await transport.handleRequest(request), server);
};
```

Criar o servidor uma vez, no topo do módulo, é o jeito natural de escrever e o jeito errado aqui: com 80 requisições simultâneas numa instância, clientes diferentes trocam IDs de requisição entre si. Funciona no teste com um cliente e quebra em produção com dois.

Fechar o servidor também tinha armadilha. Num `finally`, a resposta saía vazia; sem fechar, sobrava um servidor por requisição. Quem achou foi o Codex, revisando o código que outro modelo escreveu. A correção foi fechar só quando o stream da resposta termina.

A página [/mcp](/mcp) mostra como conectar no Claude Code, no Claude, no ChatGPT e em qualquer cliente MCP.

## Toda página tem uma versão para máquina

Nem todo agente fala MCP. Para os que só leem, cada página tem a versão `<página>.md`, o markdown puro, e a `<página>/ia`, a página como um agente a enxergaria. Um botão no canto troca entre a visão humana e a visão IA.

Uma tabela só liga caminho a markdown, e página fora dela responde 404. Prefiro um 404 honesto a um markdown gerado no escuro.

Completam a parte de máquina o `llms.txt`, o `AGENTS.md`, o currículo em `resume.json` e `resume.txt`, e o JSON-LD. A lista do que um answer engine procura veio do [aeo.js](https://aeojs.org), também do Ruben. Não instalei a biblioteca: usei o que ela gera como referência e implementei cada rota no projeto, saindo da mesma camada de conteúdo das páginas. O verificador dele, o [check.aeojs.org](https://check.aeojs.org), foi o que usei para medir o resultado.

## Um agente pode me contratar

O `POST /api/hire` recebe uma proposta em JSON, direto de um agente que terminou a triagem. O schema recusa chave desconhecida em vez de guardar em silêncio, e todo campo tem limite de tamanho. O mesmo endpoint atende o formulário de [contato](/contato) das pessoas.

E nenhum e-mail aparece nas rotas de máquina. Um teste varre todas procurando e-mail, chave, caminho absoluto e IP privado, porque a premissa é de crawler que ignora o `robots.txt`.

## Sete portões

Regra escrita em documento não impede ninguém de quebrá-la numa sexta à noite. Então cada regra que importava virou teste:

| Portão | O que impede |
|---|---|
| Contraste | Par de cor abaixo de 4,5:1 |
| Valor fora da escala | Cor solta e valor arbitrário do Tailwind |
| JavaScript de cliente | Segundo script, ou o único acima de 1,5 KB gzip |
| Fonte única | `getCollection` fora da camada de acesso |
| Schema quebra o build | Conteúdo inválido chegando em produção |
| CTA único | Dois botões de mesmo peso na home |
| Vazamento | E-mail, chave, caminho absoluto, IP privado nas rotas de máquina |

**Um portão só está pronto depois de ter ficado vermelho.** Para cada um escrevi o caso que deveria falhar e vi falhar.

O de JavaScript diz muito do site: existe **um** script de cliente, com cerca de 700 bytes gzip, que faz o efeito do ponteiro, o botão de copiar e o fundo do header ao rolar. Nenhum framework no navegador.

E tem a regra do número com contexto. Tenho 964 estrelas no GitHub, mas umas 700 vieram de temas Jekyll de 2018. Mostrar o total sem dizer isso seria vender trabalho com IA usando a prova social de outra época, então o componente que exibe número quebra se não receber a explicação junto.

## O que deu errado

Alguns problemas só apareceram em produção:

- **O redirect que não redirecionava.** Numa página pré-renderizada, o redirect 301 vira um documento com meta refresh servido com status 200. No navegador funciona; para crawler e cache, não é redirect. Os testes estavam verdes porque procuravam a string `301` no código.
- **O 403 atrás do proxy.** O Astro confere a origem dos formulários e, atrás do proxy do App Hosting, achava que a requisição vinha por HTTP. Todo envio do formulário de contato voltava 403.
- **A mensagem que sumia.** O formulário dizia sucesso e nada chegava ao Firestore: faltava uma permissão na conta de serviço, e a gravação falhava calada.
- **O gerenciador de senhas no honeypot.** O campo escondido que pega robô se chamava `website`, e o gerenciador de senhas (provavelmente o 1Password) preenchia sozinho. Mensagem de gente de verdade ia para o lixo como spam.

## Como foi construído

Com agentes, num fluxo de pesquisa, plano e implementação em que o Claude Code conduz, o Grok escreve e o Codex revisa. Contei como funciona em [Fluxo RPI com três agentes](/fluxo-rpi-claude-code-grok-codex). Em números: mais de 300 commits, 16 specs, 16 planos e mais de 1.400 testes.

## Tendência ou demonstração

Eu acho que site com servidor MCP pode virar tendência entre devs e engenheiros de IA. Para mim, é demonstração: se eu digo que construo ferramenta para agentes, o meu próprio site precisa ser consumível por um.

Se você estiver avaliando alguém para um problema de IA, pode começar pelo agente:

```bash
claude mcp add --transport http nandomoreira https://nandomoreira.dev/api/mcp
```

Ou pelo caminho humano, na página de [contato](/contato).
