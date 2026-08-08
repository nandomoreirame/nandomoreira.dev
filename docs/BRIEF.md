# nandomoreira.dev - Brief

> **Status:** approved
> **Criado:** 2026-08-07
> **Atualizado:** 2026-08-07

---

## Problema (em uma frase)

O portfólio atual vende um "desenvolvedor web full-stack" genérico enquanto o
trabalho real dos últimos doze meses é construir ferramental de agentes de IA, e
é invisível para os agentes que hoje fazem a triagem inicial de candidatos e
fornecedores.

**Como foi descoberto:** auditoria do próprio acervo público. A bio do GitHub
(476 followers) não menciona IA nem agentes em nenhum ponto, enquanto os repos
mais recentes são `forja` (cliente GUI multi-CLI para Claude Code, Codex e Gemini),
o framework `.claude`, `amnesia-claude-code` e `devkit-claude-plugins`.

**Frequência da dor:** contínua. Cada visita a `nandomoreira.dev` e cada leitura
do perfil no GitHub reforça um posicionamento defasado.

**Custo de NÃO resolver:** oportunidades em IA e agentes não chegam, porque nada
no material público sinaliza essa competência. O acervo existe; a leitura dele não.

**Workaround atual:** explicar o posicionamento verbalmente, uma conversa por vez.
Não escala e depende de a conversa começar.

## Solução (em uma frase)

Um portfólio que é a própria demonstração do que ele afirma: escrito para humano
e para máquina, com currículo estruturado, servidor MCP e canal de contratação
consumíveis por qualquer agente sem renderizar a página.

## Público-Alvo

### Persona principal

| Campo | Valor |
|-------|-------|
| Quem é | Avaliador técnico: CTO, tech lead ou head de engenharia que decide se vale marcar uma conversa |
| Job to be done | Determinar em poucos minutos se esta pessoa resolve o problema de IA/agentes que ele tem agora |
| Define sucesso como | Ver artefato funcionando e decisão técnica explicada, não lista de tecnologias |
| Onde está hoje | LinkedIn, GitHub, indicação de terceiro, e cada vez mais um resumo produzido por ChatGPT ou Claude |
| Acesso para teste | Sim, via rede profissional e comunidade |

### Persona secundária (tese do produto)

| Campo | Valor |
|-------|-------|
| Quem é | Agente de IA ou answer engine fazendo triagem em nome de um humano |
| Job to be done | Extrair competências, disponibilidade e evidência de entrega em formato estruturado |
| Define sucesso como | Obter a resposta sem alucinar e sem depender de scraping de HTML |
| Onde está hoje | Consultando páginas que não foram feitas para ele |
| Acesso para teste | Sim, verificável com um cliente MCP real |

### Personas fora do escopo

- **Recrutador não técnico de agência** — otimizar para filtro por palavra-chave
  conflita com a densidade técnica que a persona principal exige.
- **Cliente final não técnico** — compra serviço por indicação e reputação, não
  por portfólio.

## Proposta de Valor

### Diferencial competitivo

O portfólio é construído com as mesmas ferramentas que ele demonstra, e expõe uma
superfície de máquina que a esmagadora maioria dos portfólios não tem: um servidor
MCP funcional, currículo em schema aberto e um endpoint de contratação validado.
A afirmação "construo sistemas com agentes" é verificável executando o próprio
site, não lendo sobre ele.

### Versus alternativas atuais

| Alternativa | Como resolve hoje | Limitação | Nossa resposta |
|-------------|-------------------|-----------|----------------|
| Portfólio dev tradicional | Grid de projetos com badges de stack | Nada para um agente consumir; badge não é evidência | Case com decisão técnica + endpoints estruturados |
| LinkedIn | Alcance e prova social | Formato uniforme, sem espaço para profundidade técnica | Página de case com problema, decisão e resultado |
| GitHub | Código é a evidência mais forte | Exige que o avaliador leia código para formar opinião | Curadoria com a narrativa que o repo não conta |
| `nandomoreira.dev-chat` (anterior) | Interface de chat com slash commands | Exige que o visitante descubra comandos; recrutador escaneia, não explora | Site em seções escaneável, chat vira case |

## Modelo de Negócio

**Fase atual:** projeto pessoal sem monetização direta.

O site não vende nada por si. Ele serve a três objetivos comerciais com hierarquia
explícita, porque três CTAs de peso igual não convertem nenhum:

1. **Vitrine do que construo** (CTA primário) — prova antes da oferta.
2. **Consultoria em IA e agentes** (secundário) — projetos de escopo fechado.
3. **Posição sênior CLT ou PJ** (secundário) — currículo e trajetória acessíveis.

**Fases futuras (a explorar):**

- Produtos próprios (`forja`, `bragstack`, `mousai`) usando o portfólio como funil
  de topo. Precisa que os produtos tenham onboarding público, o que hoje não têm.

## Métricas de Sucesso

### North Star Metric

**Conversas qualificadas iniciadas por mês:** 2 ou mais.

Qualificada significa: a outra parte já sabe o que eu faço e chega com um problema
concreto. Vale por qualquer canal, inclusive `/api/hire`. Esta métrica só sobe
quando o posicionamento funciona de verdade; visita e clique sobem sem que nada
tenha mudado.

### Métricas secundárias

| Métrica | Alvo | Como medir |
|---------|------|------------|
| Chamadas ao `/api/mcp` por agente externo | Primeira chamada não originada por mim | Log estruturado do endpoint |
| Citação em answer engine | Aparecer em 1 resposta sobre agentes/AI tooling BR | Consulta manual periódica |
| Cases publicados | 8 | Contagem no repositório |
| Tempo médio na página de case | Acima de 90s | Analytics |

## MVP Scope (resumo)

Detalhamento em `MVP-SCOPE.md`.

