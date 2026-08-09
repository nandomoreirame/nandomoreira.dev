# nandomoreira.dev - PRD

> **Status:** approved
> **Criado:** 2026-08-07
> **Atualizado:** 2026-08-07
> **Documentos relacionados:** BRIEF.md, MVP-SCOPE.md, DESIGN-GUIDELINES.md

---

## Overview

### Visão

Um portfólio pessoal que funciona como demonstração executável da competência que
afirma: legível por humano em português, consumível por agente em inglês, com
servidor MCP, currículo estruturado e canal de contratação verificáveis.

### Problem Statement

O portfólio publicado em `nandomoreira.dev` apresenta Fernando como desenvolvedor
web full-stack. O trabalho real do último ano é ferramental de agentes de IA
(`forja`, framework `.claude`, `amnesia-claude-code`, `devkit-claude-plugins`) e
produtos com IA em produção (`bragstack.app` com Claude, `portfoliosnap.app` com
Gemini). A bio pública do GitHub não menciona IA nem agentes em nenhum ponto.

O desalinhamento tem duas consequências. A primeira é de posicionamento: quem
avalia não encontra sinal da competência que importa. A segunda é estrutural: o
site está invisível para o leitor que hoje faz a triagem inicial. Não há
`llms.txt`, `sitemap.xml`, dados estruturados nem qualquer rota que um agente
possa consultar. Ambos os arquivos retornam 404 hoje.

Tentativas anteriores não resolveram. O `nandomoreira.dev-chat` trocou a navegação
por slash commands, o que aumenta o custo de exploração justamente para a persona
que escaneia. O `svelte-nandomoreira.dev`, que serve o domínio, está arquivado e
congelado desde dezembro de 2025.

### Goals

| # | Objetivo | Como medir |
|---|----------|------------|
| G1 | Reposicionar a marca pessoal de web dev genérico para engenheiro de produto com agentes | Natureza das conversas recebidas em 90 dias |
| G2 | Tornar o portfólio consumível por máquina sem renderização de página | Chamada externa bem-sucedida ao `/api/mcp` e ao `/api/resume.json` |
| G3 | Servir três objetivos comerciais com hierarquia clara e um único CTA primário | Taxa de clique no CTA primário acima dos secundários |
| G4 | Publicar substituindo o site atual | Domínio apontado para o novo backend |

### Non-Goals

- **Não opera como blog.** Notas curtas existem sob `/notas`, sem periodicidade, sem arquivo por período e sem categorias. Volume de artigo longo e calendário editorial continuam fora; os cases seguem como o conteúdo indexável de peso.
- **Não é bilíngue na camada humana.** Manter duas versões de cada página dobra o custo de manutenção do conteúdo.
- **Não é uma demo interativa de WebGL.** O impacto visual não compensa o risco de prazo e de performance.
- **Não é um agente conversacional sobre o currículo.** Superfície de prompt injection sem demanda observada.
- **Não é um CMS.** O conteúdo é versionado junto ao código.
- **Não tem área logada.** Todo o conteúdo é público por natureza.

---

## User Personas

### Persona 1: Avaliador técnico (principal)

| Campo | Valor |
|-------|-------|
| Contexto | CTO, tech lead ou head de engenharia avaliando para contratação ou parceria |
| Nível técnico | Alto. Reconhece quando uma decisão técnica foi bem fundamentada e quando é jargão |
| Job to be done | Decidir em poucos minutos se vale marcar uma conversa |
| Frustração atual | Portfólio que lista tecnologias sem mostrar decisão, escopo ou resultado |
| Define sucesso como | Ver um artefato real e entender por que foi construído daquele jeito |
| Frequência de uso esperada | Uma visita, com profundidade em dois ou três cases |

### Persona 2: Agente de IA (secundária, e a tese do produto)

| Campo | Valor |
|-------|-------|
| Contexto | Cliente MCP, crawler de answer engine ou agente de triagem operando em nome de um humano |
| Nível técnico | Consome JSON e texto estruturado; não interpreta layout |
| Job to be done | Extrair competências, evidência de entrega e disponibilidade em formato estruturado |
| Frustração atual | Precisa raspar HTML pensado para olho humano e inferir o que não está declarado |
| Define sucesso como | Obter resposta correta e citável sem alucinar |
| Frequência de uso esperada | Cada vez que um humano pergunta a ele sobre o Fernando |

### Persona 3: Recrutador não técnico (fora do MVP)

