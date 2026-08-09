# Plano: Conteúdo dos cases

> **Spec:** `docs/specs/case-content/SPEC.md`
> **Slug:** `case-content` · **Sprint:** 3 · **Criado:** 2026-08-09
> **Profundidade:** Deep (16 requisitos) — quatro lotes com dependência declarada
> **Tarefas:** 15

## Defaults aplicados nas decisões pendentes da spec

A spec foi aprovada com três decisões em aberto. O plano assume o default abaixo
e o registra em vez de parar. Trocar qualquer um deles muda apenas a tarefa citada.

| Pendente | Default do plano | Tarefa afetada |
|---|---|---|
| Quais dois projetos do cliente | Pipeline de normalização financeira e plataforma de data insights | T10, T11 |
| Segundo `ai-product` se `portfoliosnap.app` seguir fora | `mousai.gallery`, com o bloco relido como "produto SaaS próprio" | T9 |
| `mousai.gallery` entra nos oito | Só como substituto em T9; fora se `portfoliosnap.app` voltar | T9 |

## Ordem e dependências

```
Lote 1 (schema e portões)  T1 → T2 → T3, T4
        │
        ├─ bloqueia T10, T11 (case confidencial sem link)
        │
Lote 2 (cases públicos)    T5, T6, T7, T8   ← independentes entre si
Lote 3 (condicionais)      T9 (externo), T10, T11
Lote 4 (integração)        T12, T13, T14 → T15
```

**T1 bloqueia T10 e T11**: sem o schema afrouxado, um case confidencial sem link
não passa no build. **T14 depende de todos os cases existirem.**

---

## Lote 1 — Schema e portões

### T1 — Aceitar case confidencial sem link

**REQ:** REQ-002, REQ-003, REQ-004
**Arquivos:** `src/content/schemas/project.ts` (modificar) ·
`tests/content/project-schema.test.ts` (modificar)

**Step 1 — Teste vermelho**

```ts
// tests/content/project-schema.test.ts
describe('link requirement', () => {
  const base = {
    slug: 'exemplo', title: 'Exemplo', block: 'professional' as const,
    summary: 's', problem: 'p', decisions: 'd', outcome: 'o',
    tech: ['Python'], featured: false, date: '2026-01-01',
  };

  it('accepts a confidential case with no link at all', () => {
    // A client repo is private and the client domain carries the client name,
    // so the second refine forbids every link a real case could offer.
    const parsed = projectSchema.parse({ ...base, confidential: true });
    expect(parsed.repoUrl ?? null).toBeNull();
  });

  it('still rejects a public case with no link', () => {
    expect(() => projectSchema.parse({ ...base, confidential: false })).toThrow(
      /verifiable evidence/,
    );
  });
});
```

**Step 2 — Rodar e ver falhar**

```bash
npx vitest run tests/content/project-schema.test.ts
# esperado: o primeiro teste falha com "A case needs at least one of repoUrl or liveUrl"
```

**Step 3 — Implementação**

No primeiro `.refine()` de `projectSchema`, trocar a condição por:

```ts
.refine(
  (project) =>
    project.confidential || Boolean(project.repoUrl) || Boolean(project.liveUrl),
  {
    message:
      'A case needs at least one of repoUrl or liveUrl: without a link there is no verifiable evidence. Only a confidential case may omit both, and it must say so on the page (REQ-005).',
    path: ['repoUrl'],
  },
)
```

**Step 4 — Verde**

```bash
npx vitest run tests/content/project-schema.test.ts
# esperado: ambos passam
```

**Step 5 — Provar que o portão morde**

```bash
# trocar `project.confidential ||` por `false &&` e confirmar que o segundo teste falha
```

**Team:** track `backend` · implementador `backend-engineer` ·
skills `test-driven-development`, `typescript-backend` ·
painel `business-logic-reviewer`, `type-safety-reviewer`

---

### T2 — Marcar na página que a evidência não é pública

**REQ:** REQ-005
**Arquivos:** `src/components/catalog/CaseArticle.astro` (modificar) ·
`src/components/catalog/LinkList.astro` (verificar) ·
`tests/catalog/confidential-notice.test.ts` (criar)

**Step 1 — Teste vermelho**