### Entra

- Site em seções com prova primeiro, 100% em português
- Catálogo de projetos com 8 cases escritos, cobrindo os quatro blocos do acervo
- Camada de máquina em inglês: `llms.txt`, `AGENTS.md`, `robots.txt`, JSON-LD, `sitemap.xml`
- Currículo estruturado em `/api/resume.json` e `/api/resume.txt`
- Servidor MCP em `/api/mcp` com quatro tools
- Canal de contratação por agente em `/api/hire`

### Não entra

- **Blog** — zero artigos de acervo; os cases cumprem o mesmo papel de conteúdo indexável
- **Versão em inglês das páginas humanas** — a camada de máquina, que é em inglês, cobre o alcance internacional a custo muito menor
- **Three.js, WebGL, hero 3D** — risco de prazo e de performance desproporcional ao ganho
- **Demos interativas rodando no site** — cada demo é uma mini-feature; multiplica prazo e superfície de bug
- **Agente conversacional com RAG sobre o currículo** — custo, risco de prompt injection e nenhuma demanda observada

## Timeline

| Fase | Duração | Entrega |
|------|---------|---------|
| Spike de infraestrutura | 2 dias | Astro SSR mínimo publicado no App Hosting, ou plano B acionado |
| Fundação e design system | 4 dias | Layout base, tokens, componentes, catálogo vazio funcionando |
| Conteúdo e cases | 1 semana | 8 cases escritos e publicados |
| Camada de máquina | 1 semana | AEO, resume, MCP e hire funcionando e testados |
| Polimento e cutover | 3 dias | Lighthouse, acessibilidade, domínio apontado |

**Horas reais disponíveis por semana:** 10 a 15, em noites e fins de semana.

## Riscos Principais

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| RISK-001 | Astro SSR não sobe no Firebase App Hosting sem adapter oficial mantido | Média | Alto | Spike de deploy como primeira tarefa, antes de qualquer feature. Plano B: site estático no Hosting clássico com endpoints em Cloud Functions |
| RISK-002 | `/api/hire` sem rate limit nativo na plataforma | Média | Médio | Validação estrita, limite de tamanho, honeypot e contador por instância. Cloud Armor fica como escalada |
| RISK-003 | Os 8 cases nunca são escritos e o site publica com placeholder | **Alta** | Alto | Cases fazem parte da Definition of Done. Sem os 8, não é lançamento |
| RISK-004 | Prova social exibida é legado Jekyll de 2018, não trabalho com IA | Alta | Médio | Narrativa de trajetória assumida explicitamente, em vez de número agregado sem contexto |
| RISK-005 | Prazo estoura e nada vai ao ar | Média | Alto | Corte de emergência definido: site e cases sem a camada de máquina ainda constituem lançamento válido |

## Hipóteses a Validar

| # | Hipótese | Como validar | Sinal de que está errada |
|---|----------|--------------|--------------------------|
| H1 | O problema é de posicionamento, não de acervo. As oportunidades em IA não chegam porque o material público não sinaliza a competência | Publicar e observar a natureza das conversas que chegam em 90 dias | Conversas continuam sendo sobre front-end genérico |
| H2 | Um avaliador técnico decide por artefato e decisão explicada, não por lista de tecnologias | Tempo na página de case versus tempo no grid | Grid retém e case não é aberto |
| H3 | A camada de máquina é lida de fato por agentes de terceiros | Log do `/api/mcp` e do `resume.json` com origem externa | Zero chamada externa em 90 dias, o que rebaixa a camada de agentes a peça de portfólio, não de aquisição |
| H4 | Cases substituem blog como motor de citação por answer engine | Consulta periódica em answer engines por temas dos cases | Nenhuma citação, indicando que volume de artigo é insubstituível |

## Links Úteis

- Repositório: `github.com/nandomoreirame/nandomoreira.dev` (a criar)
- Produção atual: `https://nandomoreira.dev` (Firebase Hosting, congelado desde 26/01/2026)
- Projeto Firebase: `nandomoreira-dev`, região `us-east1`
- Projeto anterior: `github.com/nandomoreirame/nandomoreira.dev-chat`
- Referência de objetivo: `https://www.rubenmarcus.dev` e `github.com/rubenmarcus/portfolio`

## Notas e Contexto Adicional

### O que é preservado e o que é descartado

Isto é uma reconstrução, não um projeto novo em terreno vazio.

| Ativo | Destino | Motivo |
|-------|---------|--------|
| `nandomoreira.dev-chat` (Next.js, chat com slash commands) | Descartado como site, **preservado como case** | Interface de comando exige exploração; a persona principal escaneia. O projeto continua sendo uma boa peça de portfólio |
| `svelte-nandomoreira.dev` (privado, arquivado, serve o domínio hoje) | Substituído no cutover | Congelado desde dezembro de 2025 |
| Repos legados Jekyll (`end2end` 276 estrelas, `simplest` 130, `nandomoreira-jekyll-theme` 101, `dotX` 90) | Incorporados à narrativa de trajetória | São a maior prova social real (cerca de 700 das 964 estrelas), e escondê-los seria desperdício; exibi-los sem contexto seria enganoso |
| Documentos estratégicos do projeto anterior | Não migrados | Descrevem outro produto |

### Sobre a decisão de publicar apenas em português

A camada humana é 100% em português e a camada de máquina é 100% em inglês. Isso
é deliberado e tem um custo conhecido: o mercado de IA e agentes, assim como as
consultas que geram citação em answer engine, opera majoritariamente em inglês.
A camada de máquina em inglês recupera parte desse alcance sem o custo de manter
duas versões de cada página. Se H3 se confirmar e o tráfego internacional
justificar, a tradução das páginas humanas é o primeiro item da v1.1.
