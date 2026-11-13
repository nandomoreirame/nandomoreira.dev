---
translationOf: amnesia-claude-code
summary: "Persistent, deterministic memory layer for Claude Code. Merge, deduplication and validation leave the model and move into a Python CLI, so the result is the same on every run and the agent stops answering with a wrongly remembered fact. Daily use in my own workflow."
problem: |
  Agent memory delegated to the model itself fails at merge and deduplication,
  and the error only shows up after the agent has already answered with the
  wrong data.
decisions: |
  Merge, dedup and validation operations in a Python CLI, outside the model.
  The agent calls the CLI; the result is the same on every run.
outcome: |
  Daily personal use in the Claude Code workflow. No public traction: the
  repository is open and has no stars.
---