```ts
// tests/catalog/confidential-notice.test.ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const project = {
  slug: 'pipeline', title: 'Pipeline', block: 'professional',
  summary: 's', problem: 'p', decisions: 'd', outcome: 'o',
  tech: ['Python'], featured: false, confidential: true,
  date: '2026-01-01', repoUrl: null, liveUrl: null,
};

describe('confidential case with no link', () => {
  it('states that the evidence is not public', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CaseArticle, { props: { project } });

    // Without this the relaxation silently turns "verifiable evidence" into
    // "the author says so", which is what the catalogue exists to prevent.
    expect(html).toMatch(/confidencialidade|não é pública/i);
  });

  it('does not render an empty link area', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CaseArticle, { props: { project } });
    expect(html).not.toMatch(/<a[^>]*href="(null|undefined|#)"/);
  });
});
```

**Step 3 — Implementação**

Em `CaseArticle.astro`, quando `confidential && !repoUrl && !liveUrl`, renderizar
no lugar da lista de links:

```astro
<p class="font-mono text-small text-muted-foreground">
  Trabalho sob confidencialidade: o código e a URL não são públicos.
</p>
```

**Team:** track `frontend` · implementador `frontend-engineer` ·
skills `test-driven-development`, `accessibility-guardrails` ·
painel `business-logic-reviewer`, `test-reviewer`

---

### T3 — Verificar que todo `repoUrl` aponta para repositório público

**REQ:** REQ-006
**Arquivos:** `scripts/verify-repo-urls.sh` (criar)

Não é teste de suíte: consultar a API do GitHub a cada build tornaria o build
dependente de rede, o que o edge case da spec já descarta. É verificação sob
demanda, com linha de marca própria.

**Step 1 — Escrever o script**

```bash
#!/usr/bin/env bash
# Every repoUrl in the catalogue must be reachable without credentials: a private
# repo answers 404 to a visitor, which is worse than no link at all (REQ-006).
set -eo pipefail

fail=0
for url in $(grep -rhoE 'repoUrl: https://github\.com/[^ ]+' src/content/projects/ | sed 's/repoUrl: //'); do
  api="${url/https:\/\/github.com\//https://api.github.com/repos/}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$api")
  if [ "$code" != "200" ]; then
    echo "PRIVATE OR MISSING: $url (api $code)"
    fail=1
  else
    echo "ok: $url"
  fi
done

[ "$fail" -eq 0 ] && echo "REPO URLS PASSED" || { echo "REPO URLS FAILED"; exit 1; }
```

**Step 2 — Provar que morde**

```bash
bash scripts/verify-repo-urls.sh    # espera: REPO URLS PASSED
# acrescentar temporariamente um repoUrl privado a um case e rodar de novo:
# espera: PRIVATE OR MISSING + exit 1
```

**Team:** track `scripts` · implementador `backend-engineer` ·
skills `bash-linux` · painel `security-reviewer`

---

### T4 — Limitar os destaques a cinco

**REQ:** REQ-014
**Arquivos:** `tests/content/featured-cap.test.ts` (criar)

**Step 1 — Teste vermelho** (fica vermelho quando o sexto destaque entrar)

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('featured cases', () => {
  it('never exceeds the five the home lists', () => {
    const dir = 'src/content/projects';
    const featured = readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => /^featured:\s*true$/m.test(readFileSync(`${dir}/${f}`, 'utf8')));

    // The home caps at five (REQ-008 of theme-restyle). A sixth flag would be
    // silently ignored, and the author would not know which case was dropped.
    expect(featured.length, `featured: ${featured.join(', ')}`).toBeLessThanOrEqual(5);
  });
});
```

**Team:** track `tests` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `test-reviewer`

---

## Lote 2 — Cases públicos (independentes entre si)

Cada tarefa cria um arquivo em `src/content/projects/` e verifica com
`npm run build`, que falha em qualquer campo inválido. O texto abaixo é o
material verificado; a redação final é do autor.

### T5 — Case `amnesia-claude-code` (`ai-tooling`)

**REQ:** REQ-001, REQ-006, REQ-010
**Arquivo:** `src/content/projects/amnesia-claude-code.md` (criar)

Material verificado: Python, público, criado 2026-04-03, 0 estrelas. Descrição
oficial: "Persistent memory system for Claude Code — deterministic entity and
project session memory". O README declara a decisão central: as operações de
merge, dedup e validação são feitas por um CLI Python determinístico **em vez de
depender do raciocínio do modelo**.

```yaml
slug: amnesia-claude-code
title: Amnesia
block: ai-tooling
summary: Camada de memória persistente e determinística para o Claude Code
problem: |
  Memória de agente delegada ao próprio modelo erra em merge e deduplicação, e o
  erro só aparece quando o agente já respondeu com o dado errado.
decisions: |
  Operações de merge, dedup e validação num CLI Python, fora do modelo. O agente
  chama o CLI; o resultado é o mesmo em toda execução.
