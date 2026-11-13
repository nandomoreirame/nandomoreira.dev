---
slug: automate-your-own-problems
translationOf: scripts-que-automatizam-meu-linux
title: "Automate your own problems: a guide with the scripts that run on my Linux"
summary: "How to find what is worth automating, write the simplest version that works, choose between shell, Python and Rust and make the script run without you. With my dotfiles scripts as examples and a list of ideas to steal."
markers:
  - linux
  - shell
  - productivity
extras:
  - "66 lines that turn on Do Not Disturb on a call"
  - "bash · systemd · PipeWire · Niri"
keyPoints:
  - "The first script only needs to do what you used to do by hand; error handling and options come later."
  - "A script you have to remember to run still depends on you: give it a shortcut, login, a timer or a hook."
  - "A watcher only acts when state changes, and before writing it ask what else on the system looks like what it watches."
snapshot:
  items:
    - label: "Watcher"
      value: "niri-mic-dnd"
    - label: "Interval"
      value: "2 s"
    - label: "Audio"
      value: "PipeWire (pw-dump)"
    - label: "Compositor"
      value: "Niri"
    - label: "Timer"
      value: "systemd"
---

When I join a call, notifications disappear and the screen stops turning off. When it ends, everything comes back. I press nothing: a 66-line script watches the microphone every two seconds and does that for me.

That script is not special. It solves a problem of mine, in the simplest way that worked, and that is what I want you to do with yours. **A ready-made tool solves everyone's problem; a script solves yours**, and your problem is almost never in a ready-made tool. It does not matter whether you write in shell, Python, Rust or something else: the path is the same.

## Find the problem that repeats

A good script candidate looks like one of these:

- The sequence of commands you type the same way every time. Open the terminal history (`history | less`) after a week of work and look for what repeats. My [Gitflow scripts](/en/gitflow-scripts-to-a-skill) were born that way, around 2019: they were the sequence I typed every time I opened a branch.
- What you forget to do: backup, clear cache, delete old screenshots. If it depends on you remembering, it will not happen.
- A small daily annoyance: turn on Do Not Disturb before a call, switch the audio output when you plug in headphones, find the Spotify window. Each one costs seconds, and they repeat all day.
- A once-a-year task that you always have to look up again: generate an SSH key, install an AppImage properly. The script becomes the documentation you never wrote.

## Write the dumbest version that works

The first script does not need error handling, help text or options; it needs to do what you used to do by hand, and only that. My Gitflow one had 31 lines. It validated the argument and ran, in the same order, the commands I already typed, and I used that for years before it grew.

In shell, the minimum is this:

```bash
#!/usr/bin/env bash
set -euo pipefail

[ -n "${1:-}" ] || { echo "uso: $(basename "$0") <nome>" >&2; exit 1; }

# os comandos que você já digita, na mesma ordem
```

`set -euo pipefail` makes the script stop on the first error, instead of keeping going on top of a broken state. It is the line that pays off most in shell.

## Pick the language by the problem

I write a lot of shell because I like it, but it is not the only tool in the box. The rule I use:

| If the script… | I use | My example |
|---|---|---|
| Glues commands that already exist (git, pacman, ssh, pw-dump) | Shell | almost everything in the dotfiles `bin/` |
| Touches data, HTTP, JSON, real text | Python | [job-radar](/en/job-radar-pure-python), which scrapes job sites with only the standard library |
| Needs a terminal interface or stays running for a long time | Rust | the dotfiles TUI, the `rdo-solo` one on the homelab and [`stats`](/en/analytics-without-browser-javascript), which reads the blog analytics |

When the shell starts filling up with `sed` and `awk` to pick a format apart, it is time to switch. And you do not have to pick only one: my shell scripts call `jq` to read JSON all the time, and the Rust TUI in the dotfiles calls the shell scripts instead of rewriting them.

Any language becomes a command the same way: a first line saying who runs the file (the shebang), execute permission and a folder on the PATH.

```bash
#!/usr/bin/env python3
```

```bash
chmod +x ~/bin/meu-script
export PATH="$HOME/bin:$PATH"   # no seu .zshrc ou .bashrc
```

In my dotfiles, every subfolder of `bin/` goes on the PATH through `.zshrc`, and the script is available in any terminal.

## Give the script a front door

A script you have to remember to run still depends on you. What helped me most was deciding, for each one, who presses the button: me in the terminal, a shortcut, login, a schedule or another program.

| Door | How it works | My example |
|---|---|---|
| Terminal | It is on the PATH, you type | `git-release`, `hd-backup` |
| Keyboard shortcut | The window manager calls the script | `niri-scratchpad` on `Mod+Shift+S` |
| Login | Starts with the session and keeps watching something | `niri-mic-dnd`, `audio-jack-autoswitch` |
| Timer | systemd runs it on a schedule, with no terminal | the daily system backup |
| Hook | A program calls it at the right moment | git's `commit-msg`, machine shutdown |

On Niri, the shortcut and login are one line each in `config.kdl`:

```kdl
spawn-at-startup "sh" "-c" "~/.dotfiles/bin/utils/niri-mic-dnd"
```

