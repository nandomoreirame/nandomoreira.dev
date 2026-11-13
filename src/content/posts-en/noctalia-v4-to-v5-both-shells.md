---
slug: noctalia-v4-to-v5-both-shells
translationOf: noctalia-v4-para-v5-com-os-dois-shells-ligados
title: "From Noctalia v4 to v5: I ported the plugins with both shells running"
seoTitle: "Noctalia v4 to v5: migrate QML plugins to Luau"
summary: "In ten days I swapped my desktop shell and rewrote three plugins from QML to Luau with v4 always one command away. What held it together was one rule: v4 could not stop working until v5 took over."
markers:
  - linux
  - noctalia
  - niri
  - luau
extras:
  - "3 plugins ported, v4 removed in 10 days"
  - "Noctalia v5 · Luau · bash · git worktree"
keyPoints:
  - "One command switched shells and a dispatcher translated each Niri shortcut for v4 or v5, without the shortcut knowing which was running."
  - "Every plugin plan carried the same rule: the v4 plugin keeps loading until v5 takes over. The old QML lives on the legacy-v4 branch."
  - "In Luau, os.time with a table returns UTC. The plan assumed local time, and a test caught it before it became a reminder at the wrong hour."
snapshot:
  items:
    - label: "Compositor"
      value: "Niri"
    - label: "Old shell"
      value: "Noctalia 4.7.7 (QML)"
    - label: "New shell"
      value: "Noctalia 5.2.1"
    - label: "Plugins"
      value: "Luau 0.742"
    - label: "Shell switch"
      value: "nocta · noctalia-switch"
    - label: "Tests"
      value: "bats · Luau"
---

