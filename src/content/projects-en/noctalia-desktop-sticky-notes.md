---
translationOf: noctalia-desktop-sticky-notes
summary: "Plugin for Noctalia Shell that pins sticky notes to the desktop as widgets: each note can be dragged and resized, has a post-it color and Markdown text, opens an editor on click and can stay linked to a .md file on disk, updating when the file changes."
problem: |
  Quick reminders were scattered across files and apps, away from the screen
  where I work, and Noctalia had no notes pinned to the desktop itself.
decisions: |
  Each note is a desktop widget instance, with its own text, colors, size,
  position and scale, saved in Noctalia settings so they survive a shell
  restart. A click opens a panel with keyboard focus, because a desktop widget
  does not receive typing. A note can point to a Markdown file, which becomes
  the source of truth. The JavaScript logic is covered by Vitest tests; the
  Markdown renderer and the editor layout come from sapjax's sticky-notes
  plugin, also MIT.
outcome: |
  Working MVP on my desktop, tested on Noctalia 4.7.7, in English and
  Portuguese. Published under the MIT license and not yet submitted to the
  Noctalia plugin registry.
imageAlts:
  - "Yellow sticky note on the desktop with the settings panel open: linked Markdown file, background color, text color and font size"
shortcutActions:
  - "saves the note and closes the editor"
  - "also saves and closes"
---
