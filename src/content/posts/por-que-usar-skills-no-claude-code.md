---
slug: por-que-usar-skills-no-claude-code
title: "Por que usar Skills no Claude Code mudou completamente meu workflow"
summary: "Depois de 3 meses usando Claude Code com e sem skills, aprendi que a diferença não é só produtividade - é sobre trabalhar de forma completamente diferente."
date: "2026-01-22"
---
Se você já usou Claude Code por algumas semanas, provavelmente já passou por isso: você passa 10 minutos explicando pro Claude exatamente como você quer que ele revise seu código, quais padrões seguir, que tipo de feedback dar. Na próxima sessão? Você explica tudo de novo. E de novo. E de novo.

Eu fiz isso por dois meses antes de descobrir Skills. Quando finalmente entendi como funcionam, percebi que não era só sobre economizar tempo - era sobre trabalhar de uma forma completamente diferente.

Neste artigo, vou compartilhar minha experiência real usando Skills no Claude Code: o que mudou, os números que observei, e por que você deveria parar tudo e criar sua primeira skill hoje mesmo.

## O Problema que Ninguém Fala

Deixa eu te contar como era meu dia antes de usar Skills.

Eu tinha um prompt salvo no Notion chamado "Code Review Prompt". Toda vez que queria que o Claude revisasse meu código, eu:

1. Abria o Notion
2. Copiava o prompt (umas 15 linhas de instruções específicas)
3. Colava no Claude Code
4. Ajustava alguns detalhes do contexto
5. Finalmente recebia o feedback

Isso consumia cerca de 3-5 minutos **toda vez**. E o pior: como eu sempre ajustava o prompt, os resultados eram inconsistentes. Às vezes o Claude focava em performance, outras em segurança, dependendo de como eu tinha formulado as instruções naquele dia.

O problema real não era perder 5 minutos. Era a **falta de consistência** e a **carga mental** de lembrar exatamente como formular cada tipo de requisição.

## O que são Skills (de verdade)

Quando li sobre Skills pela primeira vez na documentação do Claude Code, a descrição era técnica demais. Falava sobre "progressive disclosure", "filesystem-based architecture", "YAML frontmatter". Nada disso me fez entender o valor real.

Então vou te explicar do jeito que eu gostaria que tivessem me explicado:

**Skills são manuais de instrução permanentes que o Claude carrega automaticamente quando precisa.**

É como ter um colega de equipe que você treinou uma vez e ele nunca mais esquece. Você explica uma vez como quer que code reviews sejam feitos, salva isso como uma skill, e pronto - todo código que você pedir pra revisar vai seguir exatamente aquele padrão.

### Como Funciona Tecnicamente (versão simplificada)

Quando você cria uma skill, você está criando uma pasta com um arquivo `SKILL.md` que tem duas partes:

1. **Metadados (frontmatter)**: Nome da skill e quando ela deve ser ativada
2. **Instruções**: O que o Claude deve fazer quando a skill for carregada

Por exemplo, minha skill de code review tem este frontmatter:

```yaml
---
name: code-review
description: Review code for security, performance, and best practices in Next.js/React projects
---
```

E o Claude sabe: "Quando o Fernando pedir pra revisar código Next.js, eu carrego essas instruções".

O truque mágico aqui é o **progressive disclosure**. Ao invés de carregar todas as suas instruções em todas as conversas (consumindo contexto desnecessariamente), o Claude só carrega a skill quando precisa dela.

### Skills vs Prompts vs Projects

Quando entendi essa tabela, tudo fez sentido:

| Característica | Prompts | Projects | Skills |
|---|---|---|---|
| **Persistência** | Você precisa repetir | Contexto mantido no projeto | Reutilizável entre projetos |
| **Quando usar** | Explorando ideias | Contexto específico de projeto | Workflows repetitivos |
| **Controle** | Manual toda vez | Sempre ativo no projeto | Ativa quando relevante |
| **Compartilhamento** | Copiar/colar | Específico do projeto | Portável e versionável |

A sacada: **Prompts são pra experimentar, Projects pra contexto, Skills pra workflows**.

## Minha Experiência Real - Os Números

Depois de 3 meses usando Skills consistentemente, fiz uma análise do meu tempo. Os números me surpreenderam.

### Antes das Skills (Setembro-Outubro 2025)

- **Tempo médio de setup por sessão**: 8 minutos
- **Sessões do Claude Code por semana**: ~25
- **Tempo gasto só em repetir contexto**: 3h20min/semana

### Depois das Skills (Novembro-Janeiro 2026)

- **Tempo médio de setup**: 30 segundos
- **Sessões por semana**: ~30 (aumento porque ficou mais fácil)
- **Tempo gasto em setup**: 15min/semana

