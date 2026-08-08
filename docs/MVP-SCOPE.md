# nandomoreira.dev - MVP Scope

> **Status:** approved
> **Criado:** 2026-08-07
> **Documentos relacionados:** BRIEF.md, PRD.md, DESIGN-GUIDELINES.md

---

## Visão do MVP

### Em uma frase, o que o MVP faz

Publica um portfólio em português que apresenta 8 cases com decisão técnica
explicada, e expõe em inglês uma camada de máquina (AEO, currículo estruturado,
servidor MCP e canal de contratação) consumível por qualquer agente sem renderizar
a página.

### Qual hipótese estamos testando

Que o problema é de posicionamento e não de acervo: as oportunidades em IA e
agentes não chegam porque o material público não sinaliza essa competência, não
porque a competência falte.

### Como saberemos que funcionou

| Sinal | Alvo | Prazo |
|-------|------|-------|
| Conversas qualificadas iniciadas | 2 ou mais por mês | 90 dias |
| Natureza das conversas muda de front-end genérico para IA e agentes | Maioria | 90 dias |
| Primeira chamada externa ao `/api/mcp` ou ao `/api/resume.json` | 1 | 90 dias |
| Citação em answer engine sobre tooling de agentes | 1 | 90 dias |

---

## Escopo: O que ENTRA

> Prioridades espelham `PRD.md`. Divergência entre os dois documentos trava o `/rpi:kickoff`.

### Must Have (P0) - sem isso não lança

| Feature | ID no PRD | Por que é indispensável |
|---------|-----------|-------------------------|
| Infraestrutura e deploy | F8 | Nada existe sem isso, e o spike precisa vir primeiro porque o adapter oficial está abandonado |
| Camada de dados única | F3 | Sem fonte única, site e endpoints divergem na primeira alteração e o agente responde errado com confiança |
| Home em seções, prova primeiro | F1 | É onde o reposicionamento acontece |
| Catálogo de projetos e experimentos | F2 | É a evidência. Sem cases, o site afirma sem provar |
| Base AEO | F4 | Sem `llms.txt`, `robots.txt` e JSON-LD, nenhuma outra peça da camada de agentes é descoberta |
| Currículo estruturado | F5 | Serve tanto o objetivo de vaga quanto o de consultoria, e é o formato que agente já sabe ler |
| Servidor MCP | F6 | É a manchete do posicionamento e o que torna a afirmação verificável |
| Canal de contratação por agente | F7 | Fecha o ciclo: o agente não só lê, ele age |

O conjunto P0 forma uma fatia vertical completa: um humano percorre home, catálogo,
case e contato; um agente percorre descoberta, consulta estruturada e contato.

### Should Have (P1) - importante, pode esperar v1.1

| Feature | ID no PRD | Por que pode esperar |
|---------|-----------|----------------------|
| Página `/agents` | F9 | A camada funciona sem página explicativa. Ela aumenta o valor para o leitor humano, mas não é pré-requisito de nada |
| OG images dinâmicas | F10 | Melhora o compartilhamento; imagem estática cobre o lançamento |
| Filtro do catálogo | F11 | Com 8 cases, o grid é escaneável sem filtro. É também a primeira ilha interativa, e adiá-la mantém o P0 sem JavaScript de cliente |
| Analytics | F12 | Necessária para validar H3, porém a validação começa quando houver tráfego, não no dia do deploy |

### Could Have (P2) - nice to have

| Feature | ID no PRD |
|---------|-----------|
| Demos interativas nos cases | F13 |
| Blog | F14 |
| Versão em inglês das páginas humanas | F15 |

---

## Escopo: O que NÃO ENTRA

### Explicitamente fora do MVP