Otimizar para filtro por palavra-chave conflita diretamente com a densidade técnica
que a Persona 1 exige. Fica de fora, e a mitigação é o `resume.json`, que qualquer
ferramenta de recrutamento consegue consumir.

---

## User Stories

### Avaliador técnico

**US-001** — Como avaliador técnico, quero entender o que essa pessoa faz nos
primeiros segundos, para decidir se continuo lendo.

- **Prioridade:** P0
- **Feature:** F1
- **Critérios de aceite:**
  - [ ] O posicionamento em IA e agentes está visível sem rolagem em 320px e em desktop
  - [ ] Existe exatamente um CTA primário acima da dobra
  - [ ] O CTA primário leva ao catálogo de projetos

**US-002** — Como avaliador técnico, quero ver o que ele construiu agrupado por
tipo de trabalho, para achar rápido o que é relevante para mim.

- **Prioridade:** P0
- **Feature:** F2
- **Critérios de aceite:**
  - [ ] Os quatro blocos do acervo estão representados com pelo menos 2 cases cada
  - [ ] Cada card mostra nome, uma linha de descrição e as tecnologias principais
  - [ ] Cada card leva à página de case

**US-003** — Como avaliador técnico, quero ler como um projeto foi decidido e não
só o que ele usa, para julgar a qualidade do raciocínio.

- **Prioridade:** P0
- **Feature:** F2
- **Critérios de aceite:**
  - [ ] A página de case contém problema, decisões técnicas e resultado
  - [ ] Links para repositório e versão no ar aparecem quando existem
  - [ ] Projeto com repositório privado não exibe link quebrado

**US-004** — Como avaliador técnico, quero acessar o currículo e a trajetória, para
avaliar senioridade.

- **Prioridade:** P0
- **Feature:** F1, F5
- **Critérios de aceite:**
  - [ ] Seção de trajetória apresenta os números do acervo com a narrativa que os contextualiza
  - [ ] O currículo é acessível em página e em download

**US-005** — Como avaliador técnico, quero entrar em contato sem fricção, para
iniciar a conversa.

- **Prioridade:** P0
- **Feature:** F1
- **Critérios de aceite:**
  - [ ] Pelo menos um canal direto de contato, sem formulário obrigatório

### Agente de IA

**US-006** — Como agente, quero descobrir quais rotas estruturadas existem, para
consultar a fonte certa em vez de raspar HTML.

- **Prioridade:** P0
- **Feature:** F4
- **Critérios de aceite:**
  - [ ] `/llms.txt` responde 200 e lista as rotas de máquina
  - [ ] `/robots.txt` declara permissão explícita para crawlers de answer engine
  - [ ] `/sitemap.xml` lista todas as rotas públicas

**US-007** — Como agente, quero obter o currículo em schema conhecido, para não
precisar interpretar prosa.

- **Prioridade:** P0
- **Feature:** F5
- **Critérios de aceite:**
  - [ ] `/api/resume.json` responde no schema JSON Resume com extensão própria
  - [ ] `/api/resume.txt` responde em texto puro legível por LLM

**US-008** — Como cliente MCP, quero consultar perfil, projetos e disponibilidade
via tools, para responder ao meu usuário com dado correto.

- **Prioridade:** P0
- **Feature:** F6
- **Critérios de aceite:**
  - [ ] Um cliente MCP real conecta e lista as tools
  - [ ] Cada tool retorna dado consistente com o site
  - [ ] Requisição malformada retorna erro JSON-RPC padronizado sem stack trace

**US-009** — Como agente, quero enviar um briefing de projeto, para iniciar contato
em nome do meu usuário.

- **Prioridade:** P0
- **Feature:** F7
- **Critérios de aceite:**
  - [ ] Payload válido é persistido e notificado
  - [ ] Payload inválido, grande demais ou acima do limite de taxa é rejeitado com status apropriado
  - [ ] Nenhuma resposta expõe detalhe interno do sistema

---

## Features

### F1: Home em seções, prova primeiro

- **Prioridade:** P0
- **Persona:** Avaliador técnico
- **Depende de:** F3
- **User stories:** US-001, US-004, US-005

**Descrição**

Página inicial em seções escaneáveis, com a evidência antes da oferta. Navegação:
Projetos, Sobre, Agents, Contato.

