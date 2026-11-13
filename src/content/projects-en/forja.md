---
translationOf: forja
summary: "Desktop client that brings Claude Code, Codex and Gemini into one interface, so context survives when I switch instead of vanishing across three terminals. Built with Electron, React and TypeScript, with xterm.js for the terminal and an adapter layer per CLI instead of forcing a common protocol on all three. It is my primary client day to day."
problem: |
  Switching between three agent CLIs in separate terminals costs context on
  every swap, and none of them shows the state of the others.
decisions: |
  Started in Tauri and Rust, for binary weight. In March 2026 it moved to
  Electron: each session's terminal is a PTY, and managing PTYs from Node.js
  was simpler and had a larger ecosystem than from a Rust backend. An adapter
  layer per CLI, instead of a common protocol forced on all three.
outcome: |
  11 stars on GitHub and daily personal use as the primary client.
imageAlts:
  - "Forja workspace with file tree, CLAUDE.md open, Claude Code session, embedded browser, Pomodoro timer and Markdown tasks"
  - "Forja with side-by-side panes running Claude Code, Codex, Gemini and GitHub Copilot on the same project"
  - "Forja command bar with shortcuts for new session, open project, files and browser"
---
