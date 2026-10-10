---
slug: claude-code-cursor-workflow-nextjs16
title: "Como uso Claude Code e Cursor juntos: Workflow real em projetos Next.js 16"
summary: "Descubra como combinar Claude Code e Cursor para desenvolver projetos Next.js 16 40% mais rápido. Workflow real, exemplos de código e números de produtividade."
date: "2026-01-26"
markers:
  - claude code
  - cursor
  - next.js
art: panels
---
Quando comecei a usar ferramentas de IA para desenvolvimento, achei que precisava escolher uma única solução. Testei Claude Code, depois Cursor, e ficava naquela dúvida: qual usar? Até que percebi que essa era a pergunta errada. A questão certa é: **quando usar cada uma?**

Nos últimos 4 meses, desenvolvi um workflow que combina as duas ferramentas em projetos Next.js, e os resultados foram surpreendentes. Estou entregando features 40% mais rápido e com menos bugs. Não é mágica: é entender o que cada ferramenta faz de melhor e orquestrar elas no momento certo.

Vou te mostrar exatamente como uso Claude Code e Cursor juntos, com um case real de um projeto Next.js 16 que construí recentemente.

## Por que usar as duas?

Antes de entrar no workflow, preciso te explicar por que não escolhi só uma ferramenta.

**Claude Code é terminal-first**. Ele roda no terminal, tem uma visão completa do codebase, e é excelente para tarefas que exigem planejamento e mudanças arquiteturais. Com features recentes como checkpoints, subagents e a integração com MCP servers, ele se tornou indispensável para trabalho agentic, quando você delega tarefas complexas e deixa a IA trabalhar de forma autônoma.

**Cursor é IDE-first**. É um fork do VS Code com IA integrada em todo o fluxo de desenvolvimento. O autocomplete é absurdamente rápido, o Composer é perfeito para edições multi-arquivo, e a interface visual torna tudo mais intuitivo. É onde eu passo 80% do meu tempo de codificação.

Percebi que elas se complementam perfeitamente:
- Claude Code para decisões e transformações grandes
- Cursor para implementação rápida e iteração
- Claude Code para refactoring complexo
- Cursor para debugging e ajustes finos

## O Case Real: Dashboard de Analytics SaaS

Vou usar um projeto real que desenvolvi em janeiro de 2026 como exemplo. Era um dashboard de analytics para um micro-SaaS que analisa métricas de produtos digitais.

**Stack técnica:**
- Next.js 16.1 (com Turbopack estável)
- TypeScript
- React 19.2
- Prisma (PostgreSQL)
- Tailwind CSS
- shadcn/ui

**Desafio:** Entregar MVP funcional em 2 semanas com dashboard completo, sistema de auth, gráficos interativos e API de ingestão de dados.

**Prazo apertado + complexidade alta = cenário perfeito para aproveitar IA ao máximo.**

## Meu Workflow: Quando usar cada ferramenta

Vou te mostrar fase por fase como usei as duas ferramentas.

### Fase 1: Planejamento e Arquitetura (Claude Code)

Sempre começo projetos Next.js 16 no terminal com Claude Code. A razão é simples: ele tem uma visão holística do codebase e pode me ajudar a tomar decisões arquiteturais antes de escrever uma linha de código.

Abri o terminal na raiz do projeto:

```bash
claude
```

Meu primeiro prompt foi direto:

```text
Estou criando um dashboard de analytics. Stack: Next.js 16, Prisma, PostgreSQL.
Features principais:
- Auth (NextAuth)
- Ingestão de eventos via API
- Visualização de dados em tempo real
- Dashboard com gráficos

Analise a estrutura atual e sugira a melhor arquitetura de pastas
considerando Cache Components e Server Actions do Next.js 16.
```

Claude Code analisou o projeto e sugeriu uma estrutura que aproveitava as features do Next.js 16:

```text
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx          # Layout com cache
│   ├── page.tsx            # Dashboard principal
│   └── analytics/
│       └── [projectId]/    # Rotas dinâmicas
├── api/
│   ├── events/route.ts     # Ingestão de dados
│   └── analytics/route.ts  # Queries otimizadas
├── actions/                # Server Actions
│   ├── auth.ts
│   └── analytics.ts
└── components/
    ├── charts/             # Client Components
    └── ui/                 # shadcn/ui
```

**O insight mais valioso** foi a sugestão de usar `use cache` para otimizar as queries de analytics. Claude Code me mostrou que eu podia cachear os dados de analytics por projeto usando Cache Components:

```typescript
// app/actions/analytics.ts
'use server'
'use cache'

import { db } from '@/lib/db'

export async function getProjectAnalytics(projectId: string) {
  const data = await db.event.groupBy({
    by: ['eventName'],
    where: { projectId },
    _count: true,
  })

  return data
}

// Cache automático com revalidação inteligente
export const cacheLife = {
  analytics: {
    revalidate: 300, // 5 minutos
  }
}
```

Isso economizou **tempo de query em 70%** nos testes que fiz depois, um ganho absurdo que veio de uma sugestão arquitetural no início.

### Fase 2: Setup Inicial (Claude Code + Cursor)

Para o setup inicial, usei os dois:

**Claude Code** para instalar dependências e configurar Prisma:

```text
# No Claude Code
Instale as dependências necessárias:
- NextAuth
- Prisma com PostgreSQL
- shadcn/ui
- Recharts para gráficos
- Zod para validação

Configure o Prisma com schema inicial para Users e Events.
```

Claude Code executou tudo, criou o schema do Prisma, rodou migrations, e configurou as variáveis de ambiente. Em **menos de 3 minutos** eu tinha o projeto estruturado.

**Cursor** para criar os componentes base da UI:

Abri o Cursor e usei o Composer (Cmd+I) para gerar os componentes básicos:

```text
Crie um layout base para o dashboard usando shadcn/ui:
- Sidebar com navegação
- Header com user dropdown
- Área de conteúdo principal
- Use Tailwind para styling
- Componentes devem ser server components quando possível
```

Cursor gerou o layout completo em **segundos**, já usando a estrutura correta de Server Components do Next.js 16.

### Fase 3: Implementação de Features (Cursor domina)

Na hora de implementar features, Cursor vira minha ferramenta principal. O autocomplete dele é assustadoramente bom: ele entende o contexto do projeto Next.js 16 e sugere código que realmente funciona.

**Exemplo real: Implementando sistema de auth**

Pressionei Cmd+K no arquivo `app/(auth)/login/page.tsx`:

```text
Crie uma página de login usando NextAuth e Server Actions.
- Form com email e password
- Validação com Zod
- Error handling
- Redirect após login
- Use useActionState do React 19.2
```

Cursor gerou isso:

```typescript
'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={formAction} className="w-full max-w-md space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            disabled={pending}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={pending}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
```

Repare que ele:
- Usou `useActionState` (novo no React 19.2)
- Criou states corretos para pending e error
- Implementou acessibilidade com labels
- Usou os componentes shadcn/ui que já estavam no projeto

**Velocidade absurda.** O que levaria 30-40 minutos para escrever e testar, levou **5 minutos** com Cursor.

### Fase 4: Refactoring Complexo (Claude Code volta ao jogo)

Depois de implementar todas as features básicas, percebi que a estrutura da API de ingestão de eventos precisava de refactoring. Estava crescendo demais e virando um monolito.

Aqui, voltei pro Claude Code porque o trabalho envolvia:
- Mover lógica de múltiplos arquivos
- Criar novas abstrações
- Atualizar imports em todo o codebase
- Testar que nada quebrou

No terminal:

```bash
claude
```

```text
A rota app/api/events/route.ts está com muita responsabilidade.
Refatore para:

1. Extrair validação para lib/validators/events.ts
2. Criar lib/services/analytics.ts com lógica de processamento
3. Manter route.ts só como entrypoint
4. Atualizar todos os imports
5. Adicionar error handling apropriado

Use subagents se necessário para trabalho paralelo.
```