Ordem das seções: hero, projetos e experimentos em destaque, trajetória e números,
o que eu faço por você, sobre, contato.

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F1.1 | QUANDO um visitante acessa a home ENTÃO o sistema DEVE exibir o posicionamento em IA e agentes e um único CTA primário que leva ao catálogo |
| F1.2 | QUANDO a home é renderizada ENTÃO o sistema DEVE apresentar as seções na ordem definida, com projetos antes de serviços |
| F1.3 | QUANDO a seção de trajetória é exibida ENTÃO o sistema DEVE apresentar os números do acervo acompanhados da narrativa que explica sua origem |
| F1.4 | QUANDO a seção de serviços é exibida ENTÃO cada serviço DEVE referenciar ao menos um case que o comprove |
| F1.5 | QUANDO o site é acessado em qualquer viewport a partir de 320px ENTÃO o sistema DEVE renderizar sem scroll horizontal |

**Critérios de aceite**

- [ ] Um único CTA primário acima da dobra
- [ ] Nenhum serviço listado sem case correspondente
- [ ] Números da trajetória conferem com a fonte pública

**Fora do escopo desta feature**

- Hero 3D ou animação WebGL — risco de prazo e performance
- Depoimentos — não há material real

### F2: Catálogo de projetos e experimentos

- **Prioridade:** P0
- **Persona:** Avaliador técnico
- **Depende de:** F3
- **User stories:** US-002, US-003

**Descrição**

Grid de cases agrupados pelos quatro blocos do acervo, e uma página de case por
projeto. Blocos: ferramental de AI coding; produtos SaaS com IA; sistemas e CLI em
Rust e Go; trabalho profissional e de cliente.

O conteúdo dos cases é escrito pelo autor. A feature entrega a estrutura, o schema
e o cadastro.

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F2.1 | QUANDO um visitante acessa o catálogo ENTÃO o sistema DEVE exibir os cases agrupados pelos quatro blocos |
| F2.2 | QUANDO um visitante abre um case ENTÃO o sistema DEVE exibir problema, decisões técnicas, resultado, imagens e links disponíveis |
| F2.3 | QUANDO um projeto tem repositório privado ENTÃO o sistema DEVE omitir o link de repositório e exibir apenas o link da versão no ar |
| F2.4 | QUANDO um projeto não tem imagem ENTÃO o sistema DEVE aplicar um fallback visual determinístico, nunca um card quebrado |
| F2.5 | QUANDO um case é renderizado ENTÃO o sistema DEVE embutir JSON-LD do tipo apropriado para aquele artefato |

**Critérios de aceite**

- [ ] Os quatro blocos representados com ao menos 2 cases cada
- [ ] Nenhum link quebrado em projeto privado
- [ ] Página de case legível em 320px

### F3: Camada de dados única

- **Prioridade:** P0
- **Persona:** ambas
- **Depende de:** F8
- **User stories:** sustenta todas

**Descrição**

Uma única fonte de verdade em Astro Content Collections, com schema validado em
build, alimentando site, currículo, `llms.txt`, JSON-LD e as respostas do MCP.
Sem esta feature, cada superfície duplica conteúdo e elas divergem na primeira
alteração.

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F3.1 | QUANDO um projeto é cadastrado na content collection ENTÃO o sistema DEVE derivar dela o site, o currículo, o `llms.txt`, o JSON-LD e as respostas do MCP, sem duplicação manual |
| F3.2 | QUANDO um campo obrigatório está ausente ou malformado ENTÃO o build DEVE falhar com erro de schema |
| F3.3 | QUANDO o perfil é atualizado em um único lugar ENTÃO todas as superfícies DEVEM refletir a mudança no próximo build |

**Critérios de aceite**

- [ ] Nenhum dado de projeto ou perfil escrito duas vezes no repositório
- [ ] Build falha com projeto inválido, comprovado por teste

### F4: Base AEO

- **Prioridade:** P0
- **Persona:** Agente de IA
- **Depende de:** F3
- **User stories:** US-006

**Descrição**

Superfície estática de descoberta para agentes e answer engines. Conteúdo em inglês.

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F4.1 | QUANDO um agente requisita `/llms.txt` ENTÃO o sistema DEVE responder com índice em inglês do conteúdo e das rotas de máquina |
| F4.2 | QUANDO um agente requisita `/AGENTS.md` ENTÃO o sistema DEVE responder com brief de contratação em inglês, incluindo serviços, disponibilidade e como acionar os endpoints |
| F4.3 | QUANDO um crawler requisita `/robots.txt` ENTÃO o sistema DEVE declarar permissão explícita para os principais crawlers de answer engine |
| F4.4 | QUANDO qualquer página é renderizada ENTÃO o sistema DEVE embutir JSON-LD válido dos tipos `Person`, `WebSite` e, nas páginas de case, `CreativeWork` ou `SoftwareApplication` |
| F4.5 | QUANDO um agente requisita `/sitemap.xml` ENTÃO o sistema DEVE listar todas as rotas públicas indexáveis |

