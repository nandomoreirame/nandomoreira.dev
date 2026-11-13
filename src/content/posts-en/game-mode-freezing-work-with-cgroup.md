---
slug: game-mode-freezing-work-with-cgroup
translationOf: game-mode-congelando-o-trabalho-com-o-cgroup-freezer
title: "game-mode: I freeze work to play, without closing any window"
seoTitle: "game-mode: freeze work apps with cgroup v2"
summary: "A Niri shortcut freezes Chrome, Slack and the terminals with the cgroup v2 freezer, blanks the leftover monitors and turns on quiet mode. Steam and music keep going. Getting there cost a Steam painted black and a game mode that not even its own command could turn off."
markers:
  - linux
  - shell
  - niri
extras:
  - "309-line script with the cgroup v2 freezer"
  - "Niri · Noctalia · PipeWire"
keyPoints:
  - "It freezes scope by scope under app.slice, not the whole slice, so the exit shortcut itself is not born frozen."
  - "Steam, emulators, Noctalia and whoever is playing sound in PipeWire stay out of the freeze."
  - "Opening an app with app.slice frozen paints the window black; that is why the script only freezes and never launches the game."
snapshot:
  items:
    - label: "OS"
      value: "CachyOS"
    - label: "Compositor"
      value: "Niri"
    - label: "Shell"
      value: "Noctalia"
    - label: "Freezer"
      value: "cgroup v2"
    - label: "Script"
      value: "309 lines"
---