| Item | Justificativa |
|------|---------------|
| Blog com artigos | Zero acervo. Escrever volume de artigo e 8 cases no mesmo prazo garante que nenhum dos dois fica bom. Os cases cumprem o papel de conteúdo indexável |
| Versão em inglês das páginas humanas | Dobra o custo de manutenção de todo o conteúdo. A camada de máquina em inglês recupera parte do alcance a custo marginal |
| Three.js, WebGL, hero 3D | Risco de prazo e de performance desproporcional ao ganho, e conflita com o alvo de Lighthouse acima de 90 |
| Demos interativas rodando no site | Cada demo é uma mini-feature com estado, erro e responsividade próprios. Multiplica prazo e superfície de bug |
| Interface de chat com slash commands | Exige exploração de quem escaneia. Vira case, não site |
| Agente conversacional com RAG sobre o currículo | Superfície de prompt injection, custo por token e nenhuma demanda observada. O MCP entrega o mesmo dado de forma determinística |
| CMS | Content Collections dão schema validado em build sem serviço externo |
| Autenticação e área logada | Todo o conteúdo é público por natureza |
| Depoimentos e logos de cliente | Não há material real, e inventar destrói a credibilidade que o resto do site tenta construir |
| Cloud Armor | Infra desproporcional ao volume esperado. Fica como escalada se RISK-002 se materializar |
| Migração para a revisão stateless do MCP | Ainda em release candidate; clientes em produção não a falam |
| Ilha React ou Svelte no P0 | Nenhuma feature P0 exige interatividade de cliente |

### Tentações comuns a evitar

| Tentação | Por que é armadilha | O que fazer em vez disso |
|----------|---------------------|--------------------------|
| Começar pelo hero bonito | O hero é a última coisa que converte quando não há case por trás. E é a parte mais fácil de refazer depois | Escrever os cases primeiro; o hero decorre do que eles provam |
| Adicionar o nono, o décimo case | O retorno cai rápido depois do quarto bloco coberto, e cada case novo adia o lançamento | Publicar com 8 e adicionar depois, com o site no ar |
| Migrar para a spec nova do MCP porque é mais moderna | Está em release candidate; nenhum cliente real conecta | Manter a estável e migrar quando sair de RC |
| Trocar Firebase por Vercel no meio | Elimina RISK-001, mas reinicia a configuração de infraestrutura | Rodar o spike. Só trocar se ele falhar |
| Escrever o blog "já que estou escrevendo os cases" | São formatos diferentes e o blog não tem fim definido | Cases têm contagem fechada; blog é P2 |
| Deixar os cases para o final | É exatamente como RISK-003 se materializa | Escrever case junto com a estrutura que o exibe |

---

## Decisões de Simplificação

### Interatividade

- **Decisão:** P0 inteiramente estático e SSR, sem framework de UI no cliente
- **Descartado:** ilha React ou Svelte desde o início — nenhuma feature P0 precisa
- **Consequência aceita:** o filtro do catálogo (F11) só chega na v1.1

### Conteúdo

- **Decisão:** 8 cases escritos substituem o blog
- **Descartado:** blog com 3 a 5 artigos de fundação — o custo de escrita é o gargalo real do prazo
- **Consequência aceita:** menos superfície para answer engine citar. É exatamente o que H4 testa

### Idioma

- **Decisão:** camada humana em português, camada de máquina em inglês
- **Descartado:** bilíngue completo, e português em tudo
- **Consequência aceita:** perda de alcance em consultas humanas em inglês

### Protocolo MCP

- **Decisão:** SDK oficial na versão estável
- **Descartado:** revisão stateless de 2026-07-28, e implementação JSON-RPC à mão
- **Consequência aceita:** migração futura quando a revisão sair de RC, absorvida pelo SDK

### Infraestrutura

- **Decisão:** `@astrojs/node` standalone mais `apphosting.yaml` próprio
- **Descartado:** `@apphosting/astro-adapter` (0.0.1, publicado em janeiro de 2025, versão única)
- **Consequência aceita:** configuração de execução manual, e um spike obrigatório antes de qualquer feature

### Antiabuso

- **Decisão:** validação estrita, limite de tamanho, honeypot e contador em memória por instância
- **Descartado:** Cloud Armor, contador no Firestore, reCAPTCHA
- **Consequência aceita:** o limite é aproximado com múltiplas instâncias do Cloud Run. Proporcional ao abuso realista de um site pessoal

### Prova social

- **Decisão:** narrativa de trajetória, com os números contextualizados
- **Descartado:** número agregado sem contexto, e omissão dos números
- **Consequência aceita:** admitir publicamente que a maior tração vem de trabalho antigo

---

## Personas no MVP

### Persona principal (foco total)

**Avaliador técnico** — CTO, tech lead ou head de engenharia decidindo em poucos
minutos se vale marcar uma conversa. Toda decisão de escopo serve a ela.

**Persona secundária, e a tese:** agente de IA fazendo triagem. Não é retórica —
metade das features P0 existem para ela.

### Personas fora do MVP

