---
slug: dotfiles-from-symlink-to-reinstall
translationOf: seu-sistema-tem-memoria-por-que-manter-um-dotfiles
title: "Does your system have memory? A dotfiles from the first symlink to a reinstall"
seoTitle: "A dotfiles from symlink to reinstall"
summary: "Formatting cost me a full day and a week remembering what I had missed. How to build a dotfiles that keeps the configs and the why of each one, and how it reinstalls the whole system on a blank machine, with what broke anyway."
markers:
  - dotfiles
  - linux
  - shell
extras:
  - "From a full day to a few hours per reinstall"
  - "Bash · Git · 1Password · CachyOS"
keyPoints:
  - "The dotfiles starts with a symlink: the file lives in the repository, and every change goes through Git."
  - "Secrets stay out of the repository: the versioned file has the structure, and the value lives in a local file that Git ignores."
  - "Each reinstall makes the next one shorter, because what I had to remember becomes a line of code or of a playbook."
snapshot:
  items:
    - label: "Language"
      value: "Bash"
    - label: "Link map"
      value: "configs/links.conf"
    - label: "SSH keys"
      value: "1Password (agent)"
    - label: "Packages"
      value: "pacman · AUR · Flatpak · npm"
    - label: "System"
      value: "CachyOS + Niri + Noctalia"
---

In 2015 I wrote here about [my work environment](/meu-ambiente-de-trabalho-em-7-itens): Ubuntu 15.04, GNOME Shell 3.14 and Sublime Text 3. Midway through the post there is this line: "Whenever I install Sublime Text, I usually go ahead and install my packages too, here is the list". And then came the list, Emmet, Sass, GitGutter and so on.

The list lived in a blog post. The real configuration lived in my head. Formatting meant downloading and installing one by one, regenerating the SSH and GPG keys by hand and rebuilding the configs as I bumped into each one. It took a full day, sometimes more, because I spent the following week remembering what I had forgotten to install.