**Economia real: ~3 horas por semana**, mas o benefício maior foi a **consistência**.

Antes, meus code reviews variavam dependendo do meu humor e de como eu formulava o prompt. Agora, todo código passa pelo mesmo crivo - e percebi uma redução de ~40% em bugs que chegavam em produção.

## 5 Skills que Uso Todo Dia

Deixa eu te mostrar as skills que realmente fazem diferença no meu workflow:

### 1. Code Review Automatizado

Esta foi a primeira skill que criei e a que mais uso.

```markdown
---
name: code-review
description: Review code for security, performance, and best practices
---

When reviewing code, analyze in this order:

1. **Security Issues**
   - SQL injection, XSS vulnerabilities
   - Exposed secrets or API keys
   - Authentication/authorization flaws

2. **Performance**
   - Unnecessary re-renders in React
   - N+1 queries
   - Missing indexes or inefficient queries

3. **Best Practices**
   - TypeScript strict mode violations
   - Missing error handling
   - Code duplication

4. **Next.js Specific**
   - Wrong use of Server/Client Components
   - Missing metadata for SEO
   - Inefficient data fetching

Format findings as:
- Critical (must fix)
- Important (should fix)
- Nice to have (consider)

Always include code examples of fixes.
```

**Impacto real**: Encontra 3-4 problemas que eu sempre esquecia de verificar manualmente.

### 2. Geração de Documentação

Esta skill gera docs consistentes pra funções e componentes:

```markdown
---
name: generate-docs
description: Create comprehensive documentation for code
---

Generate documentation including:

1. **Purpose**: One sentence what it does
2. **Parameters**: Type, description, default
3. **Returns**: What it returns and when
4. **Examples**: 2-3 common use cases
5. **Edge Cases**: What could go wrong

Format as JSDoc for TypeScript.
Use real examples from the codebase.
```

**Impacto real**: Documentação consistente em 100% do código novo desde que comecei a usar.

### 3. Test Generator

Automatiza criação de testes unitários:

```markdown
---
name: generate-tests
description: Create Jest/Vitest unit tests
---

For each function/component, create tests covering:

1. Happy path
2. Edge cases (null, undefined, empty)
3. Error scenarios
4. Integration with dependencies (mock when needed)

Use describe/it structure.
Include setup/teardown when needed.
Mock external dependencies.
Aim for 80%+ coverage.
```

**Impacto real**: Cobertura de testes subiu de 45% para 82% em 2 meses.

### 4. Explain Code com Diagramas

Esta é minha favorita pra entender código legado:

```markdown
---
name: explain-code
description: Explain code using analogies and diagrams
---

When explaining code:

1. **Start with analogy**: Compare to everyday concept
2. **Draw ASCII diagram**: Show flow/structure
3. **Walk through step-by-step**: What happens
4. **Highlight gotchas**: Common mistakes

Keep conversational. Use multiple analogies for complex concepts.
```

**Exemplo de output** que recebi explicando um hook customizado:

```
Think of useLocalStorage like a notebook with automatic sync.

+------------------+
|  Your Component  |
|                  |
|  const [value,   |
|   setValue] =    |
|   useLocal...    |
+--------+---------+
         |
         | reads/writes
         v
+------------------+      auto-sync      +--------------+
|  React State     | <-----------------> | localStorage |
|  (in memory)     |                     |  (browser)   |
+------------------+                     +--------------+

When you call setValue(), it:
1. Updates React state (re-render)
2. Saves to localStorage (persistence)
3. Broadcasts to other tabs (sync)

Gotcha: localStorage is synchronous - don't store large objects!
```

Isso é infinitamente melhor que uma explicação genérica.

### 5. Pre-Deploy Checklist

Antes de fazer deploy, rodo essa skill:

```markdown
---
name: pre-deploy
description: Run checklist before deployment
disable-model-invocation: true
---

Before deploying, verify:

- [ ] All tests passing
- [ ] No console.logs in production code
- [ ] Environment variables documented
- [ ] Error boundaries in place
- [ ] Loading states for async operations
- [ ] SEO metadata complete
- [ ] Security headers configured
- [ ] Performance budget met

Report findings with severity and suggested fixes.
```

O `disable-model-invocation: true` significa que só EU posso invocar essa skill com `/pre-deploy`. O Claude não vai rodar automaticamente.

**Impacto real**: Zero deploys quebrados desde que comecei a usar.

## Como Criar Sua Primeira Skill

Vou te ensinar do jeito mais prático possível. Vamos criar uma skill simples de validação de commits.

### Passo 1: Crie a estrutura