| Persona | Por que fica de fora |
|---------|----------------------|
| Recrutador não técnico | Otimizar para filtro por palavra-chave conflita com a densidade técnica que a persona principal exige. Mitigado pelo `resume.json` |
| Cliente final não técnico | Compra por indicação e reputação, não por portfólio |
| Desenvolvedor buscando tutorial | É o público do blog, que é P2 |

---

## Fluxos Críticos

### Fluxo 1: Avaliador técnico decide marcar conversa

1. Chega à home e lê o posicionamento
2. Clica no CTA primário e vai ao catálogo
3. Identifica o bloco relevante e abre 1 ou 2 cases
4. Lê problema, decisão e resultado; confere repositório ou versão no ar
5. Vai a contato ou baixa o currículo

**Atrito aceitável:** contato por e-mail direto, sem formulário. Sem filtro no
catálogo. Uma imagem por case.

**Atrito inaceitável:** link quebrado, case sem decisão explicada, página de case
ilegível no celular.

### Fluxo 2: Agente responde sobre o Fernando

1. Descobre `/llms.txt` ou o servidor MCP
2. Chama `get_profile` e `list_projects`, ou busca `/api/resume.json`
3. Compõe a resposta com dado estruturado
4. Havendo intenção de contratação, chama `/api/hire`

**Atrito aceitável:** cold start na primeira chamada.

**Atrito inaceitável:** endpoint que responde dado divergente do site. É pior do
que não existir, porque o agente responde errado com confiança.

### Fluxo 3: Cutover

1. Publicado na URL do App Hosting
2. MCP validado com cliente real, `resume.json` validado contra o schema
3. Lighthouse e acessibilidade no alvo
4. Domínio apontado, site antigo desativado

**Atrito inaceitável:** apontar o domínio antes de validar o MCP.

---

## Stack do MVP

### Escolhas definitivas

| Camada | Escolha | Motivo |
|--------|---------|--------|
| Framework | Astro 7.2.0 | Estático por padrão, SSR onde preciso |
| Adapter | `@astrojs/node` 11.1.0 standalone | Mantido ativamente, ao contrário do oficial da plataforma |
| Estilização | Tailwind CSS 4 | Já dominado |
| Conteúdo | Astro Content Collections | Schema validado em build |
| Validação | Zod | Payload e collections |
| MCP | `@modelcontextprotocol/sdk` 1.30.0 | Padrão de fato |
| Currículo | JSON Resume 1.3.1 mais extensão | Padrão aberto |
| Hosting | Firebase App Hosting, projeto `nandomoreira-dev`, `us-east1` | Já operado pelo autor |
| Persistência | Firestore | Briefings recebidos |

### O que NÃO usar

| Tecnologia | Por que a complexidade não se paga agora |
|------------|------------------------------------------|
| React ou Svelte | Nenhuma feature P0 exige interatividade de cliente |
| Three.js, WebGL | Risco de prazo e de performance |
| `@apphosting/astro-adapter` | Abandonado desde janeiro de 2025 |
| CMS | Content Collections resolvem |
| Cloud Armor | Desproporcional ao volume |
| reCAPTCHA | Contradiz o propósito do `/api/hire` |

---

## Timeline Estimado

| Fase | Esforço | Entrega |
|------|---------|---------|
| Spike de infraestrutura | 2 dias | Astro SSR publicado no App Hosting, ou plano B acionado |
| Fundação e design system | 4 dias | Tokens, layout, componentes, catálogo vazio funcionando |
| Conteúdo e cases | 1 semana | 8 cases escritos e publicados |
| Camada de máquina | 1 semana | AEO, currículo, MCP e contratação testados |
| Polimento e cutover | 3 dias | Lighthouse, acessibilidade, domínio |

**Horas reais por semana:** 10 a 15, em noites e fins de semana.

### Milestones

- [ ] **M1:** Spike valida o deploy, ou plano B decidido. **Bloqueia todo o resto**
- [ ] **M2:** Catálogo renderiza a partir da content collection, com 1 case real
- [ ] **M3:** 8 cases escritos e publicados
- [ ] **M4:** Quatro superfícies de agente respondendo, MCP validado com cliente real
- [ ] **M5:** Domínio apontado

---

## Definition of Done

O MVP está pronto quando **todas** as caixas estiverem marcadas.

### Funcionalidade