**Critérios de aceite**

- [ ] JSON-LD passa em validador de dados estruturados
- [ ] Nenhuma informação sensível exposta nas rotas de máquina

### F5: Currículo estruturado

- **Prioridade:** P0
- **Persona:** Agente de IA
- **Depende de:** F3
- **User stories:** US-004, US-007

**Descrição**

Currículo em JSON Resume com bloco de extensão próprio para o que o schema padrão
não expressa (agentes, tooling de IA, disponibilidade), mais uma versão em texto puro.

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F5.1 | QUANDO um agente requisita `/api/resume.json` ENTÃO o sistema DEVE responder com currículo em inglês aderente ao JSON Resume, acrescido do bloco de extensão |
| F5.2 | QUANDO um agente requisita `/api/resume.txt` ENTÃO o sistema DEVE responder em texto puro legível por LLM |
| F5.3 | QUANDO o currículo é servido ENTÃO o sistema DEVE derivá-lo da mesma fonte que alimenta o site |

**Critérios de aceite**

- [ ] Payload valida contra o schema JSON Resume
- [ ] Extensão isolada em chave própria, sem quebrar a validação

### F6: Servidor MCP

- **Prioridade:** P0
- **Persona:** Agente de IA
- **Depende de:** F3, F8
- **User stories:** US-008

**Descrição**

Servidor MCP em `/api/mcp` usando o SDK oficial, falando a versão estável do
protocolo, expondo quatro tools: `get_profile`, `list_projects` com `get_project`,
`get_resume` e `check_availability`.

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F6.1 | QUANDO um cliente MCP conecta a `/api/mcp` ENTÃO o sistema DEVE responder conforme o protocolo na versão estável suportada pelos clientes em produção |
| F6.2 | QUANDO um cliente lista tools ENTÃO o sistema DEVE expor `get_profile`, `list_projects`, `get_project`, `get_resume` e `check_availability` |
| F6.3 | QUANDO uma tool é chamada ENTÃO o sistema DEVE retornar dado derivado da mesma fonte que alimenta o site |
| F6.4 | QUANDO uma requisição é malformada ENTÃO o sistema DEVE retornar erro JSON-RPC padronizado, sem stack trace nem detalhe interno |
| F6.5 | QUANDO `check_availability` é chamada ENTÃO o sistema DEVE retornar a disponibilidade declarada na fonte de verdade, com a data da última atualização |

**Critérios de aceite**

- [ ] Conexão validada com um cliente MCP real, não apenas por teste unitário
- [ ] Nenhuma tool retorna dado divergente do site

**Fora do escopo desta feature**

- Tools de escrita — `/api/hire` cobre o único caso de escrita necessário
- Migração para a revisão stateless do protocolo — ainda em release candidate

### F7: Canal de contratação por agente

- **Prioridade:** P0
- **Persona:** Agente de IA
- **Depende de:** F8
- **User stories:** US-009

**Descrição**

Endpoint que recebe briefing de projeto enviado por um agente, valida com rigor,
persiste e notifica.

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F7.1 | QUANDO um agente envia briefing válido a `/api/hire` ENTÃO o sistema DEVE validar no servidor, persistir e notificar por e-mail |
| F7.2 | QUANDO o payload é inválido ENTÃO o sistema DEVE rejeitar com status apropriado, sem persistir |
| F7.3 | QUANDO o payload excede o limite de tamanho ENTÃO o sistema DEVE rejeitar antes do parse |
| F7.4 | QUANDO o campo honeypot vem preenchido ENTÃO o sistema DEVE descartar silenciosamente |
| F7.5 | QUANDO um mesmo IP excede o limite de requisições na janela ENTÃO o sistema DEVE rejeitar com status 429 |
| F7.6 | QUANDO a notificação por e-mail falha ENTÃO o sistema DEVE manter o registro persistido e não retornar erro ao chamador |

**Critérios de aceite**

- [ ] Nenhuma resposta expõe detalhe interno
- [ ] Registro sobrevive a falha de entrega do e-mail

### F8: Infraestrutura e deploy

- **Prioridade:** P0
- **Persona:** ambas
- **Depende de:** —
- **User stories:** sustenta todas

**Descrição**

Astro 7 com adapter Node em modo standalone, publicado no Firebase App Hosting via
`apphosting.yaml` com comando de execução próprio. **A primeira tarefa é um spike
de deploy**, antes de qualquer feature, porque o adapter oficial da plataforma está
abandonado (ver RISK-001).