On GNOME, KDE or another environment, the equivalent is a custom shortcut in the settings, and for login a `.desktop` in `~/.config/autostart/`. For a timer, a systemd `.service` plus `.timer` (or good old `cron`).

## Make it run on its own

Scripts that watch something almost always follow the same shape: a loop that looks at state, compares with the previous one and only acts when it changes. Mine for the microphone, without the comments:

```bash
main() {
  local using prev="unknown"
  while true; do
    if mic_in_use; then using=1; else using=0; fi

    if [ "$using" = 1 ] && [ "$prev" != 1 ]; then
      hold dnd acquire mic
      hold awake acquire mic
    elif [ "$using" = 0 ] && [ "$prev" = 1 ]; then
      hold dnd release mic
      hold awake release mic
    fi

    prev="$using"
    sleep "$INTERVAL"
  done
}
```

Acting only on change stops the script from turning Do Not Disturb back on every loop pass, which runs every two seconds. Since it starts at login, a `flock` at the beginning guarantees a single copy.

What matters most in this kind of script is defining what counts as "state". My desktop bar has an audio visualizer. It also captures sound: what comes out of the speaker, to draw the waves. If the script counted any capture as the microphone in use, Do Not Disturb would stay on forever, as if I were in an eternal call. That is why the PipeWire query ignores speaker captures. Before you write your watcher, ask what else on the system looks like what you are watching.

A script that starts to matter gets a test. `nocta-hold` and `audio-jack-autoswitch` have theirs, and I told how I test mine in [treating dotfiles as software](/en/treating-dotfiles-as-software).

## Ideas to steal

All of this lives in my dotfiles, which is private, so there is no link to the code. Some got their own post, with the link on the item.

**Git**

- `git-feature`, `git-bugfix`, `git-hotfix`, `git-release`: the whole Gitflow in one command, from branch to merge, tag and changelog ([their story](/en/gitflow-scripts-to-a-skill)).
- `git-push`: sends the branch to every configured remote at once.
- `git-rollback`: rolls `master` back to a tag.
- `git-strip-ai-signatures`: a global `commit-msg` hook that strips the signatures AI tools put on the commit.

**Install and configure**

- `dotfiles`: config symlinks, packages from each manager and new-machine scripts ([the post about it](/en/dotfiles-from-symlink-to-reinstall)).
- `sys-ssh-keys`: generates the key, adds it to the agent and copies the public one.
- `sys-gpg-keys`: generates the GPG key, copies the public one and configures git to sign commits and tags.
- `appimage-install`: stores the AppImage in `~/.local/opt`, creates the PATH link and the launcher shortcut.
- `webapp-install`: turns a site into an app with its own window and an icon in the launcher.

**A desktop that reacts on its own**

- `niri-mic-dnd` and `niri-dnd-screenshare`: Do Not Disturb during a call and while the screen is shared or recorded.
- `niri-keepawake-tasks`: keeps the screen awake while a long task runs.
- `niri-power-autoprofile`: on AC, performance profile; on battery, power saving.
- `niri-hdmi-automode`: the TV and the monitor share the same cable, and it applies the right resolution for the connected device.
- `nocta-hold`: the judge of the ones above. Counts how many scripts asked for Do Not Disturb, so the first one to finish does not turn off what another still needs.

**Windows, audio and modes**

- `niri-scratchpad`: a shortcut shows and hides Spotify, WhatsApp and Discord ([scratchpad on Niri](/en/niri-scratchpad-windows-vanish)).
- `audio-jack-autoswitch`: plugged in the headphones, headphone profile; unplugged, speaker ([mute headphones and the P2 jack](/en/mute-headphones-for-78-days)).
- `bt-audio`: sends output and microphone to the Bluetooth headset, ignoring mouse and keyboard.
- `game-mode`: freezes the work apps to free the machine for the game, without closing anything ([game mode with the cgroup freezer](/en/game-mode-freezing-work-with-cgroup)).
- `focus-mode`: freezes only the distractions (Steam, Telegram), turns on Do Not Disturb and leaves the music playing.

**Backup and cleanup**

- `sys-btrfs-backup`: daily incremental system snapshot to my [homelab](/en/homelab-on-a-2018-mac-mini).
- `hd-backup`: packs a folder and sends it to another disk or machine, with a progress bar.
- `sys-clean-cache`, `clean-screenshots` and `clean-claude-sessions`: cache cleanup, screenshots older than a week and old Claude Code sessions.
- `podman-shutdown`: stops the containers calmly before shutting down the machine.

**Small utilities**

- `downloads`: downloads in parallel a list of URLs from a `.txt`, with a progress bar per file.
- `utils-password`: generates a password and already copies it to the clipboard.
- `utils-tempo`: weather forecast in the terminal, via [wttr.in](https://wttr.in).
- `rdo-solo`: controls from the laptop the filter that keeps Red Dead Online in a session of my own ([Red Dead Online alone via the gateway](/en/rdo-solo-alone-via-home-gateway)).

## Start with the most annoying one

Do not start with the coolest script on the list. Start with the one that most annoys you this week. My Gitflow one was just the sequence I already typed, pasted into a file; the ones that react on their own came years later, one problem at a time.

`exit 0`
