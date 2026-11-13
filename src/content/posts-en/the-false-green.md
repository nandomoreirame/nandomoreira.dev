---
slug: the-false-green
translationOf: o-falso-verde
title: "The false green: when the gate says PASS and nothing ran"
summary: "In a flow with agents, a red test gets investigated. The danger is the green nobody questions: the gate that skipped everything, the pipeline that hid the error, the test that read the source instead of making the request."
markers:
  - quality
  - agents
  - tests
extras:
  - "7 red tests under a green gate"
  - "rpi-gates.sh · npm test · curl"
keyPoints:
  - "Until August 19, tier1 ran lint, type-check and build, without the test suite: green only proved it compiled."
  - "A skipped step is not a green step: the script printed result: PASS without running any check."
  - "Evidence is a marker line or the build exit code saved to a file, never the status of a pipe."
snapshot:
  items:
    - label: "Gates"
      value: "rpi-gates.sh"
    - label: "Tests"
      value: "npm test"
    - label: "Formatting"
      value: "prettier"
    - label: "Types"
      value: "tsc"
    - label: "HTTP"
      value: "curl"
---

In August, a review round on a project closed with `result: PASS`. Lint green, type-check green, build green. And seven red tests, breaking against a route the round itself had removed. What caught it was an `npm test` run outside the flow.

A red test does not worry me. It shouts, someone stops and investigates. What costs me dearly is the green nobody questions, and if you use an agent to write code it gets worse, because it reads the `PASS` and moves on with full confidence. **Exit code is not evidence: only the green that the check itself produces counts.**

## The gate that did not run the suite

My implementation flow has a ladder of gates, a script (`rpi-gates.sh`) that detects the project stack and runs the right checks. The first rung, `tier1`, was the verdict of every round. And until August 19 it was lint, type-check and build. The test suite only lived in `tier2`, behind the coverage gate.

In other words: **for almost two months, since the ladder existed, a green gate report proved that the code compiled, and nothing more.** The seven red tests were not bad luck. The gate had never been designed to see them.

The fix was to put `npm test` inside `tier1`, and the lesson was worse than the bug: every gate report from before that date stopped counting as evidence that tests passed. (Eight days later I found its sibling: the TypeScript `tier1` also skipped formatting, the only stack without that gate.)

## Zero checks, `result: PASS`

In September the same script gave me two false greens on the same day. It takes the project directory as an argument and prints that path in the header, nicely. Only it looked for `eslint`, `tsc` and `package.json` from where I had run the command, and I was at the workspace root, with the projects in subfolders.

Result: every gate came out `WARN, skipped, tool not installed`, and the final verdict was `result: PASS`. A PASS with no check executed, reading exactly like approval.

**A skipped step is not a green step.** Today I run the script from inside the repository, and I never read the `result` without checking that the lines above are checks that ran, not warnings that something was skipped.

## The exit code that lies

The other false greens came from the shell, and those catch anyone.

The status of a pipeline is the status of the last command. So `npm run build 2>&1 | tail -12` ends with the status of `tail`, which is always zero. The agent notification says "exit code 0" with a look of proof, and `tail` can still cut off exactly the `Failed to compile` line. I nearly reported a green build from twelve lines of a CSS warning that already existed.

The opposite also happens. I ended a verification script with `grep -c "Type error"` to count errors. The build passed, `grep` found nothing, and `grep` with no match exits 1. The notification said it failed, and it was exactly the best possible result that produced the failure signal.

There is also the case that looks like sabotage. `npx prettier --write` printed the usual success line, exited zero and left the file identical, byte for byte. `./node_modules/.bin/prettier` on the same file changed the md5 right away. And the bare name `tsc`, here with mise, resolves to a shim that dies with no version configured, while the wrapper that summarizes the output printed `TypeScript: No errors found` without the compiler having run.

## The test that reads the source

This one was on this site. The old notes page did `Astro.redirect('/x', 301)`, and the test looked for the string `301` in the source. Green. But the page was prerendered, and a prerendered page does not send an HTTP status: the redirect became a document with `<meta http-equiv="refresh">` served with 200. In the browser it "worked", so nobody saw it. For crawlers and cache it was no redirect at all.

It happened twice in the same repository. The source test had no way to tell one from the other, by construction. The only gate that catches this is real HTTP, against the running build:

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/notas/algum-post
```

## What I do today

None of these failures was exotic. All had the same shape: a success signal that was not tied to what I wanted to prove. So I changed what counts as evidence.

- **Evidence is a marker line, never the exit code.** This site's verification scripts end with `ALL LOCAL CHECKS PASSED`, `AEO ROUTES PASSED`, `STAGING DEPLOY PASSED`. If the line is not there, it did not pass, whatever the exit code says.
- **When I need a build status, it goes to a file,** and I capture `$?` from the build, not from the pipe: `npm run build > build.log 2>&1; echo "EXIT=$?"`.
- **Tool via the local binary** (`./node_modules/.bin/<tool>`), and writes checked by the effect: `md5sum` before and after, or `git status`.
- **A new gate must go red before it is accepted.** It is written in this repository's `CLAUDE.md`: a gate that never failed is not a gate.

The false green does not go away with discipline, because it shows up exactly when discipline is satisfied. It goes away when green can only be produced by the thing I wanted to verify.

`exit 0`
