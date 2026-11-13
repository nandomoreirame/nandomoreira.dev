---
slug: seven-review-rounds-when-to-stop
translationOf: sete-rodadas-de-revisao-quando-parar
title: "Seven review rounds: when to stop"
summary: "In one day, a review went from nine findings to zero in seven rounds. On another, another one spent six rounds oscillating between two and four. The number of rounds does not say when to stop; the shape of the count and where the finding lands do."
markers:
  - code review
  - agents
  - quality
extras:
  - "9, 3, 1, 1, 2, 1, 0 findings in seven rounds"
  - "Codex · Claude Code · Grok"
keyPoints:
  - "The round with a single low finding was not the last: the next one found a race that left server and screen disagreeing."
  - "When the finding leaves the code and lands on the test that proves the fix, one more round is left, with the scope closed."
  - "My stop rule caught a repeated fix on the same line. A count that does not fall is another problem, and only the ceiling held."
snapshot:
  items:
    - label: "Implementers"
      value: "Codex · Grok"
    - label: "Reviewers"
      value: "Claude Code · Codex"
    - label: "Trail"
      value: "<slug>.rounds.jsonl"
    - label: "Stop"
      value: "3 fixes on the same line"
    - label: "Ceiling"
      value: "6 rounds"
---

The prompt Codex wrote for the third round already called the review final. Claude returned a single low finding: after a rejection, retyping the value that was already saved left the field marked invalid. On the fourth round it found a race where the server held one value, the screen showed another, and the status said "Saved". After that the review still ran three more rounds until `NONE`.

How many rounds are enough is the wrong question. If you put one agent to implement and another to review in a loop, someone decides when the loop ends, and "when the reviewer says it found nothing" looks like the right answer. I already wrote about [why a second model finds what the first one misses](/en/cross-model-review); this piece is about the next step, when the second model is already in the loop. **The round count does not say when to stop. What says it is the shape of the curve and where the finding lands.**

## Seven rounds in twelve minutes

October 27, on contrateum.dev (a project of mine that links job posts to developers). Codex implemented two features together: linking the account to the company and the company settings area (field-by-field save, account deletion). agy, which today is my external reviewer, was unavailable, and Codex does not review its own code, so Claude reviewed. With no tool at all. It got the specs and the code inside the prompt and returned lines `severity | file:line | problem | fix`, or exactly `NONE`.

| Round | Findings | Where they landed | Duration | Output tokens |
|---|---|---|---|---|
| 1 | 9 (4 medium, 5 low) | database, session, docs, screen | 84 s | 15.9k |
| 2 | 3 (2 medium, 1 low) | docs and one `aria-describedby` | 60 s | 11.3k |
| 3 | 1 low | field `onBlur` | 61 s | 10.3k |
| 4 | 1 medium | field `onBlur` | 28 s | 5.1k |
| 5 | 2 low | test | 42 s | 7.7k |
| 6 | 1 low | test | 20 s | 3.5k |
| 7 | 0 | | 5 s | 300 |

From the start of the first to the end of the seventh was twelve minutes, counting Codex's fixes between rounds. An eighth round, the next day, also came back empty.

The first round was the only one that saw everything, and not all of it was spot on: on the second, the prompt itself contested four findings (docs that were already there, a fixture fallback in preview, a database trigger, delete cascade) with the argument that they contradicted the architecture, and they dropped out. The rest became fixes.

## The final round that was not

The third round is the one that teaches the most. One low finding, on a form field, after two rounds that had already cleared the bulk. By the count, you could have stopped there.

The fourth found this, on the same `onBlur`: the person edits the field to "A" and leaves, which fires the POST for "A". Before the response, they go back to the original value and leave again. Because the value on screen matches the last confirmed one, nothing is sent. Then the "A" response arrives successfully: the server stored "A", the screen shows the original, and no error appears. The fix was to store the last value sent and compare against it, not against the last confirmed one.

In other words, severity went from low to medium after a round that looked like the end. Every fix touches code nobody has reviewed yet, and that component had taken a fix in each of the three previous rounds.

## When the finding lands on the test, one more is left

From the fifth round on, no finding was in production code. The fifth pointed out that the race test passed even with the bug, because the final assertion checked a value that had already been correct since before the second response (the same [green that proves nothing](/en/the-false-green) as always). The sixth asked for a missing assertion. The seventh answered `NONE` in five seconds.

