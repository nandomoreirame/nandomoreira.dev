# Plano: correções da página Agora (`/now`)

> **Spec:** `docs/specs/now-page/SPEC.md`
> **Plano original:** `docs/plans/2026-10-11-now-page.md` (implementado até `977bbf8`)
> **Origem:** `/code-review` de 2026-10-11 sobre `6d3c881..977bbf8` (10 achados) mais 1 achado na leitura do código
> **Slug:** `now-page-fixes` · **Criado:** 2026-10-11
> **Profundidade:** Standard · **Tarefas:** 10 em 3 lotes · commit por tarefa, **nunca push**

**Objetivo:** fechar os 11 achados antes do primeiro push da `/now`. Três bloqueiam o push
(XSS na visão IA, segredos declarados sem existir, placeholder `TODO` em produção); os
outros erram o que a página mostra ou desperdiçam a cota das APIs.

**Regras desta rodada:**

- Cada tarefa começa pelo teste vermelho e roda `npx vitest run <arquivo>` antes e depois.
- Nenhum teste faz rede (mesma regra do plano original: `vi.stubGlobal('fetch', ...)`).
- **Não fazer push.** `main` publica sozinho, e os segredos ainda não existem.
- Nenhum portão existente é relaxado para passar; o teste de `apphosting.yaml` muda porque a decisão mudou (Task 2), não para ficar verde.

## Fatos verificados (código em `977bbf8`)

| Fato | Evidência |
|---|---|
| Visão IA renderiza markdown com `marked` e injeta com `set:html`, sem sanitizar | `src/components/ai-view/AiDocument.astro:41` |
| Texto externo entra cru no markdown | `src/lib/now/markdown.ts:45-75` (`repo.name`, `repo.description`, `track.title`, `track.artists`, `game.name`) |
| URLs externas não são validadas: `html_url` do GitHub e `external_urls.spotify` vão direto para `href` na página e no markdown | `src/lib/now/github.ts`, `src/lib/now/spotify.ts:80`, `src/pages/now.astro:51,78` |
| Só a disponibilidade passa por filtro de e-mail | `withoutEmail` em `src/lib/now/markdown.ts:6-8` |
| Padrões do portão de vazamento | `MACHINE_LEAKS` em `tests/helpers/machine-leaks.ts:2` |
| Cinco segredos declarados, nenhum criado | `apphosting.yaml:32-56`, `tests/now/apphosting.test.ts` exige os cinco |
| `NOW_GAMES` é um placeholder e o teste exige que continue | `src/lib/now/now.ts:29`, `tests/now/now-data.test.ts:30` |
| `day` do Spotify é calculado dentro do fetch e fica no cache | `parseRecentTracks` em `src/lib/now/spotify.ts:81`, chamado no `load` do cache em `src/lib/now/load.ts:64` |
| Dia em UTC no Xbox e no GitHub | `playedOn` (`iso.slice(0, 10)`) em `src/lib/now/xbox.ts:52`; `repo.pushedAt.slice(0, 10)` em `src/pages/now.astro:58` e `src/lib/now/markdown.ts:50` |
| Dia em São Paulo já existe, mas privado | `saoPauloDay` em `src/lib/now/spotify.ts:32` |
| `NOW_DECLINING` sai como segunda lista sem rótulo | `src/pages/now.astro:34-36`, `src/lib/now/markdown.ts:36-38` |
| Um item malformado do histórico derruba a seção inteira | `historySchema` estrito + `playedOn` lançando em `src/lib/now/xbox.ts:30-56,89-104` |
| Falha com valor antigo não renova `at` | `src/lib/now/cache.ts:22-24` |
| Espaço antes da pontuação | `src/pages/now.astro:51-60` (`</a>` seguido de quebra) e `:78-81` (`</a>` + `, {track.artists}`) |
| **Link do último post errado.** Posts ficam na raiz (`src/pages/[slug].astro`); não existe `src/pages/posts/[slug]` | `src/pages/now.astro:69`, `src/lib/now/markdown.ts:57` (`/posts/${slug}`) |
| Em dev, `getCurrentPosts()` põe rascunhos primeiro, então `posts[0]` pode ser um rascunho | `draftsFirst` em `src/lib/content/posts.ts:101-102`; `latest: posts[0]` em `src/lib/now/load.ts:121` |