Claude Code usou **subagents** (feature recém lançada) para trabalhar em paralelo:
- Um agent criou os validators
- Outro criou o service layer
- O principal orquestrou e atualizou imports

Em **10 minutos**, o refactoring que levaria facilmente 1-2 horas estava completo. E o melhor: Claude Code criou um checkpoint antes de começar, então se algo desse errado, eu poderia voltar instantaneamente com `/rewind`.

### Fase 5: Debugging e Performance (Ambas as ferramentas)

Quando encontrei um bug de performance nos gráficos (eles estavam re-renderizando demais), usei as duas ferramentas de formas diferentes:

**Cursor para debug rápido:**

Selecionei o componente com problema e pressionei Cmd+K:

```text
Este componente está re-renderizando demais.
Analise e otimize usando React Compiler ou memoização manual.
```

Cursor identificou o problema:

```typescript
// ANTES - re-renderizava a cada mudança de state
export default function AnalyticsChart({ data }) {
  const chartConfig = {
    // ... configuração complexa recalculada sempre
  }

  return <LineChart data={data} config={chartConfig} />
}

// DEPOIS - otimizado com useMemo
'use client'

import { useMemo } from 'react'

export default function AnalyticsChart({ data }) {
  const chartConfig = useMemo(() => ({
    // ... configuração
  }), []) // Não depende de nada, calcula uma vez

  return <LineChart data={data} config={chartConfig} />
}
```

**Claude Code para análise profunda:**

Para entender o impacto real, pedi pro Claude Code analisar o bundle:

```text
Analise o bundle size e identifique possíveis otimizações.
Foque em:
- Code splitting
- Dynamic imports
- Unused dependencies
```

Claude Code descobriu que o Recharts estava sendo importado em todas as páginas, mesmo nas que não tinham gráficos. Sugeriu usar dynamic imports:

```typescript
// app/(dashboard)/analytics/[projectId]/page.tsx
import dynamic from 'next/dynamic'

// Carrega apenas quando necessário
const AnalyticsChart = dynamic(
  () => import('@/components/charts/AnalyticsChart'),
  { ssr: false } // Não precisa de SSR para gráficos interativos
)
```

**Resultado:** Bundle inicial reduziu de 180kb para 95kb. **Quase 50% menor.**

## Números Reais: Produtividade e Resultados

Vou ser honesto sobre os ganhos que tive usando esse workflow:

**Tempo de desenvolvimento:**
- Estimativa inicial sem IA: 3 semanas
- Tempo real com Claude Code + Cursor: **11 dias**
- **Redução de 47% no prazo**

**Qualidade do código:**
- Bugs encontrados em QA: 3 (contra média de 8-12 em projetos similares)
- Cobertura de testes: 78% (gerada por Claude Code)
- Performance Lighthouse: 95/100

**Breakdown por ferramenta:**
- **Claude Code**: ~25% do tempo (planejamento, refactoring, análise)
- **Cursor**: ~70% do tempo (implementação, debugging, iteração)
- **Manual**: ~5% (decisões de negócio, design)

## Meu Setup e Configuração

### Claude Code

**Settings essenciais** que uso no `~/.claude/config.json`:

```json
{
  "model": "claude-sonnet-4-5",
  "features": {
    "checkpoints": true,
    "subagents": true
  }
}
```

**Skills customizadas** para Next.js 16:

Criei uma skill em `~/.claude/skills/nextjs16.md`:

```markdown
# Next.js 16 Best Practices

- Use Cache Components com 'use cache' para dados que mudam pouco
- Prefira Server Actions a API Routes quando possível
- Aproveite React 19.2 features (useActionState, <Activity>)
- Use Turbopack (já é default, não precisa de flag)
- Implementar updateTag() para invalidação granular de cache
```

**MCP Servers que uso:**

O Next.js DevTools MCP é essencial para debugar problemas de cache e routing:

