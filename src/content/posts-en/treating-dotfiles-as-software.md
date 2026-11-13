---
slug: treating-dotfiles-as-software
translationOf: tratando-dotfiles-como-software
title: "Treating dotfiles as software"
summary: "A dotfiles script runs from a shortcut, a timer and a hook, where nobody sees the error. How I test mine with shellcheck and BATS, swap dependencies for stubs and let AI write almost everything without losing trust."
markers:
  - dotfiles
  - shell
  - quality
extras:
  - "571 test cases across 42 BATS files"
  - "shellcheck · BATS · stubs · Rust"
keyPoints:
  - "A script that runs from a shortcut, timer or hook fails with nobody watching; that is why it has a test."
  - "Every external dependency is swappable via an environment variable, and the test points it at a stub."
  - "A fixed bug becomes a test named after the bug, and it goes red if someone reintroduces the error."
snapshot:
  items:
    - label: "Lint"
      value: "shellcheck"
    - label: "Tests"
      value: "BATS (42 files)"
    - label: "Doubles"
      value: "stubs via env vars"
    - label: "TUI"
      value: "Rust + ratatui"
---

For nine days, my system backup did not send a single incremental. The script looked for the previous snapshot on the homelab with an `ssh` inside a `while read`, and `ssh` read stdin: it drained the loop's pipe, only the first candidate was tested, and every run became a full send that blew past the service's two-hour timeout. When I noticed, it was 48.65 GiB in one send and 12 snapshots piled up on disk ([the homelab side is here](/en/homelab-on-a-2018-mac-mini)).

Nobody saw it because nobody was watching: it was a systemd timer running as root around noon. In the [previous post](/en/dotfiles-from-symlink-to-reinstall), the dotfiles saved and reinstalled the system. Here the subject is the script working on the day you need it.

## A script nobody sees fail

A lot of a mature dotfiles does not run in a terminal. In mine, it runs from a [Niri](https://github.com/YaLTeR/niri) shortcut, a timer, a Git hook, when the microphone turns on or when the laptop comes unplugged. When one of those breaks, no message shows up anywhere. The feature just stops.

Today there are 66 scripts in `bin/` and almost 7,500 lines of Bash in `lib/`. At that size, "I test by hand when I touch it" stops working.

## Start with shellcheck

The first step costs nothing: [shellcheck](https://www.shellcheck.net/) catches missing quotes, undeclared variables, `cd` without error handling and other Bash classics. It is on my package list, so every machine has it, and a GitHub Actions workflow runs it file by file on `bin/` and `lib/`:

```bash
find lib -type f -name "*.sh" | while read -r file; do
    shellcheck -e SC1091,SC2034 "$file" || exit 1
done
```

It does not test behavior, but it clears out the errors that would make the test fail for a dumb reason.

## Put BATS inside the repository

For behavior, I use [BATS](https://github.com/bats-core/bats-core). A script in the repo itself (`tests/install-bats.sh`) installs `bats-core` locally plus the `bats-support`, `bats-assert` and `bats-file` libraries, into a folder that stays in `.gitignore`. The tests follow the code layout, `tests/unit/bin/` for the commands and `tests/unit/lib/` for the libraries, and a runner runs everything:

```bash
./tests/run-tests                 # todos os testes
./tests/run-tests unit            # só os unitários
./tests/run-tests tests/unit/bin/nocta-hold.bats
```

Today that is 42 files and 571 test cases.

The reason I got there is my Claude Code framework, which forces TDD on everything, as I told in the post about the [flow with three agents](/en/rpi-flow-with-three-agents). About 90% of the dotfiles code today is written by AI. With AI writing almost everything, the fair move is to test everything I can, and the test comes before the script.

## Make every dependency swappable

A dotfiles script almost always touches real things: SSH, btrfs, the bar's shell, [PipeWire](https://pipewire.org). You cannot test against the real system. The trick is to make every dependency swappable via an environment variable, with the real value as the default, and in the test point that variable at a stub that only records what it received.

`nocta-hold` controls Do Not Disturb when several scripts ask at once, and it talks to the bar through a command called `nocta`. The dependency looks like this:

```bash
# Overridable so tests can inject a stub; default is sibling nocta binary.
: "${NOCTA_BIN:=$SCRIPT_DIR/nocta}"
```

In the test, `NOCTA_BIN` points at the stub that logs every call to a file and answers whatever the test tells it to:

```bash
cat > "$STUB_DIR/nocta" <<'STUB'
#!/usr/bin/env bash
# Log every invocation; answer dnd status from FAKE_DND_STATUS (on|off).
if [ "$#" -eq 0 ]; then
    echo "nocta" >> "$CALL_LOG"
else
    echo "nocta $*" >> "$CALL_LOG"
fi
if [ "${1:-}" = "dnd" ] && [ "${2:-}" = "status" ]; then
    printf '%s\n' "${FAKE_DND_STATUS:-off}"
    exit 0
fi
exit 0
STUB
```

The test then checks the log: who asked for Do Not Disturb, who released it, whether the last one out turned off what it should. No real bar is touched.

## The backup bug, now as a test

The backup fix followed that path. Every SSH call inside a loop started using a function with `-n`, which stops `ssh` from reading stdin:

```bash
# ssh_rn: -n keeps ssh from reading stdin. Mandatory for every call inside a
# `while read` loop, otherwise ssh drains the loop's input pipe and the loop
# ends after a single iteration.
ssh_rn() { ssh -n "${SSH_OPTS[@]}" "$REMOTE_HOST" "$@"; }
```

And the script got `BTRFS_BACKUP_SOURCE` and `BTRFS_BACKUP_LOCAL_DIR`, so the test can point at a temporary folder instead of my root. That was seven tests. The first one is the bug itself written as a test: "probe every local snapshot until it finds the parent present on the homelab". If someone (me or the AI) puts an `ssh` without `-n` in that loop again, it goes red.

## Spec before script

A big change in my dotfiles starts as a document inside the repository itself, under `docs/specs/` and `docs/plans/`. The [Noctalia](https://github.com/noctalia-dev/noctalia-shell) migration to v5, for example, was broken into slices, one per plugin, and each plan carried the same rule: the plugin kept working on v4 until v5 took over, which happened on October 21.

With AI writing most of the code, the spec is where I review the intent before any code exists, and the tests are what let me trust what was delivered.

## A TUI that calls the scripts

The dotfiles menus used to be whiptail, and `lib/interactive.sh` had become 42 KB of Bash. In April 2026 I built a TUI in Rust with [ratatui](https://ratatui.rs), to learn Rust on a project I actually use.

The main rule was not to rewrite anything. The TUI calls the Bash scripts that already exist via `std::process::Command`, reads `links.conf` and the profiles in the formats they already had, and picks up theme and paths from a `config.yaml`. The MVP closed with 50 tests, in a 1.6 MB binary.

It became my main way to install apps. Only now and then do I call the scripts by hand, and they are still there, tested, for when I need them.

## What I take from this

- A script that runs with nobody watching has a test.
- Every external dependency is swappable via an environment variable.
- A fixed bug becomes a test named after the bug.
- A big change starts as a spec inside the repository.
- The interface calls Bash; rewrite in Rust only when Bash gets in the way.

`./tests/run-tests`