## Ordem

```
Lote 1 (bloqueiam o push)   T1 → T2 → T3
Lote 2 (dados corretos)     T4 → T5 → T6 → T7
Lote 3 (robustez e forma)   T8 → T9 → T10
```

---

## Lote 1: bloqueiam o push

### Task 1: texto e URLs externos seguros na página e na visão IA

**Achados:** XSS em `/now/ia` (1), vazamento em `/now.md` (7) · **REQ:** REQ-011, REQ-015
**Files:** Create `src/lib/now/safe.ts`; Modify `src/lib/now/github.ts`, `src/lib/now/spotify.ts`, `src/lib/now/markdown.ts`; Test `tests/now/safe.test.ts`, `tests/now/now-markdown.test.ts`, `tests/aeo/no-leak.test.ts`
**Team:** backend · implementer `backend-engineer` (typescript-backend, security-guardrails) · reviewers security-reviewer, test-reviewer

Duas defesas, nas duas pontas:

1. **Na entrada (parser):** URL externa só passa com host na lista. `html_url` precisa começar com `https://github.com/`; `external_urls.spotify` com `https://open.spotify.com/`. Item com URL fora da lista é **descartado** (não vira link para lugar nenhum). Faz isso com `.refine` no schema Zod do item e `safeParse` por item, para um item ruim não derrubar os outros.
2. **Na saída de máquina (`nowMarkdown`):** todo texto que veio de API passa por `machineText()`, que (a) escapa `&`, `<`, `>` como entidades HTML e (b) faz backslash-escape de `\`, `` ` ``, `*`, `_`, `[`, `]`, `(`, `)`, `#`, `|`. Campo opcional (descrição do repo) que casar com um padrão de vazamento é **omitido**; campo obrigatório (nome do repo, título da faixa, artista, nome do jogo) que casar faz o **item inteiro** sumir.

**Step 1 (Red), `tests/now/safe.test.ts`:**

```ts
import { describe, expect, it } from 'vitest';
import { isAllowedUrl, machineText, leaksToMachine } from '../../src/lib/now/safe';

describe('machineText', () => {
  it('turns raw HTML into inert text', () => {
    expect(machineText('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert\\(1\\)&gt;');
  });

  it('neutralises markdown link syntax', () => {
    expect(machineText('[x](javascript:alert(1))')).toBe('\\[x\\]\\(javascript:alert\\(1\\)\\)');
  });

  it('keeps plain text intact', () => {
    expect(machineText('Red Dead Redemption 2')).toBe('Red Dead Redemption 2');
  });
});

describe('isAllowedUrl', () => {
  it('accepts only https on the expected host', () => {
    expect(isAllowedUrl('https://github.com/nandomoreirame/forja', 'github.com')).toBe(true);
    expect(isAllowedUrl('javascript:alert(1)', 'github.com')).toBe(false);
    expect(isAllowedUrl('http://github.com/x', 'github.com')).toBe(false);
    expect(isAllowedUrl('https://github.com.evil.io/x', 'github.com')).toBe(false);
  });
});

describe('leaksToMachine', () => {
  it('flags e-mail, absolute path, key-like text and private IP', () => {
    for (const text of ['fale em x@y.com', 'roda em /var/lib/x', 'api_key= abc', 'ip 192.168.0.2']) {
      expect(leaksToMachine(text), text).toBe(true);
    }
    expect(leaksToMachine('CLI de normalização de dados')).toBe(false);
  });
});
```

**Step 3 (Green), `src/lib/now/safe.ts`:**

```ts
/**
 * Text that reaches /now.md and /now/ia from Spotify, GitHub or OpenXBL is not
 * the author's: /now/ia renders markdown as HTML (marked + set:html), so it is
 * escaped here, and anything that looks like a leak never reaches a machine route.
 */
const HTML: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

export const machineText = (text: string): string =>
  text.replace(/[&<>]/g, (char) => HTML[char]!).replace(/([\\`*_[\]()#|])/g, '\\$1');

