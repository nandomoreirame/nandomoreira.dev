---
slug: ai-harness-with-rpi
translationOf: meu-harness-de-ia-com-rpi
title: "My AI harness with RPI: from Superpowers and TLC to Forja 2.0"
seoTitle: "My AI harness with RPI and Forja 2.0"
summary: "Harness is everything that runs around the model. Mine came out of almost a year of projects, tests, and study on top of Superpowers and tlc-spec-driven, and now it is becoming Forja 2.0."
markers:
  - harness
  - rpi
  - agents
  - claude code
extras:
  - "424 specs across 26 repositories, one harness"
  - "Superpowers · tlc-spec-driven · Forja 2.0"
keyPoints:
  - "Harness is everything that is not the model: rule, skill, spec, test, review. Mine took almost a year of projects and study."
  - "The plan that named my RPI told me to use Superpowers and, in task 3, deleted Superpowers itself."
  - "Forja 2.0 started over from scratch to take this harness into an app, with approvals in the user's hands."
snapshot:
  items:
    - label: "Phases"
      value: "Research, Plan, Implement"
    - label: "Specs"
      value: "424 across 26 repos"
    - label: "First base"
      value: "Superpowers"
    - label: "Memory ideas"
      value: "tlc-spec-driven"
    - label: "Under construction"
      value: "Forja 2.0"
---

Today there are 424 specs across 26 repositories, among my own projects and client ones, and almost all of them went through the same RPI flow. That flow is my harness, and it took almost a year of projects, tests, and study to get there.

## What a harness is

