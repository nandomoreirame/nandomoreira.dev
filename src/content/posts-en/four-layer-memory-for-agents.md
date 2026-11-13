---
slug: four-layer-memory-for-agents
translationOf: memoria-para-agentes-em-4-camadas
title: "Memory for agents: a four-layer backbone"
summary: "How Claude Code remembers decisions across sessions without loading everything into context: what is always read, what only comes in when someone asks, and the migration that only finished when a gate allowed it."
markers:
  - claude code
  - memory
  - agents
extras:
  - "4 layers, 5 commands, 1 recall rule"
  - "Claude Code · Markdown · YAML"
keyPoints:
  - "Self, Workspace and Project always load; Entity only comes in when asked, so the base context does not bloat."
  - "One rule forces the agent to call /memory recall when I name an entity that is not loaded yet."
  - "/memory verify checks whether cited files and functions still exist and flags the memory that went stale."
snapshot:
  items:
    - label: Agent
      value: Claude Code
    - label: Format
      value: Markdown
    - label: Frontmatter
      value: YAML
    - label: Layers
      value: four layers
    - label: Commands
      value: five commands
---

On June 1 I saved two memories in my Claude Code. One said that the bar on my [Niri](https://github.com/YaLTeR/niri) is [Noctalia](https://github.com/noctalia-dev/noctalia-shell), not Waybar. The other, that the version manager on the machine is mise, and that it must never look for nvm, pyenv or asdf. They look trivial, and they exist because the agent, without them, assumed the opposite: every new session started from zero, and from zero the default guess for a Linux desktop is Waybar and nvm.

That is the whole problem of agent memory: each session starts knowing nothing, and the obvious fix (dump everything into context) costs money and gets worse as memory grows.

## Before: two systems and no owner

Until May I had two memories living side by side. One was Claude Code's own automatic memory, stored per project. The other was a plugin called amnesia, with `/amnesia:*` commands, that I used for client and subproject facts. Each had its own format and path, and neither knew about the other.

On May 19 I rewrote that as a single backbone, with a single format (YAML frontmatter and Markdown body, with `[[name]]` links between memories) and four layers.

## The four layers

| Layer | Where it lives | When it loads | What it stores |
|---|---|---|---|
| Self | `~/.claude/USER.md` and `SOUL.md` | Always | Who I am, how the agent should sound, preferences |
| Workspace | `<workspace>/.claude/WORKSPACE.md` | Always, if it exists | Rules shared across several projects in the same workspace |
| Entity | `<workspace>/.memory/entities/<id>.md` | Only when asked | Facts about a specific client or subproject |
| Project | `<project>/.claude/MEMORY.md` | Always, inside the project | Decisions of the current repository |

**The decision that matters is the third row: Entity is lazy on purpose.** A workspace can have dozens of entities, and loading all of them every session bloats the base context to answer questions that are almost never about them. So it only comes in when someone mentions it.

Laziness has a risk, and I wrote the rule with that in mind: lazy memory becomes "lazy and never loaded". Framework rule 14 forces the agent to call `/memory recall <id>` before answering whenever I name an entity that is not in the layers already loaded. If the name does not match, it returns similar suggestions and asks me which one it was, instead of guessing.

The rest of the interface is manual and small: `save` (which asks for the layer before writing), `recall`, `list`, `audit` and `verify`.

## The migration a gate held back

Migrating memory without losing anything was the requirement I would not negotiate. `migrate-memory.sh` runs in three phases (backup, consolidate automatic memory, convert amnesia entities), has `--dry-run` and writes a marker so it does not run twice.

One detail cost me more than it looked. Claude Code stores automatic memory in a folder with the project path encoded as a hash, and decoding that hash back to the path is ambiguous. The way out was to go the other direction: walk `~/dev`, encode each candidate path the same way and see which one matched.

Removal of the old plugin stayed behind a gate: `--finalize` runs `audit` and refuses to continue if anyone is still calling `/amnesia`. On the first attempt the audit complained about five things, and none was real. `USER.md` and `SOUL.md` have a filename different from the `name` field (on purpose, they are files for people to read), and the new skills cited `/amnesia` in text, exactly to say "do not use `/amnesia`". The regex does not tell a call from a warning. I adjusted the exception list, the audit went clean and `--finalize` ran. The plugin left for good on June 18.

## What broke

On that same June 18 I found a bug that ate memory in silence. The layer loader stripped frontmatter by counting `---` lines. Only `---` is also the Markdown horizontal rule, so a memory that used that separator in the body was cut there, and the agent read half the file thinking it was the whole file. The fix was to strip frontmatter only when the file opens with `---` on line 1, with a regression test on top.

The worst came later, on an ordinary day. I wanted to move a line inside the memory index and did it with `grep -v "$LINHA"` followed by a redirect back into the file. The line started with `- [`, like every Markdown list item, and the local `grep` read that as an option and died. The next step wrote into the original file from an empty output, and `MEMORY.md` ended up with zero bytes (the shell truncates the destination before running the command, so there is no time to regret it).

Today the rule is to write to a temporary file, check that it is not empty and only then move it over. And `--` before any pattern that came from a variable.

## Memory that lies

The last problem is the subtlest: memory that was right on the day it was written, and wrong six months later. A project memory that cites `src/lib/qualquer-coisa.ts` keeps asserting that with full confidence after the file was renamed.

`/memory verify` exists for that. It reads Project-layer memories, takes everything between backticks (files, functions, flags) and checks whether it still exists in the repository. What disappeared becomes a drift report, and I decide whether the memory dies or gets updated.

It ended up a small system: four layers, five commands and one rule that forces the agent to remember when I name someone.

`/clear`
