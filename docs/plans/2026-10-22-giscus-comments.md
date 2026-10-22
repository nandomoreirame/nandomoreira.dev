# Plano: comentários com Giscus no blog

> **Spec:** docs/specs/giscus-comments/SPEC.md

**Objetivo:** Adicionar comentários Giscus aos posts atuais publicados, logo depois de `<AuthorBox />`, e documentar a integração na política de privacidade.
**Arquitetura:** Um componente Astro renderiza a seção e seus estados acessíveis. Um carregador cliente inicia o embed perto da viewport, configura o mapeamento estrito por `pathname`, idioma `pt` e tema, e mantém o conteúdo do post disponível em caso de falha. A rota filtra posts arquivados e rascunhos, e a política permanece em uma única fonte de dados para HTML e Markdown.
**Stack:** Astro, TypeScript, Vitest, happy-dom, GitHub Discussions, Giscus.
**Total de tarefas:** 5
**Complexidade estimada:** média

---

## Pré-requisitos de ativação

Antes da implantação, confirmar que `nandomoreirame/nandomoreira.dev` é público, habilitar Discussions, instalar o app Giscus com acesso ao repositório e criar a categoria `Blog` do tipo `Announcements`. Copiar os valores públicos `repoId` e `categoryId` gerados pela configuração oficial do Giscus para a configuração da feature. Esses valores não são segredos. Não usar valores fictícios em produção.

## Ordem e dependências

| Grupo | Tarefas | Dependências |
|---|---|---|
| A | 1, 2 | Pré-requisitos do GitHub para integração final |
| B | 3 | 1 e 2 |
| C | 4, 5 | independentes entre si; Tarefa 4 depende de 1 e 2 |

### Tarefa 1: Criar a seção Astro e a configuração pública do Giscus

**Requisitos:** REQ-002, REQ-003, REQ-007, REQ-008
**Arquivos:**

- Criar: `src/components/posts/GiscusComments.astro`
- Criar: `src/lib/posts/giscus-config.ts`
- Criar: `tests/posts/giscus-comments.test.ts`

**Equipe:**

- Trilha: frontend
- Implementador: frontend-engineer (skills: frontend-design, accessibility-guardrails)
- Revisores: test-reviewer, accessibility-guardrails, security-reviewer

**TDD:** Primeiro escrever testes AstroContainer que falham sem o componente, verificando título acessível, estado inicial, repositório/categoria públicos e ausência de credenciais. Rodar `./node_modules/.bin/vitest run tests/posts/giscus-comments.test.ts` e confirmar a falha esperada. Implementar o mínimo no componente e configuração, com a mensagem de falha em português e sem conteúdo externo inicial. Rodar o mesmo comando e confirmar aprovação. Revisar o diff e deixar commit para o fluxo autorizado do Claude Code ou para o usuário.

### Tarefa 2: Implementar carregamento sob demanda, tema e falha

**Requisitos:** REQ-002, REQ-004, REQ-005, REQ-008
**Arquivos:**

- Criar: `src/lib/posts/giscus-loader.ts`
- Criar: `tests/posts/giscus-loader.test.ts`
- Modificar: `src/components/posts/GiscusComments.astro`

**Equipe:**

- Trilha: frontend
- Implementador: frontend-engineer (skills: frontend-design, accessibility-guardrails)
- Revisores: type-safety-reviewer, test-reviewer, accessibility-guardrails, security-reviewer

**TDD:** Escrever testes happy-dom que falham para: não inserir o script antes da interseção; usar `pathname`, strict mode, categoria configurada, `pt` e nenhuma reação; mapear `noir`/`paper`; enviar a atualização de tema ao iframe sem recarregar; e mostrar fallback em erro ou timeout. Rodar `./node_modules/.bin/vitest run tests/posts/giscus-loader.test.ts` e observar as falhas. Implementar o carregador mínimo usando IntersectionObserver, MutationObserver e a API de mensagens documentada pelo Giscus; limitar mensagens de entrada ao origin esperado. Rodar o teste novamente e confirmar aprovação. Revisar o diff, sem operação Git.

### Tarefa 3: Renderizar somente depois de AuthorBox em posts atuais

**Requisitos:** REQ-001, REQ-004
**Arquivos:**

- Modificar: `src/pages/[slug].astro`
- Modificar: `tests/posts/post-page.test.ts`

**Equipe:**

- Trilha: frontend
- Implementador: frontend-engineer (skills: accessibility-guardrails)
- Revisores: test-reviewer, accessibility-guardrails

**TDD:** Ampliar os testes de rota para falhar se o widget faltar em post atual publicado, aparecer em post arquivado/rascunho, ou vier antes de `<AuthorBox />`/depois dos posts relacionados. Rodar `./node_modules/.bin/vitest run tests/posts/post-page.test.ts`. Inserir o componente imediatamente depois de `<AuthorBox />`, ainda dentro do `<article>`, e antes da seção de posts relacionados; aplicar a condição de elegibilidade usando os campos atuais do post. Repetir o comando e confirmar aprovação para os casos atuais, arquivados e rascunhos. Revisar o diff sem operação Git.

### Tarefa 4: Integrar com o portão de scripts do cliente e build

**Requisitos:** REQ-004, REQ-007
**Arquivos:**

- Modificar: `tests/helpers/client-scripts.ts`
- Modificar: `tests/helpers/client-scripts.test.ts`
- Criar: `tests/posts/giscus-comments.build.test.ts`

**Equipe:**

- Trilha: frontend
- Implementador: frontend-engineer (skills: accessibility-guardrails)
- Revisores: test-reviewer, security-reviewer

**TDD:** Criar primeiro o teste que exige uma exceção nomeada para o carregador intencional, verifica o orçamento definido pelo helper e compara a saída de rota atual com a arquivada; confirmar falha com `./node_modules/.bin/vitest run tests/helpers/client-scripts.test.ts tests/posts/giscus-comments.build.test.ts`. Ajustar o allowlist somente para o marcador do Giscus e estabelecer um limite explícito, sem liberar scripts genéricos; confirmar que nenhum script ou iframe do Giscus aparece antes do carregamento sob demanda. Rodar novamente os testes e confirmar aprovação. Revisar o diff, sem operação Git.

### Tarefa 5: Atualizar a política de privacidade

**Requisitos:** REQ-006
**Arquivos:**

- Modificar: `src/lib/privacy/policy.ts`
- Modificar: `tests/privacy/policy.test.ts`

**Equipe:**

- Trilha: docs
- Implementador: rpi-implementer
- Revisão: autorrevisão do conteúdo em pt-BR

**TDD:** Acrescentar asserts que falham exigindo nas saídas HTML e Markdown uma seção que identifique Giscus/GitHub, autenticação GitHub, armazenamento público em Discussions e link para a política de privacidade do GitHub. Rodar `./node_modules/.bin/vitest run tests/privacy/policy.test.ts`. Atualizar `privacySections` e a data da política na fonte compartilhada, sem duplicar os textos por formato. Rodar novamente e confirmar aprovação. Revisar acentuação, coerência entre HTML e Markdown e diff; deixar Git sem alterações de índice.

## Verificação final do implementador

Após as tarefas, executar os portões existentes do projeto: `npm test`, `npm run check`, `npm run build` e `npm run test:build`. Fazer uma verificação manual com a configuração real do repositório para autenticação, criação de conversa, moderação, carregamento tardio, troca de tema e fallback por falha/timeout. Nenhum bloqueador de extensão que impeça todo JavaScript pode ser detectado pelo site. Registrar evidências e deixar commit/push para o fluxo autorizado.
