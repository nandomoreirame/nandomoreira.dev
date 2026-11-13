---
translationOf: coachbot-cli
summary: "Anti-motivational coach for the terminal: every time a shell opens, a sarcastic line in a speech bubble, spoken by a little pixel-art robot. Over a hundred lines in English and as many in Portuguese, and it installs with a single command."
problem: |
  A motivational line in the terminal is a cliché nobody reads after the second
  day. The sarcastic version does the opposite: it gets a smile precisely
  because it does not take the day seriously.
decisions: |
  A shell script with no dependency beyond what is already on the system, with
  the lines in JSON separated by language, so adding a language does not touch
  the code. The language comes from a flag or the COACHBOT_LANG variable, and
  the one-line installer puts everything in ~/.local/bin. It works in bash,
  zsh, fish and PowerShell.
outcome: |
  A small humor project, in use in my own terminal. Two stars on GitHub.
imageAlts:
  - "Freshly opened terminal with CoachBot saying, in a speech bubble, that everything happens for a reason and that sometimes the reason is a terrible decision, above a little pixel-art robot"
---