It was not the first time the tail looked like that. Three days earlier, the developer-side screens went through seven rounds with the same Codex and Claude pair, in a count of 3, 0, 6, 5, 3, 1 and 0 (with a zero on the second round that closed nothing, because the third came back with six). The sixth round there also landed on a test file, and the seventh zeroed out.

When the finding leaves the code and goes to the test that proves the fix, the code has converged. One more round is left, with the scope closed on what was asked, and that is it.

## Six rounds that were not going to close

On the 28th Grok took five plans from the same project in sequence (`--sequential --agentic`), with Codex reviewing, since agy was still out. These were the seeker-side features: read a job post, review what was read, cross it with the profiles, show the result and keep the history.

At 2h44 of execution, I asked Claude to check whether Grok was stuck in a loop. It was not: each commit differed from the previous one, the latest had landed seconds earlier, and four of the five features were implemented, 30 of 39 tasks. The three that had already closed the review cycle closed in two rounds each (6 findings then 0, 1 then 0, 3 then 0). Each feature took between 30 and 70 minutes, review included.

The fourth, the results page, was another story:

| Round | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Findings | 3 | 4 | 2 | 3 | 4 | 2 |

Six rounds, almost an hour between review and fix, and the count did not fall. It hit the ceiling of six with two open medium findings: with a concurrent fix, the summary could come from one version of the search and the ranking from another; and the snapshot wrote every item in a single statement, which above about 13 thousand items goes past PostgreSQL's parameter limit and aborts the transaction. Both were fixed even after the ceiling, because the flow requires fixing the cause of any valid finding, but the review stayed recorded as pending, with nobody declaring it resolved.

## My stop rule was looking at something else

Each round becomes a line in a trail file next to the review (`docs/reviews/<slug>.rounds.jsonl`): who implemented, who reviewed, the open `file:line` entries. The loop reads that trail to decide whether to spend another round:

```python
#: Rounds a finding must OUTLIVE to count as stalled. Two corrections is the point
#: where "not finished yet" stops being the better explanation.
WARN_AFTER_SURVIVED = 2
STOP_AFTER_SURVIVED = 3
```

The same `file:line` still open after two fixes raises a warning for the implementer (attack the cause or disagree with evidence). After three, the loop stops. The script comment explains why it is not two: tested against a real seven-round cycle, stopping at two would have left the review on the third, on a finding whose three fixes closed three different doors on the same line. The same file on lines that change is a weak signal and never stops anything, because it also describes honest progress in a file with several real defects.

On the results page, no `file:line` repeated from one round to the next. None. The findings moved through the same file on different lines, which is exactly the weak signal, and by the rule's definition Grok was not stuck (and it really was not), only the review was also not going to converge. The rule catches the agent that repeats the same fix; a count that goes up and down it does not see. What stopped the cycle was the ceiling of six rounds, which only counts attempts.

Reading the two days side by side, the trail shows three different situations:

| What the trail shows | What happened |
|---|---|
| Falling count, finding in the code | One more round found something serious (the race in round 4) |
| Finding only in the test | One closed-scope round and `NONE` |
| Count not falling for six rounds | Ceiling, pending review, fix outside the cycle |

## One more round gets cheap, and that is the problem

In the cycle that converged, each round cost less than the previous one: from 84 seconds and 15.9k output tokens on the first to 5 seconds and 300 tokens on the last. Nobody skips an eighth round for 300 tokens (and the eighth came). The real cost is on the other side, in the implementer fixing between rounds, and on the results page it was almost an hour for a feature that, on its neighbors, closed entirely in 30 to 70 minutes.

## Where I may be wrong

The curve that fell to zero is not only merit of the code. Who wrote the review prompts was Codex, the implementer. On the sixth round the ask said, in these words: "Verify ONLY resolution of these two findings. Do not expand scope. Output exactly NONE if resolved". The seventh was even narrower. A reviewer that can only say whether two assertions exist will say `NONE` as soon as they exist, and that `NONE` is about two assertions, not about the feature.

My rule says that whoever wrote the code does not lead the judgment. There it did not judge, but it decided the size of what would be judged, and on the second round it still argued against four findings. The flow allows disagreeing with evidence, and the review history records the four as reassessed, but the convergence of the last rounds was in part manufactured by the scope. What holds the conclusion is that the first round saw both specs and the full diff, and the others narrowed from there, not from zero.

[[FILL: the decision you take from this for the flow (for example, stop when the count does not fall for three rounds, or stop having the implementer write the review prompt), or cut this paragraph if nothing changed]]

`NONE`