outcome: |
  Uso próprio diário no fluxo de trabalho com Claude Code. Sem tração pública:
  o repositório é aberto e não tem estrelas.
tech: [Python, Claude Code]
repoUrl: https://github.com/nandomoreirame/amnesia-claude-code
liveUrl: null
featured: false
confidential: false
date: "2026-04-03"
```

**Verificação:** `npm run build` deve passar; `bash scripts/verify-repo-urls.sh`
deve listar o novo `repoUrl` como `ok`.

**Team:** track `content` · implementador `technical-article-writer` ·
skills `pt-br-accent-fix` · painel `business-logic-reviewer`

---

### T6 — Case `tumodori` (`systems-cli`)

**REQ:** REQ-001, REQ-009, REQ-010
**Arquivo:** `src/content/projects/tumodori.md` (criar)

Material verificado: Rust com Ratatui, público, 2026-04-08, 2 estrelas.
Diferencial declarado no README: dígitos grandes e centralizados, legíveis à
distância; durações configuráveis; pausa longa automática após N sessões.

```yaml
slug: tumodori
title: Tumodori
block: systems-cli
summary: Pomodoro de terminal com dígitos grandes, em Rust e Ratatui
problem: |
  Um cronômetro em janela de terminal comum exige aproximar do monitor para ler,
  o que quebra o foco que a técnica existe para proteger.
decisions: |
  Ratatui em vez de uma GUI, para o cronômetro viver no mesmo lugar que o
  trabalho. Dígitos desenhados em bloco, não a fonte do terminal, para o tamanho
  não depender da configuração de quem usa.
outcome: |
  Uso próprio diário. Duas estrelas no GitHub, o que é interesse pontual e não
  tração.
tech: [Rust, Ratatui]
repoUrl: https://github.com/nandomoreirame/tumodori
liveUrl: null
featured: false
confidential: false
date: "2026-04-08"
```

**Team:** igual a T5

---

### T7 — Case `hypr-switcher` (`systems-cli`)

**REQ:** REQ-001, REQ-009, REQ-010
**Arquivo:** `src/content/projects/hypr-switcher.md` (criar)

Material verificado: Rust, público, 2026-03-03, 3 estrelas. README: overlay
Wayland em layer-shell, tela cheia, mostrando todas as janelas de todos os
workspaces, com navegação por teclado.

```yaml
slug: hypr-switcher
title: Hypr Switcher
block: systems-cli
summary: Alt+Tab visual para o Hyprland, em Rust sobre layer-shell
problem: |
  O Hyprland não traz um alternador visual de janelas, e trocar entre workspaces
  às cegas custa mais tempo que a troca em si.
decisions: |
  Camada layer-shell do Wayland em vez de uma janela comum, para o overlay
  aparecer acima de tudo sem roubar foco. Rust pela latência de abertura, que é
  o que decide se a ferramenta é usada ou abandonada.
outcome: |
  Uso próprio diário no ambiente Hyprland. Três estrelas, a maior contagem entre
  as ferramentas de sistema do acervo recente.
tech: [Rust, Wayland, Hyprland]
repoUrl: https://github.com/nandomoreirame/hypr-switcher
liveUrl: null
featured: false
confidential: false
date: "2026-03-03"
```

**Team:** igual a T5

---

### T8 — Case `bragstack` (`ai-product`)

**REQ:** REQ-001, REQ-006, REQ-008
**Arquivo:** `src/content/projects/bragstack.md` (criar)

Material verificado: repositório **privado** (API devolve 404), domínio
`https://bragstack.app` responde 200. PWA mobile-first em Next.js 16.1 com
Firebase; a IA transforma conquistas soltas em documentos no formato STAR.

**`repoUrl` fica nulo**: o repositório é privado e um link privado devolve 404 ao
visitante (REQ-006). A evidência é o `liveUrl`.

```yaml
slug: bragstack
title: BragStack
block: ai-product
summary: Captura conquistas em segundos e a IA gera o documento no formato STAR
problem: |
  Quem precisa de um brag document na avaliação não lembra o que fez seis meses
  antes, e registrar no momento custa mais atenção do que a conquista merece.
decisions: |
  Captura em texto livre de dez segundos, com o custo de estruturar jogado para
  a IA na hora de gerar. PWA mobile-first porque a conquista acontece longe do
  editor.
outcome: |
  No ar em bragstack.app. Repositório fechado, então a evidência é o produto
  rodando, não o código.
tech: [Next.js, TypeScript, Firebase, IA generativa]
repoUrl: null
liveUrl: https://bragstack.app
featured: true
confidential: false
date: "2026-02-09"
```