**Requisitos funcionais**

| # | Requisito |
|---|-----------|
| F8.1 | ANTES de qualquer implementação de feature ENTÃO um spike DEVE validar em produção o deploy de um Astro SSR mínimo no App Hosting |
| F8.2 | QUANDO o spike falha ENTÃO o plano B DEVE ser acionado: site estático no Hosting clássico com endpoints em Cloud Functions |
| F8.3 | QUANDO o projeto é construído ENTÃO o sistema DEVE rodar em Astro 7 com adapter Node standalone |
| F8.4 | QUANDO o site é auditado ENTÃO o sistema DEVE atingir Lighthouse acima de 90 em Performance, Acessibilidade e SEO |
| F8.5 | QUANDO um usuário navega apenas por teclado ENTÃO o sistema DEVE manter foco visível e ordem de tabulação lógica |
| F8.6 | QUANDO o lançamento ocorre ENTÃO o site DEVE ser validado em staging antes de o domínio ser apontado |

**Critérios de aceite**

- [ ] Deploy reproduzível a partir de comando documentado
- [ ] Cutover só após validação do MCP com cliente real

### F9: Página /agents

- **Prioridade:** P1
- **Persona:** Avaliador técnico

Página em português explicando a camada de máquina, os endpoints e como usá-los.
É o que transforma a camada de agentes de detalhe invisível em argumento de venda
para o leitor humano.

### F10: OG images dinâmicas

- **Prioridade:** P1

Imagem de compartilhamento gerada a partir do conteúdo da página.

### F11: Filtro do catálogo

- **Prioridade:** P1

Filtro por bloco e por tecnologia sem recarregar a página. **É a primeira feature
que exige uma ilha interativa**; até ela, o site é inteiramente estático e SSR.

### F12: Analytics

- **Prioridade:** P1

Métricas de audiência respeitando privacidade, mais log estruturado das chamadas
às rotas de máquina, necessário para validar H3.

### F13: Demos interativas

- **Prioridade:** P2

Experimentos rodando no browser dentro das páginas de case.

### F14: Notas

- **Prioridade:** P0

Notas curtas em `/notas`, no mesmo padrão de linha das listagens de cases. A data existe no frontmatter só para ordenação, RSS e `lastmod`; nunca aparece na superfície humana.

**Requisitos funcionais:**

- QUANDO o visitante abre `/notas` ENTÃO o sistema DEVE listar as notas publicadas da mais recente para a mais antiga, sem exibir data.
- QUANDO o visitante abre `/notas/<slug>` ENTÃO o sistema DEVE renderizar o título e o corpo da nota, com link de volta para a listagem, sem data.
- QUANDO uma nota está marcada como rascunho ENTÃO o sistema DEVE omiti-la de listagem, página, navegação, sitemap, `llms.txt` e RSS.
- QUANDO existem notas publicadas ENTÃO o sistema DEVE incluir o item "Notas" na navegação apontando para `/notas`.
- QUANDO não há nota publicada ENTÃO o sistema DEVE omitir o item "Notas" da navegação.
- QUANDO um agente consulta `llms.txt` ou `sitemap.xml` ENTÃO o sistema DEVE incluir as notas publicadas, com `lastmod` derivado da data de frontmatter no sitemap.
- QUANDO um leitor assina o feed ENTÃO o sistema DEVE servir `/rss.xml` com as notas publicadas e `pubDate` derivado da data de frontmatter.

### F15: Versão em inglês das páginas humanas

- **Prioridade:** P2

Com `hreflang`. Primeiro item da v1.1 se H3 se confirmar.

---

## Technical Stack

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| Framework | Astro | 7.2.0 | Estático por padrão com SSR onde necessário. Começar em Astro 5, versão da referência, colocaria o projeto dois majors atrás no dia zero |
| Adapter | `@astrojs/node` (standalone) | 11.1.0 | O adapter oficial da plataforma está abandonado. Este tem manutenção ativa |
| Linguagem | TypeScript | 5.x | Padrão do autor |
| Estilização | Tailwind CSS | 4.x | Já dominado; tokens no CSS |
| Conteúdo | Astro Content Collections | nativo | Schema validado em build atende F3.2 sem serviço externo |
| Validação | Zod | 4.x | Valida payload de `/api/hire` e schema das collections (peer do Astro 7) |
| MCP | `@modelcontextprotocol/sdk` | 1.30.0 | 194M downloads/mês. Escrever JSON-RPC à mão não se justifica e a negociação de versão sai de graça |
| Currículo | JSON Resume schema | 1.3.1 | Padrão aberto que agentes já sabem ler |
| Hosting | Firebase App Hosting | — | Projeto `nandomoreira-dev`, região `us-east4`. Autor já opera Firebase em três produtos |
| Persistência | Firestore | — | Registro dos briefings recebidos |
| Fontes | JetBrains Mono + Inter | — | Continuidade com a identidade atual |

