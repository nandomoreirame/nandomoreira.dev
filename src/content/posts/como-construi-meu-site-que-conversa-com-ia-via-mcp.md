---
slug: como-construi-meu-site-que-conversa-com-ia-via-mcp
title: "Como eu construí meu novo site em 2026 que conversa com IA via MCP"
summary: "Um portfólio escrito para duas audiências: o avaliador humano e o agente que faz a triagem por ele. Servidor MCP, visão IA de cada página, sete portões automatizados e o que deu errado no caminho."
date: "2026-10-10"
art: orbit
markers:
  - astro
  - mcp
  - ia
---

Faça um teste. Abra o Claude Code e rode:

```bash
claude mcp add --transport http nandomoreira https://nandomoreira.dev/api/mcp
```

Depois pergunte: "o que o Fernando já colocou em produção?". O agente não vai abrir uma página, raspar HTML e adivinhar. Ele vai chamar `list_projects`, receber uma lista estruturada dos cases e responder a partir dela. Se perguntar se estou disponível, ele chama `check_availability`, que devolve o status e a data da última atualização.

Este site foi feito para isso. Ele tem duas audiências, e a segunda não tem olhos.

## Um pouco de história

O nandomoreira.dev já foi um blog em Jekyll, depois em Gatsby e, nos últimos anos, uma página que ninguém mantinha. Cada versão vendia a mesma coisa: "desenvolvedor web full-stack". Genérico, e cada vez mais distante do que eu faço de fato.

O problema apareceu numa auditoria do meu próprio acervo. A bio do GitHub não mencionava IA em nenhum ponto, enquanto os repositórios mais recentes eram um cliente GUI para Claude Code, Codex e Gemini, um framework de skills e hooks para o Claude Code e um sistema de memória para agentes. O trabalho existia. A leitura dele, não.

E tem um detalhe que pesa mais em 2026: quem lê primeiro um portfólio, cada vez mais, não é uma pessoa. É um ChatGPT ou um Claude resumindo candidatos para um CTO que não tem tempo de abrir vinte abas. Esse leitor consulta páginas que não foram feitas para ele, e quando a página não responde bem, ele responde errado com confiança.

## O brief que eu dei a mim mesmo

Antes de escrever uma linha de código, escrevi quatro documentos: `BRIEF.md`, `PRD.md`, `MVP-SCOPE.md` e `DESIGN-GUIDELINES.md`. A solução cabe numa frase do brief:

> Um portfólio que é a própria demonstração do que ele afirma: escrito para humano e para máquina, com currículo estruturado, servidor MCP e canal de contratação consumíveis por qualquer agente sem renderizar a página.

Duas personas. A principal é o avaliador técnico, CTO ou tech lead, que quer ver artefato funcionando e decisão explicada, não lista de tecnologias. A secundária é o agente fazendo triagem em nome dele, que quer extrair competências, disponibilidade e evidência sem alucinar.

O brief também listou os riscos, e o de maior probabilidade não era técnico: **os cases nunca serem escritos** e o site ir ao ar com placeholder. Todo mundo que já refez o próprio portfólio conhece essa armadilha. Você passa três semanas no hero e o conteúdo fica para depois. A mitigação foi de processo: os oito cases entraram na sprint 3, **antes** da home, e a "Definition of Done" diz que sem eles não existe lançamento.

## Sprint 1: provar a plataforma antes de construir em cima dela

A stack escolhida foi Astro 7 em modo SSR, publicado no Firebase App Hosting. O problema é que o adapter oficial da plataforma, `@apphosting/astro-adapter`, estava na versão 0.0.1 desde janeiro de 2025. Versão única, 1.509 downloads por mês. Abandonado, para todos os efeitos.

Toda a camada de máquina (MCP, currículo, endpoint de contratação) depende de rotas de servidor. Construir em cima de uma plataforma não verificada seria apostar o projeto inteiro numa suposição. Então a sprint 1 foi um spike com tempo de caixa de dois dias e um critério de parada declarado antes de começar: ou o plano A sobe em produção, ou aciono o plano B (Hosting estático com Cloud Functions).

