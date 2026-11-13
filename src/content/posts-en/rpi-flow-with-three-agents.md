---
slug: rpi-flow-with-three-agents
translationOf: fluxo-rpi-claude-code-grok-codex
title: "RPI flow with three agents: Claude Code plans, Grok implements, Codex reviews"
seoTitle: "RPI flow: Claude Code plans, Grok implements"
summary: "Research and plan before any feature, the way I already worked. Claude Code leads, Grok writes, Codex reviews, and the test comes before the code even when that makes the AI slower."
markers:
  - claude code
  - rpi
  - agents
extras:
  - "3 models, 1 task at a time, test first"
  - "Claude Code · Grok · Codex"
keyPoints:
  - "Research and spec before code: by the time of implementation, no decision is left for the agent to make."
  - "Grok implements, Codex reviews in a sandbox, and only Claude commits; git writes are blocked by permission."
  - "Exit 3 means unavailable and swaps the executor; any other failure goes back for a fix, up to two rounds."
snapshot:
  items:
    - label: Orchestrator
      value: Claude Code
    - label: Implements
      value: Grok
    - label: Reviews
      value: Codex
    - label: Scripts
      value: shell
    - label: Format
      value: markdown
---

I have started many projects where research and planning come before any feature. RPI came out of that. There was no single project, and no diff I looked at and thought "now I will invent a method". As a senior engineer, that order was already mine. Passing it to the agent felt natural.

The wrong question is which model writes best. In my flow, what changes the result is the order. Claude Code leads and decides. Grok writes the code for each task. Codex reviews the diff. Claude closes the books: commits the reviewed task and, at the end, runs lint, type-check, tests and build over the whole feature.

This site was built that way. The examples below come from it.

```bash
/rpi:research ai-view     # entrevista e escreve a spec
/rpi:plan ai-view         # transforma a spec em tarefas atômicas
/rpi:implement ai-view    # executa as tarefas, uma por vez
```

RPI is Research, Plan and Implement. Separating those phases is not new. What I did was spread each phase across different models, and leave Claude Code in the middle, driving.

## The decision is written before the code

Asking to "add an AI view on every page" hides a pile of choices: which route, what happens to a page with no markdown, whether JavaScript comes in, how to copy the content, what goes into the sitemap. If nobody asks, the agent picks, and I find the choice in code review.

I spend the time **before** any code exists, when changing my mind costs one line of text. By the time of implementation, no decision is left for the agent to make.

## The command I type almost has no content

Each slash command is a short markdown file, and its job is to call the skill:

```markdown
---
name: rpi:research
description: "Phase R of RPI - explore requirements and produce a spec"
---

Invoke the `rpi-research` skill and follow it exactly as presented to you.

User's input: $ARGUMENTS
```

The logic lives in the skills (`rpi-research`, `rpi-plan`, `rpi-implement`). The mechanical steps live in shell scripts. The command only routes. I evolve the process without changing what I type.

## The spec comes from questions, not guesses

`/rpi:research` starts by reading. Code, project documents, specs that already exist. It only asks what is written nowhere, one question at a time.

On a medium or large feature a stage I call grilling comes in, adapted from Matt Pocock's `grill-me`. It walks the decision tree, one node at a time, and proposes an answer with the rationale. I react to a proposal instead of thinking from scratch. If the answer is in the code, the agent goes and gets it. If it is my choice, it asks and waits.

The result is `docs/specs/<slug>/SPEC.md`. On this site the requirements are in Portuguese, in the form `QUANDO [evento] ENTÃO o sistema DEVE [resposta]`:

```markdown title="docs/specs/<slug>/SPEC.md"
1. [REQ-001] QUANDO qualquer página coberta renderiza ENTÃO o sistema DEVE
   exibir um switcher fixo no canto inferior direito, **Humano | IA**, com
   "Humano" marcado como atual e "IA" como link para `<página>/ia`.
```

Every requirement has an ID. That ID follows the task, the test and the commit. The spec also records what was left out, so the same discussion does not come back the week after.

No spec is saved without my approval.

## The task has to fit in the hand of someone who did not read the chat

`/rpi:plan` breaks the feature into two-to-five-minute tasks. Each one states the requirement, the files, the test that comes first and the command that proves it passed:

```markdown
### Task 1: `marked` e `renderMarkdown`

**Requirement:** REQ-002 · **Files:** Create `src/lib/ai-view/render.ts`;
Modify `package.json`; Test `tests/ai-view/render.test.ts`

- `npm install marked@18.1.0 --save-exact`; rodar `npm audit --omit=dev`.
- `renderMarkdown(source: string): string` usa `marked.parse(source, { async: false, gfm: true })`.
- Antes de renderizar, remover um frontmatter YAML inicial, que não é conteúdo.
- Testes: título vira `<h1>`, lista vira `<ul>`, frontmatter some, link mantém `href`.
```

**An engineer without the chat context has to be able to run the task.** In practice that engineer is another model. It did not read the chat, does not know the project and only gets the text. If the plan depends on something that only lives in my head, it is incomplete.