export const isAllowedUrl = (url: string, host: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === host;
  } catch {
    return false;
  }
};

// Same intent as tests/helpers/machine-leaks.ts. The test file stays the
// independent gate; this list only decides what to drop before rendering.
const LEAKS = [
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  /\/(home|Users|var|etc)\//,
  /(api[_-]?key|secret|token|bearer)\s*[:=]/i,
  /\b(10|127|192\.168)\.\d+\.\d+\.\d+\b/,
];

export const leaksToMachine = (text: string): boolean => LEAKS.some((pattern) => pattern.test(text));
```

**Também neste task:**

- `withoutEmail` sai de `markdown.ts`; a disponibilidade passa por `leaksToMachine` (vaza → linha omitida) e `machineText`.
- `tests/now/now-markdown.test.ts`: snapshot hostil (faixa `<script>alert(1)</script>`, descrição `contato: x@y.com`, repo com `html_url: 'javascript:alert(1)'` já descartado no parser) → o markdown não contém `<script`, não casa nenhum `MACHINE_LEAKS`, e `renderMarkdown(nowMarkdown(...))` não contém `<script` nem `onerror=`.
- `tests/aeo/no-leak.test.ts`: acrescentar `nowMarkdown` com esse mesmo snapshot hostil à lista `outputs()`, para o portão geral cobrir a `/now` e não só o teste da feature.
- `tests/now/github.test.ts` e `tests/now/spotify.test.ts`: item com URL fora do host some, e os outros itens continuam.

Run: `npx vitest run tests/now tests/aeo/no-leak.test.ts` → verde.

### Task 2: `apphosting.yaml` sem segredos inexistentes

**Achado:** push quebra o rollout (2) · **REQ:** REQ-017
**Files:** Modify `apphosting.yaml`, `tests/now/apphosting.test.ts`, `CLAUDE.md`, `docs/specs/now-page/SPEC.md`
**Team:** infra · `infra-engineer` (cloud-cli) · reviewers security-reviewer, consequences-reviewer

**Decisão desta tarefa:** o `apphosting.yaml` só declara segredo que **já existe** no Secret Manager. Como nenhum dos cinco existe hoje, o bloco `/now` sai inteiro do arquivo. `readNowConfig` já trata variável ausente como "fonte desligada", então a página publica com Projetos (GitHub público sem token), Escrevendo e Foco, e com Ouvindo e Jogando em estado vazio ou reserva. `GITHUB_TOKEN` deixa de ser declarado: é opcional e o cache de 30 min cabe no limite anônimo.

- Remover as cinco entradas e o comentário do bloco `/now` de `apphosting.yaml`.
- **Step 1 (Red):** reescrever `tests/now/apphosting.test.ts` para a regra nova: **se** alguma das variáveis da `/now` estiver declarada, ela usa `secret:` e nunca `value:`; e `GITHUB_TOKEN` não é exigido. O teste continua provando a regra de segurança, sem exigir segredo que não existe. Rodar contra o YAML atual (com os cinco) → passa na parte de `secret:`; contra uma cópia com `value: abc` numa delas (fixture string no próprio teste) → falha. Isso prova que o portão ainda morde.
- `CLAUDE.md`, seção Deploy: subseção curta "Ligar as fontes da `/now`" com, para cada fonte, a ordem obrigatória: (1) `firebase apphosting:secrets:set <nome>`; (2) `firebase apphosting:secrets:grantaccess <nome> --backend nandomoreira-dev`; (3) só então acrescentar a entrada no `apphosting.yaml` e fazer push. Nomes: `now-openxbl-api-key` → `OPENXBL_API_KEY`; `now-spotify-client-id`, `now-spotify-client-secret`, `now-spotify-refresh-token` → as três `SPOTIFY_*`.
- `SPEC.md`: REQ-017 passa a dizer "QUANDO uma fonte da `/now` é ligada em produção ENTÃO sua credencial DEVE vir do Secret Manager por `apphosting.yaml`, declarada só depois de o segredo existir"; Grilling Log ganha a linha 13 com essa decisão.

### Task 3: reserva de jogos sem placeholder

**Achado:** `TODO(author)` em produção (3) · **REQ:** REQ-010
**Files:** Modify `src/lib/now/now.ts`, `src/lib/now/load.ts`, `tests/now/now-data.test.ts`, `tests/now/load.test.ts`
**Team:** backend · `backend-engineer` · reviewers business-logic-reviewer, test-reviewer

- `NOW_GAMES` vira `[]` (o autor preenche quando quiser; o comentário diz isso).
- `load.ts`: quando a OpenXBL não serve (falha, sem chave ou histórico vazio) e `NOW_GAMES` está vazio, a seção é `{ state: 'empty' }`, não `fallback` com lista vazia.
- **Step 1 (Red):**
  - `now-data.test.ts`: troca o teste que exige o placeholder por um que **reprova** `TODO` em qualquer texto curado (`NOW_FOCUS`, `NOW_DECLINING`, `NOW_GAMES`, `NOW_LEAD`).
  - `load.test.ts`: sem chave e com `NOW_GAMES` vazio → `games.state === 'empty'`; com `NOW_GAMES` preenchido (injetado via parâmetro, ver abaixo) → `fallback`.
- Para testar os dois lados sem mexer no módulo, `createNowLoader` recebe `fallbackGames = NOW_GAMES` como parâmetro opcional.

---

## Lote 2: dados corretos

### Task 4: dia no fuso de São Paulo, compartilhado

**Achado:** datas em UTC no Xbox e no GitHub (5) · **REQ:** REQ-005, REQ-009
**Files:** Create `src/lib/now/day.ts`; Modify `src/lib/now/spotify.ts`, `src/lib/now/xbox.ts`; Test `tests/now/day.test.ts`, `tests/now/xbox.test.ts`
**Team:** backend · `backend-engineer` · reviewers business-logic-reviewer, test-reviewer

- Mover `saoPauloDay`, `shiftDay` e `dayLabel` de `spotify.ts` para `day.ts` e exportá-los. `saoPauloDay(instant: Date): string` devolve `YYYY-MM-DD` em `America/Sao_Paulo`.
- `xbox.ts`: `lastPlayed = saoPauloDay(new Date(iso))`; data inválida (`Number.isNaN(date.getTime())`) devolve `undefined` (o item é descartado na Task 8, não lança aqui).
- **Step 1 (Red), `day.test.ts`:** `saoPauloDay(new Date('2026-10-12T01:00:00Z'))` → `'2026-10-11'` (22h de 11/10 em SP); `'2026-10-11T03:00:00Z'` → `'2026-10-11'`; `'2026-10-11T02:59:00Z'` → `'2026-10-10'`. Os testes de `dayLabel` que estavam em `spotify.test.ts` vêm junto.
- `xbox.test.ts`: título com `lastTimePlayed: '2026-10-12T01:00:00Z'` → `lastPlayed: '2026-10-11'`.

### Task 5: rótulo "hoje"/"ontem" calculado na renderização

**Achado:** rótulo do Spotify congelado no cache (4) · **REQ:** REQ-008, REQ-012
**Files:** Modify `src/lib/now/spotify.ts`, `src/lib/now/load.ts`, `src/lib/now/markdown.ts`, `src/pages/now.astro`; Test `tests/now/spotify.test.ts`, `tests/now/load.test.ts`
**Team:** backend · `backend-engineer` · reviewers business-logic-reviewer, test-reviewer

- `RecentTrack` troca `day` por `playedAt: string` (ISO). `parseRecentTracks` não recebe mais `now`.
- O cache guarda `RecentTrack[]` sem rótulo. O snapshot exposto à página leva `day`: `loadNow` monta `music.items` como `{ ...track, day: dayLabel(track.playedAt, clock()) }` **depois** de ler o cache. Novo tipo `RecentTrackView = RecentTrack & { day: string }` no `NowSnapshot`.
- **Step 1 (Red), `load.test.ts`:** relógio injetado em 2026-10-11T15:00Z; Spotify responde uma faixa tocada em 2026-10-11T12:00Z → `day === 'hoje'`; avança o relógio para 2026-10-13T15:00Z com a fonte **falhando** (valor antigo servido) → a mesma faixa agora diz `11 de out.`, não `hoje`.

### Task 6: Foco com "Recusando agora" rotulado

**Achado:** recusas lidas como prioridades (6) · **REQ:** REQ-004
**Files:** Modify `src/pages/now.astro`, `src/lib/now/markdown.ts`; Test `tests/now/now-page.test.ts`, `tests/now/now-markdown.test.ts`
**Team:** frontend · `frontend-engineer` (tailwind-conventions, accessibility-guardrails) · reviewers accessibility-guardrails

- Página: dentro da seção Foco, depois da lista de prioridades, um `<h3>` "Recusando agora" seguido da lista de `declining`; depois um `<p>` com "Disponibilidade: …". O `h3` fica sob o `h2` "Foco" (hierarquia válida).
- Markdown: `### Recusando agora` e a linha `Disponibilidade: …`.
- **Step 1 (Red):** a página tem o `h3` "Recusando agora" e a primeira frase de `NOW_DECLINING` aparece **depois** dele no HTML; o markdown tem `### Recusando agora` entre `## Foco` e `## Projetos em andamento`.

