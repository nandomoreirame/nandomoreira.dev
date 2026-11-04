---
slug: newsletter-antispam
phase: implement
spec_path: docs/specs/newsletter-antispam/SPEC.md
plan_path: docs/plans/2026-11-03-newsletter-antispam.md
updated: 2026-11-04
---

# State: newsletter-antispam

Implementation started on 2026-11-04 by Grok, from the saved plan. The invocation of
`/rpi implement newsletter-antispam` is the author's go-ahead for D5 (named Turnstile
script exception) and for the recorded no-JavaScript tradeoff in SPEC.md.

## Ledger

| Task | Implementation | Tests | Commit | Review |
|---|---|---|---|---|
| 1 pending subscriber | done | green | d0911e6 | pending |
| 2 confirm token | done | green | 1d420c7 | pending |
| 3 mail after confirm | done | green | 8dd64b1 | pending |
| 4 resend window | done | green | 31c196f | pending |
| 5 legacy status | done | green | | pending |
| 3 mail after confirm | | | | |
| 4 resend window | | | | |
| 5 legacy status | | | | |
| 6 turnstile verify | | | | |
| 7 origin allowlist | | | | |
| 8 hourly limit | | | | |
| 9 captcha gate | | | | |
| 10 widget | | | | |
| 11 privacy and JS exception | | | | |