```bash
mkdir -p ~/.claude/skills/commit-validator
cd ~/.claude/skills/commit-validator
touch SKILL.md
```

Skills no `~/.claude/skills/` ficam disponíveis em TODOS os seus projetos. Se quiser uma skill só pra um projeto específico, crie em `.claude/skills/` dentro do projeto.

### Passo 2: Escreva o SKILL.md

```markdown
---
name: commit-validator
description: Validate commit messages follow conventional commits
---

# Commit Message Validator

Validate commit messages against these rules:

1. **Format**: `type(scope): description`
2. **Types**: feat, fix, docs, style, refactor, test, chore
3. **Description**: Present tense, no period, < 72 chars
4. **Body** (optional): Wrapped at 72 chars

Examples:
- feat(auth): add OAuth login
- fix(api): handle null user response
- updated stuff (no type) - INVALID
- feat: added new feature. (period, past tense) - INVALID

For invalid commits, suggest corrections.
```

### Passo 3: Teste

Abra o Claude Code e digite:

```bash
Validate this commit: "updated auth"
```

O Claude vai carregar a skill automaticamente e responder algo como:

```
Invalid commit message: "updated auth"

Issues:
- Missing type (feat/fix/etc)
- Past tense instead of present
- Too vague

Suggested fix:
feat(auth): update authentication flow
```

### Passo 4: Refine

Depois de usar algumas vezes, você vai notar padrões. Eu ajustei minha skill de commit-validator umas 5 vezes até ficar perfeita.

Adicione casos específicos que você encontra no dia a dia.

## Progressive Disclosure - Por Que Isso Importa

Aqui está o truque que faz Skills serem tão eficientes: **progressive disclosure**.

Imagine que você tem 10 skills. Se o Claude carregasse todas em toda conversa, seu contexto estaria sempre lotado com instruções que talvez não sejam relevantes.

Com progressive disclosure:

1. **No início**: Claude só vê nome e descrição de cada skill (poucos tokens)
2. **Quando relevante**: Carrega o SKILL.md completo
3. **Se precisar de arquivos adicionais**: Carrega sob demanda

Por exemplo, minha skill de `generate-docs` tem arquivos extras:

```
generate-docs/
-- SKILL.md
-- examples/
    -- function-example.md
    -- component-example.md
-- templates/
    -- jsdoc-template.md
```

O Claude só lê `examples/` e `templates/` se precisar de referência. Isso economiza ~1500 tokens por conversa.

**Impacto observado**: Com 8 skills ativas, meu consumo de tokens aumentou apenas 12% comparado a não usar skills. Sem progressive disclosure, seria >200%.

## Skills vs MCP vs Prompts - Quando Usar

Depois de 3 meses testando, criei esta matriz de decisão:

### Use Prompts quando

- Você está explorando uma ideia nova
- É uma tarefa única que não vai repetir
- Quer experimentar abordagens diferentes

**Exemplo**: "Me explique como funciona Suspense no React 18"

### Use Skills quando

- Você faz a mesma coisa 3+ vezes por semana
- Precisa de resultados consistentes
- Quer compartilhar workflow com o time

**Exemplo**: Code review, geração de testes, documentação

### Use MCP (Model Context Protocol) quando

- Precisa integrar com serviços externos
- Quer acesso a databases, APIs, ferramentas
- Necessita de state persistente

**Exemplo**: Conectar com Linear, Slack, GitHub

### Use Projects quando

- Tem contexto específico de um projeto
- Quer que o Claude lembre de conversas passadas
- Tem documentação que sempre é relevante

**Exemplo**: Projeto específico de cliente com suas regras de negócio

**Minha recomendação**: Comece com Skills. São mais simples que MCP e mais poderosas que Prompts.

## O Impacto Real na Produtividade

Vamos aos números que realmente importam.

### Métricas que Observei

Comparando Novembro 2025 (sem skills) vs Janeiro 2026 (com skills):

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Features/semana | 3.2 | 4.8 | +50% |
| Bugs em prod/mês | 12 | 7 | -42% |
| Cobertura testes | 45% | 82% | +82% |
| Tempo em code review | 4h/sem | 1.5h/sem | -62% |
| Deploys quebrados | 2/mês | 0 | -100% |

### ROI de Criar Skills

**Tempo investido criando minhas 8 skills principais**: ~6 horas total

**Tempo economizado por semana**: ~4 horas

**Payback**: 1.5 semanas

Depois disso, é lucro puro. Já estou com 12 semanas de uso, então economizei ~48 horas de trabalho repetitivo.

### Curva de Aprendizado

- **Semana 1**: Criação da primeira skill (1-2h)
- **Semana 2-3**: Refinamento e criação de mais 3-4 skills
- **Semana 4+**: Manutenção mínima, criação ocasional de skills novas