**Versões verificadas em:** 2026-08-07, via npm registry (`dist-tags.latest` mais data de publicação e downloads no último mês).

### Dependências verificadas

| Pacote | Situação | Consequência |
|--------|----------|--------------|
| `astro` | 7.2.0, publicado 06/08/2026, 17,6M downloads/mês | Saudável |
| `@astrojs/node` | 11.1.0, publicado 06/08/2026, 2,7M downloads/mês | Saudável, escolhido |
| `@modelcontextprotocol/sdk` | 1.30.0, publicado 27/07/2026, 194M downloads/mês | Saudável |
| `@jsonresume/schema` | 1.3.1, publicado 22/07/2026, 5.062 downloads/mês | Vivo, porém nicho. Aceito por ser padrão aberto |
| `@apphosting/astro-adapter` | **0.0.1, publicado 23/01/2025, versão única, 1.509 downloads/mês** | **Descartado.** Abandonado; origem do RISK-001 |

### O que NÃO usar

| Tecnologia | Por que a complexidade não se paga |
|------------|-------------------------------------|
| Three.js, WebGL, shaders | Risco de prazo e performance desproporcional |
| React ou Svelte no P0 | Nenhuma feature P0 exige interatividade cliente. A primeira ilha entra só com F11 |
| CMS | Content Collections resolvem com validação em build |
| Cloud Armor | Infra desproporcional para o volume esperado. Fica como escalada de RISK-002 |
| reCAPTCHA em `/api/hire` | Contradiz o propósito do endpoint, que é ser chamado por agente |

---

## Data Models

### Content Collection: `projects`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `slug` | string | sim | Identificador estável, kebab-case |
| `title` | string | sim | Nome do projeto |
| `block` | enum | sim | `ai-tooling`, `ai-product`, `systems-cli`, `professional` |
| `summary` | string | sim | Uma linha para o card |
| `problem` | markdown | sim | O problema que originou o projeto |
| `decisions` | markdown | sim | Decisões técnicas e alternativas descartadas |
| `outcome` | markdown | sim | Resultado, com métrica quando existir |
| `tech` | string[] | sim | Tecnologias principais |
| `repoUrl` | string \| null | não | Ausente quando o repositório é privado |
| `liveUrl` | string \| null | não | Ausente quando não há versão no ar |
| `images` | object[] | não | Caminho e texto alternativo |
| `featured` | boolean | sim | Destaque na home |
| `confidential` | boolean | sim | Quando verdadeiro, omite nome de cliente e métrica sigilosa |

**Regra de integridade:** `repoUrl` e `liveUrl` não podem ser ambos nulos. Um case
sem nenhum link não tem evidência verificável.

### Content Collection: `profile`

Fonte única para bio, posicionamento, stack, trajetória, serviços, disponibilidade
e canais de contato. Alimenta home, `resume.json`, `resume.txt`, `llms.txt`,
`AGENTS.md`, JSON-LD e as tools do MCP.

### Firestore: `hire_requests`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `receivedAt` | timestamp | Momento do recebimento |
| `from` | string | Identificação declarada pelo agente |
| `contact` | string | Canal de retorno |
| `brief` | string | Conteúdo, com tamanho limitado |
| `sourceIp` | string | Para diagnóstico de abuso |
| `notified` | boolean | Se o e-mail foi entregue |

**Acesso:** escrita apenas pelo backend; leitura apenas pelo proprietário. Nenhuma
regra permite leitura pública.

---

## User Flows

### Flow 1: Avaliador técnico decide se marca conversa

1. Chega à home por LinkedIn, GitHub ou indicação
2. Lê o posicionamento no hero e clica no CTA primário
3. Percorre o grid e identifica o bloco relevante
4. Abre 1 ou 2 cases e lê problema, decisão e resultado
5. Verifica o repositório ou a versão no ar
6. Vai a contato ou baixa o currículo

**Caminho infeliz:** um case sem link, sem imagem ou com texto raso encerra a
avaliação ali. Por isso a integridade de link é regra de schema, não recomendação.

### Flow 2: Agente responde a uma pergunta sobre o Fernando

