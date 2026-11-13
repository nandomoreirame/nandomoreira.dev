---
translationOf: flipclock-screensaver-ascii
summary: "Screensaver for Hyprland that draws the time in large ASCII inside a fullscreen terminal, one per monitor, with Terminal Text Effects transitions every minute. It comes in through hypridle when the machine goes idle and leaves on the first movement."
problem: |
  Hyprland has no screensaver, only a lock. I wanted something that showed up
  when the machine went idle, matched the terminal and did not require another
  graphical app running.
decisions: |
  A fullscreen terminal per monitor, instead of a graphical window: the clock
  is text rendered with pyfiglet, and the transitions come from Terminal Text
  Effects, optional. Three small scripts split the responsibilities: detect
  monitors and terminal, open a window on each, draw the frame. Integration is
  through hypridle, and a state file turns the screensaver off without
  uninstalling anything.
outcome: |
  Personal use on the desktop, with pytest tests for the renderer and bats
  tests for the shell scripts. Supports ghostty, alacritty and kitty.
imageAlts:
  - "Screensaver with 17:18 in blue and white ASCII blocks centered on a dark terminal, with the wallpaper blurred behind it"
---
