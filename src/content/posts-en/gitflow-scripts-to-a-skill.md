---
slug: gitflow-scripts-to-a-skill
translationOf: meus-scripts-de-gitflow-de-31-linhas-a-uma-skill
title: "My Gitflow scripts: from 31 lines of Bash to a Claude Code skill"
summary: "Around 2019 I wrote a few scripts so I would not type the same git flow every time I opened a branch. They grew, got rewritten with AI and today live in a skill. The idea is still the same."
markers:
  - git
  - shell
  - productivity
snapshot:
  items:
    - label: "First version"
      value: "feature.sh, 31 lines"
    - label: "Dependency"
      value: "git-flow (gitflow-avh)"
    - label: "Library"
      value: "lib/gitflow.sh"
    - label: "Release"
      value: "git-release, 867 lines"
    - label: "Changelog"
      value: "Conventional Commits"
    - label: "Today"
      value: "skill /git + release.sh"
---

`feature DEV-123`. That is what I typed to start any task: one command, the card ID, and the script did the rest. It stashed whatever changes I had, updated the development branch, created the feature branch, published it to the remote and restored my changes. It was 31 lines of Bash I wrote around 2019, 2020, long before I had AI in the terminal.

I am not going to argue whether Gitflow still makes sense in 2026 (some people love it, some hate it, like almost everything in git). The point here is another one: if you repeat the same sequence of five or six commands every time you open a branch, that sequence is a script waiting to be written. **Even if you are the only one on the project.** Mine were always personal, nobody else used them, and even so they were a damn good idea (modesty aside).

## Gitflow in one sentence, and why it wears you out

Gitflow is a branch model: each task starts on a `feature/` branch from the development branch (`develop`, or `staging` on some projects), returns to it at the end, and every so often a `release/` branch takes everything to `main` (or `master`) with a version tag. Urgent fixes leave production on a `hotfix/` and go back to both sides.

The model is simple to explain. The exhausting part is running it: update both branches, create the new one from the right one, publish, then merge without fast-forward, create the tag, push everything to the remote, delete the local branch and the remote one. Forgetting a step is easy, and the forgotten step is usually the tag.

## The first version fit on one screen

Before I used AI in the terminal, I solved this kind of thing with a shell script. The feature one looked like this, the whole thing:

```bash
#!/bin/bash

if [ -z "$1" ]; then
    echo "❌ Erro: o ID do Jira é obrigatório"
    echo "Uso: ./scripts/git-flow/feature.sh <id_do_jira>"
    echo "Exemplo: ./scripts/git-flow/feature.sh DEV-123"
    exit 1
fi

_JIRA_ID="$1"

git stash
git fetch --all
git checkout staging
git pull origin staging

git flow feature start $_JIRA_ID
git push origin feature/$_JIRA_ID
git stash pop
```

(I only removed the header `echo`s it printed between each step.)

Notice the call path: `./scripts/git-flow/feature.sh`. It was born inside a project's `scripts/` folder. The `bugfix` and `hotfix` ones were the same file with a different prefix. It depended on [git-flow](https://github.com/petervanderdoes/gitflow-avh), the git extension that gives you `git flow feature start` and friends.

The release one was the one that paid off most, at 77 lines. It updated `master` and `staging`, opened the release, bumped the `package.json` version with `jq`, committed, published and finished:

```bash
git flow release start $NEW_VERSION staging

jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
git add package.json && git commit -m "chore: prepare release v$NEW_VERSION" --no-verify

git flow release publish $NEW_VERSION
git flow release finish $NEW_VERSION
```

And it ended by printing the two push commands, for me to run by hand:

```text
git push origin staging
git push origin master --tags
```

Nothing clever there. It was the sequence I ran every day, with comments in Portuguese explaining what `git flow release finish` did under the hood (merge into `master`, create the tag, merge back into `develop`, delete the branch). If you are just starting, that is the best way to write your first script: copy from your terminal history the sequence you already run and paste it into a file.

## After they moved into the dotfiles, they grew

When the scripts moved into my dotfiles, they became commands on the PATH (`git-feature`, `git-bugfix`, `git-hotfix`, `git-release`) and got rewritten with AI. Three changes are worth telling.

The first was dropping the git-flow extension. Today everything is plain git, and the parts shared by the three branch types live in a single library, `lib/gitflow.sh`. It brings protections the 31-line version did not have. A list of branches that can never be "finished":

```bash
# Protected branches that cannot be used for finish
PROTECTED_BRANCHES=("main" "master" "staging" "develop" "dev")
```

And the stash became conditional. The original always ran `git stash`; if there was nothing to stash, the `git stash pop` at the end could reapply an old change that was already on the stack. Now it only stashes if there is a real change:

```bash
_auto_stash() {
    if ! git diff-index --quiet HEAD --; then
        git stash push -m "auto-stash before git flow operation"
        return 0
    fi
    return 1
}
```

The second was detection. The script figures out on its own whether production is `main` or `master` and whether development is `staging`, `develop` or `dev`, so the same command works on a new project and an old one. `finish` also detects the release from the current branch, with no need to repeat the version.

The third was the changelog. `git-release` reads the commits since the last tag, understands the [Conventional Commits](https://www.conventionalcommits.org/) format (`feat(scope): description`, with or without an emoji in front) and splits them into added, fixed, changed and removed:

```bash
if [[ "$clean_msg" =~ ^(feat|fix|refactor|perf|docs|test|chore|sec|security|remove|removed|deprecate|deprecated)(\(.+\))?:[[:space:]]*(.+)$ ]]; then
```

It also updates every `package.json` that git tracks (not only the one at the root) and validates the version in semantic format before starting. The toy went from 77 to 867 lines, a good chunk of them validation and help text.

## Today Claude is the one who runs it

For a while, Claude Code used those same scripts: I asked for a release and it called `git-release`. Today I no longer use the commands directly. Everything moved into a skill, `/git`, and the Gitflow skill got its own `release.sh`.

What the skill adds is the part that needed judgment. It figures out the repository's branch model (if `develop` exists, it is Gitflow; if not, trunk-based), computes the next version from the last tag (patch by default, `0.1.0` if it is the first) and generates the changelog with AI, instead of the regex. The rest, creating the branch, merging, tagging and pushing, is still a script.

The 2019 idea is the same: one command for a whole flow, without me having to remember the order of the steps. What changed was who types the command.

## If you want to build yours

1. Open the terminal history after a week of work and look for the git sequence that repeats.
2. Paste it into a file, swap the branch name for `$1` and validate the argument right at the start.
3. Put the folder on the PATH, so you can call it from any project.
4. Only after that think about branch detection, changelog and protections. The 31-line version solved my problem for years.

That was just one of the scripts I have been carrying for years. I gathered the others, for audio, backup, windows and install, into a [roundup of my dotfiles scripts](/en/automate-your-own-problems), as inspiration.

`git push origin master --tags`