### Task 7: link e escolha do último post

**Achado:** link `/posts/<slug>` vai para 404; em dev o "último post" pode ser rascunho (11) · **REQ:** REQ-007
**Files:** Modify `src/pages/now.astro`, `src/lib/now/markdown.ts`, `src/lib/now/load.ts`; Test `tests/now/now-page.test.ts`, `tests/now/now-markdown.test.ts`, `tests/now/load.test.ts`
**Team:** backend · `backend-engineer` · reviewers business-logic-reviewer

- Link do post: `/${post.slug}` na página e `absoluteUrl(site, `/${post.slug}`)` no markdown. Antes de escrever, conferir se existe helper de URL de post (`grep -rn "postPath\|postUrl" src/lib`) e usá-lo se existir.
- `latest`: o primeiro post com `draft !== true` (`posts.find(...)`), não `posts[0]`.
- **Step 1 (Red):** página e markdown apontam para `/<slug>`, nunca contêm `/posts/<slug>`; `load.test.ts` com lista `[rascunho, publicado]` → `latest` é o publicado.

---

## Lote 3: robustez e forma

### Task 8: histórico do Xbox tolerante a item malformado

**Achado:** um item ruim derruba a seção (8) · **REQ:** REQ-009, REQ-011
**Files:** Modify `src/lib/now/xbox.ts`; Test `tests/now/xbox.test.ts`
**Team:** backend · `backend-engineer` · reviewers business-logic-reviewer, test-reviewer