O plano A subiu no primeiro dia, com `@astrojs/node` em modo standalone e um `apphosting.yaml` próprio. A decisão está registrada em um ADR, com as alternativas descartadas e o motivo. Parece burocracia para um site pessoal, mas foi o que me deixou escrever as quatro features de servidor sem medo de refazer a arquitetura no meio.

## Uma fonte só, seis superfícies

O conteúdo vive em duas Content Collections do Astro, `projects` e `profile`, validadas por schema Zod. Delas saem seis superfícies: a home, o catálogo de cases, o `llms.txt`, o JSON-LD, o currículo estruturado e as tools do MCP.

"Fonte única de verdade" costuma ser uma intenção que dura até a primeira página com pressa ler direto da coleção. Aqui ela é um teste:

```ts
const ALLOWED = [
  'src/lib/content/projects.ts',
  'src/lib/content/profile.ts',
  'src/lib/content/posts.ts',
];

it('only the access layer may read a collection directly', async () => {
  const offenders: string[] = [];

  for await (const file of glob('src/**/*.{ts,astro}')) {
    const normalized = file.replaceAll('\\', '/');
    if (ALLOWED.includes(normalized)) continue;

    if (readFileSync(file, 'utf8').includes('getCollection(')) {
      offenders.push(normalized);
    }
  }

  expect(offenders).toEqual([]);
});
```

Se qualquer arquivo fora da camada de acesso chamar `getCollection`, a suíte fica vermelha. Para este produto isso importa mais do que o normal: se a home disser uma coisa e o MCP outra, o agente responde errado com confiança, que é exatamente o modo de falha que o site existe para evitar.

## O servidor MCP

