---
translationOf: job-radar
summary: "Scrapes job boards, drops what does not match your profile and posts the matches to Discord, running on its own a few times a day. Pure Python, no dependencies: hard filters decide what gets through, a 0-to-100 score ranks the rest, and the qualifications come from your own resume in markdown."
problem: |
  Looking for a job means scrolling long lists across several sites, repeating
  the same seniority, remote and salary cuts on every visit, and running into
  the same listing posted on two sources.
decisions: |
  Hard filters and scoring kept apart: the filter answers "would I apply to
  this?" and drops it, scoring only ranks what remains, so a bad listing does
  not climb by stacking secondary criteria. Qualifications come from the
  resume, not from a parallel list that would go stale in hiding. When nothing
  gets through, the channel gets the scrape funnel, so silence never confuses
  "found nothing" with "did not run". Connector tests use recorded real
  responses, and the connectors respect robots.txt and pause between requests.
outcome: |
  Published on GitHub, with connectors for Gupy, GitHub job repos, Programathor
  and Sólides. Runs on a systemd timer or cron.
imageAlts:
  - "Discord #job-radar channel with two AI engineering jobs posted by the bot, each with modality, location, the qualifications that matched, the apply link and the match score (90/100 on the first)"
---
