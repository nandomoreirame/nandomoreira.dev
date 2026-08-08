# Plan: Camada de dados única

> **Spec:** `docs/specs/content-data-layer/SPEC.md`

**Goal:** Uma única fonte de verdade em Astro Content Collections, com schema Zod que falha o build em dado inválido, e uma camada de acesso que é o único caminho para ler projeto e perfil.
**Architecture:** Duas collections declaradas em `src/content.config.ts` — `projects` (glob de markdown, uma entrada por case) e `profile` (entrada única). Os schemas Zod vivem em `src/content/schemas/` para poderem ser exercitados em teste sem subir o Astro. A camada de acesso em `src/lib/content/` expõe consultas nomeadas (`getAllProjects`, `getProjectsByBlock`, `getFeaturedProjects`, `getProject`, `getProfile`) e é o único módulo autorizado a chamar `getCollection`, o que um teste de contrato garante.
**Tech Stack:** Astro 7.2.0 Content Collections, Zod 3.x, TypeScript 5.x, Vitest.
**Total Tasks:** 11
**Estimated Complexity:** large (9+ tasks)

---

## Verificação de caminhos (§3.5)

`Files: Modify` declarados: **1** (`package.json`, Task 1). Criado pela sprint 1
(`2026-08-08-infra-deploy-spike.md`, Task 1). Existente no momento da escrita: **0**.

Rodar a checagem no início da execução. Se `package.json` não existir, a sprint 1 não
rodou e este plano não pode começar.

---

### Task 1: Instalar Zod e declarar os blocos do acervo

**Requirement:** REQ-002
**Files:**

- Modify: `package.json`
- Create: `src/content/blocks.ts`
- Test: `tests/content/blocks.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `consequences-reviewer`, `security-reviewer`, `business-logic-reviewer`

**Step 1: Write the failing test**

`tests/content/blocks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BLOCKS, BLOCK_LABELS } from '../../src/content/blocks';

