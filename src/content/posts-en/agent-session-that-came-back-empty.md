---
slug: agent-session-that-came-back-empty
translationOf: sessao-de-agente-que-voltava-zerada
title: "The agent session that came back empty: when the UI cache owns the process lifecycle"
summary: "In Forja, switching projects scrambled the terminal and, on the way back, Claude Code showed up with 0 tokens. The process had never been killed by the backend: what forgot the session was a UI cache with a five-minute TTL."
markers:
  - electron
  - terminal
  - agents
---

At the end of March, switching projects in [Forja](https://github.com/nandomoreirame/forja) had two side effects. The terminal came back with overlaid text, broken lines and content scattered across the area. And if the switch took a little while, the Claude Code session came back with "0 tokens": a new session, with none of the conversation history.

Forja is the desktop client I built to run agent CLIs (Claude Code, Codex, Gemini, Cursor Agent and a plain terminal) with tabs, panes and projects side by side. At that time it ran on Electron, with xterm.js drawing the terminal and node-pty holding the process. The obvious question facing an emptied session is "who is killing the process?". The answer was nobody, and before that answer came three fixes around the same place.

## Three fixes before the right one

Each one fixed something real. None of them solved the symptom.

On March 18, the frontend terminal cache stopped killing the backend process when it expired. The idea was that the session would survive the cache and could be reconnected later through `pty:has-session` and the circular buffer.

On March 25, the "parked" terminal (hidden tab) started batching writes by animation frame. TUIs built with Ink send the screen redraw in several chunks, and writing each chunk straight into xterm left intermediate states corrupting the internal buffer.

On March 30, a race condition showed up: during an asynchronous round trip over IPC, the active project could change, and project A's layout was saved into project B's config. That same night, the tmux integration for persisting sessions left the backend, 1,637 lines deleted. [[FILL IN: why tmux left, and whether it was part of the attempt to hold the sessions]]

The fix plan, dated the same March 30, still described both symptoms.

## The backend never killed anything

That plan starts with a finding that moves the problem: `pty.ts` kills no process during a project switch. The backend's session `Map` keeps every one alive. **The problem was only on the frontend: the cache expired the terminal, the exit handlers went with it and the tab state stopped matching reality.**

The full chain, as it sits in the plan:

1. The terminal cache had a five-minute TTL (`CACHE_TTL_MS = 5 * 60 * 1000`). On expiry it discarded the terminal and also unregistered that tab's exit handler in the PTY event dispatcher.
2. With no handler, if the process ended for any reason (crash, idle timeout, a system signal), the event was dropped in silence. The tab stayed marked `isRunning: true` with a dead process behind it.
3. On return to the project, `pty:has-session` answered `false` and a new process was created.
4. `--resume` only kicked in if the CLI session ID had been detected before the tab was parked. If it had not, the session started from scratch.
5. And even with the ID in hand, the tab that still claimed to be running fell into the "new active tab" path and came up without the resume arguments.

In other words: a cache whose job was to save drawing resources had become, with nobody deciding it, the owner of the session lifecycle.

## The scrambled terminal had three causes

The visual corruption was another chain, also on the frontend.

`TerminalBlock`, which wires the pane layout to the terminal component, passed `isVisible={true}` as a constant. The effect that recovered the terminal when it became visible again depended on `isVisible` changing, and a value that is always `true` never changes. The recovery code existed and never ran.

The first `fitAddon.fit()`, done at initialization, did not check whether the container had width and height. The `ResizeObserver` handler had that guard; the init path did not. During a layout transition, the terminal could be sized against a 0x0 container.

On return from the cache, the screen was only cleared when the dimensions changed. Only the parked terminal received writes while it was out of the DOM, and that already corrupted the canvas even with the same dimensions.

## The fix

It landed in v1.9.3, on April 1, and touched both sides.

On the session side, the dispatcher got a permanent exit handler, which receives the event when the tab has no handler of its own:

```ts
handleExit(payload) {
  const tabHandler = exitHandlers.get(payload.tab_id);
  if (tabHandler) {
    tabHandler(payload.code);
  } else {
    permanentExitHandler?.(payload.tab_id, payload.code);
  }
},
```

And the cache TTL started asking before discarding: if the tab still exists in the store, the user will come back, so the deadline is rescheduled instead of the terminal being thrown away. For CLI tabs that ended without a known session ID, a `--resume latest` attempt came in.

On the drawing side: the `isVisible={true}` left, the initial `fit()` got the dimension guard, the screen started being cleared whenever a CLI session returns from the cache, and the terminal that mounts hidden defers process creation until the first valid resize.

## The contract that stuck

That same afternoon the second plan arrived, which turned the fix into a rule. Its architecture line: treat the PTY lifetime and the UI lifetime as separate concerns.

The requirements stayed locked in writing: switching projects does not kill a PTY, switching workspaces does not kill a PTY, hiding a tab does not kill a PTY. Only closing the window and removing the project may end a session, and both only after persisting what is needed to restore it in the same project, the same tab and the same layout position.

To hold that, a regression matrix came in with 1,005 lines of tests added across eight files, covering project and workspace switches, the save on `beforeunload`, session metadata for each CLI (Claude, Codex, Gemini and terminal) and cleanup of orphaned layout blocks. The review of that work still found a divergence: workspace activation restored tabs without the `hasBlock` guard that boot restoration used, which could duplicate blocks. The two paths were unified into one.

The decision, in the end, fits in one line: a UI cache may discard what it draws, never what it knows about the process. Who decides when a session ends is the user, by closing the window or removing the project.

`pty.kill()`