When I hit `Mod+Alt+G`, Chrome, Slack, the terminals and the rest of my workday stop using CPU, but stay open exactly where they were. The monitors I am not looking at go blank, [Noctalia](https://github.com/noctalia-dev/noctalia-shell) turns on quiet mode and keeps the screen awake. Steam, [RetroArch](https://www.retroarch.com) and the music keep running. I hit it again and everything comes back, tabs included.

If you play on the same computer you work on, you know the bad choice: close everything and reopen later, or play with work eating CPU in the background. That is `game-mode`, a 309-line script in my `~/.dotfiles`, which escapes both with the cgroup, the kernel's way of grouping processes and controlling what each group uses (the [kernel docs](https://docs.kernel.org/admin-guide/cgroup-v2.html) cover the rest). I will show how it is configured, why each list has what it has, and the two versions I threw away before landing on the toggle. Those are what convinced me that a game mode should not open the game: it only freezes the rest.

## Freeze instead of close

The cgroup v2 freezer stops every process in a group at once: CPU goes to zero, cold pages can go to zram and the windows stay where they are. To the compositor, the frozen window still exists. To me, it is work on pause without needing to reopen anything later.

systemd already splits the session the right way. On my [CachyOS](https://cachyos.org) with [Niri](https://github.com/YaLTeR/niri), the compositor and audio (`niri`, `pipewire`, `wireplumber`) live in `session.slice`, which I never touch. Graphical apps live in `app.slice`, each in its own scope. That is the target.

The obvious path does not work:

```bash
$ systemctl --user freeze app.slice
Unit does not support freeze/thaw
```

The user manager's `app.slice` answers `CanFreeze=no`, unlike `session.slice`, `background.slice` and the individual scopes. The kernel, on the other hand, does not care. The `cgroup.freeze` file sits in the subtree delegated to my user, so you can write it directly, with no `sudo`:

```bash
readonly APP_CG="/sys/fs/cgroup/user.slice/user-${_uid}.slice/user@${_uid}.service/app.slice"

freeze_work_scopes() {
    local self d playing
    self="$(my_scope)"
    playing=" $(media_pids | tr '\n' ' ')"
    for d in "$APP_CG"/*.scope; do
        [[ -d "$d" ]] || continue
        [[ "${d##*/}" == "$self" ]] && continue
        scope_is_kept "$d" "$playing" && continue
        echo 1 >"$d/cgroup.freeze" 2>/dev/null || true
    done
}
```

**The detail that makes the toggle work is freezing scope by scope, and not the whole `app.slice`.** Anything that is born later (the shortcut to turn it off, a new terminal, a Noctalia hook) lands in a new scope, which inherits the parent's state, and the parent is not frozen. If I froze the slice, the exit shortcut itself would be born frozen. The `my_scope` line exists for the same reason: the script runs inside `app.slice` and cannot freeze itself along with it.

## What stays out of the freeze

The part I tweaked the most was the lists of who stays alive. The first is by process name:

```bash
readonly KEEP_COMMS_RE='^(steam|steamwebhelper|reaper|retroarch|gamescope|qs|pcsx2-qt|heroic|lutris)$'
```

`qs` is Noctalia. If it freezes, IPC dies and I lose control of quiet mode. The name comes from `/proc/<pid>/comm`, which the kernel truncates to 15 characters, which is why the PCSX2 binary shows up as `pcsx2-qt`.

Flatpak apps cannot be caught by name: several run behind a generic `run.sh`. For them the list is by app-id, which shows up in the scope directory name:

```bash
readonly KEEP_SCOPES_RE='flatpak-(io\.github\.unknownskl\.greenlight|net\.studio08\.xbplay|app\.xemu\.xemu)'
```

Greenlight and XBPlay are Xbox streaming clients, xemu is the original Xbox emulator. That list landed eight days after the first version, along with PCSX2, Heroic and Lutris in the by-name list.

Music took more work. A fixed list of players (`spotify`, `mpv`, `vlc` and company) covers whoever plays music on purpose. But music playing in a browser tab or a PWA cannot be kept by name without keeping the whole browser. So the script asks [PipeWire](https://pipewire.org) who is producing sound right now, with `pw-dump` and `jq`, and keeps the scope that owns that stream.

The trap was finding out who the owner is. The audio node brings `application.process.id` for clients that go through the PulseAudio layer (browser, Spotify, RetroArch), but that field comes `null` for a native PipeWire client. My first filter looked only at the node, and a test `pw-cat`, with the stream in `running`, came out as "nothing playing". The fix is to fall through to the PipeWire Client object and read `pipewire.sec.pid`, the PID the kernel confirms on the connection. And that PID also lies: for a PulseAudio client it is the `pipewire-pulse` daemon PID, not the app's. The order that works ended up like this: node, then the client's `application.process.id`, and only at the end `pipewire.sec.pid`.

Oh, and the JSON is read with `jq`, never with `python3`. In a process spawned by Niri or by a Noctalia hook, the `python3` that shows up first on `PATH` is a mise shim that can hang waiting for trust in the config, and the script stops in the middle with no error at all.

## How I turn it on and off

There are three entries into the same command:

```kdl
Mod+Alt+G hotkey-overlay-title="Game mode (freeze work apps)" { spawn-sh "~/.dotfiles/bin/utils/game-mode toggle"; }
```

The second is Noctalia's Performance mode: the `performanceModeEnabled` and `performanceModeDisabled` hooks call `game-mode on` and `game-mode off`, so turning on performance mode on the bar also freezes work. The third is the emergency exit: if everything goes wrong, a TTY (`Ctrl+Alt+F2`) lives outside `app.slice`, and `game-mode off` from there writes `0` into each `cgroup.freeze` without depending on the compositor. On a TTY there is no `NIRI_SOCKET`, so the script looks for the socket under `$XDG_RUNTIME_DIR/niri.*.sock` to be able to turn the monitors back on.

Quiet mode and the awake screen are not turned on directly. They go through `nocta-hold`, a reference counter per marker file with `flock`: each script asks for a "hold" with its own name, the resource turns on when the count goes from 0 to 1 and turns off when it returns to 0. Without that, `game-mode` would turn off the quiet mode that another script (the one that silences notifications while I share the screen, for example) still wanted on. And quiet mode I had already turned on by hand before the first hold is remembered and never turned off by the last one.

`game-mode` has a sibling for work, `focus-mode` (`Mod+Alt+F`), which does the opposite: it freezes only a blacklist of distractions and leaves the rest alive. On October 12 I took Discord out of that list, because it needs to stay usable while I work. Today the regex has Steam, Telegram and two alternative Discord clients, vesktop and WebCord.

## Steam painted black

The `game-mode` version I use today was already born as a toggle that opens nothing, and came out in one afternoon, in a few hours with Claude Code. Before it there were two that opened the game, and neither made it into the repository.

The first was the script opening the game. `game-mode on` would launch Steam in Big Picture mode and freeze the rest. Big Picture opened with the whole screen black and a giant cursor, about 60 pixels. The Steam log gave part of it away: `desktop: { size: 5176,1920 }`, the box that sums all my monitors. It was positioning itself outside the visible screen. I tried isolating it in `gamescope`, which solves exactly that, and it hung right after `scriptmgr: Loading scripts`, never reaching Vulkan. I blanked the extra monitors before opening: the cursor went back to normal, the window stayed black. I swapped Big Picture for the regular Steam client: black too.

The multi-monitor diagnosis was wrong. The same Steam, opened from the Noctalia launcher, rendered perfectly. **The difference was opening the app while `app.slice` was already frozen: an app cannot bring up the GPU context in the middle of a freeze, and paints black.** The right order would be open the game first, wait for the window to appear on Niri and only then freeze.

That was the second idea, and it brought two hangups that not even `game-mode off` fixed. The first: to know when the game had ended, the script did `pgrep -x steam`. But the work Steam, frozen in `app.slice`, still exists as a process. `pgrep` found it, the loop waited forever and nothing thawed. The second: `game-mode off` stopped the unit with `systemctl --user stop`, which sends SIGTERM, and a bash `trap ... EXIT` does not run on SIGTERM if you do not also `trap` the signal. The process died, work stayed frozen and the monitors blank.

I fixed both (count processes only inside `game.slice` and `trap 'exit 143' TERM` alongside `EXIT`) and still gave up on launching anything. I open Steam, Steam opens RetroArch, and `game-mode` only freezes. That is why `game-mode on` starts by checking whether Steam is open and, if it is not, warns and does nothing.

## What still bothers me

`game-mode` and `focus-mode` cannot run together. Both touch the same scopes and would fight over them; today that is a warning in the script header, not a lock.

Browser-tab audio is only protected if it is playing at the moment I turn the mode on. If I paused the PWA music beforehand, it freezes along with it and only comes back when I turn it off.

There is no automated test for the real freeze. Claude Code, which helps me write these scripts, runs in Ghostty, inside `app.slice`, so testing the real freeze there would freeze the session itself. What I checked was freezing a real scope, watching `cgroup.events` go from `frozen 0` to `frozen 1` and back.

And there is a freezer that is not mine. systemd freezes user sessions on suspend, and a race can leave a scope behind with `cgroup.freeze` at 1. Steam stayed frozen for three days that way: clicking the icon did nothing, because the launcher only sends a message to the instance that already exists and exits 0. `systemctl --user show` still said `running`. What tells the truth is `cgroup.events`, and the fix is writing `0` into that scope's `cgroup.freeze`.

`echo 0 > cgroup.freeze`