The definition I use is Birgitta Böckeler's, [on Martin Fowler's site](https://martinfowler.com/articles/harness-engineering.html): `Agent = Model + Harness`. In other words, harness is everything in the agent that is not the model: instruction, tool, permission, memory, test, and review, everything that sits between what you ask and what the model does. The word means a bridle. The animal stays strong, but it goes where you point.

Part of that already comes ready, because Claude Code is a harness. What interests me is the external harness, what we build around the tool. And it has two halves: guides, which steer the agent before it acts, and sensors, which watch the result and let you correct afterward.

| Type | When it acts | In my harness |
|---|---|---|
| Guide | Before the agent acts | Each project's `CLAUDE.md`, rules, skills, spec, plan, lessons |
| Sensor | After the agent acts | Lint, type-check, tests, build, proof by requirement, validators, a reviewer that did not implement |

RPI (Research, Plan, Implement) is the order those pieces come in: research produces the spec, the plan breaks the spec into tasks, implementation runs one task at a time. How each phase works I already told [in the flow post](/en/rpi-flow-with-three-agents). **Here the story is where the pieces came from, because researching before coding was already my order, but the first files were not mine.**

## Superpowers was my first real skill

[Superpowers](https://github.com/obra/superpowers), by Jesse Vincent, is a set of skills that takes the agent from a brainstorm to the merge, through plan, TDD, and review. It was the first one I used for real, on client work and on my own projects.

The embryo of RPI was born on top of it, in January, when I worked at Liquid AI. I built an internal framework for the team (which in the end became mine) and, on January 27, it got three commands: `/liquid:research`, `/liquid:plan`, and `/liquid:implement`. It was already Research, Plan, and Implement. Only each command just called a skill that came from Superpowers or was almost a copy of it. The research one opened with the same description as `brainstorming`, "You MUST use this before any creative work", word for word.

When, in March, I turned those commands into my `rpi-*` skills, Superpowers stayed the base, and that version shows it with no shame at all:

| Superpowers | My RPI on March 31 |
|---|---|
| [`brainstorming`](https://github.com/obra/superpowers/tree/main/skills/brainstorming): asks one thing at a time | `rpi-research`: "Ask questions one at a time" |
| [`writing-plans`](https://github.com/obra/superpowers/tree/main/skills/writing-plans): small task, for someone with no context | `rpi-plan`: 2 to 5 minute tasks, "needs zero prior context" |
| [`subagent-driven-development`](https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development): new subagent per task, with spec and quality review | `rpi-implementer` and `rpi-reviewer`, with the same two reviews |
| `Announce at start`: the skill announces itself before starting | The same "Announce at start", copied even in that |

**The best of Superpowers is the discipline:** test before code, root cause before the fix, one task at a time, and review afterward. I still keep that today, and [`systematic-debugging`](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) and [`using-git-worktrees`](https://github.com/obra/superpowers/tree/main/skills/using-git-worktrees) are still installed here.

What bothered me was the tone of law. The `brainstorming` description says "You MUST use this before any creative work", and the text adds that the process applies to every project, "regardless of perceived simplicity", with a list of tasks you have to complete in order. The skill ordered before I asked, even on small things, and competed with my flow. To change a color I do not want a design meeting.

## In March, too many skills and none owned the process

Two months later I had a skill for everything and none of them owned the process. Two flows fought over the same feature: the agent picked one and, after a compaction (when the conversation fills up and the agent summarizes what came before), forgot what had been decided.

I wanted a single path, with my face on it. The first step was not even writing anything: 45 unused skills left in the same commit, 33 of them marketing alone. And the first line of the plan that named RPI gives away where I was coming from:

```markdown title="docs/plans/2026-03-31-sdd-rpi-restructure.md"
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement this plan task-by-task.
```

In task 3, the same plan runs an `rm -f` on `executing-plans`, `brainstorming`, and `using-superpowers`. The plan told me to use Superpowers to get Superpowers out of the way (you can call it parricide).

## TLC taught me the memory part

[`tlc-spec-driven`](https://github.com/tech-leads-club/agent-skills/blob/main/packages/skills-catalog/skills/%28development%29/tlc-spec-driven/SKILL.md) is an open source skill from [Tech Leads Club](https://github.com/tech-leads-club/agent-skills), which organizes the feature into four phases: Specify, Design, Tasks, and Implement. I am not a member; I took the public skill. And this one I studied more than I ran: I read carefully and kept pulling the ideas.

Neither of the two is called RPI, but at the core it is the same thing: understand, plan, execute. What hurt most here was the agent forgetting. And for that TLC had the best ideas. A day after creating the `rpi-*` skills, I wrote a spec saying it would stay the main flow and absorb the best of TLC:

| TLC piece | What it became here |
|---|---|
| `STATE.md` | Phase, decisions, and paths live in a file, and compaction does not erase anything |
| Knowledge chain | Before asking me, the agent reads the code, the docs, and the specs; the web comes last |
| Depth by size | Compact, standard, or deep in every phase (my RPI only did that at implementation) |

And I refused two things: the separate Design phase and mapping an existing project into 7 documents. For me that was too much ceremony. Design decisions fit in research, and the knowledge chain covers discovery in a lighter way. It is a choice for my use, not a flaw in TLC, and the skill has changed a lot since April: the current version already skips Design when the change is simple.

On October 31 I went back to it. I wanted an error found in one feature's review not to show up again in the next, and I took from there, and from Waldemar Neto's ["Loop Engineering"](https://www.youtube.com/watch?v=PYSyFKCvzNU) video, the idea of lessons that promote themselves: a lesson only counts when the problem returns in two different features, because repeating it in the same feature is a single incident. If the lesson is penalized twice, it goes into quarantine. The content license is CC-BY-4.0, but I rewrote everything from scratch: I took the idea, not the code. That part of the harness is too new for me to say whether it worked, and the pilot report, on the Forja features, still does not exist.

## The change

My development flow today is quite different from the beginning. From then to now the harness kept changing because of things that broke or bothered me here:

| Piece | At the start | Today |
|---|---|---|
| Who implements and who reviews | Claude subagents | Different CLIs, and the reviewer is never the one who implemented |
| State | One file per project, one active session | One `STATE.md` per feature, since June, to run sessions in parallel |
| Questions | One at a time | Reads everything first and goes through grilling (more on it below) |
| Validating spec and plan | Instruction to the model | Script that blocks the save, because a warning nobody reads is false green again |
| Announcing itself | "Announce at start" | Dead; I have a rule forbidding it |

The bill for that choice is this: in March it was 4 skills and 388 lines. Today it is 8 skills and 2,353 lines, not counting scripts, hooks, and references. When Claude Code changes, when a CLI goes down, when a gate lies, the problem is mine. Nobody is going to open a PR to save me. If you do not want to maintain this, use Superpowers or TLC as they come; they are good and have far more people watching.

## Honorable mention: Matt Pocock's grill-me

One piece came from outside those two and deserves a section of its own: Matt Pocock's [`grill-me`](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me). The idea is simple: the agent interviews you until no implicit decision is left. It walks the decision tree, every question already comes with the answer it recommends, and it has the rule that saves me the most time: fact (what is in the code, in git, or on the web) is for the agent to go fetch, and the decision is mine.

I adapted it in July. It became `rpi-grill`, which I use to refine Research and Plan: it comes in on its own in Research for medium and large features, and Plan asks whether I want to run it when it gets a spec that never went through it. In the original the questions come in rounds. Here it is one at a time, because I react better to one proposal than to a whole list of questions waiting for answers. And each answer goes into the `## Grilling Log` of the spec itself, so the decision is not lost in the conversation and the plan starts from a spec with no holes.

## One harness for many projects

I work on many projects at the same time. Each project has its own git, its own toolchain, and its own `CLAUDE.md`, which only loads when I touch that project. What keeps that from turning into a mess is knowing which level each thing lives at:

| Level | What lives there |
|---|---|
| Machine | Rules, scripts, and skills, the same ones for Claude Code, Codex, Grok, and agy, plus a memory in an [Obsidian](https://obsidian.md) vault that all of them query |
| Project | `CLAUDE.md`, specs, plans, reviews, and lessons |
| Feature | `STATE.md` and, when two run in the same repository, one worktree each |
| Session | A saved context: `/session save`, `/clear`, then `/session start --id <id>` |

In practice, one session can be researching a feature while another implements in another project, and one does not overwrite the other, because each feature's state lives in its own repository and not in a conversation. I send several plans to `/rpi-implement` at once, and each one gets its worktree. If a CLI dies on quota, the task drops down a chain (Grok, Codex, agy, Claude) and the reviewer stays someone else.

**I stay where the decision is mine:** I approve the spec, I approve the plan, and only I tell it to push. Böckeler says something similar, that a good harness does not need to eliminate the person; it needs to put their attention where it matters most.

## Now that harness is becoming an app

[Forja](https://github.com/nandomoreirame/forja) was born in February as a desktop client to run agent CLIs without losing context switching between terminals, and the published version is 1.9. The [`release/2.0`](https://github.com/nandomoreirame/forja/tree/release/2.0) started over from scratch on October 30, redesigned on top of this flow I built. Installed CLIs become execution tools, and what runs the process is RPI.

A large part of the [specs](https://github.com/nandomoreirame/forja/blob/release/2.0/docs/specs/chat-workflow/SPEC.md) is my harness translated into product:

| In my harness | In Forja 2.0 |
|---|---|
| Claude Code opens in `~/dev`, which is not a repository | Opens any folder as a project, including without git, and the spec's example is `~/dev` itself |
| Claude Code leads | The Ferreiro chats, proposes the next step, and passes the turn, but does not write a file or approve anything |
| I approve spec and plan | Approvals stay yours, with manual acceptance before the merge |
| Scripts block invalid spec and plan | The core rejects the invalid document |
| Skills in `~/.skills` | The catalog reads that folder and the CLIs', read only |
| Grok, Codex, agy, and Claude | Claude, Codex, opencode, agy, and Grok, with each one's authentication, without copying credentials |

Not so fast: you cannot download it yet. Today it is a preview: the interface runs on mock data, the terminals use real shells, and the agent integration is still not implemented. The MVP has more than 150 tasks and most of them are still to do. The up-to-date number is [in the roadmap](https://github.com/nandomoreirame/forja/blob/release/2.0/ROADMAP.pt-BR.md), and the pitch is [on the landing](https://forjav2.web.app/pt-br). It is also being built with the harness itself, spec by spec, plan by plan, so what breaks there comes back here.

## A ready-made harness is for studying, not installing

Installed whole, it fights your way of working. With me it was like that: from Superpowers and TLC I kept the ideas and rewrote the files. The trail left behind is the worktree skill, which still cites Jesse in the text and, when the project does not define another place, creates under `~/.config/superpowers/worktrees/`: last week's ended up there.

And that goes for mine too: do not copy mine. Read Superpowers, read TLC, use one of them on real work until it bothers you, and then write only what bothered you.

`git switch release/2.0`