On October 11 a Qt update, from 6.11 to 6.12, broke my desktop. `noctalia-qs`, the base of [Noctalia](https://github.com/noctalia-dev/noctalia) v4, had to be rebuilt here with a patch taken from a newer version, and Qt 6.12 gained a `Color` singleton that overrode Noctalia's `Color`. The fix was pinning `import QtQuick 6.11` in every QML file, of the shell and of my plugins, with a `sed` run as root over `/etc/xdg`. It worked, and I knew the next Qt would break everything again: the v4 branch has been unsupported since August 29. Ten days later v4 no longer existed on this machine.

The obvious question was how to rewrite four plugins from QML to [Luau](https://luau.org). The one that mattered to me was another: how to keep working on the computer while the whole shell (bar, launcher, notifications, lock screen) and the plugins changed underneath. If you also run a hand-built desktop, you know that an afternoon without a bar and without shortcuts is a lost day. **Running both versions side by side cost more code than switching at once, and that code is what let me switch without fear.**

This post continues the one about [the four plugins I built for Noctalia](/en/four-noctalia-plugins-with-ai), which were all for v4.

## What changes from v4 to v5

v5 is a different program. v4 runs on [Quickshell](https://quickshell.org) (Qt and QML); v5 is a native C++ shell with OpenGL ES, no Qt at all, and shipped ready in the CachyOS repository. What weighed most for me:

| | v4 | v5 |
|---|---|---|
| Binary | `qs -c noctalia-shell` | `noctalia` |
| Config | `settings.json`, which the shell itself rewrites | several `.toml` files, which it never rewrites |
| IPC | `qs -c noctalia-shell ipc call <target> <function>` | `noctalia msg <command>` |
| Plugin | QML with free windows | `plugin.toml` and isolated Luau scripts, declarative UI, no free window |

The config line matters for anyone who versions dotfiles: on v4 I sometimes committed `settings.json` just because the shell had rewritten it on its own. The plugin line is the one that costs work: none of the QML carries over, and what was a floating window becomes a panel.

The upside is that both packages coexist. v4 only reads `settings.json`, v5 only reads `*.toml`, so they share the same config folder without stepping on each other.

## Migration first, plugins later, one plugin at a time

When I asked for the plan, the line was this: "I want to understand how to deliver value in stages and be able to test as fast as possible, without saying that my Claude plan won't work all at once, it will be migration first, plugins later and one plugin at a time".

It became a plan with 13 stages. One per file, and each one ending in something you can test by hand, because I was going to pull one stage at a time with `/rpi:implement` and the plan quota had to last. The v5 configuration, the switch command, the shortcut layer and the test kit came before any plugin. v4 stayed as backup until the last stage, the one that removes everything.

The other decision was mine too: "I don't want a monorepo, I want each plugin to keep its own repository with a `legacy-v4` branch and main being v5". Each plugin followed its own cycle of spec, plan and implementation inside its repository, in the [RPI flow](/en/rpi-flow-with-three-agents), with Grok implementing and Claude reviewing (Codex was out of quota those days).

## One command to switch shells

The first real script was `noctalia-switch`. It stops the shell that is running, waits for it to exit (with `SIGKILL` if it takes more than five seconds), starts the other one via `niri msg action spawn`, runs again the script that restores the tray icons and records the choice:

```bash
$ noctalia-switch v5
$ noctalia-switch status
persisted: v5 running: v5
```

`noctalia-session` reads that choice at login. [Niri](https://github.com/YaLTeR/niri) got a single autostart line, which calls `noctalia-session`, and it brings up v4 or v5 according to the last switch. That way I could use v5 and, if something locked up, go back to v4 with one command. Without editing any config.

## No shortcut knows which shell is running

My Niri shortcuts called the v4 IPC directly, and the v5 syntax is different for almost everything. Instead of keeping two `config.kdl` files, I wrote `nocta`, a bash dispatcher: the shortcut asks for an action with a human name, and `nocta` translates it for the shell that is alive.

| Action | v4 | v5 |
|---|---|---|
| `nocta launcher` | `launcher toggle` | `panel-toggle launcher` |
| `nocta lock` | `sessionMenu lock` | `session lock` |
| `nocta dnd on` | `notifications enableDND` | `notification-dnd-set on` |
| `nocta plugin <name> <event>` | `plugin:<name> <event>` | `plugin nandomoreirame/<name>:<entry> <target> <event>` |

In `config.kdl` the shortcut looks like this, the same for both shells:

```kdl
Mod+Space hotkey-overlay-title="Daybar: captura rápida" { spawn-sh "~/.dotfiles/bin/utils/nocta plugin daybar capture"; }
```

The last row of the table is what held the plugin migration. On v5 each plugin has entries with their own names (aibar answers on `usage`, daybar on `core`, rdo-solo on `live`), and `nocta` keeps that map in a variable. A plugin that has not been ported yet exits with code 4 and the message `plugin <name> not migrated to v5`, instead of failing silently. Gistbar is still in that state today: `Mod+G` returns 4 until the Luau version ships.

The scripts that talk to the shell (`nocta-hold`, `game-mode`, `noctalia-restart`) went through `nocta` as well. v4 gave a scare here: `qs ipc call state all` dropped the socket, so `nocta dnd status` failed on v4 and the scripts treated do-not-disturb as off. It stayed noted as a known issue, because v4 was going away anyway.

When v4 left, `nocta` lost its v4 branch and stayed. The shortcuts did not change a single line.

## A test kit before the first plugin

The v4 plugins had the logic in pure JavaScript tested with Vitest. I wanted the same on v5, and command-line Luau does not help: there is no `io`, no `os.execute`, `_G` is read-only and you cannot list a file. A Luau test cannot even read from disk the plugin script it wants to test.

The way out was to let bash do what Luau cannot. `run-tests` discovers the tests, and before running it generates, for each plugin script, a module that only returns the source as a string. The test loader `require`s that module, compiles the string and runs the script in a fake environment, with a `noctalia.*` mock that records every HTTP, file, state and process call. The layout rule comes with it: pure logic in `lib/*.luau`, without touching `noctalia`, and a thin entry script.

That lives in a template in my dotfiles, which is private, but the copy is in every plugin: aibar's [`run-tests`](https://github.com/nandomoreirame/noctalia-aibar/blob/main/run-tests) and [`tests/support/`](https://github.com/nandomoreirame/noctalia-aibar/tree/main/tests/support) are exactly that. Two scripts close the kit:

- `noctalia-plugin-scaffold <repo>` copies the kit and the CI workflow into the plugin repository. Running it again updates the kit without touching the plugin code.
- `noctalia-plugins-link` creates a symlink of each already-ported repository under `~/.local/share/noctalia/plugins/`, which is where v5 looks for local plugins and from where it reloads on its own when a file changes. Repositories still in QML (no `plugin.toml`) and `-v4` worktrees are left out.

## The rule every plan carried

Before the first commit that took QML out of a plugin's `main`, three things: the `legacy-v4` branch with the last QML version, a `git worktree` of that branch in a `<plugin>-v4` folder next to the repository, and the v4 link pointing at the worktree. v5 read `main`, v4 read the worktree. Same repository, two checkouts, no duplicate clone.

And the rule written into every plugin plan: **the v4 plugin never stops working.** No task was allowed to break it. A fix that v4 needed during the migration went to `legacy-v4`, never to `main`. That let me switch shells at any time in the middle of a half-finished port, and that is what I did.

## Three plugins, three sizes

[aibar](https://github.com/nandomoreirame/noctalia-aibar) was the first, on the 14th, and it was what held the default shell switch. It had about a thousand lines of QML on v4 and came out with 147 Luau tests and 7 in shell, with the panel showing Claude Code and Grok usage on the v5 bar the same day. Its README has a known gaps section, with what the v5 API does not allow: the bar widget does not stay highlighted with the panel open, and the panel does not follow the content height.

Then the plan changed. On the 19th I wrote: "if we skip the plugins can we use v5 without them? and implement later?". The answer became a new stage, which left v5 usable with no plugin at all (lock that waits for the password, screen blanking in the same time as v4, wallpaper swapping, the bar copying v4's), and the plugins moved to after the switch. "I need to get used to it, the few times I used it I found it very different from v4."

[daybar](https://github.com/nandomoreirame/noctalia-daybar) was the big one, with 4.1 thousand lines of QML. The port shipped on the 19th: all the logic rewritten in Luau modules, the service handling all I/O (file, `khal`, HTTP, sound) and the free windows turned into panels. The v4 data is imported once on the first start. Its gap list is longer: no floating timer window (the desk clock replaces it), confirmation on one line instead of a balloon, alarm that plays once and does not stop early.

rdo-solo, which shows on the bar the mode of my homelab filter, got its own repository on the 18th and was ported on the 19th, with 69 tests. It did not need a worktree: v4 kept loading the copy that was already in the dotfiles.

Of the other two plugins from the previous post, Gistbar was left for later and Desktop Sticky Notes I discontinued.

## What broke

### `os.time` with a table is UTC in Luau

The daybar plan said that `os.time` and `os.date` work in local time, as in reference Lua (PUC-Rio). A test showed the opposite: in command-line Luau, `os.time` with a date table reads the table as UTC, not as São Paulo time. Wrong by three hours. `os.date` without `!` still uses the process timezone, so the two functions do not round-trip each other. In a plugin with agenda, reminder and pomodoro, that puts every time in the wrong place (São Paulo is UTC-3).

The fix is to measure the offset and add it:

```lua
local asUtc = os.time({ year = year, month = month, day = day, hour = h, min = mi, sec = s })
local probe = math.max(asUtc, 86400)
local parts = os.date("*t", probe)
local wallAsUtc = os.time({ year = parts.year, month = parts.month, day = parts.day,
  hour = parts.hour, min = parts.min, sec = parts.sec or 0 })
return asUtc + (probe - wallAsUtc)
```

The `math.max` with 86400 exists because, west of Greenwich, January 1, 1970 in local time falls before the Unix epoch. Everything in daybar goes through [`lib/dates.luau`](https://github.com/nandomoreirame/noctalia-daybar/blob/main/lib/dates.luau), no module calls `os.time` with a table directly, and `run-tests` exports `TZ=America/Sao_Paulo` so the tests do not depend on the machine. The plan was wrong. The prompts of the following tasks for Grok already went out with the fix, otherwise it would have followed the plan and repeated the error in every date module.

### Lua patterns are not regex

The daybar date parser (the one that understands "reunião sexta 15h-16h") was full of regex with alternation, like `(?:-|até|às|as)` for the time separator. In Lua there is no `|`: inside a `string.match` it is just a character, and `*`, `+` and `?` do not apply to a parenthesized group. Pasting the JavaScript regex gives a pattern that compiles and finds nothing.

[`lib/when.luau`](https://github.com/nandomoreirame/noctalia-daybar/blob/main/lib/when.luau) became a tokenizer: it splits the text into words and looks each one up in tables (`RELATIVE_DAYS` with `hoje`, `amanha` and `depois de amanha`, `WEEKDAYS` with the weekdays), with the keys without accents so "amanhã" and "amanha" hit the same. It is more code than the regex, and every case from the v4 test was ported along with it.

### `game-mode` was freezing v5

`game-mode` freezes everything that is not a game while I play, except a process allowlist. The shell is on the list because IPC needs to answer. Only the list said `qs`, the v4 process name. With v5 running as `noctalia`, game mode froze the new shell too. That only showed up on cleanup day, when the v4 code left the scripts, and the fix was swapping `qs` for `noctalia` in a regular expression. A layer like `nocta` solves the syntax; it does not help when the process name is written by hand in another script.

## October 21: v4 leaves

The plan asked for seven days with v5 as the default before removing v4. The default switch was on the 18th, and the last time I went back to v4 was on the 19th. On the 21st I wrote: "I think I used noctalia v5 enough to approve it as default and drop the noctalia-shell v4 install". I did not wait the seven days.

Everything left at once: the v4 branch of `nocta` and of the scripts, `noctalia-switch` and `noctalia-session` (Niri went back to starting `noctalia` directly), the JSON config, the old color schemes, both packages and 1.6 GB of `noctalia-qs` rebuild cache. Before that I kept a backup of the v4 config in a tarball. The `-v4` worktrees were deleted, the `legacy-v4` branches stayed: the QML of [aibar](https://github.com/nandomoreirame/noctalia-aibar/tree/legacy-v4) and [daybar](https://github.com/nandomoreirame/noctalia-daybar/tree/legacy-v4) is still there, frozen, for anyone still on v4.

`noctalia-switch` lived seven days, from the 14th to the 21st. It is what let me port daybar on the 19th with v5 open and v4 one command away, and it left with v4. What remains from the migration is `nocta` and the test kit, waiting for the Gistbar port.

`pacman -Rns noctalia-shell noctalia-qs`