```json
// .mcp.json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

### Cursor

**Cursor Rules** no `.cursorrules` do projeto:

```text
# Next.js 16 Project Rules

- Use TypeScript strict mode
- Prefira Server Components quando possível
- Use 'use server' para Server Actions
- Implemente error boundaries em Client Components
- Use Zod para validação de schemas
- Siga padrão shadcn/ui para componentes
- Cache responses com 'use cache' quando apropriado
- Dynamic imports para componentes pesados (charts, editors)
```

**Modelos que uso por tarefa:**
- **Claude Sonnet 4.5**: Refactoring e lógica complexa
- **GPT-4**: Quando preciso de speed em autocomplete
- **Claude Opus 4.6**: Tasks muito complexas (raramente, pelo custo)

**Atalhos que uso constantemente:**
- `Cmd+K`: Quick edit no arquivo atual
- `Cmd+I`: Composer para edições multi-arquivo
- `Cmd+L`: Chat rápido sem editar código
- `Cmd+Shift+P > "Cursor: Enable Agent Mode"`: Para tarefas longas

## Lições Aprendidas e Armadilhas

### O que funciona bem

**1. Delegar arquitetura pro Claude Code**

Ele tem contexto completo e toma decisões melhores que eu isoladamente. Sempre começo projetos com ele analisando requirements e sugerindo estrutura.

**2. Iterar rápido no Cursor**

Para codificação ativa, nada bate o autocomplete e o Composer do Cursor. É onde acontece a mágica do dia a dia.

**3. Usar checkpoints antes de refactorings grandes**

Claude Code salva seu estado antes de cada mudança. Isso me deu confiança pra fazer refactorings agressivos. Se algo der errado, `Esc Esc` e volto pro estado anterior.

**4. Combinar com web search quando necessário**

Quando estou implementando algo novo (tipo integração com API externa), peço pra ambas as ferramentas pesquisarem a documentação oficial antes de gerar código.

### Armadilhas para evitar

**1. Não confiar cegamente**

IA erra. SEMPRE reviso código gerado, especialmente:
- Lógica de negócio crítica
- Queries de banco de dados
- Validações de segurança
- Permissões e autenticação

**2. Contexto é rei**

Quanto melhor eu explico o que quero, melhores são os resultados. Prompts vagos = código genérico.

Exemplo ruim:
```text
Faça um dashboard
```

Exemplo bom:
```text
Crie um dashboard para analytics com:
- Grid de cards mostrando métricas principais (total events, unique users, conversion rate)
- Gráfico de linha com eventos dos últimos 7 dias
- Tabela com top 10 eventos mais frequentes
- Use shadcn/ui, faça server component quando possível
- Dados vêm de getProjectAnalytics() action
```

**3. Não usar IA para tudo**

Decisões de produto, priorização de features, escolhas de UX: isso ainda é 100% humano. IA ajuda a executar, não a decidir o que construir.

**4. Cuidado com vendor lock-in**

Construí algumas abstrações pra não ficar totalmente dependente:

```typescript
// lib/ai-helpers.ts
// Se eu mudar de ferramenta, mudo só aqui
export async function generateComponent(prompt: string) {
  // Hoje usa Cursor/Claude, amanhã pode ser outra coisa
  return await currentAIProvider.generate(prompt)
}
```

### Produtividade Real vs Hype

Vou ser direto: **IA não vai te fazer 10x mais produtivo magicamente.**

O ganho real que tive foi:
- **40% mais rápido** em features conhecidas (CRUD, auth, etc)
- **60% mais rápido** em setup e boilerplate
- **30% mais rápido** em debugging
- **20% mais rápido** em código novo e complexo

A média dá uns 35-40% de ganho real. É MUITO, mas não é mágica. E tem custo:
- Tempo aprendendo as ferramentas (~2 semanas até dominar)
- Dinheiro ($20/mês Cursor + custos Claude Code)
- Energia mental organizando o workflow
- Risco de confiar demais e criar bugs sutis

**Vale a pena?** Pra mim, absolutamente sim. Mas sua milhagem pode variar dependendo do tipo de projeto e sua experiência.

## Casos de Uso Específicos

### Quando usar SOMENTE Claude Code

- **Análise de codebase grande**: Claude Code consegue ler 200+ arquivos e entender a arquitetura
- **Migrations complexas**: Atualizar de Next.js 15 pra 16, migrar de Pages pra App Router
- **Debugging de build**: Quando o build falha e você não sabe por quê
- **Planejamento técnico**: Antes de começar uma feature grande

### Quando usar SOMENTE Cursor

- **Codificação rápida**: Implementar componentes, pages, APIs simples
- **Ajustes de UI**: Tweaks de Tailwind, responsividade
- **Debugging visual**: Quando você vê o problema mas não sabe como consertar
- **Explorar codebase pequeno**: Cmd+L e perguntar sobre arquivos específicos

### Quando usar AMBOS (sequencialmente)

- **Features complexas**: Claude Code planeja, Cursor executa
- **Refactoring + implementação**: Claude Code refatora, Cursor adiciona features
- **Performance**: Cursor identifica, Claude Code analisa fundo
- **Code review**: Claude Code analisa PR inteiro, Cursor ajusta detalhes

## Próximos Passos e Evolução

Esse workflow ainda está evoluindo. Algumas coisas que estou testando:

**1. Usar mais MCP servers**

Estou experimentando conectar Claude Code com:
- Linear (pra criar tasks automaticamente)
- GitHub (pra abrir PRs direto do terminal)
- Slack (pra notificar o time quando deploy termina)

**2. Automatizar mais com skills**

Criei uma skill que roda sempre que inicio um projeto Next.js:

```markdown
# Skill: NextJS Project Init

