---
slug: niri-scratchpad-windows-vanish
translationOf: scratchpad-no-niri-janelas-que-somem-com-um-atalho
title: "Scratchpad on Niri: windows that vanish and return with a shortcut"
seoTitle: "Niri scratchpad: windows that vanish with a key"
summary: "Niri cannot minimize a window. A 199-line script and a hidden workspace make WhatsApp, Obsidian and YouTube appear and disappear with one key, and Discord, Spotify and LocalSend return to the tray."
markers:
  - niri
  - wayland
  - shell
  - linux
extras:
  - "7 shortcuts, 1 script, 15 BATS tests"
  - "Niri · Bash · jq"
keyPoints:
  - "Niri does not minimize windows: a named, hidden workspace plays the role of i3 and Sway's scratchpad."
  - "The window returns on the focused monitor with move-window-to-monitor, not a workspace index, which repeats per monitor."
  - "Tray apps close to the tray; the rest goes to scratch, and a single line in the preset decides."
snapshot:
  items:
    - label: OS
      value: CachyOS
    - label: Compositor
      value: Niri
    - label: Tests
      value: 15 BATS tests
    - label: Query
      value: niri msg --json
    - label: Filter
      value: jq
---

I hit `Mod+Shift+A` and WhatsApp appears floating, centered on the monitor I am on. I hit it again and it vanishes, and focus returns to the terminal I left. There are seven shortcuts like that on my [Niri](https://github.com/YaLTeR/niri): YouTube on `Y`, YouTube Music on `U`, WhatsApp on `A`, [Obsidian](https://obsidian.md) on `O`, Discord on `D`, Spotify on `S` and LocalSend on `L`, all with `Mod+Shift`.

Searching "how to minimize a window on Niri" leads nowhere, because Niri has neither minimize nor hide. It organizes everything in scrollable columns, and a window either exists in a column of some workspace or it does not exist. A compositor without minimize does not need to gain minimize: it is enough to emulate a scratchpad (the scratch area of i3 and Sway), with a workspace I never visit and a script that takes the window there and brings it back.

## A workspace nobody visits

The hideout is a named workspace, declared in `config.kdl`:

```kdl title="config.kdl"
workspace "scratch" {
    open-on-output "eDP-1"
}
```

It stays pinned to the laptop panel, so it never goes orphaned when I unplug the external monitors and so it never enters the main monitor's workspace navigation. And it has to be declared: **sending a window to a named workspace that does not exist in the config is an operation that does nothing and complains about nothing.** The comment above the block is there so I never discover that again.

The other half is the window rule. Each scratchpad app opens floating (`open-floating true`), so when it appears it sits on top of the columns, without pushing the layout sideways.

## Find the right window by app-id

Everything starts by discovering whether the window already exists. The script asks Niri (`niri msg --json windows`) and filters by app-id with `jq`. Each app is a preset with a regex and a launch command, and the regexes are all anchored:

| Preset | app-id | Why |
|---|---|---|
| `discord`, `localsend`, `obsidian` | `^discord$`, `^localsend$`, `^obsidian$` | Exact name, nothing similar gets in |
| `spotify` | `(?i)^spotify$` | The flatpak calls the window `spotify`, the native package calls it `Spotify` |
| `youtube`, `youtube-music`, `whatsapp` | `^chrome-<host>__-` | The Chrome profile suffix changes (`Default`, `Profile_1`), so it only matches the host |

The anchor has a reason: without it, any window with `discord` in the middle of the app-id would be hidden instead of launching Discord. There is a test for that, with a fake window named `discord-overlay-helper`: the toggle must not touch it and must launch the app.

WhatsApp taught me the Chrome part. The script was born on June 2, one day after I installed [CachyOS](https://cachyos.org), and on that first day WhatsApp was an installed PWA, and an installed PWA's app-id is a hash (`chrome-<extension-id>-Default`). It worked, but it tied the shortcut to `chrome://apps`: if I removed the PWA from there, the shortcut died. On the afternoon of the next day I swapped it for `google-chrome-stable --app=https://web.whatsapp.com`, the same format as YouTube and YouTube Music, and the app-id started being derived from the address.

## Show on the right monitor, hide without stealing focus

The whole toggle logic fits in one function:

```bash
scratchpad_toggle() {
  local wid
  wid="$(scratchpad_window_id)"
  if [[ -z "$wid" ]]; then
    scratchpad_launch
    return 0
  fi
  if [[ "$HIDE" == tray ]]; then
    niri msg action close-window --id "$wid"
    return 0
  fi
  if scratchpad_in_scratch "$wid"; then
    scratchpad_show "$wid"
  else
    scratchpad_hide "$wid"
  fi
}
```

With no window, it launches the app with `setsid`, detached, so the process survives the end of the script. On Obsidian that matters: if I call `obsidian` with it already open, the vault-picker window appears. That is why the script only launches when it finds no window at all.

To show, I move the window to the focused **monitor**, not to a workspace index. Niri's indexes repeat per monitor, and it resolved the index from the monitor where the window was (the scratch one). The result was the window always reappearing on the same screen, no matter where I was looking. With `move-window-to-monitor` it comes to where I am; then the script focuses and centers it.

To hide, `move-window-to-workspace --focus false scratch`. Only, if the hidden window was the only one on the workspace and held focus, Niri has nowhere to leave focus and follows it into scratch. The script checks the focused workspace after moving and, if it fell into scratch, returns with `focus-workspace-previous`.

There is also the `start` mode, which launches the app already hidden, for login: the app stays open, only out of sight. Today my login only brings up Steam and 1Password, so the WhatsApp line is commented out in the config, ready to come back.

## Some apps need no hideout

Discord, Spotify and LocalSend close to the system tray. Even so, the script used to send Discord and Spotify to scratch, like any other app. Today I asked for the opposite, in these words: "I want it to close to the app drawer and not send it to the hidden workspace".

It became one line per preset, `HIDE=tray`, and the branch in the toggle that shows up above: instead of moving, `niri msg action close-window --id`. The process stays alive in the tray. Next time I hit the key, there is no window, so the script falls into the launch branch and runs the command again. Because all three are single-instance, the command creates no new process: the instance in the tray reopens the window. I checked live, with the same PID before and after the toggle on Discord and Spotify, and LocalSend reopened on the same PID after closing.

LocalSend has a story of its own. It comes up at login with `--hidden`, so after a reboot it stays only in the tray, with no window, and the shortcut needs to know how to open from there. It had also vanished from the machine in the Omarchy-to-CachyOS migration, because it was never in the dotfiles package lists (now it is, and its port was opened in the firewall). `Mod+Shift+L` came back today.

WhatsApp, YouTube, YouTube Music and Obsidian stay on scratch.

## Testing a script that talks to the compositor

A script that only makes sense with Niri running is annoying to test, and I wrote the tests before today's change. There are 15 tests in [BATS](https://github.com/bats-core/bats-core), and the trick is never letting the real Niri get close. Two stubs go on `PATH`: a fake `niri` answers `--json` queries with the JSON each test defines and logs every `msg action` call, and a fake `setsid` logs the command instead of opening the app. The test then checks the log:

```bash
@test "discord toggle closes a visible window back to the tray, never into scratch" {
    FAKE_WINDOWS='[{"id":7,"app_id":"discord","workspace_id":2}]' \
    FAKE_WORKSPACES='[{"id":2,"idx":1,"name":null,"is_focused":true}]' \
        run_scratchpad toggle discord

    assert_success
    run grep -F -- "close-window --id 7" "$CALL_LOG"
    assert_success
    run grep -cF -- "move-window-to-workspace" "$CALL_LOG"
    assert_output "0"
}
```

Two traps live in the test helper. The first: on my machine `BASH_ENV` points at `~/.bashrc`, which puts the original `PATH` back in front, and the child bash would find the real `niri` before the stub. That is why the script runs with `env -i` and a hand-built `PATH`. The second: the launch goes to the background, so the fake `setsid` line can land in the log after the script has already finished. The test waits for it instead of looking at the log right away.

There is also a test for the crooked case: a Discord that stayed in scratch because of an old toggle needs to go to the tray with one press, and not reappear on screen. With the 15 passing, `shellcheck` and `niri validate` clean, the change landed.

## What stayed out

ZapZap opens floating, but has no toggle. TickTick had a shortcut until October 11, when I uninstalled the app. And the Discord shortcut belonged to DroidCam until the end of August.

The rule that stuck: an app that has a tray closes to the tray, the rest goes to scratch, and a single line in the preset decides.

`focus-workspace-previous`