Before saving, the plan checks that every file marked "Modify" exists. A wrong path becomes a new file in the wrong place.

## Three models, and me at the terminal

For each task, in sequence:

| Step | Who | How |
|---|---|---|
| Implements code and test | Grok | `grok-implement.sh`, headless |
| Reviews the task diff | Codex | `codex-review.sh`, read-only sandbox |
| Commits the task and, at the end, validates the feature | Claude Code | commit per task; lint, type-check, tests and build at the end |

Claude Code stays in the orchestrator role. It reads the task, builds the prompt with the task text, the project context and the TDD rule, and hands it to Grok:

```bash
grok-implement.sh --prompt-file /tmp/grok-task-3.md --cwd <projeto>
```

When Grok finishes, Claude sends that task's diff to Codex, with the review rules in the text itself, because Codex does not read Claude's skills:

```bash
codex-review.sh --mode panel --cwd <projeto> \
  --prompt-file /tmp/codex-task-3.md --out /tmp/codex-task-3.rows
```

Codex returns findings by severity. Critical or high goes back to Grok, at most two rounds. If there is still a problem, the flow stops and calls me. Medium or low continues.

I follow this closely. I like reading the AI's thoughts straight in the terminal, task by task. I do not wait for the state file to know that something stalled.

Codex finds something almost every time. Usually it is a code fix, a hallucination from the implementer. On this site's [MCP](https://modelcontextprotocol.io) server it found a case neither the implementer nor I had seen: closing the server in a `finally` emptied the response before it went out, and not closing leaked one server per request. The fix was to defer the close until the end of the stream.

## Grok and Codex do not commit

It is not a request in the prompt, which the model can ignore. Grok's script passes a list of denied commands to the CLI itself:

```bash
DENY_RULES=(
  "Bash(git commit:*)"
  "Bash(git push:*)"
  "Bash(git add:*)"
  "Bash(git merge:*)"
  "Bash(git reset:*)"
  # ...
)
```

Grok can run `git status` and `git diff`. Writes are blocked. Codex runs in a read-only sandbox. Who commits is Claude, after the review. Push only when I ask.

I learned to block the expensive way. I gave a CLI a list of files to commit and it made five commits: the one I asked for plus four more groups of changes that were dirty in the tree. A scope list does not constrain an agent. Permission does.

## When one of them falls, I see it right away

Grok and Codex depend on quota, auth and network. The scripts split the failure by exit code:

| Exit | Meaning | What the flow does |
|---|---|---|
| `0` | Finished | Continues |
| `3` | Unavailable: quota, auth, rate limit, network or timeout | Claude takes that step through the end of the feature |
| other | Ran, but failed | Fix round, up to two times |

"Grok did not answer" and "Grok wrote wrong code" ask for different reactions. In the first I swap the executor. In the second I send the problem back and ask again.

On this site's AI view I noticed right away, because I was at the terminal. Grok did tasks 1 through 6, timed out in the middle of 7, and Claude took over from there. Codex was out of quota, so the review was Claude's too. The feature shipped whole, ten tasks, green suite. Because each task stands on its own, Claude picked up 7 from the point where Grok stopped, without needing the conversation.

## Each feature has its own diary

State lives in `docs/specs/<slug>/STATE.md`:

```yaml title="docs/specs/<slug>/STATE.md"
---
feature: ai-view
phase: none
started_at: 2026-10-08
depth: standard
spec_path: docs/specs/ai-view/SPEC.md
plan_path: docs/plans/2026-10-08-ai-view.md
---
```

There is no global state. I run two sessions at once, in different terminals, one researching while the other implements, without one overwriting the other. Two features in the same repository go to separate worktrees.

That is the file that records who implemented what, what fell over and which evidence showed it was done.

## The gate that said PASS without having run

A gate that reports success without having run is worse than no gate at all.

In an older version, the script ran lint, type-check and build, and did not run the suite. A round closed with `result: PASS` and seven red tests. Compiling is not passing the test. In another, run from the wrong folder, it found no tool at all, skipped everything with a warning and reported `PASS` with zero verification.

Today the gate runs lint, formatting, type-check, the suite and the build. I do not read `PASS` without looking at the lines above. A skipped step is not a green step. The danger, with an agent, is the green nobody questions. The red someone will investigate.

## Day to day

New feature:

```bash
/rpi:research hire-endpoint
/rpi:plan hire-endpoint
/rpi:implement hire-endpoint
```

You can plan several and implement them all at once:

```bash
/rpi:implement mcp-server hire-endpoint structured-resume --agentic
```

A small fix that does not deserve a spec goes through `/dev:implement`, the same trio in a single task.

I do not use RPI for everything. Changing a color, fixing a line of copy or tweaking spacing goes straight. The flow starts when there is a decision to make.

## What I keep

I like the way it is. For now I would not change much. I keep tinkering with how I work, and at some point I change one piece or another. Today's design I stand behind.

People have disagreed with me. They said the flow is too rigid, because the test comes before the implementation and the AI takes longer to finish the work. I hold the line. A test is essential on any feature.

`/exit`