Quando criar novo projeto Next.js:
1. Instalar dependências base (shadcn/ui, Zod, Prisma)
2. Configurar TypeScript strict mode
3. Criar estrutura de pastas padrão
4. Setup Tailwind com config customizada
5. Criar .cursorrules com as regras do projeto
6. Init git e primeiro commit
```

**3. Experimentar Agent Teams no Claude Code**

A feature de Agent Teams (Opus 4.6) permite criar times de agents trabalhando em paralelo. Quero testar isso em projetos maiores.

**4. Melhorar prompts com iteração**

Estou guardando os melhores prompts em um arquivo `prompts.md` no projeto pra reusar. É tipo um "prompt library" pessoal.

## Conclusão: Orquestração é a chave

Depois de 4 meses usando Claude Code e Cursor juntos, minha maior lição foi: **não existe ferramenta perfeita, existe workflow bem orquestrado.**

As duas ferramentas são excepcionais no que fazem. Claude Code é o arquiteto sênior que pensa no big picture. Cursor é o desenvolvedor ágil que executa rápido. Sozinhas, elas são boas. Juntas, elas são transformadoras.

Meu conselho se você tá começando:

1. **Comece com uma só** (sugiro Cursor por ser mais visual)
2. **Domine os basics** antes de tentar workflows complexos
3. **Adicione Claude Code** quando sentir a necessidade de análises mais profundas
4. **Itere no workflow**: o que funciona pra mim pode não funcionar pra você
5. **Meça resultados**: acompanhe quanto tempo você economiza de verdade

E lembre: **IA é ferramenta, não substituto**. Ela amplifica sua capacidade, mas as decisões críticas ainda são suas. Use com sabedoria.

---

## Recursos e Links Úteis

- [Claude Code Docs](https://docs.anthropic.com/claude-code)
- [Cursor Docs](https://docs.cursor.com)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [React 19.2 Features](https://react.dev/blog/2025/react-19-2)
- [Next.js DevTools MCP](https://github.com/vercel/next-devtools-mcp)

---

*Este artigo foi publicado originalmente no blog da A's Code, em [ascode.com.br](https://ascode.com.br/blog/claude-code-cursor-workflow-nextjs16).*
