---
slug: como-criar-claude-project-produtivo
title: "Como criar um Claude Project produtivo usando o próprio Claude: Guia passo a passo"
summary: "Tutorial completo de como usar o Claude para gerar suas próprias custom instructions e knowledge base. Do zero ao projeto funcionando em 30 minutos, com prompts prontos."
date: "2026-02-04"
markers:
  - claude
  - produtividade
art: mosaic
---
Se você já tentou usar Claude Projects, provavelmente passou pela mesma frustração que eu: abrir o projeto, olhar para a tela em branco de "Custom Instructions" e pensar "o que diabos eu escrevo aqui?".

Depois de criar vários projetos (alguns ótimos, outros completamente inúteis), descobri algo irônico mas genial: **a melhor forma de configurar um Claude Project é usando o próprio Claude para isso**.

Não estou falando de copiar templates genéricos da internet. Estou falando de um processo estruturado onde você usa Claude para:

- Gerar suas custom instructions personalizadas
- Criar toda a sua knowledge base
- Construir ferramentas e geradores de artefatos (PPP, Brag Docs, etc)
- Validar se está funcionando
- Refinar até ficar perfeito

Neste artigo, vou te mostrar exatamente como fazer isso. Com prompts prontos para copiar, exemplos reais dos meus projetos, e um processo que você replica em 30 minutos.

## Por que Claude Project (e não só conversar com Claude)?

Antes de começar, vale entender a diferença:

**Chat normal com Claude:**

- Começa do zero toda vez
- Você precisa reexplicar contexto
- Sem memória entre conversas
- Genérico

**Claude Project:**

- Context window de 200K tokens (equivalente a 500 páginas)
- Custom instructions que aplicam em TODAS as conversas
- Knowledge base persistente (upload de documentos)
- Claude "lembra" de você e do seu trabalho
- Compartilhável com time (planos Team/Enterprise)

Na prática, é a diferença entre ter um assistente que você precisa treinar toda vez vs. ter um colega sênior que conhece todo o seu contexto.

## O processo em 6 passos

Vou te mostrar o processo completo que uso. Cada passo tem o prompt exato que você vai usar.

### PASSO 1: Criar o projeto base

