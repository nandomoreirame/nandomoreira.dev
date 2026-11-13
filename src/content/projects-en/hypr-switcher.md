---
translationOf: hypr-switcher
summary: "Visual Alt+Tab for Hyprland, which ships no window switcher of its own. In Rust on the Wayland layer-shell, so the overlay sits above everything without stealing focus, and with open latency as the main criterion, because that is what decides whether the tool is used or abandoned."
problem: |
  Hyprland ships no visual window switcher, and switching workspaces blind costs
  more time than the switch itself.
decisions: |
  Wayland layer-shell instead of a regular window, so the overlay sits above
  everything without stealing focus. Rust for open latency, which is what
  decides whether the tool is used or abandoned.
outcome: |
  Daily personal use in the Hyprland environment. Three stars, the highest
  count among the recent systems tools in the catalog.
imageAlts:
  - "hypr-switcher over the editor: a strip of open windows with icon, title and workspace, and the selected window highlighted"
---