1. Recebe a pergunta do usuário
2. Descobre `/llms.txt` ou o servidor MCP
3. Chama `get_profile` e `list_projects`, ou busca `/api/resume.json`
4. Compõe a resposta com dado estruturado
5. Se houver intenção de contratação, chama `/api/hire`

**Caminho infeliz:** endpoint fora do ar ou payload divergente do site faz o agente
responder errado com confiança. Por isso F3 é pré-requisito de F5 e F6.

### Flow 3: Cutover do domínio

1. Site publicado na URL do App Hosting
2. MCP validado com cliente real e `resume.json` validado contra o schema
3. Lighthouse e acessibilidade dentro do alvo
4. Domínio apontado para o novo backend
5. Site antigo desativado

**Caminho infeliz:** apontar o domínio antes de validar o MCP publica uma promessa
quebrada exatamente na feature que sustenta o posicionamento.

---

## Non-Functional Requirements

### Performance

- Lighthouse acima de 90 em Performance
- LCP abaixo de 2,5s em conexão 4G
- CLS abaixo de 0,1
- Sem JavaScript de cliente nas rotas P0

### Segurança

- Toda entrada validada no servidor com schema estrito
- Limite de tamanho aplicado antes do parse
- Nenhum segredo em código de cliente
- Nenhuma resposta de erro expõe stack trace ou detalhe interno
- Regras do Firestore negam leitura pública de `hire_requests`
- Rotas de máquina não expõem informação sensível, já que crawler pode ignorar `robots.txt`

### Acessibilidade

- WCAG AA
- Navegação completa por teclado com foco visível
- Nenhuma informação transmitida apenas por cor
- Alvo de toque de no mínimo 44px

### Escalabilidade

Volume esperado é baixo. O risco real não é carga legítima e sim abuso do
`/api/hire`, tratado em F7. Cold start do Cloud Run pode fazer a primeira chamada
ao `/api/mcp` passar de 1s, o que é aceitável.

### Suporte

- Navegadores em versão corrente, duas últimas versões
- Viewport mínimo de 320px

---

## Integrations

### Firebase App Hosting

- **Uso:** hospedagem do build SSR
- **Autenticação:** CLI do Firebase, projeto `nandomoreira-dev`
- **Limites:** requer plano Blaze
- **Modo de falha:** RISK-001. Plano B é Hosting estático mais Cloud Functions

### Firestore

- **Uso:** persistência de `hire_requests`
- **Modo de falha:** se a escrita falha, `/api/hire` retorna erro ao chamador, pois sem persistência o briefing se perde

### Serviço de e-mail

- **Uso:** notificação de novo briefing
- **Modo de falha:** F7.6. Falha de entrega não invalida a requisição, já que o registro está no Firestore

### Cliente MCP externo

- **Uso:** validação de contrato do `/api/mcp`
- **Modo de falha:** se nenhum cliente conectar, F6 não está pronta, independentemente dos testes unitários

---

## Edge Cases

| # | Cenário | Comportamento esperado |
|---|---------|------------------------|
| EC-001 | Projeto com repositório privado | Omitir link de repositório, exibir apenas o da versão no ar |
| EC-002 | Projeto sem nenhum link | Build falha por regra de integridade do schema |
| EC-003 | Projeto sem imagem | Fallback visual determinístico |
| EC-004 | Campo obrigatório ausente na collection | Build falha com erro de schema |
| EC-005 | `/api/hire` sob flood | Rejeição por limite de taxa com status 429 |
| EC-006 | Payload gigante em `/api/hire` | Rejeição antes do parse |
| EC-007 | Honeypot preenchido | Descarte silencioso, resposta de sucesso ao chamador |
| EC-008 | E-mail de notificação falha | Registro mantido, sucesso retornado |
| EC-009 | Cliente MCP com versão de protocolo incompatível | Erro JSON-RPC claro, sem stack trace |
| EC-010 | Crawler ignora `robots.txt` | Sem impacto: nenhuma informação sensível nas rotas públicas |
| EC-011 | Case de cliente sob confidencialidade | `confidential: true` omite nome e métrica sigilosa |
| EC-012 | Cold start do Cloud Run | Primeira chamada pode passar de 1s; aceitável |
| EC-013 | Spike de deploy falha | Plano B do F8.2 |

---

## Success Metrics

### North Star

**Conversas qualificadas iniciadas por mês:** 2 ou mais.

### Por feature

