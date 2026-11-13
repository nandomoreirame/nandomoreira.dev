---
translationOf: noctalia-gistbar
summary: "Plugin for Noctalia Shell that brings my GitHub gists to the bar: search by description, file name, language and content, copy from the keyboard, new gist from the clipboard, preview and edit, all through the gh CLI."
problem: |
  There are 95 accumulated gists, and finding a snippet meant opening GitHub,
  remembering which gist it was in and copying by hand. Creating a new gist
  with what was on the clipboard also went through the browser.
decisions: |
  A plugin of the shell itself, on the same architecture and the same visual
  kit as Daybar: logic in pure JavaScript functions tested with Vitest, QML
  only as the screen. All GitHub access goes through the gh CLI, so the plugin
  never touches a token, and content goes via stdin, never on the command
  line. Search ignores accents and covers content, which is why a gist exists,
  but description and file name weigh more. Content stays in a local cache with
  0600 permissions and is only downloaded again when the gist changes. A new
  gist is born secret, because publishing by mistake is the worst possible
  failure here.
outcome: |
  Personal use on my desktop with CachyOS, published under the MIT license,
  with 151 tests. Tested on Noctalia 4.7.7; the port to Noctalia v5 is planned.
imageAlts:
  - "Gistbar panel with the search field, the New gist button, the All (95), Public (70) and Secret (25) filters and the gist list, each with the description, the files, the language badge and how long ago it was updated"
shortcutActions:
  - "opens gist search"
  - "creates a gist from the clipboard"
  - "navigates the list"
  - "copies the first file of the gist"
  - "copies the gist link"
  - "clears the search"
  - "edits the description and the open file in the preview"
  - "saves the edit to GitHub"
---
