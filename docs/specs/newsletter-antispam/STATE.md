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
| 5 legacy status | done | green | c5871f3 | pending |
| 6 turnstile verify | done | green | 487d344 | pending |
| 7 origin allowlist | done | green | 4561c33 | pending |
| 8 hourly limit | done | green | 046b964 | pending |
| 9 captcha gate | done | green | 7c35cc0 | pending |
| 10 widget | done | green | b6f5d36 | pending |
| 11 privacy and JS exception | done | | | pending |
