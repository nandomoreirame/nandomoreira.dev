---
feature: lead-analytics
phase: implement-complete
depth: deep
started_at: 2026-10-14
completed_at: 2026-10-14
spec_path: docs/specs/lead-analytics/SPEC.md
plan_path: docs/plans/2026-10-14-lead-analytics.md
---

# State: lead-analytics

Spec approved on 2026-10-14 after a grilling pass (17 decisions, see the Grilling Log).
Plan saved with 20 tasks in 5 batches. Task 19 creates Google Cloud resources and runs
only with the author's go-ahead. The data reader (sh/Rust/TUI) is deliberately out of
scope and will be its own feature.

Implemented on 2026-10-14. Commits, in order: `6dc06c0` classify, `17f470c` visitor hash, `08c524a` channel and UTM, `865af37` events and increments, `7749b56` what counts, `f768d12` journey text, `02b36be` store, `df0646b` recorder, `bcb9eb1` SSR middleware, `f2af95b` `/v.gif`, `16493d0` pixel placement, `de70c4b` `/eu`, `a5325b3` `/go`, `0ff6ba5` catalog links, `51dede7` contact links, `884bc80` journey on lead mail, `730fad5` MCP usage, `5fd52a4` privacy policy, `8a033b5` HTTP checks, `a8eac25` runtime secrets.

Secrets `analytics-hash-secret` and `analytics-self-token` exist in Secret Manager and the App Hosting backend `nandomoreira-dev` (`us-east4`) can read them. `expiresAt` TTL is enabled on `analytics_events` and `analytics_daily` in the `(default)` database. The self token stays only in `~/.config/nandomoreira/self-token` (mode 0600).
