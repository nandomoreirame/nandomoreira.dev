---
translationOf: tumodori
summary: "Terminal Pomodoro with large digits, readable from across the room without leaning into the monitor. Built in Rust with Ratatui, so the timer lives in the same place as the work, and with the digits drawn in block characters, so the size does not depend on the font configured in whoever is using the terminal."
problem: |
  A timer in an ordinary terminal window requires leaning into the monitor to
  read it, which breaks the focus the technique exists to protect.
decisions: |
  Ratatui instead of a GUI, so the timer lives in the same place as the work.
  Digits drawn in block characters, not the terminal font, so the size does
  not depend on the user's configuration.
outcome: |
  Daily personal use. Two stars on GitHub, which is one-off interest and not
  traction.
imageAlts:
  - "tumodori in the terminal: work session with 08:21 in large digits, keyboard shortcuts and the progress bar"
---