| Feature | Métrica | Alvo |
|---------|---------|------|
| F1 | Clique no CTA primário acima dos secundários | Sim |
| F2 | Tempo médio na página de case | Acima de 90s |
| F4 | Citação em answer engine | Ao menos 1 em 90 dias |
| F5 | Requisição externa ao `resume.json` | Primeira ocorrência não originada pelo autor |
| F6 | Conexão MCP externa | Primeira ocorrência não originada pelo autor |
| F7 | Briefing legítimo recebido | Ao menos 1 em 90 dias |

---

## Open Questions

| # | Questão | Bloqueia | Responsável |
|---|---------|----------|-------------|
| Q1 | Astro SSR sobe no App Hosting com `apphosting.yaml` próprio? | F8, e por consequência F6 e F7 | Spike, primeira tarefa |
| Q2 | Qual serviço de e-mail para a notificação de F7 | F7.1 | Definir na implementação |
| Q3 | Cor de acento permanece âmbar ou muda | F1 estética | Ajustável, ver DESIGN-GUIDELINES |
| Q4 | Quais 8 projetos exatos entram como case | F2 conteúdo | Autor, com sugestão em MVP-SCOPE |

### Resolvidas no grilling

| # | Decisão | Resolução | Racional |
|---|---------|-----------|----------|
| 1 | Versão do protocolo MCP | SDK oficial na versão estável | A revisão stateless de 28/07/2026 é release candidate e os clientes em produção ainda não a falam. O SDK absorve a migração depois |
| 2 | Como tratar a prova social | Narrativa de trajetória explícita | Cerca de 700 das 964 estrelas vêm de temas Jekyll de 2018. Exibir o número agregado sem contexto seria enganoso; omitir desperdiçaria a prova mais forte que existe |
| 3 | Schema do currículo | JSON Resume mais bloco de extensão | Interoperabilidade com quem já lê o padrão, sem perder o que diferencia |
| 4 | Nome do repositório | `nandomoreira.dev` | O nome carrega redirect de um repo privado e arquivado, sem tráfego externo |
| 5 | Tools do MCP | `get_profile`, `list_projects`, `get_project`, `get_resume`, `check_availability` | Cobre o que um agente pergunta sem criar superfície de escrita |
| 6 | Destino da notificação de contratação | Firestore mais e-mail | Persistência sobrevive a falha de entrega |
| 7 | Proteção do `/api/hire` | Zod estrito, limite de tamanho, honeypot e contador por instância | Proporcional ao abuso realista de um site pessoal, sem infra nova |
| 8 | Estrutura da home | Prova primeiro | Coerente com o CTA primário escolhido |
| 9 | Definition of Done de conteúdo | 8 cases, 2 por bloco | Cobre os quatro blocos e mantém a escrita factível |
| 10 | Estratégia de cutover | Staging primeiro | Publicar MCP quebrado no domínio principal derrubaria justamente o argumento central |
| 11 | Conjunto de documentos | BRIEF, PRD, MVP-SCOPE, DESIGN-GUIDELINES | LANDING-PAGE-SPEC seria duplicação: a home está aqui |
| 12 | Serviços anunciados | Tooling com agentes, produtos com IA, frontend e performance, engenharia de dados | Cada um com case que o comprove |

---

## References

### Referência de objetivo

- `rubenmarcus.dev` e `github.com/rubenmarcus/portfolio` — Astro 5, Svelte 5, Three.js, i18n. Camada de agentes com `/api/mcp`, `/api/hire`, `/api/resume.json`, `llms.txt`. **A referência é de objetivo, não de forma:** ele vende consultoria com escopo fechado e tem 22 artigos como motor de citação, enquanto aqui o CTA é vitrine e o acervo de artigos é zero.

### Acervo próprio verificado

- Perfil: 99 repos próprios, 476 followers, 964 estrelas somadas, conta desde 2012
- Ferramental de IA: `forja` (11 estrelas), framework `.claude`, `amnesia-claude-code`, `devkit-claude-plugins`
- Produtos com IA: `bragstack.app` (Claude Haiku), `portfoliosnap.app` (Gemini), `mousai.gallery`
- Sistemas: `tumodori` (crates.io, 58 downloads), `hypr-switcher`, `flipclock-app`
- Legado de maior tração: `end2end` (276 estrelas, 190 forks), `simplest` (130), `nandomoreira-jekyll-theme` (101), `dotX` (90)

### Protocolo

- Revisão 2026-07-28 do MCP: remove `initialize`, elimina sessões, exige `Mcp-Method` e `Mcp-Name`, e `ttlMs` nos endpoints de listagem. Em release candidate na data desta especificação