- `historySchema` valida só o envelope: `content.titles: z.array(z.unknown())`. Cada entrada passa por `titleSchema.safeParse`; entrada inválida, sem `titleHistory`, ou com data inválida (Task 4) é descartada. `SourceError('shape')` só quando o envelope falha.
- `fetchXbox` deixa de chamar `parseRecentGames` com `limit: Infinity` sobre tudo: chama com o limite normal para `recent` e passa à presença a lista **sem corte** já filtrada (o comportamento de exclusão de `Microsoft Jewel` e o "próximo ocupa a vaga" não mudam; os testes atuais disso continuam verdes).
- **Step 1 (Red):** histórico com 6 jogos válidos e, no meio, um com `titleHistory: null` e outro com `lastTimePlayed: 'ontem'` → 5 jogos válidos, sem lançar.

### Task 9: cache lembra a falha

**Achado:** toda requisição espera o timeout durante uma queda (9) · **REQ:** REQ-012
**Files:** Modify `src/lib/now/cache.ts`, `src/lib/now/now.ts` (constante); Test `tests/now/cache.test.ts`
**Team:** backend · `backend-engineer` · reviewers performance-guardrails, test-reviewer

Comportamento novo:
- Falha **com** valor antigo: serve o antigo e trata como fresco por `failureTtlMs` (não tenta de novo a cada requisição).
- Falha **sem** valor antigo: guarda o erro por `failureTtlMs` e rejeita na hora durante esse período, sem chamar a fonte.
- `failureTtlMs` default 60 s (`NOW_FAILURE_TTL_MS = 60_000` em `now.ts`), passado por `load.ts` às três fontes.