A ideia de colocar um servidor MCP num portfólio não é minha. Veio do [site do Ruben Marcus](https://www.rubenmarcus.dev/pt/), que expõe o próprio portfólio para agentes e conta como fez isso num [artigo sobre construir o portfólio com agentes de IA](https://www.rubenmarcus.dev/pt/blog/como-construi-este-portfolio-com-agentes-de-ia). Foi ver aquilo funcionando que me convenceu de que a tese cabia num site pessoal.

O MCP (Model Context Protocol) é o que transforma o site de algo que o agente **lê** em algo que o agente **consulta**. São cinco tools:

| Tool | O que devolve |
|---|---|
| `get_profile` | Quem sou, o que faço, onde estou |
| `check_availability` | Status de disponibilidade e data da atualização |
| `list_projects` | Os cases, com stack e links verificáveis |
| `get_project` | Um case completo pelo slug |
| `get_resume` | O currículo estruturado |

A rota usa o SDK oficial com o transporte Streamable HTTP, que recebe um `Request` da Web API e devolve um `Response`. Isso encaixa direto numa rota SSR do Astro, sem adaptar `IncomingMessage`. O ponto que me custou atenção está no comentário do topo:

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

O jeito natural de escrever é criar o servidor uma vez no escopo do módulo. Em modo stateless, com uma instância atendendo 80 requisições simultâneas, isso faz clientes diferentes trocarem IDs de requisição entre si. Funciona no teste local com um cliente só e quebra em produção com dois.

O fechamento também tem armadilha. Fechar o servidor num `finally` esvazia a resposta antes de ela sair; não fechar vaza um servidor por requisição. A solução foi pendurar o fechamento no fim do stream da resposta, disparando uma única vez em conclusão, cancelamento ou erro. Esse achado veio de uma revisão de código feita pelo Codex, e voltarei a ele.

A página [/mcp](/mcp) mostra como conectar no Claude Code, no Claude, no ChatGPT e em qualquer cliente MCP, e publica o mesmo passo a passo como JSON-LD `HowTo`.

## Toda página tem uma versão para máquina

Nem todo agente fala MCP. Para os que só leem, cada página do site tem duas versões extras: `<página>.md`, o markdown puro, e `<página>/ia`, a mesma página renderizada como um agente a enxergaria. No canto da tela existe um botão que alterna entre a visão humana e a visão IA, com abas para ver o markdown renderizado ou o fonte, copiar e baixar o `.md`.

Por baixo, uma única tabela mapeia caminho para markdown. Página fora dela responde 404. Página nova só ganha visão IA quando entra no registro, e isso é deliberado: prefiro um 404 honesto a um markdown gerado às cegas.

Completam a camada de máquina o `llms.txt`, o `AGENTS.md` na raiz, um currículo em `resume.json` e `resume.txt`, e o JSON-LD dividido de propósito: `Person` derivado do perfil, `SoftwareApplication` ou `CreativeWork` para cada case (tem URL no ar, é aplicação; senão, obra) e `WebSite` global. Tudo em inglês, porque a camada de máquina fala a língua do leitor dela. As páginas, a copy e os cases são em português.

A lista de arquivos que um answer engine procura veio do [aeo.js](https://aeojs.org), também do Ruben Marcus. Ele gera `llms.txt`, `llms-full.txt`, `ai-index.json`, schema e versões em markdown das páginas a partir do site. Não instalei a biblioteca: usei o que ela gera como referência e implementei cada rota direto no projeto, com geradores em funções puras e testes próprios, porque eu queria que tudo saísse da mesma camada de conteúdo que alimenta as páginas e o MCP. O verificador dele, o [check.aeojs.org](https://check.aeojs.org), foi o que usei para medir o resultado.

## Um agente pode me contratar

O último pedaço da tese é o `POST /api/hire`. Um agente que concluiu a triagem pode enviar a proposta direto, em JSON, sem preencher formulário. O schema é `.strict()`, então chave desconhecida é recusada em vez de guardada em silêncio, e todo campo tem limite de tamanho.

O mesmo endpoint atende o formulário de [contato](/contato) para humanos, aceitando `application/x-www-form-urlencoded` e respondendo com redirect 303. A mensagem vai para o Firestore com expiração de 12 meses, o IP fica num registro separado apagado em 30 dias, e uma cópia chega ao meu e-mail pelo Resend.

E nenhum e-mail aparece nas rotas de máquina. Um teste varre cada uma delas procurando e-mail, chave de API, caminho absoluto e IP privado. A premissa é que o crawler é hostil e ignora o `robots.txt`; a proteção real é não haver nada sensível ali.

## Sete portões que viram regra em falha

Documento de design declara regra. Nada impede que ela seja violada na próxima sexta-feira à noite. Então cada regra que importava virou um portão automatizado:

| Portão | O que impede |
|---|---|
| Contraste | Par de cor abaixo de 4,5:1 |
| Literal fora da escala | Hex solto ou valor arbitrário do Tailwind |
| JavaScript de cliente | Segundo script, ou o único acima de 1,5 KB gzip |
| Fonte única | `getCollection` fora da camada de acesso |
| Schema quebra o build | Conteúdo inválido chegando em produção |
| CTA primário único | Dois botões de mesmo peso na home |
| Vazamento nas rotas de máquina | E-mail, chave, caminho absoluto, IP privado |

Uma regra que me acompanhou o projeto inteiro: **um portão só está pronto depois de ter ficado vermelho**. Para cada um, escrevi o caso que deveria falhar e confirmei que falhava. Um portão que nunca falhou não é portão, é decoração.

O de JavaScript merece um parágrafo. O site inteiro tem **um** script de cliente, e ele faz três coisas: o efeito de ponteiro na grade de pontos do fundo, o botão de copiar e o header que ganha fundo quando você rola a página. Hoje ele pesa cerca de 700 bytes com gzip. Nenhuma diretiva `client:*`, nenhum framework no navegador. As abas da visão IA e os chips do formulário são CSS puro.

Outra regra que virou código: **nenhum número sem narrativa**. Tenho 964 estrelas no GitHub, mas cerca de 700 delas vêm de temas Jekyll de 2018. Exibir o agregado sem contexto seria vender trabalho com IA usando prova social de outra época. O componente `StatItem` lança erro se receber um valor sem contexto.

## Os números

- **313 commits** entre 8 de agosto e 10 de outubro de 2026.
- **16 specs** e **16 planos**, cada tarefa com teste vermelho antes da implementação.
- **159 arquivos de teste**, mais de 1.280 testes unitários e 16 asserções sobre a saída do build.
- **Lighthouse** na auditoria de lançamento: 97 de performance e 100 de acessibilidade e SEO na home.
- **PageSpeed mobile**: 98 depois de inlinear o CSS, mover as fontes para assets com hash e pré-carregar só as duas que aparecem acima da dobra.

A mesma auditoria reprovou um post antigo com 75 de performance e achou comentários de código com contraste de 3,04:1. O portão de contraste não pegou porque lia só os tokens do CSS, e o Shiki escreve as cores do tema inline. Os dois achados viraram tarefa, não nota renegociada.

## Como foi construir com agentes

Todo o código foi escrito com agentes, mas não do jeito "pede e aceita". O fluxo foi o que eu chamo de RPI: Research, Plan, Implement.

1. **Research**: cada feature começa numa spec com requisitos no formato `QUANDO [evento] ENTÃO o sistema DEVE [resposta]`, cada um com ID. Para as features maiores, o agente me interroga uma decisão por vez, sempre com uma resposta recomendada, até não sobrar nada implícito.
2. **Plan**: a spec vira um plano de tarefas atômicas de dois a cinco minutos, cada uma com o teste que deve falhar, o código que o faz passar e o comando para verificar.
3. **Implement**: o Claude Code orquestra. Em parte das features, o Grok implementou as tarefas e o Codex revisou o diff; o Claude validou, rodou os portões e commitou.

Não foi um pipeline perfeito, e o registro de estado das features conta isso sem maquiagem. Na visão IA, o Grok implementou as tarefas 1 a 6, estourou o tempo limite no meio da 7, e o Claude assumiu dali em diante. O Codex estava sem cota, então a revisão também foi do Claude. O valor do processo não está em cada agente fazer sempre o seu papel; está em a spec e o plano serem bons o suficiente para qualquer um deles continuar de onde o outro parou.

O que eu fiz o tempo todo foi o que agente não faz bem sozinho: decidir o que importa, dizer não, olhar a tela e perceber que o rótulo do ícone estava dois pixels desalinhado.

## O que deu errado

Alguns problemas que só apareceram em produção, ou que pareciam outra coisa:

**Redirect que não redireciona.** Em uma página pré-renderizada, `Astro.redirect('/x', 301)` vira um documento com meta refresh servido com status 200. No navegador funciona, então passa despercebido. Para crawler e cache, não é redirect nenhum. Os testes estavam verdes porque procuravam a string `301` no fonte. O único portão que pega isso é HTTP de verdade contra o build rodando.

**Texto colado.** O `compressHTML` do Astro remove espaço entre texto e elemento inline, e "um POST" virou "umPOST". Corrigido com `{' '}` explícito e um portão que procura texto grudado em link.

**403 atrás do proxy.** O Astro verifica a origem de formulários, e atrás do proxy do App Hosting ele achava que a requisição vinha de HTTP. Todo envio do formulário respondia 403. A correção foi declarar `security.allowedDomains`, que faz o Astro confiar no `X-Forwarded-Proto`.

**Mensagem que sumia.** O formulário respondia sucesso e nada chegava ao Firestore. A conta de serviço do App Hosting não tinha `roles/datastore.user`, e a gravação falhava sem barulho.

**O gerenciador de senhas preenchendo o honeypot.** O campo escondido que pega bots se chamava `website`, e o gerenciador de senhas, provavelmente o 1Password, o preenchia por conta própria. Mensagens legítimas eram descartadas como spam. Hoje o campo tem um nome que nenhum autofill reconhece e cada descarte gera um aviso no log.

## O que fica

O ponto de partida foi uma pergunta simples: se um agente vai ler meu portfólio antes de uma pessoa, por que não construir o portfólio para ele também?

A resposta virou um site que se explica em dois idiomas e dois formatos, com um servidor MCP que responde da mesma fonte que a página que você está lendo agora. Não é um recurso a mais; é o argumento. Se eu digo que construo ferramental para agentes, o próprio site precisa ser consumível por um.

Se você estiver avaliando alguém para um problema de IA ou agentes, pode começar pelo agente:

```bash
claude mcp add --transport http nandomoreira https://nandomoreira.dev/api/mcp
```

Ou, se preferir o caminho humano, a página de [contato](/contato) continua lá.