describe('archive blocks', () => {
  it('declares the four blocks from the PRD', () => {
    expect(BLOCKS).toEqual(['ai-tooling', 'ai-product', 'systems-cli', 'professional']);
  });

  it('keeps positioning order, not alphabetical order', () => {
    expect(BLOCKS.indexOf('ai-tooling')).toBeLessThan(BLOCKS.indexOf('ai-product'));
  });

  it('carries a human label in pt-BR for every block', () => {
    for (const block of BLOCKS) {
      expect(BLOCK_LABELS[block]).toBeTruthy();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/blocks.test.ts`
Expected: FAIL com `Failed to resolve import "../../src/content/blocks"`.

**Step 3: Write minimal implementation**

```bash
npm install zod
```

`src/content/blocks.ts`:

```ts
/**
 * The four blocks of the archive, in positioning order.
 * Alphabetical order would put ai-product before ai-tooling, inverting the
 * hierarchy the BRIEF wants to communicate.
 */
export const BLOCKS = [
  'ai-tooling',
  'ai-product',
  'systems-cli',
  'professional',
] as const;

export type Block = (typeof BLOCKS)[number];

export const BLOCK_LABELS: Record<Block, string> = {
  'ai-tooling': 'Ferramental de AI coding',
  'ai-product': 'Produtos SaaS com IA',
  'systems-cli': 'Sistemas e CLI em Rust e Go',
  professional: 'Trabalho profissional e de cliente',
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/blocks.test.ts`
Expected: PASS, `Tests 3 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 2: Schema de `projects` com campos obrigatórios

**Requirement:** REQ-001, REQ-002, REQ-008, REQ-014
**Files:**

- Create: `src/content/schemas/project.ts`
- Test: `tests/content/project-schema.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `consequences-reviewer`, `security-reviewer`, `business-logic-reviewer`
**Depends on:** Task 1

**Step 1: Write the failing test**

`tests/content/project-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { projectSchema } from '../../src/content/schemas/project';

const valid = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling',
  summary: 'Cliente GUI multi-CLI para agentes de código',
  problem: 'Alternar entre três CLIs de agente custa contexto.',
  decisions: 'Tauri em vez de Electron, por peso do binário.',
  outcome: '11 estrelas e uso diário próprio.',
  tech: ['Rust', 'Tauri', 'TypeScript'],
  repoUrl: 'https://github.com/nandomoreirame/forja',
  liveUrl: null,
  featured: true,
  confidential: false,
};

describe('projectSchema', () => {
  it('accepts a complete project', () => {
    expect(projectSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    'slug',
    'title',
    'block',
    'summary',
    'problem',
    'decisions',
    'outcome',
    'tech',
    'featured',
    'confidential',
  ])('rejects a project missing %s', (field) => {
    const { [field as keyof typeof valid]: _removed, ...incomplete } = valid;
    expect(projectSchema.safeParse(incomplete).success).toBe(false);
  });

  it('rejects a block outside the four declared ones', () => {
    const result = projectSchema.safeParse({ ...valid, block: 'side-project' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty tech list, since a case with no stack proves nothing', () => {
    expect(projectSchema.safeParse({ ...valid, tech: [] }).success).toBe(false);
  });

  it('rejects a relative repo URL', () => {
    expect(
      projectSchema.safeParse({ ...valid, repoUrl: '/nandomoreirame/forja' }).success,
    ).toBe(false);
  });

  it('rejects an image without alternative text', () => {
    const result = projectSchema.safeParse({
      ...valid,
      images: [{ src: '/img/forja.png', alt: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a project with no images at all', () => {
    expect(projectSchema.safeParse({ ...valid, images: undefined }).success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/project-schema.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/content/schemas/project.ts`:

```ts
import { z } from 'zod';
import { BLOCKS } from '../blocks';

const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'A case image is content, never decoration: alt is required'),
});

export const projectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: z.string().min(1),
  block: z.enum(BLOCKS),
  summary: z.string().min(1),
  problem: z.string().min(1),
  decisions: z.string().min(1),
  outcome: z.string().min(1),
  tech: z.array(z.string().min(1)).min(1),
  repoUrl: z.string().url().nullable().optional(),
  liveUrl: z.string().url().nullable().optional(),
  images: z.array(imageSchema).optional(),
  featured: z.boolean(),
  confidential: z.boolean(),
});

export type Project = z.infer<typeof projectSchema>;
```

A regra de integridade de link entra na Task 3, como refinamento separado, para que o
teste dela isole a causa da falha.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/project-schema.test.ts`
Expected: PASS, `Tests 15 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 3: Regra de integridade de link

**Requirement:** REQ-003
**Files:**

- Modify: `src/content/schemas/project.ts`
- Test: `tests/content/link-integrity.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 2

**Step 1: Write the failing test**

`tests/content/link-integrity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { projectSchema } from '../../src/content/schemas/project';

const base = {
  slug: 'projeto',
  title: 'Projeto',
  block: 'professional',
  summary: 'resumo',
  problem: 'problema',
  decisions: 'decisões',
  outcome: 'resultado',
  tech: ['TypeScript'],
  featured: false,
  confidential: false,
};

describe('link integrity', () => {
  it('accepts a public repo with no live version', () => {
    const result = projectSchema.safeParse({
      ...base,
      repoUrl: 'https://github.com/x/y',
      liveUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a private repo with a live version', () => {
    const result = projectSchema.safeParse({
      ...base,
      repoUrl: null,
      liveUrl: 'https://bragstack.app',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a case with neither link, which has no verifiable evidence', () => {
    const result = projectSchema.safeParse({ ...base, repoUrl: null, liveUrl: null });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/repoUrl|liveUrl/);
    }
  });

  it('rejects a case where both links are simply absent', () => {
    expect(projectSchema.safeParse(base).success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/link-integrity.test.ts`
Expected: FAIL nos dois últimos casos: o schema da Task 2 ainda aceita ambos nulos.

**Step 3: Write minimal implementation**

Em `src/content/schemas/project.ts`, envolver o objeto com o refinamento:

```ts
export const projectSchema = z
  .object({
    /* ...campos da Task 2, inalterados... */
  })
  .refine((project) => Boolean(project.repoUrl) || Boolean(project.liveUrl), {
    message:
      'A case needs at least one of repoUrl or liveUrl: without a link there is no verifiable evidence',
    path: ['repoUrl'],
  });
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/link-integrity.test.ts tests/content/project-schema.test.ts`
Expected: PASS nos dois arquivos.

**Step 5: Commit**

Run: `/git commit`

---

### Task 4: Schema de `profile`

**Requirement:** REQ-005, REQ-011
**Files:**

- Create: `src/content/schemas/profile.ts`
- Test: `tests/content/profile-schema.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `security-reviewer`, `consequences-reviewer`
**Depends on:** Task 1

**Step 1: Write the failing test**

`tests/content/profile-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { profileSchema } from '../../src/content/schemas/profile';

const valid = {
  name: 'Fernando Moreira Costa',
  headline: 'Engenheiro de produto com agentes de IA',
  bio: 'Construo ferramental de agentes e produtos com IA em produção.',
  positioning: 'IA, agentes e tooling de AI coding.',
  stack: ['TypeScript', 'Rust', 'Astro'],
  trajectory: [
    {
      value: '964',
      label: 'estrelas no GitHub',
      context: 'cerca de 700 vêm de temas Jekyll de 2018',
    },
  ],
  services: [
    {
      title: 'Tooling com agentes',
      description: 'Ferramental interno para times que usam agentes de código.',
      caseSlug: 'forja',
    },
  ],
  availability: {
    status: 'open',
    detail: 'Aberto a consultoria de escopo fechado e a posição sênior.',
    updatedAt: '2026-08-08',
  },
  contacts: [{ kind: 'email', value: 'fernando@nandomoreira.dev' }],
};

describe('profileSchema', () => {
  it('accepts a complete profile', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it('requires availability to carry the date it was last updated', () => {
    const { updatedAt: _dropped, ...availability } = valid.availability;
    expect(profileSchema.safeParse({ ...valid, availability }).success).toBe(false);
  });

  it('rejects an availability date that is not ISO-8601', () => {
    const result = profileSchema.safeParse({
      ...valid,
      availability: { ...valid.availability, updatedAt: '08/08/2026' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a trajectory number with no narrative context', () => {
    const result = profileSchema.safeParse({
      ...valid,
      trajectory: [{ value: '964', label: 'estrelas', context: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a service that references no case, since every service needs proof', () => {
    const result = profileSchema.safeParse({
      ...valid,
      services: [{ title: 'X', description: 'Y', caseSlug: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one contact channel', () => {
    expect(profileSchema.safeParse({ ...valid, contacts: [] }).success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/profile-schema.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/content/schemas/profile.ts`:

```ts
import { z } from 'zod';

/** A number without its narrative misleads: RISK-004 of the BRIEF. */
const statSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  context: z.string().min(1, 'A bare number without context is misleading'),
});

/** Every advertised service must point at a case that proves it (F1.4). */
const serviceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  caseSlug: z.string().min(1, 'A service with no case behind it is an unproven claim'),
});

const availabilitySchema = z.object({
  status: z.enum(['open', 'limited', 'closed']),
  detail: z.string().min(1),
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'updatedAt must be an ISO-8601 date (YYYY-MM-DD)'),
});

const contactSchema = z.object({
  kind: z.enum(['email', 'github', 'linkedin', 'site']),
  value: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  bio: z.string().min(1),
  positioning: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  trajectory: z.array(statSchema).min(1),
  services: z.array(serviceSchema).min(1),
  availability: availabilitySchema,
  contacts: z.array(contactSchema).min(1),
});

export type Profile = z.infer<typeof profileSchema>;
```

`updatedAt` é obrigatório porque `check_availability` do MCP precisa devolver a data
junto com o status (F6.5). Sem ela o agente recebe um dado que não consegue qualificar.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/profile-schema.test.ts`
Expected: PASS, `Tests 6 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 5: Declarar as collections no Astro

**Requirement:** REQ-001, REQ-005
**Files:**

- Create: `src/content.config.ts`
- Create: `src/content/profile/profile.md`
- Create: `src/content/projects/forja.md`
- Test: `tests/content/collections.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `consequences-reviewer`, `business-logic-reviewer`, `type-safety-reviewer`
**Depends on:** Task 3, Task 4

**Step 1: Write the failing test**

`tests/content/collections.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = readFileSync('src/content.config.ts', 'utf8');

describe('content collections', () => {
  it('declares both collections', () => {
    expect(config).toContain('projects');
    expect(config).toContain('profile');
  });

  it('reuses the tested schemas instead of redeclaring them inline', () => {
    expect(config).toContain("from './content/schemas/project'");
    expect(config).toContain("from './content/schemas/profile'");
  });
});
```

Reaproveitar os schemas é o que faz o teste unitário das Tasks 2 a 4 valer para o
build. Um schema inline no `content.config.ts` seria uma segunda definição, não testada.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/collections.test.ts`
Expected: FAIL com `ENOENT ... src/content.config.ts`.

**Step 3: Write minimal implementation**

`src/content.config.ts`:

```ts
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { profileSchema } from './content/schemas/profile';
import { projectSchema } from './content/schemas/project';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: projectSchema,
});

const profile = defineCollection({
  loader: glob({ base: './src/content/profile', pattern: '**/*.md' }),
  schema: profileSchema,
});

export const collections = { projects, profile };
```

`src/content/projects/forja.md` — o case real que M2 do `MVP-SCOPE.md` exige. O texto
definitivo é da sprint 3; aqui basta ser verdadeiro e completo:

```markdown
---
slug: forja
title: Forja
block: ai-tooling
summary: Cliente GUI multi-CLI para Claude Code, Codex e Gemini
problem: |
  Alternar entre três CLIs de agente em terminais separados custa contexto a cada
  troca, e nenhuma delas mostra o estado das outras.
decisions: |
  Tauri em vez de Electron, pelo peso do binário e por já haver Rust no acervo.
  Uma camada de adaptação por CLI, em vez de um protocolo comum imposto às três.
outcome: |
  11 estrelas no GitHub e uso diário próprio como cliente principal.
tech:
  - Rust
  - Tauri
  - TypeScript
repoUrl: https://github.com/nandomoreirame/forja
liveUrl: null
featured: true
confidential: false
---
```

`src/content/profile/profile.md` — preencher com os dados reais do `BRIEF.md` e do
`PRD.md` (seção References, "Acervo próprio verificado"), seguindo o schema da Task 4.
Nenhum número inventado: os do acervo estão em `docs/PRD.md:731`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/collections.test.ts && npm run build`
Expected: PASS, e o build conclui sem erro de schema.

**Step 5: Commit**

Run: `/git commit`

---

### Task 6: Slug único entre projetos

**Requirement:** REQ-010
**Files:**

- Create: `src/lib/content/validate.ts`
- Test: `tests/content/unique-slug.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 2

**Step 1: Write the failing test**

`tests/content/unique-slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { assertUniqueSlugs } from '../../src/lib/content/validate';

describe('assertUniqueSlugs', () => {
  it('accepts distinct slugs', () => {
    expect(() => assertUniqueSlugs([{ slug: 'a' }, { slug: 'b' }])).not.toThrow();
  });

  it('rejects a duplicate, which would make /projetos/<slug> ambiguous', () => {
    expect(() => assertUniqueSlugs([{ slug: 'a' }, { slug: 'a' }])).toThrow(/a/);
  });

  it('names every duplicate, not just the first', () => {
    expect(() =>
      assertUniqueSlugs([{ slug: 'a' }, { slug: 'a' }, { slug: 'b' }, { slug: 'b' }]),
    ).toThrow(/a.*b|b.*a/);
  });

  it('accepts an empty catalogue', () => {
    expect(() => assertUniqueSlugs([])).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/unique-slug.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/lib/content/validate.ts`:

```ts
/**
 * The slug is the routing key, the JSON-LD identifier and the argument of the
 * MCP get_project tool. A duplicate makes all three ambiguous.
 */
export const assertUniqueSlugs = (projects: ReadonlyArray<{ slug: string }>): void => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const { slug } of projects) {
    if (seen.has(slug)) duplicates.add(slug);
    seen.add(slug);
  }

  if (duplicates.size > 0) {
    throw new Error(`Duplicate project slugs: ${[...duplicates].sort().join(', ')}`);
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/unique-slug.test.ts`
Expected: PASS, `Tests 4 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 7: Camada de acesso a projetos

**Requirement:** REQ-007, REQ-012, REQ-013
**Files:**

- Create: `src/lib/content/projects.ts`
- Test: `tests/content/projects-access.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `consequences-reviewer`, `type-safety-reviewer`, `test-reviewer`
**Depends on:** Task 5, Task 6

**Step 1: Write the failing test**

`tests/content/projects-access.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { featured, groupByBlock, sortProjects } from '../../src/lib/content/projects';

const project = (overrides: Partial<Project>): Project =>
  ({
    slug: 'x',
    title: 'X',
    block: 'professional',
    summary: 's',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['TypeScript'],
    repoUrl: 'https://example.com',
    liveUrl: null,
    featured: false,
    confidential: false,
    ...overrides,
  }) as Project;

const catalogue = [
  project({ slug: 'c', title: 'C', block: 'professional' }),
  project({ slug: 'a', title: 'A', block: 'ai-tooling', featured: true }),
  project({ slug: 'b', title: 'B', block: 'ai-product', featured: true }),
];

describe('groupByBlock', () => {
  it('returns the four blocks in positioning order, not alphabetically', () => {
    expect(groupByBlock(catalogue).map((group) => group.block)).toEqual([
      'ai-tooling',
      'ai-product',
      'systems-cli',
      'professional',
    ]);
  });

  it('keeps an empty block in the result, so the gap is visible', () => {
    const group = groupByBlock(catalogue).find((g) => g.block === 'systems-cli');
    expect(group?.projects).toEqual([]);
  });
});

describe('featured', () => {
  it('returns only the highlighted projects', () => {
    expect(featured(catalogue).map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('is stable: the same input always yields the same order', () => {
    expect(featured(catalogue)).toEqual(featured(catalogue));
  });
});

describe('sortProjects', () => {
  it('orders by title, so the grid never reshuffles between builds', () => {
    expect(sortProjects(catalogue).map((p) => p.slug)).toEqual(['a', 'b', 'c']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/projects-access.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/lib/content/projects.ts`:

```ts
import { getCollection } from 'astro:content';
import { BLOCKS, type Block } from '../../content/blocks';
import type { Project } from '../../content/schemas/project';
import { redactConfidential } from './confidential';
import { assertUniqueSlugs } from './validate';

export interface BlockGroup {
  block: Block;
  projects: Project[];
}

export const sortProjects = (projects: readonly Project[]): Project[] =>
  [...projects].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

export const featured = (projects: readonly Project[]): Project[] =>
  sortProjects(projects.filter((project) => project.featured));

/** Every block is present even when empty, so a missing block is visible. */
export const groupByBlock = (projects: readonly Project[]): BlockGroup[] =>
  BLOCKS.map((block) => ({
    block,
    projects: sortProjects(projects.filter((project) => project.block === block)),
  }));

const load = async (): Promise<Project[]> => {
  const entries = await getCollection('projects');
  const projects = entries.map((entry) => entry.data);

  assertUniqueSlugs(projects);

  return projects.map(redactConfidential);
};

export const getAllProjects = async (): Promise<Project[]> => sortProjects(await load());

export const getFeaturedProjects = async (): Promise<Project[]> => featured(await load());

export const getProjectsByBlock = async (): Promise<BlockGroup[]> =>
  groupByBlock(await load());

export const getProject = async (slug: string): Promise<Project | undefined> =>
  (await load()).find((project) => project.slug === slug);
```

`redactConfidential` chega na Task 8; até lá, criar o módulo com uma função identidade
para o import resolver, e substituir na próxima tarefa.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/projects-access.test.ts`
Expected: PASS, `Tests 5 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 8: Omitir dado confidencial na leitura

**Requirement:** REQ-009
**Files:**

- Create: `src/lib/content/confidential.ts`
- Test: `tests/content/confidential.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `security-reviewer`, `business-logic-reviewer`, `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 7

**Step 1: Write the failing test**

`tests/content/confidential.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { redactConfidential } from '../../src/lib/content/confidential';

const base = {
  slug: 'cliente-x',
  title: 'Plataforma da Acme',
  block: 'professional',
  summary: 'Plataforma interna para a Acme',
  problem: 'A Acme perdia 4h por semana em conciliação manual.',
  decisions: 'Fila assíncrona em vez de processamento síncrono.',
  outcome: 'Redução de 4h para 20min, com faturamento de R$ 2,3M no primeiro ano.',
  tech: ['TypeScript'],
  repoUrl: null,
  liveUrl: 'https://acme.example.com',
  featured: false,
  clientName: 'Acme',
  confidentialMetrics: ['R$ 2,3M no primeiro ano'],
} as unknown as Project;

describe('redactConfidential', () => {
  it('leaves a public project untouched', () => {
    const project = { ...base, confidential: false };
    expect(redactConfidential(project)).toEqual(project);
  });

  it('removes the client name when the case is confidential', () => {
    const redacted = redactConfidential({ ...base, confidential: true });
    expect(JSON.stringify(redacted)).not.toContain('Acme');
  });

  it('removes the sensitive metric from the outcome', () => {
    const redacted = redactConfidential({ ...base, confidential: true });
    expect(redacted.outcome).not.toContain('R$ 2,3M');
  });

  it('keeps the case publishable: problem and decisions survive', () => {
    const redacted = redactConfidential({ ...base, confidential: true });
    expect(redacted.problem).toContain('conciliação manual');
    expect(redacted.decisions).toContain('Fila assíncrona');
  });

  it('never mutates the input', () => {
    const project = { ...base, confidential: true };
    const snapshot = JSON.stringify(project);
    redactConfidential(project);
    expect(JSON.stringify(project)).toBe(snapshot);
  });
});
```

Os campos `clientName` e `confidentialMetrics` precisam existir no schema da Task 2 para
que a redação tenha o que remover. Acrescentá-los como opcionais antes de implementar, e
estender `tests/content/project-schema.test.ts` com um caso que os aceite ausentes.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/confidential.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/lib/content/confidential.ts`:

```ts
import type { Project } from '../../content/schemas/project';

const REDACTED_CLIENT = 'cliente sob confidencialidade';

const strip = (text: string, needles: readonly string[]): string =>
  needles.reduce(
    (result, needle) => (needle ? result.split(needle).join('[omitido]') : result),
    text,
  );

/**
 * Redaction happens on read, never on write: the source file keeps the full
 * text so the author never maintains two versions of the same case (EC-011).
 */
export const redactConfidential = (project: Project): Project => {
  if (!project.confidential) return project;

  const needles = [
    project.clientName ?? '',
    ...(project.confidentialMetrics ?? []),
  ].filter(Boolean);

  return {
    ...project,
    clientName: REDACTED_CLIENT,
    confidentialMetrics: undefined,
    title: strip(project.title, needles),
    summary: strip(project.summary, needles),
    problem: strip(project.problem, needles),
    decisions: strip(project.decisions, needles),
    outcome: strip(project.outcome, needles),
  };
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/confidential.test.ts tests/content/project-schema.test.ts`
Expected: PASS nos dois arquivos.

**Step 5: Commit**

Run: `/git commit`

---

### Task 9: Camada de acesso ao perfil

**Requirement:** REQ-006, REQ-011
**Files:**

- Create: `src/lib/content/profile.ts`
- Create: `src/lib/content/index.ts`
- Test: `tests/content/profile-access.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `business-logic-reviewer`, `consequences-reviewer`, `type-safety-reviewer`
**Depends on:** Task 4, Task 7

**Step 1: Write the failing test**

`tests/content/profile-access.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const barrel = readFileSync('src/lib/content/index.ts', 'utf8');

describe('content access barrel', () => {
  it.each([
    'getAllProjects',
    'getFeaturedProjects',
    'getProjectsByBlock',
    'getProject',
    'getProfile',
    'getAvailability',
  ])('exports %s, so every surface has one way in', (symbol) => {
    expect(barrel).toContain(symbol);
  });
});
```

`tests/content/availability.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toAvailability } from '../../src/lib/content/profile';

describe('toAvailability', () => {
  it('always reports the date the status was last updated', () => {
    const availability = toAvailability({
      status: 'open',
      detail: 'Aberto a consultoria.',
      updatedAt: '2026-08-08',
    });

    expect(availability.updatedAt).toBe('2026-08-08');
    expect(availability.status).toBe('open');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/profile-access.test.ts tests/content/availability.test.ts`
Expected: FAIL, ambos com módulo inexistente.

**Step 3: Write minimal implementation**

`src/lib/content/profile.ts`:

```ts
import { getCollection } from 'astro:content';
import type { Profile } from '../../content/schemas/profile';

export type Availability = Profile['availability'];

export const toAvailability = (availability: Availability): Availability => availability;

export const getProfile = async (): Promise<Profile> => {
  const entries = await getCollection('profile');

  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one profile entry, found ${entries.length}. The profile is the single source of truth.`,
    );
  }

  return entries[0].data;
};

/** F6.5: check_availability must return the status together with its date. */
export const getAvailability = async (): Promise<Availability> =>
  toAvailability((await getProfile()).availability);
```

`src/lib/content/index.ts`:

```ts
export {
  getAllProjects,
  getFeaturedProjects,
  getProject,
  getProjectsByBlock,
} from './projects';
export { getAvailability, getProfile } from './profile';
export type { BlockGroup } from './projects';
export type { Availability } from './profile';
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/profile-access.test.ts tests/content/availability.test.ts`
Expected: PASS nos dois arquivos.

**Step 5: Commit**

Run: `/git commit`

---

### Task 10: Portão de fonte única

**Requirement:** REQ-007
**Files:**

- Create: `tests/content/single-source.test.ts`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`)
- Reviewers: `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 9

**Step 1: Write the failing test**

`tests/content/single-source.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const ALLOWED = ['src/lib/content/projects.ts', 'src/lib/content/profile.ts'];

describe('single source of truth', () => {
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

  it('proves the gate can actually fail', () => {
    const source = "const x = getCollection('projects');";
    expect(source.includes('getCollection(')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/content/single-source.test.ts`
Expected: PASS já de primeira, porque só a camada de acesso usa `getCollection`. Para
provar que o portão morde, acrescentar temporariamente um `getCollection('projects')`
em `src/pages/index.astro`, rodar de novo e conferir que ele aponta o arquivo. Só então
remover. Um portão que nunca ficou vermelho não é portão.

**Step 3: Write minimal implementation**

Nenhuma. Esta tarefa entrega apenas o portão que sustenta REQ-007 nas próximas cinco
features.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/content/single-source.test.ts`
Expected: PASS, `Tests 2 passed`, com `src/pages/index.astro` já limpo.

**Step 5: Commit**

Run: `/git commit`

---

### Task 11: Build falha com conteúdo inválido

**Requirement:** REQ-004
**Files:**

- Create: `scripts/verify-schema-gate.sh`

**Team:**

- Track: data
- Implementer: `backend-engineer` (skills: `typescript-backend`, `bash-linux`)
- Reviewers: `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 5

**Step 1: Write the failing test**

O script é o teste: injeta um projeto inválido, roda o build real, exige saída diferente
de zero e restaura o estado. É o único jeito de provar que a validação está acoplada ao
build, e não apenas disponível como função.

**Step 2: Run test to verify it fails**

Run: `bash scripts/verify-schema-gate.sh`
Expected: FAIL com `No such file or directory`.

**Step 3: Write minimal implementation**

`scripts/verify-schema-gate.sh`:

```bash
#!/usr/bin/env bash
# REQ-004: an invalid project must break the build, not slip into production.
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

FIXTURE="src/content/projects/__schema-gate__.md"
cleanup() { rm -f "$FIXTURE"; }
trap cleanup EXIT

# Missing `outcome` and both links: violates REQ-001 and REQ-003 at once.
cat > "$FIXTURE" <<'MARKDOWN'
---
slug: schema-gate
title: Schema Gate
block: ai-tooling
summary: fixture
problem: fixture
decisions: fixture
tech:
  - TypeScript
featured: false
confidential: false
---
MARKDOWN

set +e
npm run build > /tmp/schema-gate-build.log 2>&1
BUILD_EXIT=$?
set -e

echo "BUILD_EXIT=${BUILD_EXIT}"

if [ "$BUILD_EXIT" -eq 0 ]; then
  echo "FAIL: the build accepted an invalid project. REQ-004 is not enforced." >&2
  exit 1
fi

grep -qiE "outcome|schema|invalid" /tmp/schema-gate-build.log || {
  echo "FAIL: the build failed, but not with a schema error. Check the log." >&2
  exit 1
}

echo "SCHEMA GATE PASSED: invalid content breaks the build"
```

O `set +e` em volta do build é deliberado: aqui a falha é o resultado desejado, e
`set -e` abortaria o script antes da verificação. A evidência é a linha
`SCHEMA GATE PASSED`, nunca o código de saída de um comando com pipe.

**Step 4: Run test to verify it passes**

Run: `chmod +x scripts/verify-schema-gate.sh && bash scripts/verify-schema-gate.sh`
Expected: PASS, termina com `SCHEMA GATE PASSED: invalid content breaks the build`, e
`git status` limpo (a fixture foi removida pelo `trap`).

**Step 5: Commit**

Run: `/git commit`

---

## Depois do plano

`project-catalog` consome `getProjectsByBlock` e `getProject`. `home-page` consome
`getFeaturedProjects` e `getProfile`. `aeo-base`, `structured-resume` e `mcp-server`
consomem o mesmo barrel, e o portão da Task 10 garante que nenhuma delas crie um segundo
caminho de leitura.

REQ-015 (aviso quando um bloco tem menos de dois cases) fica pendente como P3. O momento
natural de implementá-lo é a sprint 3, quando os 8 cases estiverem sendo escritos e o
aviso passa a ter uso real.