**Step 1 (Red), acrescentar a `tests/now/cache.test.ts`:**

```ts
it('does not retry a failing source inside the failure window', async () => {
  const c = clock();
  const load = vi.fn().mockResolvedValueOnce(['a']).mockRejectedValue(new Error('down'));
  const get = createCachedSource({ ttlMs: 1000, failureTtlMs: 60_000, load, now: c.now });
  await get();
  c.advance(1000);
  expect(await get()).toEqual(['a']);
  c.advance(30_000);
  expect(await get()).toEqual(['a']);
  expect(load).toHaveBeenCalledTimes(2);
});

it('rejects fast without calling the source after a first failure', async () => {
  const c = clock();
  const load = vi.fn().mockRejectedValue(new Error('down'));
  const get = createCachedSource({ ttlMs: 1000, failureTtlMs: 60_000, load, now: c.now });
  await expect(get()).rejects.toThrow('down');
  c.advance(10_000);
  await expect(get()).rejects.toThrow('down');
  expect(load).toHaveBeenCalledTimes(1);
  c.advance(60_000);
  await expect(get()).rejects.toThrow('down');
  expect(load).toHaveBeenCalledTimes(2);
});
```

**Step 3 (Green):** no `catch`, com valor antigo: `value = { data: value.data, at: now() - ttlMs + failureTtlMs }` e devolve `value.data`; sem valor: `failure = { error, at: now() }` e relança. No início da função, `if (!value && failure && now() - failure.at < failureTtlMs) throw failure.error;`. Sucesso limpa `failure`. Os 5 testes antigos continuam verdes (com `failureTtlMs` default).

### Task 10: espaços e separadores dos itens

**Achado:** "Song , Artist" e itens de projeto colados (10) · **REQ:** REQ-005, REQ-008
**Files:** Modify `src/pages/now.astro`; Test `tests/now/now-page.test.ts`
**Team:** frontend · `frontend-engineer` (tailwind-conventions) · reviewers accessibility-guardrails

- Ouvindo: `<a>` e o resto na mesma expressão, sem quebra de linha entre `</a>` e `,`: `<a ...>{track.title}</a>{`, ${track.artists}. ${track.day}`}`.
- Projetos: `nome: descrição. Linguagem. Último push em <time>.` O `TechBadge` fica, mas separado por um espaço explícito e com o ponto depois; sem descrição, `nome. Linguagem. Último push em …`. A data usa `saoPauloDay` (Task 4) em `datetime` e no texto, nunca `pushedAt.slice(0, 10)`.
- **Step 1 (Red):** no HTML renderizado (com o texto normalizado por `replace(/\s+/g, ' ')` depois de remover as tags), nenhum ` ,`, ` :` ou ` .` aparece; um repo com push em `2026-10-12T01:30:00Z` mostra 11 de outubro.

---

## Fechamento (Claude, não o Grok)

```bash
npm run verify > /tmp/now-fixes-verify.log 2>&1; echo "VERIFY_EXIT=$?"
grep -E "Tests .*passed|failed" /tmp/now-fixes-verify.log | tail -3
bash scripts/verify-aeo-routes.sh > /tmp/now-fixes-aeo.log 2>&1; grep "AEO ROUTES PASSED" /tmp/now-fixes-aeo.log || echo "AEO FAILED"
```

Depois, uma prova manual do XSS contra o build: subir `dist/server/entry.mjs` com um `fetch` real e conferir em `/now/ia` que nenhum `<script` vindo de fonte externa existe (o teste da Task 1 cobre o caminho; esta prova cobre a montagem). Rodar `/code-review` de novo sobre o intervalo destes commits. **Push só depois de o autor revisar.**