**Team:** igual a T5

---

## Lote 3 — Condicionais e confidenciais

### T9 — Segundo case de `ai-product`, condicional

**REQ:** REQ-002, REQ-008
**Arquivo:** `src/content/projects/portfoliosnap.md` **ou**
`src/content/projects/mousai.md` (criar)

**Step 1 — Verificar a dependência externa**

```bash
curl -s -o /dev/null -w '%{http_code}\n' --max-time 12 https://portfoliosnap.app
```

- **200** → escrever `portfoliosnap.md`. Material: Next.js com `@google/genai`;
  professores de educação infantil registram atividades diárias e a IA gera os
  relatórios mensais. `repoUrl: null` (privado), `liveUrl` para o domínio.
- **qualquer outro** (hoje **525**, falha de SSL entre Cloudflare e origem) →
  escrever `mousai.md` no lugar. Material: mood boards minimalistas para
  artistas, organizados por autor, compartilháveis por código curto e sem
  cadastro do visitante. `liveUrl: https://mousai.gallery` (200 verificado).

**Se cair no `mousai`:** ele não usa modelo de linguagem, o que colide com
REQ-008. Nesse caso a tarefa **também** emenda o rótulo do bloco em
`src/content/blocks.ts` de "Produtos SaaS com IA" para "Produtos SaaS", e
registra a mudança na spec. Anunciar IA num bloco cujo segundo case não tem IA
seria a mesma inflação que REQ-010 proíbe nos números.

**Team:** track `content` · implementador `technical-article-writer` ·
skills `pt-br-accent-fix` · painel `business-logic-reviewer`

---

### T10 — Case de cliente: normalização de dados financeiros (`professional`)

**REQ:** REQ-003, REQ-005, REQ-007
**Depende de:** T1, T2
**Arquivo:** `src/content/projects/financial-normalization.md` (criar)

Material verificado em `~/dev/clients/liquid/projects/play-pre-normalize-v2`:
serviço Python de pré-processamento e normalização de dados financeiros para
incorporadoras, em DDD com arquitetura hexagonal. O workspace tem 36 bases.

**O slug não pode conter o nome do cliente** (segundo `refine`), e por isso é
`financial-normalization` e não o nome do repositório.

```yaml
slug: financial-normalization
title: Normalização de dados financeiros
block: professional
summary: Serviço que normaliza dados financeiros heterogêneos de incorporadoras
problem: |
  Cada incorporadora entrega dado financeiro num formato próprio, e a
  normalização manual não acompanha o número de bases ativas.
decisions: |
  Domain-Driven Design com arquitetura hexagonal, para a regra de cada
  incorporadora entrar como adaptador e não como ramificação no núcleo. API
  Python de propósito único, com o frontend em repositório separado.
outcome: |
  Em produção sobre dezenas de bases ativas. Números e nome do cliente não são
  públicos.
tech: [Python, DDD, Arquitetura hexagonal]
repoUrl: null
liveUrl: null
featured: false
confidential: true
clientName: "<preencher: usado só para a redação, nunca renderizado>"
date: "<preencher: início do trabalho>"
```

**Atenção:** `clientName` fica no fonte e é redigido na leitura pública. Antes de
publicar, confirmar com o cliente o que pode ser dito no `problem` e no
`decisions`, que **não** são redigidos automaticamente.

**Verificação:** `npm run build` passa (só passa depois de T1);
`npx vitest run tests/aeo/no-leak.test.ts` continua verde;
a página do case exibe o aviso de confidencialidade (T2).

**Team:** track `content` · implementador `technical-article-writer` ·
skills `pt-br-accent-fix`, `security-guardrails` ·
painel `security-reviewer`, `business-logic-reviewer`

---

### T11 — Case de cliente: plataforma de data insights (`professional`)

**REQ:** REQ-003, REQ-005, REQ-007, REQ-008
**Depende de:** T1, T2
**Arquivo:** `src/content/projects/data-insights-platform.md` (criar)

Material verificado em `~/dev/clients/liquid/projects/liquid-play-data-insights`:
"Plataforma de data insights com IA generativa para análise e transformação de
dados", Node.js 22+.

Mesma estrutura de T10: `confidential: true`, sem links, `clientName` só no
fonte, slug sem o nome do cliente. Este é o case que liga o bloco `professional`
ao posicionamento de IA, porque é IA generativa em produção paga.

**Team:** igual a T10

---

## Lote 4 — Integração

### T12 — A trajetória declara a fração das estrelas

**REQ:** REQ-010, REQ-011
**Arquivos:** `src/content/profile/profile.md` (modificar) ·
`tests/content/stars-context.test.ts` (criar)