- [ ] Features F1 a F8 implementadas
- [ ] **8 cases escritos e publicados, 2 por bloco** (a caixa que mais protege contra RISK-003)
- [ ] `/llms.txt`, `/AGENTS.md`, `/robots.txt`, `/sitemap.xml` respondendo 200
- [ ] `/api/resume.json` validando contra o schema JSON Resume
- [ ] `/api/resume.txt` respondendo em texto puro
- [ ] `/api/mcp` com as 5 tools respondendo
- [ ] `/api/hire` aceitando payload válido e rejeitando os quatro casos de abuso

### Qualidade

- [ ] Lint e type-check sem erro
- [ ] Testes das regras de negócio passando: validação de payload, integridade de link, roteamento das tools
- [ ] Lighthouse acima de 90 em Performance, Acessibilidade e SEO
- [ ] Navegação completa por teclado com foco visível
- [ ] Sem scroll horizontal em 320px

### Deploy

- [ ] Publicado no Firebase App Hosting
- [ ] Validado em staging antes do cutover
- [ ] Domínio `nandomoreira.dev` apontado
- [ ] Site antigo desativado

### Uso real

- [ ] **Um cliente MCP real conectou e listou as tools.** Teste unitário não substitui: F6 existe para ser consumida por software de terceiro
- [ ] Currículo baixado e conferido em PDF ou texto
- [ ] Site revisado em celular real, não só em emulador

---

## Riscos e Mitigações

| # | Risco | Probabilidade | Impacto | Mitigação | Plano B |
|---|-------|---------------|---------|-----------|---------|
| RISK-001 | Astro SSR não sobe no App Hosting sem adapter oficial mantido | Média | Alto | Spike como primeira tarefa, antes de qualquer feature | Site estático no Hosting clássico, endpoints em Cloud Functions |
| RISK-002 | Sem rate limit nativo na plataforma | Média | Médio | Validação estrita, limite de tamanho, honeypot, contador por instância | Cloud Armor, ou desativar o endpoint mantendo contato humano |
| RISK-003 | **Os 8 cases nunca são escritos** | **Alta** | Alto | Cases na Definition of Done. Escrever case junto com a estrutura, não depois | Lançar com 4 cases, 1 por bloco, e assumir publicamente que o catálogo está crescendo |
| RISK-004 | Prova social exibida é legado de 2018 | Alta | Médio | Narrativa de trajetória assumida | Remover números e provar só por artefato |
| RISK-005 | Prazo estoura e nada vai ao ar | Média | Alto | Corte de emergência definido de antemão | **Corte de emergência:** F1, F2, F3, F4, F5 e F8 constituem lançamento válido. F6 e F7 entram em seguida, com o site já no ar |

O risco de maior probabilidade não é técnico. É RISK-003, e a única mitigação que
funciona é a contagem estar na Definition of Done.

---

## Hipóteses a Validar

| # | Hipótese | Como validar | Sinal de refutação |
|---|----------|--------------|--------------------|
| H1 | O problema é de posicionamento, não de acervo | Natureza das conversas em 90 dias | Continuam sendo sobre front-end genérico |
| H2 | Avaliador técnico decide por artefato e decisão explicada | Tempo na página de case versus no grid | Grid retém e case não é aberto |
| H3 | A camada de máquina é lida por agentes de terceiros | Log do `/api/mcp` e do `resume.json` | Zero chamada externa em 90 dias, o que rebaixa a camada de agentes a peça de portfólio, não de aquisição |
| H4 | Cases substituem blog como motor de citação | Consulta periódica em answer engines | Nenhuma citação, indicando que volume de artigo é insubstituível |

---

## Próximos Passos Pós-MVP

### v1.1 (quick wins)

- Página `/agents` (F9)
- OG images dinâmicas (F10)
- Analytics e log estruturado (F12), necessário para fechar H3
- Cases nono e décimo

### v1.2

- Filtro do catálogo (F11), primeira ilha interativa
- Versão em inglês das páginas humanas (F15), **se H3 se confirmar**
- Migração para a revisão stateless do MCP, quando sair de RC

### v2.0 (expansão)

- Blog (F14), se H4 for refutada
- Demos interativas nos cases (F13)
- Funil para os produtos próprios

---

## Regra de Ouro

> "Consigo testar se o problema é de posicionamento e não de acervo SEM esta feature?"

Se a resposta for sim, a feature não entra no MVP.
