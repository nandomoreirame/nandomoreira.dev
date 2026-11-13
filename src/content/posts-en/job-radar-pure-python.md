---
slug: job-radar-pure-python
translationOf: job-radar-radar-de-vagas-em-python-puro
title: "job-radar: I stopped scrolling job lists and let Python discard for me"
seoTitle: "job-radar: pure Python job board radar"
summary: "Seven job sources, filters that discard before the score, the résumé as a qualifications list and a Discord channel that only gets what survived. Zero runtime dependencies, and the code is open."
markers:
  - python
  - automation
  - open source
extras:
  - "7 sources, 0 dependencies, 328 tests"
  - "Python 3.12 · standard library"
keyPoints:
  - "Hard filters decide whether a job enters; the 0-to-100 score only ranks what passed."
  - "Qualifications come from the stack table in the résumé itself, with no parallel list left to rot."
  - "Dedup uses three keys: company plus title, canonical URL and SimHash of the description over 90 days."
snapshot:
  items:
    - label: Language
      value: Python 3.12
    - label: Runtime
      value: standard library
    - label: Tests
      value: 328 test functions
    - label: Publishing
      value: Discord
    - label: Source
      value: Gupy
---

A few times a day, a Discord channel gets the jobs that survived my cuts. The one sweeping the sites is [job-radar](https://github.com/nandomoreirame/job-radar): it reads seven sources, throws away what I would never apply to, scores the rest from 0 to 100 and posts the best ones. It runs on Python 3.12 with only the standard library, and on October 8 the repository got an MIT license.

The idea is to stop scrolling job lists. It never applies to anything for me, and the README asks nobody to use the code for mass auto-apply. Its work ends when the job lands in the channel; from there on, I am the one reading the description.

## Discard first, then rank

The pipeline has three scripts that talk through JSON files: `collect.py` fetches, `triage.py` filters and scores, `notify.py` publishes. The decision that holds the rest is separating filter from score.

The **hard filters** answer "would I apply to this?" and are binary: seniority from the title, modality, age of the posting, blocked company, salary when the ad states it, how many of my qualifications show up in the text. The **score** only ranks what passed. **Keeping the two apart stops a bad job from climbing by racking up points on secondary criteria.** An on-site job has no score that saves it: it is discarded before scoring.

Inside the score, qualification weighs more than title. The comment in `scoring.py` says why in two words: "title lies".

Filters start off. With no configuration in `.env`, none of them discard anything, because I prefer a radar that lets things through over one that hides a job behind a value nobody chose.

## The résumé is the qualifications list

Qualification matching comes from my résumé in markdown, from the `## Stack técnica` table, with a synonym expansion on top. There is no separate skills list, and that was on purpose: a parallel list ages in the dark, and I already keep the résumé.

## The filters learned from real ads

Every regex in `filters.py` has a comment explaining the ad that forced it to exist. A few of them:

- `SR`, `JR` and `PL` show up without a period in most ads, so the period is optional. Only `PL` inside "PL/SQL" is Oracle's language, not "pleno" (mid-level).
- `java` must not match inside "javascript", and a test locks that down. A mention of Java as a nice-to-have in a Python role also does not fail the job: language counts by weight, not by presence.
- "Banco de talentos" is a résumé dump, not an open role. There is no open position, but it took space in the channel as if there were one.
- The function (QA, for example) is only read in the title. Citing "the QA team" in the description is routine in a development role.
- An affirmative job, reserved for a group I am not part of, leaves the channel so it does not take the place of whoever the job is for. The first version looked for loose terms in the sentence and read as a restriction an ad from a bank that said "roles flagged as exclusive or not for people with disabilities", which is an invitation. Today the filter requires the full construction ("role exclusive for X"), and when the source declares the data in a structured field, the field wins over the text.

Everything discarded goes to `data/discarded.tsv` with title, company, URL and reason. That is where I audit an aggressive regex.

## The same job, three times

Dedup uses three keys, from cheapest to most expensive:

1. Fingerprint of company plus title, both normalized (no accent, no legal suffix, no city stuffed into the title).
2. Canonical URL, without `www.` and without tracking parameters, so the same job with `?utm_source=` does not come back.
3. SimHash of the description, with Hamming distance up to 5 bits inside a 90-day window. That one catches the consultancy republishing the client's job under another company name.

The SimHash is a port of `fingerprint-core.mjs` from [career-ops](https://github.com/career-ops-hq/career-ops), also MIT, with the original notice kept in the file.

## What broke along the way

On Gupy, the old API, `employability-portal.gupy.io/api/v1/jobs`, started answering 404. Search is now server-rendered at `portal.gupy.io/job-search`, and the HTML carries a `<script id="__NEXT_DATA__">` with the job list inside. Each item's shape was the same one the parser already read, so the fix was swapping the fetch, not rewriting the connector.

There was also a quieter problem: every connector swallowed a network error and returned an empty list, and the "nothing found" warning had no way to know whether the source was down or simply had no jobs. It gained a `health.py` that counts, per source, requests, errors, degraded jobs (empty company, HTML in the title, invalid URL) and responses that came back with status 200 but without the expected payload, which is the signal that the contract changed. When a sweep finds nothing, the channel gets the round's funnel. **Silence now means "it did not run", never "it ran and found nothing"**, which are different problems and indistinguishable without this.

On Discord there were two. Cloudflare in front of the webhook answers 403 to urllib's default User-Agent (`Python-urllib/3.x`), so an identifiable User-Agent is required. And without `wait=true` in the URL Discord answers empty, the message is orphaned and the webhook cannot delete it later, because it only deletes what it posted if it kept the ID.

![The job-radar Discord channel with a webhook message: the card for a senior AI engineering role, with the description, remote modality, the match reason (15 qualifications matched, among them AI agents, BigQuery and GCP), the apply link and the footer with the source and 100/100 compatibility, and below the start of the next job's card](../../assets/posts/2026/job-radar-discord.webp)

## Recorded fixture, never invented

Connector tests run against real responses recorded in `tests/fixtures/`: the HTML from Gupy's search, the JSON from Greenhouse, Lever and Ashby boards, the Sólides listing. The suite has 328 test functions, and the rule that matters most among them is in the README: a fixture written from the shape you imagine the API returns produces a green suite with production broken.

## How to try it

You need Python 3.12 or newer, a Discord webhook and your résumé in markdown with a `## Stack técnica` section.

```bash
git clone https://github.com/nandomoreirame/job-radar && cd job-radar
cp .env.example .env     # webhook e os seus critérios
mkdir -p profile && cp /caminho/do/seu/curriculo.md profile/profile.md
./run.sh
```

`run.sh` runs the three stages. To see what would be published without posting anything, run `notify.py` with `--dry-run`. To run on its own, a cron or a systemd timer pointing at `run.sh` covers it; with a user timer, remember `loginctl enable-linger $USER`, or it only runs with an open session.

The sources that ship configured are Brazilian or have a country filter: Gupy, the job repositories on GitHub (frontendbr/vagas, backend-br/vagas and similar), Programathor, Sólides and the public Greenhouse, Lever and Ashby boards, one slug per company. A new source must respect `robots.txt`, identify itself with a User-Agent and wait between requests; the shared HTTP client already handles all three.

The repository rule that never changes is the one from the start: zero dependencies to run. `pytest`, `ruff` and `mypy` exist only in the development environment, and what goes on the timer is the standard library.

`exit()`