1. Acesse [claude.ai](https://claude.ai)
2. Clique em "Projects" na sidebar
3. Clique em "New Project"
4. Dê um nome descritivo (ex: "Blog Técnico A's Code", "Projeto SaaS XYZ", "Gerenciamento Pessoal")

**Dica de nomenclatura:** Use nomes que deixem claro o propósito. Evite "Projeto 1" ou "Teste". Quando você tiver 10 projetos, vai agradecer.

### PASSO 2: Gerar Custom Instructions com Claude

Aqui está o segredo: **não tente escrever instruções do zero**. Use Claude para criar instruções customizadas para você através de perguntas.

Abra uma conversa **no projeto que acabou de criar** e cole este prompt:

```
Vou configurar este Claude Project para ser meu assistente de [OBJETIVO].

Me ajude a criar custom instructions efetivas seguindo este processo:

1. Me faça 8-10 perguntas estratégicas sobre:
   - Quem sou e o que faço profissionalmente
   - Objetivo específico deste projeto
   - Tom e estilo de comunicação que prefiro
   - Tipo de outputs que vou pedir (artigos, código, análises, etc)
   - Contexto importante sobre meu trabalho/área
   - Formatos e estruturas que prefiro
   - O que NÃO fazer (restrições)

2. Baseado nas minhas respostas, gere custom instructions
   estruturadas, específicas e práticas que você seguirá
   em TODAS as conversas deste projeto.

3. Estruture as instruções em seções claras:
   - Contexto (quem sou, o que faço)
   - Objetivo do projeto
   - Como você deve se comportar
   - Formatos e outputs preferidos
   - Restrições e evitar

Faça a primeira pergunta.
```

**O que vai acontecer:**

Claude vai fazer perguntas como:

- "Qual é sua área de atuação principal?"
- "Que tipo de conteúdo você cria? Artigos técnicos, tutoriais, casos de uso?"
- "Prefere tom mais formal ou conversacional?"
- "Seus artigos têm tamanho médio de quantas palavras?"

Responda honestamente. Quanto mais específico, melhor.

**Exemplo real do meu projeto de blog:**

Quando criei o projeto "Blog A's Code", Claude me perguntou:

*"Você prefere artigos mais teóricos ou baseados em experiências práticas?"*

Minha resposta: "Experiências práticas. Priorizo cases reais, projetos que fiz, problemas que resolvi, com números e resultados. Teoria só quando necessário para contextualizar."

Isso foi direto para as custom instructions e agora todo artigo que peço vem com essa abordagem.

Depois de responder todas as perguntas, Claude vai gerar algo assim:

```markdown
# Custom Instructions - Blog Técnico A's Code

## Contexto
Você está assistindo Fernando Moreira, desenvolvedor full-stack em São Paulo.
Stack principal: React, Next.js, Svelte, Bun, Node.js, TypeScript.
Foco: SaaS, Micro-SaaS, desenvolvimento assistido por IA.

## Objetivo do Projeto
Criar artigos técnicos de alta qualidade para o blog da A's Code.
Público-alvo: desenvolvedores intermediários a sênior interessados
em desenvolvimento moderno e produtividade com IA.

## Como você deve se comportar
- Tom: Técnico mas acessível, em primeira pessoa
- Sempre pesquisar informações atuais antes de escrever
- Priorizar cases e experiências reais sobre teoria
- Incluir exemplos de código práticos e testados
- Balancear listas com prosa natural

## Outputs preferidos
- Artigos: 1500-3000 palavras
- Sempre gerar como arquivo .md para download
- Incluir meta description e tags SEO
- Code snippets com comentários úteis

## Restrições
- Não usar listas excessivas (máximo 5 itens seguidos)
- Evitar tom professoral ou condescendente
- Não explicar conceitos muito básicos (assume conhecimento intermediário)
- Nunca entregar artigo sem antes criar outline para aprovação
```

**Copie isso**, cole na seção "Custom Instructions" do projeto, e salve.

### PASSO 3: Gerar Knowledge Base com Claude

Agora vamos criar os documentos que vão ficar permanentemente no projeto.

Use este prompt na **mesma conversa**:

```
Ótimo! Agora vamos criar a knowledge base.

Baseado no projeto que configuramos, me ajude a criar
documentos estratégicos para a knowledge base:

1. Liste os 5-7 documentos essenciais que devo criar
2. Para cada documento, explique brevemente o que deve conter
3. Me dê os documentos na ordem de prioridade

Depois vamos gerar o conteúdo de cada um.
```

Claude vai sugerir algo como:

```
Documentos essenciais para seu projeto:

1. **author-context.md** - Informações sobre você e a empresa
2. **writing-profile.md** - Perfil detalhado de escrita e preferências
3. **project-instructions.md** - Processos e workflows
4. **article-templates.md** - Templates de estruturas de artigos
5. **tech-stack.md** - Tecnologias que você usa e versões

Qual deles quer que eu gere primeiro?
```

Agora vem a mágica: **peça para gerar cada arquivo**:

```
Gere o conteúdo completo do arquivo "author-context.md"
em formato Markdown, pronto para eu fazer download.
```

Claude vai criar um arquivo completo. **Faça download** (ele usa a ferramenta `create_file` e `present_files`) e **faça upload na Knowledge Base** do projeto.

Repita para cada documento.

**Dica importante:** Mantenha arquivos focados. Um arquivo para contexto, outro para processos, outro para exemplos. Isso ajuda o sistema de RAG (Retrieval-Augmented Generation) do Claude a encontrar informações relevantes.

### PASSO 4: Criar Ferramentas e Geradores de Artefatos

Aqui é onde o projeto fica REALMENTE poderoso. Você pode criar "ferramentas" que geram artefatos específicos sempre que precisar.

Vou te mostrar 4 ferramentas que criei e uso semanalmente:

#### Ferramenta 1: Gerador de PPP (Progress, Problems, Plan)

Adicione este documento à knowledge base: `ppp-generator.md`

```markdown
# PPP Generator - Progress, Problems, Plan

## O que é
Framework semanal para documentar progresso, problemas e planejar próximos passos.

## Como gerar

Quando eu pedir "gere meu PPP semanal" ou "crie PPP", siga este formato:

### Progress (O que avançou)
- Liste 3-5 conquistas da semana
- Inclua métricas quando possível
- Destaque wins técnicos e de produto

### Problems (O que travou/preocupa)
- Liste 2-4 desafios atuais
- Seja específico sobre bloqueios
- Identifique se é técnico, processo ou recurso

### Plan (Próxima semana)
- 3-5 prioridades principais
- Metas claras e mensuráveis
- Dependências identificadas

## Formato de Output
- Markdown estruturado
- Bullets concisos (1 linha cada)
- Datas e métricas quando aplicável
- Pronto para copiar para Notion/Slack

## Exemplo de uso
User: "gere meu PPP"
Claude: [faz perguntas sobre a semana e gera PPP formatado]
```

Agora, sempre que você escrever "gere meu PPP", Claude vai criar um documento estruturado baseado em perguntas sobre sua semana.

#### Ferramenta 2: Gerador de Tarefas Semanais

`weekly-tasks-generator.md`:

```markdown
# Weekly Tasks Generator

## Objetivo
Transformar objetivos vagos em tasks acionáveis para a semana.

## Processo

Quando eu pedir "planeje minha semana" ou "tasks semanais":

1. Pergunte sobre:
   - Prioridades da semana
   - Deadlines fixos
   - Contexto de projetos em andamento
   - Energia disponível (quantidade de horas focadas)

2. Gere tasks seguindo:
   - Cada task = verbo de ação + resultado esperado
   - Estimativa de tempo em blocos de 2h
   - Prioridade (P0, P1, P2)
   - Dependências identificadas

3. Organize por dia, balanceando carga

## Formato de Output

## Segunda-feira (6h disponíveis)
- [ ] [P0] Implementar autenticação OAuth - 4h
- [ ] [P1] Revisar PR #123 - 1h
- [ ] [P2] Atualizar docs da API - 1h

## Terça-feira (8h disponíveis)
...

## Regras

- Máximo 6h de tasks deep work por dia
- Deixar buffer para imprevistos
- Agrupar tasks similares no mesmo dia
```

Agora você tem um planejador semanal que funciona.

#### Ferramenta 3: Gerador de Brag Documents

`brag-document-generator.md`:

```markdown
# Brag Document Generator

## O que é
Documento de conquistas para performance review, promoções, ou portfólio.

## Como usar

Quando eu pedir "crie brag document" ou "documente conquistas":

1. Pergunte sobre período (mensal, trimestral, anual)
2. Solicite contexto de projetos e achievements
3. Gere documento estruturado

## Estrutura do Output

### Projetos Liderados/Entregues
- Nome do projeto
- Impacto quantificável
- Stack técnica usada
- Desafios superados

### Melhorias e Iniciativas
- Otimizações implementadas
- Processos criados/melhorados
- Ferramentas introduzidas

### Crescimento Técnico
- Novas tecnologias aprendidas
- Certificações/cursos
- Mentoria fornecida

### Impacto no Negócio
- Métricas de performance
- Redução de custos
- Aumento de velocidade/qualidade

## Formato
- Bullets com resultados específicos
- Números sempre que possível
- Contexto técnico sem jargões
- Pronto para copiar para doc formal

## Exemplo
"Migrei aplicação para Next.js 15: reduziu tempo de build em 40%
(de 8min para 4.8min), melhorou Core Web Vitals em 25%,
impactando 50k usuários/mês"
```

Isso é OURO para quando você precisar documentar seu trabalho.

#### Ferramenta 4: Gerador de Daily Standup

`daily-standup-generator.md`:

```markdown
# Daily Standup Generator

## Objetivo
Criar standup notes consistentes e úteis.

## Formato

Quando eu pedir "gere daily" ou "standup hoje":

### Yesterday
- O que completei (2-3 items)
- Com links para PRs/tasks quando aplicável

### Today
- O que vou fazer (2-3 items prioritários)
- Foco principal do dia

### Blockers
- Bloqueios atuais (se houver)
- Ajuda necessária

## Estilo
- Conciso (máximo 5 linhas)
- Ação-oriented (verbos claros)
- Pronto para postar em Slack/Discord

## Exemplo Output

**Yesterday:**

- ✅ Completed OAuth integration (PR #234)
- ✅ Fixed pagination bug on dashboard

**Today:**

- 🎯 Implement WebSocket real-time updates
- 📝 Write API documentation

**Blockers:** None
```

Com essas 4 ferramentas na knowledge base, você tem um sistema de produtividade completo dentro do Claude Project.

**Como usar na prática:**

Você simplesmente escreve:

- "gere meu PPP"
- "planeje minha semana"
- "crie brag document do Q4"
- "daily de hoje"

E Claude gera os artefatos formatados, prontos para usar.

### PASSO 5: Testar e Refinar

Agora que tudo está configurado, vamos validar.

Use este prompt:

```
Vamos testar se o projeto está configurado corretamente.

Faça 3 perguntas diferentes que validam se você:
1. Entendeu meu contexto e objetivo
2. Está seguindo o tom e estilo corretos
3. Consegue acessar e usar a knowledge base

Depois me diga se alguma parte das instruções ou
documentos precisa ser ajustada.
```

Claude vai fazer perguntas como:

*"Baseado no seu perfil, entendo que você prefere artigos de 1500-3000 palavras focados em experiências práticas. Se eu fosse escrever sobre Next.js 15, deveria focar em um projeto real que você fez com essa versão, correto?"*

Se a resposta dele estiver alinhada, ótimo! Se não, ajuste as custom instructions.

**Teste prático:**

Peça algo que você realmente precisa:

```
Escreva um outline para um artigo sobre [tema que você quer]
```

Veja se:

- O tom está certo
- A estrutura faz sentido
- Ele referenciou informações da knowledge base
- Perguntou coisas relevantes antes de começar

Se algo estiver off, refine as instruções.

### PASSO 6: Manutenção e Evolução

Claude Project não é "configure e esqueça". Ele evolui com seu trabalho.

**Quando atualizar:**

✅ Seu trabalho mudou (nova stack, novo foco)
✅ Você descobriu padrões novos que funcionam
✅ Tecnologias/versões foram atualizadas
✅ Você identificou gaps no que Claude sabe

**Como versionar:**

Mantenha um arquivo `CHANGELOG.md` na knowledge base:

```markdown
# Changelog do Projeto

## 2026-02-07
- Adicionado gerador de PPP
- Atualizado tech stack (Bun 1.0.25)
- Refinado tom: menos formal, mais primeira pessoa

## 2026-02-01
- Setup inicial do projeto
- Custom instructions v1
- Documentos core criados
```

Isso ajuda a rastrear mudanças e reverter se necessário.

## Exemplo Completo: Meu Blog A's Code

Vou te mostrar exatamente como estruturei meu projeto real de blog.

**Custom Instructions:**

```markdown
Você é um assistente especializado em criar artigos técnicos
para o blog da A's Code.

PERFIL DO AUTOR:
- Fernando Moreira, desenvolvedor full-stack em São Paulo
- Stack: React, Next.js, Svelte, Bun, Node.js, TypeScript
- Foco: SaaS, Micro-SaaS, desenvolvimento assistido por IA

ESTILO DE ESCRITA:
- Tom: Técnico mas acessível
- Voz: Primeira pessoa (eu, meu, na minha experiência)
- Profundidade: Equilibrada (acessível mas com profundidade)
- Tamanho: Flexível conforme o tema (800-3000+ palavras)
- Código: Balanceado com conceitos

PRIORIDADES DE CONTEÚDO:
1. Cases e experiências reais de projetos
2. Artigos conceituais (Entendendo X)
3. Tutoriais práticos (Como fazer X)
4. Comparações e reviews (X vs Y)

PROCESSO DE CRIAÇÃO:
1. Sempre pesquisar (web_search) para validar informações atuais
2. Criar outline antes do artigo completo
3. Incluir exemplos de código práticos e testados
4. SEMPRE gerar o artigo final como arquivo .md para download

FORMATAÇÃO:
- Uso balanceado de listas, tabelas e prosa
- Code blocks com comentários úteis
- Headers hierárquicos (H2, H3)
- Links para documentação oficial

PÚBLICO-ALVO:
- Desenvolvedores full-stack (intermediário a sênior)
- Interessados em SaaS/Micro-SaaS
- Profissionais que querem melhorar produtividade com IA
```

**Arquivos na Knowledge Base (7 documentos):**

1. `project-instructions.md` - Processo detalhado de criação de artigos
2. `writing-profile.md` - Perfil de escrita completo com exemplos
3. `author-context.md` - Info sobre mim e a empresa
4. `article-templates.md` - Templates de estruturas (tutorial, case, conceitual)
5. `article-example-template.md` - Exemplo completo de artigo formatado
6. `tech-stack.md` - Tecnologias que uso, versões, preferências
7. `CHANGELOG.md` - Histórico de mudanças no projeto

**Resultado prático:**

Antes do projeto estruturado:

- 3-4 horas para criar um artigo
- Muito vai-e-vem para ajustar tom
- Esquecia de adicionar SEO
- Inconsistência entre artigos

Depois do projeto estruturado:

- 30-45 minutos para artigo completo
- Tom consistente desde a primeira versão
- SEO e meta description automáticos
- Qualidade consistente

**Economia real:** ~10 horas por semana que uso para criar conteúdo.

## Exemplo 2: Projeto de Desenvolvimento Next.js

Outro projeto que tenho: "SaaS Development - Next.js".

**Objetivo:** Assistente para desenvolver projetos SaaS com Next.js, TypeScript e Bun.

**Diferenças na estrutura:**

**Custom Instructions focadas em:**

- Seguir best practices de Next.js 15
- Usar App Router (não Pages Router)
- TypeScript strict mode
- Priorizar Server Components
- Testes com Jest + React Testing Library

**Knowledge Base (5 documentos):**

1. `project-architecture.md` - Estrutura de pastas, padrões, decisões arquiteturais
2. `code-style.md` - Convenções de código, ESLint rules, formatação
3. `tech-decisions.md` - Por que escolhi X em vez de Y (Zustand vs Redux, etc)
4. `common-patterns.md` - Patterns que uso: autenticação, forms, API routes
5. `troubleshooting.md` - Problemas comuns e soluções

**Integração com Claude Code:**

Este projeto funciona em conjunto com Claude Code no terminal:

- **Claude Project** (web): Planejamento, arquitetura, decisões de design
- **Claude Code** (CLI): Implementação, refactoring, debugging

Exemplo de workflow:

1. No Project: "Como devo estruturar autenticação com NextAuth.js e Prisma?"
2. Claude sugere arquitetura, mostra patterns da knowledge base
3. Copio a decisão/código sugerido
4. No Claude Code (terminal): Implemento com comandos específicos

Funciona muito bem separado assim.

## Prompts Prontos para Copiar

Aqui estão todos os prompts principais que você vai usar:

### 1. Prompt Inicial - Gerar Custom Instructions

```
Vou configurar este Claude Project para ser meu assistente de [SEU OBJETIVO].

Me ajude a criar custom instructions efetivas seguindo este processo:

1. Me faça 8-10 perguntas estratégicas sobre:
   - Quem sou e o que faço profissionalmente
   - Objetivo específico deste projeto
   - Tom e estilo de comunicação que prefiro
   - Tipo de outputs que vou pedir (artigos, código, análises, etc)
   - Contexto importante sobre meu trabalho/área
   - Formatos e estruturas que prefiro
   - O que NÃO fazer (restrições)

2. Baseado nas minhas respostas, gere custom instructions
   estruturadas, específicas e práticas que você seguirá
   em TODAS as conversas deste projeto.

3. Estruture as instruções em seções claras:
   - Contexto (quem sou, o que faço)
   - Objetivo do projeto
   - Como você deve se comportar
   - Formatos e outputs preferidos
   - Restrições e evitar

Faça a primeira pergunta.
```

### 2. Prompt para Knowledge Base

```
Baseado no projeto que configuramos, me ajude a criar
documentos estratégicos para a knowledge base:

1. Liste os 5-7 documentos essenciais que devo criar
2. Para cada documento, explique brevemente o que deve conter
3. Me dê os documentos na ordem de prioridade

Depois vamos gerar o conteúdo de cada um em Markdown.
```

### 3. Prompt para Gerar Cada Documento

```
Gere o conteúdo completo do arquivo "[NOME-DO-ARQUIVO].md"
em formato Markdown, pronto para eu fazer download.

O arquivo deve ser:
- Estruturado com headers claros
- Específico para este projeto
- Prático e acionável
- Com exemplos quando relevante
```

### 4. Prompt de Validação

```
Vamos testar se o projeto está configurado corretamente.

Faça 3 perguntas diferentes que validam se você:
1. Entendeu meu contexto e objetivo
2. Está seguindo o tom e estilo corretos
3. Consegue acessar e usar a knowledge base

Depois me diga se alguma parte das instruções ou
documentos precisa ser ajustada.
```

### 5. Prompt para Criar Ferramenta/Gerador

```
Crie um documento de "ferramenta" para a knowledge base
que me permite gerar [TIPO DE ARTEFATO].

O documento deve incluir:
- Nome e objetivo da ferramenta
- Como eu vou ativá-la (comando/frase)
- Processo que você vai seguir
- Perguntas que vai fazer
- Formato exato do output
- Exemplo de uso

Gere como arquivo .md para download.
```

## Checklist de Setup Completo

Use esta checklist para garantir que não esqueceu nada:

**Setup Inicial**

- [ ] Projeto criado no claude.ai/projects
- [ ] Nome descritivo e claro definido
- [ ] Primeira conversa aberta no projeto

**Custom Instructions**

- [ ] Prompt inicial executado
- [ ] Todas as perguntas respondidas
- [ ] Instruções geradas e revisadas
- [ ] Instruções coladas na seção "Custom Instructions"
- [ ] Instruções salvas

**Knowledge Base - Documentos Core**

- [ ] Lista de documentos essenciais definida
- [ ] `context.md` ou `author-context.md` criado e uploadado
- [ ] `instructions.md` ou `project-instructions.md` criado e uploadado
- [ ] `profile.md` ou perfil específico criado e uploadado
- [ ] Templates ou exemplos criados e uploadados

**Knowledge Base - Ferramentas (opcional mas recomendado)**

- [ ] Pelo menos 1 gerador de artefato criado
- [ ] Documentos de ferramentas uploadados
- [ ] Comandos/triggers testados

**Validação**

- [ ] Teste de validação executado
- [ ] 3 perguntas respondidas corretamente
- [ ] Tom e estilo validados
- [ ] Knowledge base acessível

**Teste Prático**

- [ ] Primeira tarefa real executada
- [ ] Resultado avaliado
- [ ] Ajustes finos feitos (se necessário)

**Manutenção**

- [ ] `CHANGELOG.md` criado na knowledge base
- [ ] Data de criação documentada
- [ ] Lembrete de review mensal configurado

## Armadilhas Comuns (e Como Evitar)

Erros que cometi (e vi outras pessoas cometerem):

### Erro 1: Custom Instructions Vagas

**Ruim:**

```
Seja profissional e útil.
Forneça respostas de qualidade.
```

**Bom:**

```
Tom: Técnico mas acessível, em primeira pessoa.
Sempre pesquisar com web_search antes de responder sobre tecnologias.
Artigos: 1500-2500 palavras, estrutura: intro + desenvolvimento + conclusão.
Código: sempre comentado, TypeScript preferido, ES modules.
```

**Por que importa:** Instruções vagas = respostas genéricas. Seja específico.

### Erro 2: Knowledge Base Duplicada

**Problema:** Informações repetidas em múltiplos arquivos.

Exemplo ruim:

- `context.md` tem sua stack tecnológica
- `tech-stack.md` tem sua stack tecnológica
- `profile.md` menciona sua stack tecnológica

**Solução:** Um arquivo, um propósito. Se a informação está em `tech-stack.md`, não repita em outro lugar. Apenas referencie: "Veja tech-stack.md para detalhes".

### Erro 3: Não Testar Antes de Usar em Produção

**O que acontece:** Você configura tudo, não testa, pede algo importante, e o resultado está completamente fora.

**Solução:** SEMPRE faça o teste de validação. Peça 2-3 tarefas reais pequenas antes de depender do projeto para algo crítico.

### Erro 4: Arquivos Muito Longos na Knowledge Base

**Problema:** Arquivo único com 10 mil palavras sobre tudo.

Isso confunde o sistema de RAG. Claude pode não encontrar a informação certa no momento certo.

**Solução:** Arquivos focados:

- `context.md` (500 palavras) - só contexto
- `instructions.md` (800 palavras) - só processos
- `tech-stack.md` (600 palavras) - só tecnologias

**Regra prática:** Se o arquivo passou de 2000 palavras, provavelmente deve ser dividido.

### Erro 5: Esquecer de Versionar Mudanças

**O que acontece:** Você ajusta instruções, algo para de funcionar, e não lembra o que mudou.

**Solução:** `CHANGELOG.md` é seu amigo. Sempre que ajustar algo significativo, documente:

```markdown
## 2026-02-10
- Ajustado tom: mais técnico, menos exemplos básicos
- Adicionado: sempre usar TypeScript strict mode
- Removido: explicações de conceitos fundamentais

## 2026-02-01
- Setup inicial
```

### Erro 6: Upload de Arquivos Errados

**Problema:** Fazer upload de arquivos em formatos que ocupam mais espaço que o necessário.

**Dados reais (mesmo conteúdo):**

- `.docx` = 3% do espaço
- `.pdf` = 3% do espaço
- `.md` = 3% do espaço
- `.html` = 6% do espaço (dobro!)

**Solução:** Prefira Markdown (`.md`). É o formato mais eficiente e Claude trabalha melhor com ele.

## Dicas Avançadas

Algumas coisas que aprendi com o tempo:

### 1. Use Nomenclatura Consistente

Todos os seus arquivos devem seguir um padrão:

```
✅ BOM:
- author-context.md
- project-instructions.md
- writing-profile.md
- article-templates.md

❌ RUIM:
- Context About Me.docx
- instructions_v2_final.pdf
- ProfileWriting.txt
- templates-UPDATED.md
```

Isso ajuda você a encontrar arquivos rapidamente E ajuda Claude a referenciar corretamente.

### 2. Referencie Arquivos nas Custom Instructions

Se você tem arquivos específicos na knowledge base, mencione eles:

```markdown
## Processo de Trabalho

Consulte `project-instructions.md` para o processo completo.
Consulte `article-templates.md` para estruturas prontas.
Consulte `writing-profile.md` para preferências de estilo.
```

Isso "aponta" Claude para onde procurar.

### 3. Crie Exemplos Concretos

Em vez de descrever o que você quer, mostre exemplos.

No meu `writing-profile.md`, tenho:

```markdown
## Tom - Exemplos

✅ BOM:
"Na minha experiência construindo SaaS, percebi que a escolha
entre Next.js e Remix impacta muito mais do que só performance."

❌ EVITAR:
"Neste artigo, será demonstrado de forma abrangente e metodológica
as diferenças arquiteturais entre frameworks modernos."
```

Um exemplo vale mais que 100 palavras de descrição.

### 4. Atualize Versões de Tecnologias

Se você trabalha com tecnologias específicas, mantenha versões atualizadas:

```markdown
# Tech Stack

## Frontend
- Next.js: 15.1.2 (atualizado em 2026-02-01)
- React: 19.0.0
- TypeScript: 5.7.2

## Backend
- Bun: 1.0.25 (preferido sobre Node.js)
- Prisma: 6.1.0
```

Sempre que você atualizar em seus projetos, atualize aqui também.

### 5. Use Projects para Contextos Diferentes

Não tente ter um "super projeto" que faz tudo. Crie projetos específicos:

- "Blog A's Code" - só criação de conteúdo
- "SaaS Development" - só desenvolvimento
- "Personal Management" - produtividade pessoal
- "Client Project X" - projeto específico de cliente

Cada um com suas próprias instruções e knowledge base.

## Integrando com Outras Ferramentas

### Claude Project + Claude Code

Como mencionei antes, uso separado:

**Claude Project (web):** Para pensar, planejar, decidir

- Arquitetura de features
- Decisões técnicas
- Escrita de documentação
- Criação de conteúdo

**Claude Code (CLI):** Para executar, implementar

- Escrever código
- Refactorings
- Debugging
- Testes

Workflow típico:

1. **No Project:** "Como devo implementar rate limiting na API?"
2. Claude sugere abordagem baseada em patterns da knowledge base
3. **No Claude Code:** `claude "implement rate limiting as discussed"`
4. Claude Code implementa seguindo decisão do Project

Funciona muito bem assim.

### Claude Project + Notion

Muita gente usa Notion para documentação. Você pode:

1. Exportar páginas relevantes do Notion como Markdown
2. Upload na knowledge base
3. Claude tem contexto de toda sua documentação

Quando algo muda no Notion, re-exporte e substitua o arquivo.

### Claude Project + GitHub

Para projetos de desenvolvimento, útil ter na knowledge base:

- `README.md` do repositório
- `CONTRIBUTING.md` se tiver
- Principais `docs/` em Markdown

Sempre que push mudanças significativas na documentação, atualize no Project.

## Métricas para Acompanhar Efetividade

Como saber se seu Claude Project está funcionando bem?

**Métricas que acompanho:**

1. **Tempo de setup de contexto**
   - Antes: 5-10 minutos explicando contexto
   - Depois: 0 minutos, Claude já sabe
   - ✅ Redução de 100%

2. **Iterações até resultado aceitável**
   - Antes: 3-5 rodadas de ajustes
   - Depois: 1-2 rodadas
   - ✅ Redução de 60%

3. **Consistência de output**
   - Antes: Muito variável
   - Depois: Consistente 90% das vezes
   - ✅ Melhoria significativa

4. **Tempo total de tarefa**
   - Exemplo: Artigo de blog
   - Antes: 3-4 horas
   - Depois: 30-45 minutos
   - ✅ Redução de 80%

**Como medir:** Mantenha um log simples por 2 semanas:

```markdown
# Métricas Claude Project

## Semana 1 (antes)
- Artigo técnico: 3.5h
- Planejamento semanal: 45min
- Code review: 30min

## Semana 2 (depois do setup)
- Artigo técnico: 45min
- Planejamento semanal: 10min
- Code review: 15min
```

Se você não está vendo melhoria significativa, algo está errado. Revise suas instruções.

## Quando Criar Novo Project vs. Atualizar Existente

**Crie novo projeto quando:**

✅ Contexto completamente diferente

- Exemplo: Tinha projeto de "Blog", agora vai fazer "Desenvolvimento SaaS"

✅ Cliente diferente (se freelancer/agência)

- Cada cliente = projeto separado

✅ Fase completamente nova

- Exemplo: Projeto de "Pesquisa" vs. "Implementação"

✅ Conhecimento não transferível

- Stack totalmente diferente
- Público-alvo diferente

**Atualize projeto existente quando:**

✅ Evolução natural do trabalho

- Adicionou nova tecnologia ao stack
- Mudou preferências de estilo
- Descobriu novos patterns

✅ Refinamento de processos

- Melhorou workflows
- Adicionou ferramentas/geradores

✅ Correção de problemas

- Instruções não estavam claras
- Faltava contexto importante

**Regra prática:** Se 70%+ do contexto é o mesmo, atualize. Se menos de 50% é o mesmo, crie novo.

## Compartilhando Projects com Time

Se você tem plano Team ou Enterprise, pode compartilhar projetos.

**Casos de uso:**

1. **Time de conteúdo:** Todos usam mesmo "Content Creation Project"
   - Consistência de tom
   - Mesmos processos
   - Knowledge base compartilhada

2. **Time de dev:** "Engineering Standards Project"
   - Code style compartilhado
   - Arquitetura padronizada
   - Decisões técnicas documentadas

3. **Agência/Consultoria:** Project por cliente
   - Todo time tem contexto do cliente
   - Informações centralizadas
   - Onboarding mais rápido

**Como compartilhar:**

1. Abra o projeto
2. Clique em "Share project"
3. Adicione pessoas por email
4. Escolha permissão:
   - "Can use" - podem usar mas não editar
   - "Can edit" - podem modificar instruções e knowledge base

**Importante:** Quando você arquiva um projeto, todas as permissões de compartilhamento são resetadas (por segurança).

## Próximos Passos

Agora que você sabe o processo completo, recomendo:

**Hoje:**

1. Crie seu primeiro projeto pequeno
2. Use o "Prompt Inicial" para gerar instruções
3. Crie 2-3 documentos básicos na knowledge base
4. Faça o teste de validação

**Esta semana:**

1. Use o projeto para 2-3 tarefas reais
2. Documente o que funcionou e o que não funcionou
3. Refine instruções baseado no feedback

**Próximo mês:**

1. Crie geradores de artefatos (PPP, tasks, etc)
2. Adicione mais contexto relevante
3. Melhore documentação baseada em uso real
4. Considere criar segundo projeto para outro contexto

**Longo prazo:**

1. Mantenha CHANGELOG.md atualizado
2. Revise e limpe knowledge base mensalmente
3. Compartilhe com time (se aplicável)
4. Crie library de prompts específicos do seu domínio

## Recursos Adicionais

**Documentação Oficial:**

- [Claude Projects Help Center](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects)
- [Anthropic Documentation](https://docs.anthropic.com)

**Ferramentas Mencionadas:**

- [Claude.ai](https://claude.ai) - Interface web
- [Claude Code](https://code.claude.com) - CLI para desenvolvimento

**Inspiração para Geradores:**

- PPP (Progress, Problems, Plan) - Framework de Jeff Weiner (LinkedIn)
- Brag Documents - Julia Evans
- Standup Notes - Padrão Agile/Scrum

## Conclusão

Criar um Claude Project bem estruturado não precisa ser complicado. O segredo é usar o próprio Claude para:

1. Gerar suas custom instructions através de perguntas
2. Criar sua knowledge base documento por documento
3. Construir ferramentas e geradores customizados
4. Validar e refinar até funcionar perfeitamente

**O investimento:**

- 30-60 minutos de setup inicial
- 10-15 minutos de refinamento por semana

**O retorno:**

- 5-10 horas economizadas por semana
- Consistência em 90%+ dos outputs
- Contexto sempre preservado
- Ferramentas de produtividade prontas

A diferença entre ter um assistente genérico e ter um colega sênior que conhece todo seu trabalho é estruturar bem o Claude Project.

E agora você tem o processo completo para fazer isso.

Comece pequeno. Crie um projeto para um contexto específico. Use por uma semana. Refine. Depois escale para outros contextos.

Você vai se surpreender com o quanto de fricção isso elimina do seu trabalho com IA.

---

**Referências:**

- [Claude Projects Help Center](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects)
- [Anthropic Documentation](https://docs.anthropic.com)
- [Claude Code](https://code.claude.com)

---

*Este artigo foi publicado originalmente no blog da A's Code, em [ascode.com.br](https://ascode.com.br/blog/como-criar-claude-project-produtivo).*
