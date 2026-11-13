---
translationOf: flipclock-app
summary: "Flip clock for the desktop, built in Go with Fyne, with a two-phase flip animation, a fullscreen mode and a screensaver mode that covers every connected monitor. The font is embedded in the binary, so the app runs with no external file dependency."
problem: |
  Desktop flip clocks are usually a web page open in a tab or a heavy app from
  another platform. I wanted a small native binary that sat in the tray and
  turned into a screensaver on every monitor.
decisions: |
  Go with Fyne, for a single binary with no runtime and the same base on Linux
  and Windows. The Bebas Neue font is embedded in the executable, so the look
  does not depend on the system. In screensaver mode, each monitor gets its own
  window, all synced to the same second and closed together by any key. On
  Wayland the compositor positions windows, and the README documents that
  limitation instead of hiding it.
outcome: |
  Two releases published, with .deb and .zip packages for Linux (x86_64 and
  ARM64) and a .zip for Windows. Personal use on the desktop. Three stars on
  GitHub, which is one-off interest and not traction.
imageAlts:
  - "FlipClock in fullscreen showing 21:07 on two dark flip cards, with the small seconds in the corner"
---
