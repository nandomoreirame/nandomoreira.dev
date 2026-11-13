---
slug: skills-repo-for-four-agents
translationOf: um-repositorio-de-skills-para-quatro-agentes
title: "A skills repo for four agents: what each one started to see"
summary: "I put Claude Code, Grok, Codex and agy skills into one folder, with one repository and two symlinks. The easy part was the link; the hard part was finding out that each agent follows what is written to the letter."
markers:
  - agents
  - claude code
  - skills
  - productivity
extras:
  - "154 skills in each agent; today there are 57"
  - "Claude Code · Grok · Codex · agy"
keyPoints:
  - "A shared folder makes every agent see everything: what belonged to one becomes an instruction for the other three."
  - "Instead of hiding skills per tool with a manifest, I deleted what nobody used. 54 remained; today there are 57."
  - "The git rule stopped saying which CLI may run and started saying who asked: only the user, in any agent."
snapshot:
  items:
    - label: "Repository"
      value: "~/.skills (private)"
    - label: "Links"
      value: "2 symlinks to ~/.skills"
    - label: "Agents"
      value: "Claude Code, Grok, Codex, agy"
    - label: "Skills today"
      value: "57"
    - label: "Sync"
      value: "sync-cli-artifacts.sh"
---

On a Saturday morning, October 17, I moved all my skills from `~/.claude/skills` and `~/.agents/skills` into one folder, `~/.skills`, initialized a git repo there, pushed it as a private repository with `gh` and left the two old folders as symlinks pointing at the new one. Three minutes later I asked Claude: "what is the side effect on claude, grok, codex and antigravity of doing it this way?". I should have asked before.

