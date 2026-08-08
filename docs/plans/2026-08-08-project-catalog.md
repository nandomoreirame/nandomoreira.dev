# Plan: Catálogo de projetos e experimentos

> **Spec:** `docs/specs/project-catalog/SPEC.md`

**Goal:** Grid agrupado pelos quatro blocos e uma página de case por projeto, gerados a partir da content collection, sem link quebrado, sem card quebrado e com JSON-LD por artefato.
**Architecture:** Duas rotas — `/projetos` (grid) e `/projetos/[slug]` (case), esta última com `getStaticPaths` derivado da camada de acesso, o que elimina rota manual por case. Toda decisão de lógica fica em funções puras sob `src/lib/catalog/`: quais links renderizar (`visibleLinks`) e qual tipo de JSON-LD escolher (`jsonLdForProject`). As páginas são casca fina sobre elas, e os componentes vêm inteiros de `design-system-foundation`.
**Tech Stack:** Astro 7.2.0 em `output: 'server'`, TypeScript 5.x, Vitest, `experimental_AstroContainer`.
**Total Tasks:** 10
**Estimated Complexity:** large (9+ tasks)

---

## Verificação de caminhos (§3.5)

`Files: Modify` declarados: **0**. Todas as 10 tarefas são `Create`.

Dependências de leitura que precisam existir antes de começar (criadas pelos planos das
outras duas features da sprint 2, não modificadas por este):
`src/lib/content/index.ts`, `src/layouts/BaseLayout.astro`,
`src/components/ui/ProjectCard.astro`, `src/components/ui/SectionHeader.astro`,
`src/components/ui/Prose.astro`, `src/content/blocks.ts`. Conferir sua existência no
início da execução; qualquer ausência significa que este plano começou fora de ordem.

---

### Task 1: Links visíveis de um projeto

**Requirement:** REQ-004
**Files:**

- Create: `src/lib/catalog/links.ts`
- Test: `tests/catalog/links.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `business-logic-reviewer`, `type-safety-reviewer`, `test-reviewer`

**Step 1: Write the failing test**

`tests/catalog/links.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { visibleLinks } from '../../src/lib/catalog/links';