O investimento inicial compensa **muito** rápido.

## Lições Aprendidas (e Erros que Cometi)

### Erro 1: Skills Muito Genéricas

Minha primeira skill de code review era:

```markdown
Review this code for issues.
```

Resultado? Claude dava feedback genérico e inconsistente, tipo "This code looks good" ou "Consider adding error handling".

**Aprendi**: Seja específico. Liste exatamente o que você quer que seja verificado, em qual ordem, e como reportar.

### Erro 2: Skills Muito Específicas

Depois fui pro outro extremo. Criei uma skill diferente pra cada tipo de componente React:

- `review-button-component`
- `review-form-component`
- `review-modal-component`

Acabei com 15 skills que faziam basicamente a mesma coisa.

**Aprendi**: Uma skill pode ser flexível. Use parâmetros e condicionais nas instruções.

### Erro 3: Não Versionar Skills

No começo, editava skills direto sem commitar. Aí fiz uma mudança que piorou tudo e não lembrava como era antes.

**Aprendi**: Coloque suas skills em Git. Trate como código.

```bash
cd ~/.claude/skills
git init
git add .
git commit -m "feat: add commit-validator skill"
```

### Erro 4: Não Usar disable-model-invocation

Tinha uma skill de deploy que o Claude ativava automaticamente sempre que eu mencionava "produção" na conversa. Quase fiz um deploy acidental.

**Aprendi**: Skills com **side effects** (deploy, commit, enviar email) devem ter `disable-model-invocation: true`.

### O que Funcionou Bem

1. **Começar simples**: Primeira skill com 10 linhas, refinei depois
2. **Usar em projetos reais**: Não criei skills "por criar"
3. **Documentar exemplos**: Dentro da skill, coloquei exemplos do output esperado
4. **Compartilhar com o time**: Skills são portáveis, todo mundo usa as mesmas

## Por Que Você Deveria Começar Hoje

Se você usa Claude Code regularmente e ainda não está usando Skills, você está:

1. **Perdendo tempo** repetindo as mesmas instruções
2. **Tendo resultados inconsistentes** porque formula diferente cada vez
3. **Não aproveitando** o verdadeiro poder da ferramenta

A barreira de entrada é ridiculamente baixa:

- Leva 15 minutos pra criar sua primeira skill
- Não precisa aprender nenhuma linguagem nova
- O retorno vem na primeira semana

### Minha Recomendação de Primeira Skill

Comece com uma skill de **code review**. Por quê?

1. Você vai usar toda semana (múltiplas vezes)
2. O benefício é imediato (menos bugs)
3. É fácil de validar se está funcionando

Use meu template acima como base e ajuste pro seu stack.

### Próximos Passos

Depois da sua primeira skill:

1. **Identifique padrões**: O que você pede pro Claude toda semana?
2. **Transforme em skill**: Cada padrão vira uma skill
3. **Refine iterativamente**: Use, observe, melhore
4. **Compartilhe**: Publique no GitHub, ajude outros devs

## Recursos e Referências

**Documentação oficial**:

- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

**Skills prontas pra usar**:

- [Anthropic Skills Repo](https://github.com/anthropics/skills)
- [Awesome Claude Skills](https://github.com/ComposioHQ/awesome-claude-skills)

**Artigos que me ajudaram**:

- [Equipping Agents for Real World](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Build Your First Skill](https://medium.com/@richardhightower/build-your-first-claude-code-skill-a-simple-project-memory-system-that-saves-hours-1d13f21aff9e)

## Conclusão

Depois de 3 meses usando Skills no Claude Code, posso dizer com certeza: **não tem volta**.

A diferença não é só em produtividade (embora 4 horas economizadas por semana seja significativo). É sobre trabalhar de uma forma fundamentalmente diferente.

Ao invés de ser um assistente que esquece tudo entre sessões, o Claude se torna um parceiro que aprende seus padrões e aplica consistentemente.

Skills transformaram o Claude Code de "ferramenta útil" pra "parte essencial do meu workflow". E o melhor: leva 15 minutos pra começar.

Então para de ler e vai criar sua primeira skill. Te garanto: daqui 2 semanas você vai se perguntar como trabalhou sem isso.

---

**Tem dúvidas sobre Skills ou quer compartilhar as suas?** Me encontra no [GitHub](https://github.com/nandomoreirame) ou no meu [site pessoal](https://nandomoreira.dev).

---

*Este artigo foi publicado originalmente no blog da A's Code, em [ascode.com.br](https://ascode.com.br/blog/por-que-usar-skills-no-claude-code).*
