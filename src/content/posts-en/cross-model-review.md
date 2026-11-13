---
slug: cross-model-review
translationOf: revisao-cruzada-entre-modelos
title: "Cross-model review: why a second agent finds what the first one misses"
seoTitle: "Cross-model review: a second agent finds more"
summary: "Different models fail in different places. How I put a second model to review the code the first one wrote, how I merge both sets of findings, what Codex caught on this site and why today the reviewer is agy."
markers:
  - code review
  - agents
  - quality
extras:
  - "6 reviewers, 2 models, 1 aggregator"
  - "Claude Code · agy · Codex"
keyPoints:
  - "A single reviewer latches onto the first topic; six reviewers with one topic each go through the diff in parallel."
  - "A finding pointed out by two different models weighs more: coincidence becomes much harder to call chance."
  - "agy's sandbox does not block writes, so it reviews a disposable copy of the repository and never the real one."
snapshot:
  items:
    - label: "Principal"
      value: "Claude Code"
    - label: "External reviewer"
      value: "agy"
    - label: "Before"
      value: "Codex"
    - label: "Aggregator"
      value: "review_aggregate.py"
    - label: "Time limit"
      value: "540 seconds"
---

Closing this site's [MCP](https://modelcontextprotocol.io) server in a `finally` around `handleRequest` is the obvious way, and it is wrong. `handleRequest` resolves as soon as the `Response` exists, before anyone reads the body, so the close kills the stream mid-flight and the client gets an empty body. Not closing flips the problem: one leaked server per request, on an instance that accepts 80 at once.

The way out was to hang the close on the end of the stream, firing once on completion, cancel or error (`src/lib/mcp/lifecycle.ts`). In the feature's state file, that decision has a note at the end: a Codex finding, reviewing code it did not write. If you let the same model write and review, it agrees with itself even on the mistake, and that is why my main reviewer comes from another model family.

## A single reviewer anchors

Until June, code review in my framework was a single agent. It got the diff and walked, in sequence, through security, performance and architecture. The problem, which I noted in the panel spec: an agent doing everything in one pass latches onto the first topic it looks at and skims the rest. And accessibility was not even on the pull-request path list.

I swapped it for a panel. There are six reviewers, each with a single topic (business logic, security, tests, types, side effects and the general reviewer), fired in parallel in the same message and reading the same context file with the diff and the plan, so nobody rereads the whole tree.

**Each reviewer returns lines, not prose:** `severity | file:line | problem | suggested fix`, with severity between Critical, High, Medium and Low. That is what makes the rest possible.

## Merging findings is code, not opinion

The lines go to a Python aggregator (`review_aggregate.py`), which does two passes. In the first, it drops duplicates from the same reviewer. In the second, it merges findings from different reviewers on the same `file:line` into one finding: it keeps the highest severity, concatenates the distinct texts and notes who contributed. When security disagrees with another reviewer on the same point, security wins.

The contributors field is what matters. A finding pointed out by two independent reviewers weighs more than one pointed out by a single one, and when the two reviewers are from different models the coincidence becomes much harder to call chance.

## The second model

In July I brought Codex into that panel, as an independent reviewer beside Claude's reviewers, and also into the implementation flow, reviewing the diff of each task. It ran through the CLI in a read-only sandbox (`codex exec -s read-only`): it could read and run read commands, but never wrote a file. The review rules that Claude's reviewers load as skills reached it embedded in the prompt itself.

The point of using another model is simple: models trained differently fail in different places. The implementer and the reviewer from the same model tend to agree on what looks right, including when it is wrong.

## What it caught here

The MCP was not an isolated case. The state files of this site's features record the author of each decision, and "Codex finding" shows up several times:

| Feature | Finding |
|---|---|
| Hire endpoint | The rate limit trusted the first IP in `x-forwarded-for`. Google's load balancer appends the real client at the end, so anyone who sent their own header could rotate identities at will and sail past the limit |
| Hire endpoint (High) | The limiter map cleaned entries by expiry. An attacker sending distinct keys kept them all fresh, nothing expired and the map grew until the instance died. It became a hard ceiling with LRU eviction |
| Hire endpoint | The 16 KB body limit did not cover the slow client, which stays under the ceiling forever holding a slot. The read got a 10-second deadline |
| Structured résumé | Dates validated by regex accepted `2024-99-99`. Swapped for `z.iso.date()` |
| Keyboard gate | The gate accepted "has box-shadow" as proof of a focus indicator, which would let a decorative shadow through with focus removed. I proved it later with that exact sabotage |

None of these is a syntax bug. They are all "what happens when someone uses this in a way I did not imagine", which is exactly the kind of thing the model that wrote the code also did not imagine.

## When the second model disappears

Cross-model review depends on a signature I do not control. Codex ran out of quota until November, and for a while this site's reviews were done by Claude alone. The flow accounts for that: the helper classifies the failure (no login, no quota, rate limit, network, timed out) with its own exit code, and the orchestrator falls back to Claude's panel without stopping the task.

It works, but I know what I lost. It is the same model family checking itself.

I also learned the limit on the other side. In August I took Codex out of the commit flow: I gave it a list with a single file to commit, and it made five commits, the requested one plus four groups of unrelated changes. An instruction in the prompt does not constrain an agent with write permission. For review, read-only, and there it was great.

## agy in place of Codex

On October 18 I swapped Codex for `agy`, the [Antigravity CLI](https://antigravity.google/product/antigravity-cli), which runs a Gemini model. It was not the quota: Codex was hallucinating too much in reviews, and a reviewer that invents findings costs more time than it saves. agy came in because it already ships with my Google AI Pro plan, and I am still testing and evaluating.

agy does not read my Claude rules, so the review skills reach it the same way they reached Codex: embedded in the prompt. The difference that took the most work was another one. **agy's `--sandbox` mode does not block writes**: in a test round, it created a file in the workspace. After the Codex lesson with the commits, that was enough for me not to leave it near the real repository. The helper clones the repository into a disposable copy (the same `HEAD`, plus the uncommitted diff), runs agy inside it and deletes the copy at the end. It also turns off agy's skills (`--disable-slash-commands`), so it does not find the review skill and call a reviewer inside the reviewer.

The first rounds on this site were a reminder that the second model still disappears. In the two reviews of the new post page, it blew past the 540-second limit and the flow continued with Claude alone. On the third, with a smaller diff, it answered in a few minutes and with no findings.

## The principal stays, the secondaries rotate

My principal agent is Claude Code. The others are rotating: Codex came in in July and left in October, agy came in now, and I will swap whenever needed. The swap stays cheap because the external reviewer sits behind a helper with its own exit code and a line contract (`severity | file:line | problem | suggested fix`): swapping the model is swapping a script, and the aggregator does not even notice.

`// LGTM`
