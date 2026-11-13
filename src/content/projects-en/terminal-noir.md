---
translationOf: terminal-noir
summary: "Open-source theme extracted from this site to give the same visual identity to the whole system and the apps I use: near-black cold surfaces, scaled by luminance, a single amber accent and an emerald green for status. Design tokens left the nandomoreira.dev CSS and became ports for shell, compositor, terminal, editor, browser and command-line tools, with a light paper-toned variant."
problem: |
  The site had a defined visual identity, but the desktop around it did not:
  each app had its own dark theme, with different blacks, grays and accents,
  and changing one color meant hunting the same hex across a dozen config
  files.
decisions: |
  Extract the site's design tokens into a single palette, in palette.json,
  with colors named by role (surface.base, text.muted, accent.primary) and not
  by value. Syntax roles live in syntax.json and point at palette names, never
  at a loose hex. Each port is generated from it by a bash and jq script, so
  changing a color is editing one file and running make build. bats tests check
  the palette, each port's mapping and whether the generated files are in sync
  with the source. The Astro site reads the same palette and each port's README
  at build time, so it never drifts from the theme.
outcome: |
  Published under the MIT license with 11 ports: Noctalia, niri, Ghostty, VS
  Code and Cursor, GTK 4 and libadwaita, Google Chrome, bat and delta, btop,
  fzf, Powerlevel10k and Obsidian. Noctalia and Ghostty already have the light
  variant. It is the theme I use on my desktop with CachyOS, Niri and Noctalia,
  where every screenshot below came from.
imageAlts:
  - "Desktop with Niri and the Noctalia bar in Terminal Noir: TypeScript code in a terminal on the left and, on the right, the 16 ANSI colors, the ports list and the git history, all on a near-black background with amber borders"
  - "Ghostty in Terminal Noir showing the 16 ANSI colors as swatches, the palette files, the ports list and the git log with amber hashes"
  - "VS Code in Terminal Noir with the project file explorer and palette.ts open: keywords in amber, strings in green and types in lilac"
  - "bat displaying site/src/lib/palette.ts with the Terminal Noir theme: dim line numbers, keywords in amber and strings in green"
  - "Obsidian in Terminal Noir: note with amber links, a teal callout, amber-checked checklist, code block and a color table"
  - "GTK 4 file manager in Terminal Noir listing the project folder, with amber folders and the selected row highlighted in dark amber"
  - "Google Chrome in Terminal Noir opening terminalnoir.web.app: the title \"A noir theme for everything you type in.\", the Browse ports button in amber and a sample terminal window"
---