**Step 1 — Teste vermelho**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('GitHub stars in the profile', () => {
  it('never states the total without the share that comes from old themes', () => {
    const source = readFileSync('src/content/profile/profile.md', 'utf8');
    const mentionsTotal = /9\d\d\s*(estrelas|stars)/i.test(source);

    // 764 of 964 stars come from Jekyll themes published between 2017 and 2021.
    // The bare total is arithmetic truth and positioning fiction (RISK-004).
    if (mentionsTotal) {
      expect(source).toMatch(/temas|2017|2018|Jekyll/i);
    }
  });
});
```

**Step 3 — Implementação**

Ajustar o item de `trajectory` que cita o GitHub para trazer o contexto no campo
`context`, que o `StatItem` já exige. Exemplo de redação:

```yaml
- value: "964"
  label: estrelas no GitHub
  context: |
    764 delas vêm de oito temas Jekyll publicados entre 2017 e 2021. O acervo
    recente de agentes e ferramental soma 200.
```

**Team:** track `content` · implementador `technical-article-writer` ·
skills `pt-br-accent-fix` · painel `business-logic-reviewer`

---

### T13 — Sincronizar os serviços com os cases que os comprovam

**REQ:** REQ-012
**Arquivos:** `src/components/home/Services.astro` (modificar)

Cada serviço anunciado aponta um `caseSlug`, e a validação cruzada quebra o build
se o slug não existir. Com sete cases novos, revisar se cada serviço aponta para
o case mais forte, e não para o único que existia.

```bash
npm run build   # falha imediatamente com caseSlug inexistente
```

**Team:** track `frontend` · implementador `frontend-engineer` ·
skills `test-driven-development` · painel `business-logic-reviewer`

---

### T14 — Portão dos oito cases, dois por bloco

**REQ:** REQ-007
**Arquivos:** `tests/content/block-coverage.test.ts` (criar)
**Depende de:** T5 a T11

**Step 1 — Teste vermelho** (vermelho até o oitavo case entrar)

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../../src/content/blocks';

const dir = 'src/content/projects';
const blockOf = (file: string): string =>
  readFileSync(`${dir}/${file}`, 'utf8').match(/^block:\s*(\S+)$/m)?.[1] ?? '';

describe('catalogue coverage', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));

  it('publishes eight cases', () => {
    expect(files.length).toBe(8);
  });

  it.each(BLOCKS)('covers %s with two cases', (block) => {
    // A block with one case reads as an unfinished section, and the MVP-SCOPE
    // treats the eight cases as the mitigation for RISK-003.
    expect(files.filter((f) => blockOf(f) === block)).toHaveLength(2);
  });
});
```

**Team:** track `tests` · implementador `backend-engineer` ·
skills `test-driven-development` · painel `test-reviewer`

---

### T15 — Verificação final

**REQ:** REQ-012
**Depende de:** todas

```bash
npm run verify                      # check + test + build + test:build
bash scripts/verify-repo-urls.sh    # espera REPO URLS PASSED
bash scripts/verify-schema-gate.sh  # espera SCHEMA GATE PASSED
bash scripts/verify-aeo-routes.sh   # espera AEO ROUTES PASSED
```

Conferir também, por leitura do build e não do fonte:

- `/portfolio` e `/lab` listam quatro cases cada.
- Os dois cases confidenciais exibem o aviso e nenhum link vazio.
- `sitemap.xml` e `llms.txt` trazem os oito.
- `tests/aeo/no-leak.test.ts` verde, com o nome do cliente ausente das rotas
  de máquina.

**A evidência é a linha de marca de cada script, nunca o código de saída**: o
status de um pipeline é o do último estágio.

**Team:** track `qa` · implementador `code-reviewer` ·
painel `security-reviewer`, `consequences-reviewer`

---

## Riscos deste plano

| Risco | Mitigação |
|---|---|
| T1 abre brecha para case sem evidência | REQ-004 e o teste de T1 mantêm o build quebrando para case não confidencial; T2 obriga o aviso na página |
| Texto do case de cliente vaza informação | `confidential: true` redige nome e métricas, mas **não** redige `problem` nem `decisions`: T10 exige revisão humana antes de publicar |
| `portfoliosnap.app` não volta | T9 já traz o caminho alternativo e a emenda de rótulo do bloco |
| Sete cases escritos de uma vez saem genéricos | Cada tarefa traz o material verificado do projeto, não um gabarito |
| Resultado envelhece | REQ-010 e a redação preferem "uso próprio diário" a número solto |
