---
translationOf: forja-plugins
summary: "Official registry and monorepo of Forja plugins: clock, Pomodoro and Markdown tasks, on a shared SDK with the plugin API types. Each plugin declares the permissions it uses, and a script generates the registry that Forja consults to install."
problem: |
  Forja needed to grow without every new feature landing in the app core. A
  plugin system only solves that if there are real plugins exercising the API,
  and a way to distribute them.
decisions: |
  Monorepo with pnpm, one plugin per folder and a shared SDK, so they all speak
  the same typed API. Each plugin declares in a manifest the permissions it
  asks for (theme, notifications, file read and write), and a script validates
  the manifests before the build. Styles use only Forja's CSS variables, so the
  plugin follows the app theme. The registry is a generated JSON published on
  GitHub Pages, with the download link for each version.
outcome: |
  Three plugins published, with twenty releases in total and tests in Vitest.
  The Pomodoro and the Markdown tasks show up on Forja's own screen.
imageAlts:
  - "Forja side panel with two plugins open: the Pomodoro Timer at 25:00 with the Start button, and Markdown Tasks with a project task"
---