In June 2026 I swapped Omarchy for a clean [CachyOS](https://cachyos.org), with Niri and Noctalia ([I told why here](/en/dynamic-tiling-or-stacked-windows)), and in a few hours the machine was mine again. This post is the path to that, from the first symlink to the reinstall, with what I did in mine at each step so you can build yours. I will not compare stow, chezmoi and yadm; anyone who wants that map will find it in [Awesome dotfiles](https://github.com/webpro/awesome-dotfiles), a curated list of tools, articles and example repositories. I tried a few, but (as a good programmer) I wanted to write my own scripts. I really like shell script, and my dotfiles is Bash from start to finish.

## Start with the files you use most

Mine started on a Sunday in November 2016, on macOS. On day one came the Git config, the Sublime Text and VS Code preferences and an `install.sh` that installed Homebrew and, with it, zsh, curl, wget and the usual apps. Start in the same place: the files you touch most are the ones that hurt most when they disappear.

The whole mechanism is a symlink. The real file moves into the repository, and in the original place sits a link pointing at it:

```bash
mkdir -p ~/.dotfiles/configs
mv ~/.zshrc ~/.dotfiles/configs/.zshrc
ln -s ~/.dotfiles/configs/.zshrc ~/.zshrc

cd ~/.dotfiles
git init
git add configs/.zshrc
git commit -m "add zshrc"
```

The shell keeps reading `~/.zshrc` as always. **The difference is that now every change goes through Git:** you tweak an option, `git diff` shows it, and the config never disappears on a format again.

## Swap the hand-made symlink for a map

With two or three files, `ln -s` is enough. With dozens, you forget which link you created (which is exactly the problem the dotfiles was supposed to solve). The way out is to write the map in a file and let a script create the links.

Mine is called `configs/links.conf` and has three sections: `[files]` for loose files that go to home, `[paths]` for whole folders (with one destination for Linux and another for macOS when needed) and `[paths:arch]`, which only loads on Arch:

```ini
[files]
.zshrc
.gitconfig

[paths:arch]
configs/niri/config.kdl | .config/niri/config.kdl |
configs/noctalia | .config/noctalia |
configs/espanso | .config/espanso |
```

Source in the repository, destination relative to home, and the section decides on which system that entry applies. The `dotfiles links --all` command reads that file and creates everything.

The care that matters most in that script is how to handle a destination that already exists. On a new machine, the app has already created its default config, and deleting that without asking is asking to lose something. Mine never deletes a real file (short version):

```bash
_backup_or_remove_target() {
    local target_path=$1

    # If doesn't exist as file or link, nothing to do
    if [ ! -e "$target_path" ] && [ ! -L "$target_path" ]; then
        return 0
    fi

    # If it's a symlink, remove to recreate
    if [ -L "$target_path" ]; then
        rm -f "$target_path"
        return 0
    fi

    # If it's a real file/dir, move to .bak with timestamp
    local ts
    ts=$(date +%Y%m%d-%H%M%S)
    mv -f "$target_path" "${target_path}.bak.${ts}"
}
```

An old symlink is recreated, a real file becomes a dated `.bak`. You can run the command as many times as you want without breaking anything, and I run it again every time I add a config to the map.

## Write the why next to the what

Six months later, a config with no explanation looks like junk. The pacman package list in my repository is grouped by purpose, and each block has a comment saying why it exists. The Podman one, for example:

```bash
# Bloco containers (podman..fuse-overlayfs): engine Podman + GUI Podman Desktop +
# shim que provê o comando `docker` (podman-docker) + compose nativo. fuse-overlayfs
# é OBRIGATÓRIO neste host: o root é btrfs e o driver overlay nativo do kernel
# falha ("'overlay' is not supported over btrfs"); sem ele nenhum comando podman
# roda. A storage.conf é gerada pelo setup script scripts/setup/podman-storage.sh.
```

Without that comment, one day I would look at `fuse-overlayfs`, decide it was a forgotten dependency and remove it. And no Podman command would run anymore. The same goes for the commit message: the reason goes with the change, because that is what answers "why did I make this change?" when you no longer remember.

## Keep secrets out of the repository

Not everything on your machine should go into Git. Keys, tokens and work email stay out, even in a private repository. My old one was once public; today's, which I restarted from scratch in 2025, is private, and the rule still holds.

My approach: the versioned file has the structure, and the value lives in a local file that Git ignores. The repository's `.gitconfig` turns on commit signing and ends with an include:

```ini
[include]
	path = ~/.gitconfig.local
```

`~/.gitconfig.local` is generated by a command of mine (`dotfiles profile`) from a profile file that also sits in `.gitignore`. Only the template goes into the repository, with fake values:

```bash
# Copy this file to git-personal.conf and fill in your values.
# The .conf file is NOT tracked in git.
GIT_GPG_FORMAT="ssh"
GIT_SIGNING_KEY="ssh-rsa YOUR_PUBLIC_SSH_KEY_HERE"
GIT_GPG_SSH_PROGRAM="/opt/1Password/op-ssh-sign"
```

On a new machine I copy the `.example`, fill it in and run the profile. That is the step I cannot forget: until the profile runs, every commit dies with `gpg: signing failed: no secret key`.

## Before the clone: the chicken and the egg

If your dotfiles is private, `git clone` over SSH needs a key. And on a freshly formatted machine, the key does not exist.

My way out is to keep the keys off the machine. Before any other program, I install two by hand, Chrome and 1Password, and with both logged in I already have every access I need. The SSH keys live in 1Password, and its SSH agent is what I use to clone any private repository of mine. No key is copied from a USB stick or generated again.

For keys that are not in 1Password, there are two commands. `sys-ssh-keys` generates the key, adds it to the agent, copies the public one to the clipboard and tests the connection to GitHub, GitLab or Bitbucket. `sys-gpg-keys` generates the GPG key, copies the public one and configures Git to sign commits and tags. With no argument, both open a menu.

## One list per package manager

What used to be "download and install one by one" becomes a list per manager. In mine, each one is a function in `lib/` that returns the names, grouped by purpose and commented:

| Manager | Default list |
|---|---|
| pacman | 69 packages: zsh, git, ghostty, fzf, ripgrep, btop, Podman, video codecs |
| AUR | 15: Chrome, Zen, VS Code, Cursor, 1Password and its CLI, Google Cloud CLI, [espanso](https://espanso.org) |
| Flatpak | 3: Flatseal, Slack and DevToolbox |
| npm global | 8 packages |
| own installers | oh-my-zsh, [mise](https://mise.jdx.dev), eza, Docker, AWS CLI, Terraform and the agy CLI |

The installer skips what is already installed, so running twice does no harm:

```bash
local to_install=()
for pack in "${_packages[@]}"; do
    if pacman -Q "$pack" &>/dev/null; then
        echo "$pack já instalado, pulando"
    else
        to_install+=("$pack")
    fi
done
```

Here I run the command and wait. The tip that saved me the most work is to separate the package list from the install code: adding an app becomes editing one line, and the `git diff` of that file becomes the history of what you use.

The same repository has already run on Ubuntu, Pop!_OS, macOS and Arch, and each one has its manager. Before installing anything, `lib/environments.sh` figures out where it is. `uname` separates macOS from Linux, and on Linux `/etc/os-release` says whether it is Arch or a derivative:

```bash
if [ "$_os_id" = "arch" ] || echo "$_os_id_like" | grep -q "arch"; then
    DOTFILES_IS_ARCH=true
fi
```

CachyOS declares itself as an Arch derivative in `ID_LIKE` and falls into the same path, with no extra line. Those variables are why each list goes to the right manager and the `[paths:arch]` sections of the link map only load where they make sense.

## Scripts that run once

Some things are not packages: cedilla on a US-international keyboard, GTK dark theme, default apps by file type, Podman storage on btrfs. Those are scripts that run once per machine and never again.

They live in `scripts/setup/`, and a registry in `lib/setup.sh` says when each one runs (a snippet):

```text
fix-cedilla.sh|auto|Cedilha (ç) no teclado US-international
gtk-dark.sh|auto|Aparência escura GTK/libadwaita (agnóstico de DE)
podman-storage.sh|auto|Storage rootless do Podman em btrfs/zfs (fuse-overlayfs)
tailscale.sh|manual|VPN mesh Tailscale (instala + ativa; requer login no navegador)
```

`auto` runs on the full install. `manual` waits for me to ask with `dotfiles setup:run <name>`, like [Tailscale](https://tailscale.com), which opens the browser for login.

They used to live in `bin/`, and I took them out on purpose. Everything in `bin/` goes on the PATH, and a script that runs once per machine does not deserve to become a permanent command.

## Order matters

`dotfiles` has a full install that does everything at once, but I prefer to run one step at a time, in the same order. That way I see where each thing fails:

```bash
git clone git@github.com:nandomoreirame/.dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./bin/dotfiles pacman:install
./bin/dotfiles aur:install
./bin/dotfiles flatpak:install
./bin/dotfiles sh:install        # oh-my-zsh, mise, Docker...
./bin/dotfiles node:install
./bin/dotfiles fonts:install
./bin/dotfiles links --all
./bin/dotfiles setup:run <nome>  # um script de setup por vez
```

The repository is private; the playbook is a template. When I add a new step, the question is always what it depends on. The npm packages need the Node that `mise` installs, so they come after `sh:install`; the script that configures Podman storage needs Podman installed, so it runs after the apps.

## What broke anyway

Three things on day one of CachyOS.

### The terminal opened in fish

CachyOS ships with fish as the login shell, and my whole setup is zsh: it is `.zshrc` that puts the dotfiles scripts on the PATH and loads the aliases. I opened the terminal and noticed right away that it was not my usual. Quite a scare, and the first thought was "crap, I will have to figure out where and how to fix this". Then I remembered there was a command to change the default shell and ran `chsh -s /usr/bin/zsh`. One more thing was still missing: the `~/.zshrc` symlink pointed at the repository root, from before I moved the configs into `configs/`, and a `dotfiles links --files` recreated the link in the right place.

If your distro picks the shell for you, put `chsh` in your playbook.

### Niri ignored all my shortcuts

The first line of my `config.kdl` is `include "monitor.kdl"`, a file that `nwg-displays` generates with the monitor layout, and I did not version it because each machine has its own. Without it, [Niri](https://github.com/YaLTeR/niri) rejects the whole config with `failed to read included config` and falls back to the default shortcuts. The symlink was fine. The included file was missing.

Today `monitor.kdl` is versioned and is on the link map. If your config includes another file, make sure it exists on every machine, even if empty.

### Noctalia wiped my config

That one hurt. Before formatting, I had versioned the [Noctalia](https://github.com/noctalia-dev/noctalia-shell) config I had built while trying it on Omarchy. On the new machine, Noctalia started at login before `dotfiles links` created the `~/.config/noctalia` symlink, and the version of the time (v4) did not reread `settings.json` afterwards. I did the obvious thing and restarted the process. Only v4 wrote the config when it got SIGTERM, and now `~/.config/noctalia` was a symlink into the repository. The old instance, with the default config in memory, died writing over my tweaks.

**That is when versioning everything paid off:** a `git checkout -- configs/noctalia/{settings,plugins,colors}.json` brought the config back. On v5, which I have used since October, that does not happen again. What I change through the UI goes to a state file outside the repository, and restarting with SIGTERM does not touch the versioned config (I tested: the files come out with the same checksum).

## Recipe and photo

Of the three, only `monitor.kdl` became code. `chsh` became a playbook line, and Noctalia v5 fixed it for me. That is how "a full day" became "a few hours": on each reinstall, what I had to remember goes into the repository, either as code or as a playbook.

Dotfiles is often confused with backup, but the two keep different things. The dotfiles is the recipe: what to install, how to configure, where each file lives and why. The photo is the system snapshot, and I keep both. On CachyOS, snapper takes a btrfs snapshot before and after every pacman update, and a script from the dotfiles itself sends the whole system to my homelab every day. The photo is for going back to yesterday when an update breaks something. The recipe builds the system on a machine that has never seen it, and only it explains why `fuse-overlayfs` is installed.

If you still lack a dotfiles, start today with the file that would most annoy you to lose: put it in a repository, create the symlink and commit. When the scripts start running on their own, from shortcuts and timers, it is worth testing them; I told how in [treating dotfiles as software](/en/treating-dotfiles-as-software).

`ln -s`
