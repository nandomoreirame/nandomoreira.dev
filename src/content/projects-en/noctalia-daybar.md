---
translationOf: noctalia-daybar
summary: "Plugin for Noctalia Shell that gathers the day into a bar: a quick-capture field that understands free text (\"buy bread tomorrow 9am\" becomes a task, \"/e meeting Friday 3pm-4pm\" becomes an event on Google Calendar), plus today's checklist, pomodoro and timer (which also open in their own window or pinned to a screen corner), favorites with page preview and Markdown notes."
problem: |
  Logging a task, an appointment, a link or an idea meant opening a different
  app for each one and leaving what I was doing on the desktop.
decisions: |
  A plugin of the shell itself, in QML, instead of a separate app: everything
  opens by shortcut, from the bar. Capture identifies the type by the prefix
  (/e event, /l reminder, /n note), by a URL or by an account. Google Calendar
  is read and written through khal and synced by vdirsyncer, with OAuth
  credentials kept in the system keyring and not in a file. Pomodoro and timer
  share the same tab and only one runs at a time: starting one pauses the
  other, without losing the time that was left. Both also respond to capture
  (/t 10m tea starts a timer, /p starts or pauses the pomodoro) and leave the
  panel with a click, in a Niri window or as a small clock pinned to the
  screen corner.
outcome: |
  Personal use on my desktop with CachyOS and Niri, published under the MIT
  license. Tested on Noctalia 4.7.7; it does not yet run on Noctalia v5, which
  has a different plugin system, and the port is planned.
imageAlts:
  - "Daybar Calendar tab: clock, appointments for the day and the October month with the days that have events marked"
  - "Daybar quick capture turning \"/e meeting with the team Friday 3pm-4pm\" into an event with date and time"
  - "Daybar Today tab: checklist with times, one completed task and another marked as overdue"
  - "Daybar Focus tab in Timer mode: 01:41 countdown inside a progress circle, with the label \"Coffee break\", and the bar showing the same time with the alarm icon"
  - "Daybar clock open in its own window: 01:17 countdown in a large circle, with the restart and pause buttons and the Focus, Short break, Long break and Timer tabs below"
shortcutActions:
  - "opens quick capture"
  - "opens the panel with the tabs"
  - "switches the capture type"
  - "saves and closes"
  - "saves and keeps the field open"
  - "closes"
  - "switches the note preview for the editor"
  - "saves the note right away"
---