A skill here is a folder with a `SKILL.md` (name, description and the instructions) that the agent loads when the description matches the request. I use four agents in the terminal: [Claude Code](https://www.anthropic.com/claude-code) leads, Grok implements, and Codex and agy (the [Antigravity](https://antigravity.google/product/antigravity-cli) CLI) review depending on the phase, as I told in the [RPI flow](/en/rpi-flow-with-three-agents) and in [cross-model review](/en/cross-model-review). If you also use more than one agent, the link solves the part of keeping a single copy. **What it does not solve is that a shared folder becomes a rule for everyone who reads it, and each agent reads the text to the letter.**

## The link worked, and everyone started to see everything

The answer came as a table. Before, each agent saw a different set of skills; after the link, all four could see the same 154, including the ones that had been written with a single agent in mind.

| Agent | Where it reads | Before | After |
|---|---|---|---|
| Claude Code | `~/.claude/skills` | 75 | 154 |
| Grok | both folders, without repeating a name | both, with 36 skills in an old version under `~/.agents` | the same folder twice |
| Codex | `~/.agents/skills` | 117 | 154 |
| agy | `.agents/skills` | 117 | 154 (I did not test whether it reads the one in home) |

Grok was the only one that came out ahead: the 36 old versions disappeared and the list of disabled skills I keep in its `config.toml` kept working. The other three got worse, each in its own way.

In Claude Code, the skills list has a space limit. With 154, about 45 showed up with only the name, no description, and a skill with no description does not fire on its own. Among them were skills I had written, like `home-radar`, `job-radar` and `technical-writer`. Alongside came third-party skills that fight my flow: `using-superpowers` and `brainstorming` say "You MUST use this before any creative work", and at least five other planning and execution ones competed with RPI.

In Codex the problem was uglier. It started seeing the `project-*` skills from my flow, and `project-review` tells whoever reads it to call the script that fires Codex as the reviewer. If Codex triggered that skill by description, it would call itself in a loop. Reviewer reviewing the reviewer.

## Instead of hiding, I deleted

The recommendation I got was to keep `~/.skills` as the single source, but bring back real folders per agent, with one link per skill and a manifest saying what each tool may see. It works. But it is one more file to maintain every time a skill is born.

I went the other way. I had already deleted about 30 by hand while the conversation ran, and I asked for a review to delete more and check whether my deletions were right. Of the 30, 27 were right. One was a mistake: `tailwind-conventions`, which I had written in August from a real bug and which no other skill covered. It came back. It lasted minutes: it left again when I also told it to delete the ones that were in doubt.

The criterion for the rest was use and dependency: was the skill called in the session histories? Does any agent, hook, script or other skill depend on it? Claude's histories covered 09/22 to 10/17, and the prompts one, from June onward. You could also count the reads in Codex sessions, and that is where the funniest case showed up: `output-adapter` had zero use in Claude and 86 reads in Codex. Its description said "use when generating any user-facing output", and Codex, obedient, opened the skill on almost every reply.

They left in several waves:

- the whole marketing set, CRO and growth, in three parts (ad, pop-up, onboarding, pricing, cold e-mail, the kinds of things I never used);
- the flow skills that competed with RPI;
- the SEO ones that the `seo` skill already covered;
- the document ones that already ship in Claude's own plugins;
- the Google integrations that expected environment variables I never set;
- the ones from the Liquid AI days, for reports and commit analysis.

That same morning there were 54. Today there are 57, because some came back or were born later: `copywriting` left in that cut and came back five days later as a new skill, copy for a sales page. What decides what each agent sees now is what exists in the folder, and what does not exist gets in nobody's way.

## Commands also became skills

Slash commands lived in `~/.claude/commands`. Only Claude Code reads that folder, so Grok and agy could see the skills but not my `/git`, `/dev:implement` or `/post-publish`. In agy there is not even a file-based slash command (its docs mark the workflows as obsolete and migrate each one into a skill). So, in the same pass, I asked to move every command into skills, to run the same entry points in Grok and agy.

The rule that stayed in the framework document is short: the entry point is always a skill, never `commands/`. The exceptions are two, and both are Claude Code only: `/session`, because the statusline reads the files it writes, and `/release-day`.

The cost showed up in two places. First, the name: a skill is only called by its folder name, so `/imoveis` became `/home-radar`, `/vagas` became `/job-radar` and `/ws` became `/workspace`. Second, control: in agy there are no `$ARGUMENTS`, `disable-model-invocation` or `allowed-tools`, so a skill that in Claude only runs when I type it can be fired there by description. Skills that depend on things only Claude Code does (subagent, firing another CLI) got a "Which CLI are you?" table at the top, saying what each agent does with them.

One piece left that a link cannot fix: the general rules. Grok and Codex never read my Claude `rules/`, so a script, `sync-cli-artifacts.sh`, injects a block with the shared rules into each one's `AGENTS.md` and has a `--check` that fails when the block fell behind. Its header explains why it exists:

```bash
# The Grok and the agy read the RPI skills straight from ~/.claude/skills and
# ~/.agents/skills (both link to ~/.skills), so no command or skill is generated
# for them anymore. What they still need from here is the shared-rules block in
# their AGENTS.md, GENERATED from the versioned source in ~/.claude and verified
# by test (AD-003): editing a destination by hand is the failure mode this script
# exists to prevent.
```

## Grok and Codex did exactly what was written

Five days later, on a Thursday, I tried to use `/git` in Grok and Codex, and neither of them did. I checked the skill, and there was the section that had landed when it stopped being a command:

```markdown
## In Grok or agy

Iron Law #15 keeps git writes with Claude Code: in any other CLI run only the read-only
subcommands (`status`, `log`, `diff`). For `commit`, `push`, `pull`, `release`, `branch` or
`stash`, say it belongs to Claude Code and stop.
```

The skill told them to say that belonged to Claude Code and stop. They stopped. At the time I thought "interesting that they follow the rules in the skill to the letter", and that is exactly it: the rule had been written for the case where Claude fires Grok as the implementer, and there nobody should commit except Claude. Only, with the skill in everyone's folder, it also applied when I open Grok and ask for the commit with my own hands.

And it was not only the skill. The rules block that `sync-cli-artifacts.sh` injects into Grok's and Codex's `AGENTS.md` had as rule number 1 "No git operation outside Claude Code". Fixing only the skill was not enough; they would keep refusing by the other rule.

The fix changed the question. Instead of saying which CLI may run git, the skill now says who asked:

```markdown
## Who may run git (any CLI: Claude Code, Grok, Codex, agy)

- **User-invoked:** the user typed `/git <subcommand>` or explicitly asked for a git
  operation in their own message. That is consent: run every named operation in full,
  including writes (`commit`, `push`, `pull`, `release`, `branch`, `stash`), in any CLI.
- **Not user-invoked:** never run any git operation, read-only included. That covers your own
  initiative, a step inside another skill (`/rpi-implement`, `/rpi-review`...), and any prompt
  dispatched by another agent or script (Iron Law #15): leave changes in the working tree and
  report them.
```

Rule number 1 of the shared block got the same exception ("without a user request"), the script rewrote both `AGENTS.md` files and `--check` passed. The prohibition that matters still stands: an agent called by another agent, or in the middle of an RPI step, does not touch git. [[PREENCHER: whether /git commit worked in Grok and Codex after the change, and when you tested]]

## What remained

One folder, one private repository and two symlinks. `~/.claude/skills` and `~/.agents/skills` point at the same place, and Claude Code, Grok, Codex and agy read the same 57 skills. What I took from that:

- a shared skill is an instruction for every agent that reads it, so every rule that only applies to one must say to which, and why;
- a permission rule is written by who asked, not by which tool is running;
- what nobody uses leaves the folder, instead of getting a manifest to stay hidden.

`readlink -f ~/.claude/skills`