describe('visibleLinks', () => {
  it('shows both links when the project has both', () => {
    const links = visibleLinks({
      repoUrl: 'https://github.com/x/y',
      liveUrl: 'https://y.app',
    });

    expect(links.map((link) => link.kind)).toEqual(['repo', 'live']);
  });

  it('omits the repo link entirely when the repository is private', () => {
    const links = visibleLinks({ repoUrl: null, liveUrl: 'https://y.app' });

    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('live');
  });

  it('omits the live link when there is no deployed version', () => {
    const links = visibleLinks({ repoUrl: 'https://github.com/x/y', liveUrl: null });

    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('repo');
  });

  it('never emits an entry with an empty href, which would render a dead anchor', () => {
    const links = visibleLinks({ repoUrl: null, liveUrl: 'https://y.app' });

    for (const link of links) {
      expect(link.href).toBeTruthy();
    }
  });

  it('treats undefined the same as null', () => {
    expect(visibleLinks({ repoUrl: undefined, liveUrl: 'https://y.app' })).toHaveLength(1);
  });

  it('labels each link with meaningful text, never "clique aqui"', () => {
    const links = visibleLinks({
      repoUrl: 'https://github.com/x/y',
      liveUrl: 'https://y.app',
    });

    expect(links.map((link) => link.label)).toEqual(['Ver repositório', 'Ver no ar']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/links.test.ts`
Expected: FAIL com `Failed to resolve import "../../src/lib/catalog/links"`.

**Step 3: Write minimal implementation**

`src/lib/catalog/links.ts`:

```ts
export interface ProjectLink {
  kind: 'repo' | 'live';
  href: string;
  label: string;
}

interface LinkSource {
  repoUrl?: string | null;
  liveUrl?: string | null;
}

/**
 * A private repository yields no entry at all. Rendering a disabled or empty
 * anchor is the broken-link failure the Flow 1 unhappy path warns about.
 */
export const visibleLinks = ({ repoUrl, liveUrl }: LinkSource): ProjectLink[] => {
  const links: ProjectLink[] = [];

  if (repoUrl) links.push({ kind: 'repo', href: repoUrl, label: 'Ver repositório' });
  if (liveUrl) links.push({ kind: 'live', href: liveUrl, label: 'Ver no ar' });

  return links;
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/links.test.ts`
Expected: PASS, `Tests 6 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 2: JSON-LD por artefato

**Requirement:** REQ-006
**Files:**

- Create: `src/lib/catalog/json-ld.ts`
- Test: `tests/catalog/json-ld.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `business-logic-reviewer`, `security-reviewer`, `type-safety-reviewer`, `test-reviewer`

**Step 1: Write the failing test**

`tests/catalog/json-ld.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { jsonLdForProject } from '../../src/lib/catalog/json-ld';

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    slug: 'forja',
    title: 'Forja',
    block: 'ai-tooling',
    summary: 'Cliente GUI multi-CLI para agentes de código',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Rust', 'Tauri'],
    repoUrl: 'https://github.com/x/forja',
    liveUrl: null,
    featured: true,
    confidential: false,
    ...overrides,
  }) as Project;

const SITE = 'https://nandomoreira.dev';

describe('jsonLdForProject', () => {
  it('uses SoftwareApplication when the project has a deployed version', () => {
    const ld = jsonLdForProject(project({ liveUrl: 'https://bragstack.app' }), SITE);
    expect(ld['@type']).toBe('SoftwareApplication');
  });

  it('uses CreativeWork when there is no deployed version', () => {
    expect(jsonLdForProject(project(), SITE)['@type']).toBe('CreativeWork');
  });

  it('always declares the schema.org context', () => {
    expect(jsonLdForProject(project(), SITE)['@context']).toBe('https://schema.org');
  });

  it('points the canonical url at the case page, not at the repository', () => {
    expect(jsonLdForProject(project(), SITE).url).toBe(`${SITE}/projetos/forja`);
  });

  it('omits codeRepository when the repository is private', () => {
    const ld = jsonLdForProject(project({ repoUrl: null, liveUrl: 'https://y.app' }), SITE);
    expect(ld).not.toHaveProperty('codeRepository');
  });

  it('serialises to valid JSON, since it is embedded in a script tag', () => {
    const serialised = JSON.stringify(jsonLdForProject(project(), SITE));
    expect(() => JSON.parse(serialised)).not.toThrow();
  });

  it('escapes a closing script tag in the content, which would break out of the tag', () => {
    const ld = jsonLdForProject(project({ summary: 'quebra </script> aqui' }), SITE);
    const serialised = JSON.stringify(ld).replaceAll('<', '\\u003c');

    expect(serialised).not.toContain('</script>');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/json-ld.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/lib/catalog/json-ld.ts`:

```ts
import type { Project } from '../../content/schemas/project';

export interface ProjectJsonLd {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication' | 'CreativeWork';
  name: string;
  description: string;
  url: string;
  keywords: string;
  codeRepository?: string;
  applicationCategory?: string;
}

/**
 * The type follows the artefact: something with a deployed version is an
 * application, everything else is a creative work. Deterministic, derived from
 * data that already exists, no extra schema field.
 */
export const jsonLdForProject = (project: Project, site: string): ProjectJsonLd => {
  const isApplication = Boolean(project.liveUrl);

  return {
    '@context': 'https://schema.org',
    '@type': isApplication ? 'SoftwareApplication' : 'CreativeWork',
    name: project.title,
    description: project.summary,
    url: `${site}/projetos/${project.slug}`,
    keywords: project.tech.join(', '),
    ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
    ...(isApplication ? { applicationCategory: 'DeveloperApplication' } : {}),
  };
};

/** Escapes `<` so user content can never break out of the script tag. */
export const serialiseJsonLd = (ld: ProjectJsonLd): string =>
  JSON.stringify(ld).replaceAll('<', '\\u003c');
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/json-ld.test.ts`
Expected: PASS, `Tests 7 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 3: Componente `LinkList`

**Requirement:** REQ-004
**Files:**

- Create: `src/components/catalog/LinkList.astro`
- Test: `tests/catalog/link-list.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 1

**Step 1: Write the failing test**

`tests/catalog/link-list.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import LinkList from '../../src/components/catalog/LinkList.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(LinkList, { props });
};

describe('LinkList', () => {
  it('renders nothing at all when the project has no visible link', async () => {
    const html = await render({ repoUrl: null, liveUrl: null });
    expect(html).not.toContain('<a');
  });

  it('renders only the live link for a private repository', async () => {
    const html = await render({ repoUrl: null, liveUrl: 'https://y.app' });

    expect(html).toContain('https://y.app');
    expect(html).not.toContain('github.com');
  });

  it('marks external links as such for screen readers and browsers', async () => {
    const html = await render({ repoUrl: 'https://github.com/x/y', liveUrl: null });

    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('uses meaningful link text', async () => {
    const html = await render({ repoUrl: 'https://github.com/x/y', liveUrl: null });

    expect(html).toContain('Ver repositório');
    expect(html).not.toContain('clique aqui');
  });
});
```

O primeiro caso não deveria ocorrer em produção, porque o schema garante ao menos um
link. Ele existe para que o componente nunca produza HTML quebrado se a regra for
relaxada no futuro.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/link-list.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/components/catalog/LinkList.astro`:

```astro
---
import { visibleLinks } from '../../lib/catalog/links';

interface Props {
  repoUrl?: string | null;
  liveUrl?: string | null;
}

const links = visibleLinks(Astro.props);
---

{
  links.length > 0 && (
    <ul class="flex flex-wrap gap-md">
      {links.map((link) => (
        <li>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center rounded-md border border-border-strong px-md py-sm text-body text-foreground transition-[border-color] duration-[--duration-fast] ease-[--ease-out] hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/link-list.test.ts`
Expected: PASS, `Tests 4 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 4: Componente `BlockSection`

**Requirement:** REQ-001, REQ-009, REQ-010
**Files:**

- Create: `src/components/catalog/BlockSection.astro`
- Test: `tests/catalog/block-section.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`

**Step 1: Write the failing test**

`tests/catalog/block-section.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BlockSection from '../../src/components/catalog/BlockSection.astro';

const project = {
  slug: 'forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI',
  tech: ['Rust'],
};

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(BlockSection, { props });
};

describe('BlockSection', () => {
  it('shows the human label of the block, not the slug', async () => {
    const html = await render({ block: 'ai-tooling', projects: [project], index: 1 });

    expect(html).toContain('Ferramental de AI coding');
    expect(html).not.toContain('>ai-tooling<');
  });

  it('renders an explicit empty state instead of vanishing', async () => {
    const html = await render({ block: 'systems-cli', projects: [], index: 3 });

    expect(html).toContain('Sistemas e CLI em Rust e Go');
    expect(html).toMatch(/nenhum case|em breve/i);
  });

  it('goes from one column to two and then three', async () => {
    const html = await render({ block: 'ai-tooling', projects: [project], index: 1 });

    expect(html).toContain('grid-cols-1');
    expect(html).toContain('sm:grid-cols-2');
    expect(html).toContain('lg:grid-cols-3');
  });

  it('uses a list, so assistive tech announces how many cases there are', async () => {
    const html = await render({ block: 'ai-tooling', projects: [project], index: 1 });
    expect(html).toContain('<ul');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/block-section.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/components/catalog/BlockSection.astro`:

```astro
---
import SectionHeader from '../ui/SectionHeader.astro';
import ProjectCard from '../ui/ProjectCard.astro';
import { BLOCK_LABELS, type Block } from '../../content/blocks';
import type { Project } from '../../content/schemas/project';

interface Props {
  block: Block;
  projects: Project[];
  index: number;
}

const { block, projects, index } = Astro.props;
---

<section class="mb-3xl" aria-labelledby={`bloco-${block}`}>
  <SectionHeader title={BLOCK_LABELS[block]} level={2} index={index} />

  {
    projects.length === 0 ? (
      <p class="rounded-md border border-border bg-surface p-lg text-body text-muted-foreground">
        Nenhum case publicado neste bloco ainda.
      </p>
    ) : (
      <ul class="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li>
            <ProjectCard
              slug={project.slug}
              title={project.title}
              summary={project.summary}
              tech={project.tech}
              image={project.images?.[0]}
            />
          </li>
        ))}
      </ul>
    )
  }
</section>
```

O `id` referenciado por `aria-labelledby` precisa existir no heading renderizado por
`SectionHeader`. Se ele ainda não aceitar `id`, estender o componente com uma prop
opcional em vez de duplicar o heading aqui.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/block-section.test.ts`
Expected: PASS, `Tests 4 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 5: Rota `/projetos`

**Requirement:** REQ-001, REQ-011
**Files:**

- Create: `src/pages/projetos/index.astro`
- Test: `tests/catalog/catalog-page.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 4

**Step 1: Write the failing test**

`tests/catalog/catalog-page.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/projetos/index.astro', 'utf8');

describe('/projetos', () => {
  it('reads projects through the access layer, never through getCollection', () => {
    expect(page).toContain('getProjectsByBlock');
    expect(page).not.toContain('getCollection(');
  });

  it('renders every block, so an empty one stays visible', () => {
    expect(page).toContain('BlockSection');
  });

  it('uses the shared layout', () => {
    expect(page).toContain('BaseLayout');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/catalog-page.test.ts`
Expected: FAIL com `ENOENT ... src/pages/projetos/index.astro`.

**Step 3: Write minimal implementation**

`src/pages/projetos/index.astro`:

```astro
---
import BlockSection from '../../components/catalog/BlockSection.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getProjectsByBlock } from '../../lib/content';

const groups = await getProjectsByBlock();
---

<BaseLayout
  title="Projetos e experimentos | nandomoreira.dev"
  description="Cases com problema, decisão técnica e resultado, agrupados pelos quatro blocos do acervo."
>
  <h1 class="mt-2xl mb-xl text-h1 font-semibold text-foreground">
    Projetos e experimentos
  </h1>

  {groups.map((group, position) => (
    <BlockSection block={group.block} projects={group.projects} index={position + 1} />
  ))}
</BaseLayout>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/catalog-page.test.ts && npm run build`
Expected: PASS, e o build gera a rota sem erro.

**Step 5: Commit**

Run: `/git commit`

---

### Task 6: Componente `CaseArticle`

**Requirement:** REQ-003, REQ-014
**Files:**

- Create: `src/components/catalog/CaseArticle.astro`
- Test: `tests/catalog/case-article.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 3

**Step 1: Write the failing test**

`tests/catalog/case-article.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const project = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling',
  summary: 'Cliente GUI multi-CLI',
  problem: 'O PROBLEMA',
  decisions: 'AS DECISOES',
  outcome: 'O RESULTADO',
  tech: ['Rust'],
  repoUrl: 'https://github.com/x/forja',
  liveUrl: null,
  featured: true,
  confidential: false,
};

const render = async (overrides: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, {
    props: { project: { ...project, ...overrides } },
  });
};

describe('CaseArticle', () => {
  it('presents problem, decisions and outcome in that order', async () => {
    const html = await render();

    expect(html.indexOf('O PROBLEMA')).toBeLessThan(html.indexOf('AS DECISOES'));
    expect(html.indexOf('AS DECISOES')).toBeLessThan(html.indexOf('O RESULTADO'));
  });

  it('starts the heading hierarchy at h1 and never skips a level', async () => {
    const html = await render();
    const levels = [...html.matchAll(/<h([1-6])/g)].map((match) => Number(match[1]));

    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('omits the image section entirely when the case has no image', async () => {
    expect(await render({ images: undefined })).not.toContain('<img');
  });

  it('renders several images in sequence, with no carousel', async () => {
    const html = await render({
      images: [
        { src: '/a.png', alt: 'Tela A' },
        { src: '/b.png', alt: 'Tela B' },
      ],
    });

    expect(html.match(/<img/g)).toHaveLength(2);
    expect(html).not.toContain('carousel');
    expect(html).not.toContain('client:');
  });

  it('lazy-loads images and declares dimensions, to protect CLS', async () => {
    const html = await render({ images: [{ src: '/a.png', alt: 'Tela A' }] });

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width=');
    expect(html).toContain('height=');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/case-article.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/components/catalog/CaseArticle.astro`:

```astro
---
import { BLOCK_LABELS } from '../../content/blocks';
import type { Project } from '../../content/schemas/project';
import Prose from '../ui/Prose.astro';
import TechBadge from '../ui/TechBadge.astro';
import LinkList from './LinkList.astro';

interface Props {
  project: Project;
}

const { project } = Astro.props;
---

<article class="mt-2xl mb-3xl flex flex-col gap-xl">
  <header class="flex flex-col gap-md">
    <p class="font-mono text-small text-primary">{BLOCK_LABELS[project.block]}</p>
    <h1 class="text-h1 font-semibold text-foreground">{project.title}</h1>
    <p class="text-body text-muted-foreground">{project.summary}</p>

    <ul class="flex flex-wrap gap-sm">
      {project.tech.map((item) => (
        <li>
          <TechBadge name={item} />
        </li>
      ))}
    </ul>

    <LinkList repoUrl={project.repoUrl} liveUrl={project.liveUrl} />
  </header>

  <section>
    <h2 class="mb-md text-h2 font-semibold text-foreground">O problema</h2>
    <Prose set:html={project.problem} />
  </section>

  <section>
    <h2 class="mb-md text-h2 font-semibold text-foreground">Decisões técnicas</h2>
    <Prose set:html={project.decisions} />
  </section>

  <section>
    <h2 class="mb-md text-h2 font-semibold text-foreground">Resultado</h2>
    <Prose set:html={project.outcome} />
  </section>

  {
    project.images && project.images.length > 0 && (
      <section>
        <h2 class="mb-md text-h2 font-semibold text-foreground">Imagens</h2>
        <div class="flex flex-col gap-lg">
          {project.images.map((image) => (
            <img
              src={image.src}
              alt={image.alt}
              width="1200"
              height="675"
              loading="lazy"
              class="w-full rounded-md border border-border"
            />
          ))}
        </div>
      </section>
    )
  }
</article>
```

`set:html` recebe conteúdo do próprio repositório, versionado e revisado, nunca entrada
de usuário. Se algum dia o conteúdo passar a vir de fora, sanitizar antes: `set:html`
com fonte não confiável é XSS.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/case-article.test.ts`
Expected: PASS, `Tests 5 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 7: Rota `/projetos/[slug]`

**Requirement:** REQ-003, REQ-011, REQ-013
**Files:**

- Create: `src/pages/projetos/[slug].astro`
- Test: `tests/catalog/case-page.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 6

**Step 1: Write the failing test**

`tests/catalog/case-page.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/projetos/[slug].astro', 'utf8');

describe('/projetos/[slug]', () => {
  it('derives its paths from the access layer, not from a hand-written list', () => {
    expect(page).toContain('getAllProjects');
    expect(page).not.toContain('getCollection(');
  });

  it('offers a way back to the catalogue', () => {
    expect(page).toContain('href="/projetos"');
  });

  it('embeds the per-case structured data', () => {
    expect(page).toContain('application/ld+json');
    expect(page).toContain('serialiseJsonLd');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run "tests/catalog/case-page.test.ts"`
Expected: FAIL com `ENOENT`. Aspas no caminho porque o nome do arquivo contém colchetes,
que o shell expande como glob.

**Step 3: Write minimal implementation**

`src/pages/projetos/[slug].astro`:

```astro
---
import CaseArticle from '../../components/catalog/CaseArticle.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { jsonLdForProject, serialiseJsonLd } from '../../lib/catalog/json-ld';
import { getAllProjects } from '../../lib/content';

export async function getStaticPaths() {
  const projects = await getAllProjects();

  return projects.map((project) => ({
    params: { slug: project.slug },
    props: { project },
  }));
}

const { project } = Astro.props;
const jsonLd = serialiseJsonLd(jsonLdForProject(project, Astro.site!.origin));
---

<BaseLayout
  title={`${project.title} | nandomoreira.dev`}
  description={project.summary}
>
  <script type="application/ld+json" is:inline set:html={jsonLd} />

  <nav class="mt-lg" aria-label="Trilha de navegação">
    <a
      href="/projetos"
      class="inline-flex min-h-11 items-center text-body text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      Voltar para projetos
    </a>
  </nav>

  <CaseArticle project={project} />
</BaseLayout>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run "tests/catalog/case-page.test.ts" && npm run build`
Expected: PASS, e o build gera uma rota por projeto da collection.

**Step 5: Commit**

Run: `/git commit`

---

### Task 8: 404 para slug inexistente

**Requirement:** REQ-007
**Files:**

- Create: `src/pages/404.astro`
- Test: `tests/catalog/not-found.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `security-reviewer`, `consequences-reviewer`, `test-reviewer`
**Depends on:** Task 7

**Step 1: Write the failing test**

`tests/catalog/not-found.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('404 handling', () => {
  it('ships a 404 page', () => {
    expect(existsSync('src/pages/404.astro')).toBe(true);
  });

  it('keeps the page out of the index', () => {
    expect(readFileSync('src/pages/404.astro', 'utf8')).toContain('noindex');
  });

  it('sends visitors back to the catalogue instead of a dead end', () => {
    expect(readFileSync('src/pages/404.astro', 'utf8')).toContain('href="/projetos"');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/not-found.test.ts`
Expected: FAIL nas três asserções.

**Step 3: Write minimal implementation**

`src/pages/404.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

Astro.response.status = 404;
---

<BaseLayout
  title="Página não encontrada | nandomoreira.dev"
  description="A página solicitada não existe."
  noindex
>
  <h1 class="mt-2xl mb-md text-h1 font-semibold text-foreground">
    Página não encontrada
  </h1>
  <p class="mb-lg text-body text-muted-foreground">
    O endereço acessado não corresponde a nenhuma página deste site.
  </p>
  <a href="/projetos" class="text-body text-primary underline">Ver todos os projetos</a>
</BaseLayout>
```

O status precisa ser 404 de verdade. Uma página de erro devolvida com 200 faz um agente
concluir que a URL era válida e que o projeto existe, que é o modo de falha declarado
na spec.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/not-found.test.ts`
Expected: PASS, `Tests 3 passed`.

Verificar o status real com o servidor de build local:
`curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/projetos/nao-existe`
Expected: `404`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 9: Verificação de integridade do catálogo renderizado

**Requirement:** REQ-004, REQ-005, REQ-008
**Files:**

- Create: `tests/catalog/rendered-integrity.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `consequences-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 5, Task 7

**Step 1: Write the failing test**

`tests/catalog/rendered-integrity.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BlockSection from '../../src/components/catalog/BlockSection.astro';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const privateRepoProject = {
  slug: 'cliente-x',
  title: 'Projeto de cliente',
  block: 'professional',
  summary: 'Plataforma interna',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  tech: ['TypeScript'],
  repoUrl: null,
  liveUrl: 'https://cliente.example.com',
  featured: false,
  confidential: false,
};

const renderCase = async (project: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, { props: { project } });
};

describe('rendered catalogue integrity', () => {
  it('never emits an anchor with a null or empty href', async () => {
    const html = await renderCase(privateRepoProject);

    expect(html).not.toContain('href="null"');
    expect(html).not.toContain('href=""');
    expect(html).not.toContain('href="undefined"');
  });

  it('falls back deterministically for a card with no image', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BlockSection, {
      props: {
        block: 'professional',
        projects: [privateRepoProject],
        index: 4,
      },
    });

    expect(html).not.toContain('<img');
    expect(html).toContain('CX');
  });

  it('never sets an element to a fixed width that could overflow 320px', async () => {
    const html = await renderCase(privateRepoProject);
    expect(html).not.toMatch(/\bw-\[\d{3,}px\]/);
    expect(html).not.toMatch(/min-w-\[\d{3,}px\]/);
  });

  it('ships no client-side island in the catalogue', async () => {
    expect(await renderCase(privateRepoProject)).not.toContain('client:');
  });
});
```

`CX` é o fallback determinístico de `cliente-x`, conforme `initialsFromSlug`.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/rendered-integrity.test.ts`
Expected: FAIL se algum dos quatro invariantes não estiver garantido pelas tarefas
anteriores. Verde de primeira também é resultado válido aqui: este é um teste de
regressão, e o valor dele é impedir que uma alteração futura reintroduza link morto ou
card quebrado.

**Step 3: Write minimal implementation**

Nenhuma, se os quatro passarem. Se algum falhar, corrigir o componente responsável, e
não o teste.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/rendered-integrity.test.ts`
Expected: PASS, `Tests 4 passed`.

**Step 5: Commit**

Run: `/git commit`

---

### Task 10: Ligar o catálogo à navegação

**Requirement:** REQ-013
**Files:**

- Create: `src/components/layout/SiteNav.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/catalog/site-nav.test.ts`

**Team:**

- Track: frontend
- Implementer: `frontend-engineer` (skills: `frontend-design`)
- Reviewers: `type-safety-reviewer`, `test-reviewer`, `accessibility-guardrails`
**Depends on:** Task 5

**Step 1: Write the failing test**

`tests/catalog/site-nav.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteNav, { props });
};

describe('SiteNav', () => {
  it('carries the four sections declared in the PRD', async () => {
    const html = await render();

    for (const label of ['Projetos', 'Sobre', 'Agents', 'Contato']) {
      expect(html).toContain(label);
    }
  });

  it('marks the current page for assistive technology', async () => {
    expect(await render({ current: '/projetos' })).toContain('aria-current="page"');
  });

  it('is a navigation landmark with an accessible name', async () => {
    const html = await render();

    expect(html).toContain('<nav');
    expect(html).toContain('aria-label=');
  });

  it('works without JavaScript, so no island and no toggle state', async () => {
    expect(await render()).not.toContain('client:');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog/site-nav.test.ts`
Expected: FAIL com import não resolvido.

**Step 3: Write minimal implementation**

`src/components/layout/SiteNav.astro`:

```astro
---
interface Props {
  current?: string;
}

const { current } = Astro.props;

const items = [
  { href: '/projetos', label: 'Projetos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/agents', label: 'Agents' },
  { href: '/contato', label: 'Contato' },
];
---

<nav aria-label="Navegação principal" class="border-b border-border py-md">
  <ul class="flex flex-wrap gap-lg">
    {items.map((item) => (
      <li>
        <a
          href={item.href}
          aria-current={current === item.href ? 'page' : undefined}
          class="inline-flex min-h-11 items-center text-body text-muted-foreground transition-[color] duration-[--duration-fast] ease-[--ease-out] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[current=page]:text-primary"
        >
          {item.label}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

Em `src/layouts/BaseLayout.astro`, inserir `<SiteNav current={Astro.url.pathname} />`
logo depois do skip link e antes do `<main>`. Os destinos `/sobre`, `/agents` e
`/contato` só existem depois de `home-page` (sprint 3) e de F9 (v1.1): até lá, apontar
para as âncoras da home ou marcar o item como pendente, nunca deixar um link para uma
rota que devolve 404.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog/site-nav.test.ts && npm test`
Expected: PASS, e a suíte inteira verde, incluindo os testes de `BaseLayout` da sprint 2.

**Step 5: Commit**

Run: `/git commit`

---

## Depois do plano

M2 do `MVP-SCOPE.md` fecha aqui: o catálogo renderiza a partir da content collection com
um case real. A sprint 3 preenche os outros sete e constrói a home sobre eles.

REQ-012 (dimensões e carregamento preguiçoso) já sai atendido pela Task 6. REQ-015
(cases relacionados) fica pendente como P3, e faz mais sentido quando os oito estiverem
publicados.
