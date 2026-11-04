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
| 11 privacy and JS exception | done | green | 56c5c91 | pending |

## Review fixes (round 2, 2026-11-04)

Implemented by opencode from the review of round 2. Each fix has its own commit.

| Finding | Fix | Commit |
|---|---|---|
| High: one Turnstile key alone | `turnstileConfigOf` fails at boot when only one key is set | dd28a63 |
| Medium: confirmation on GET | GET shows a page with a button, POST confirms | 20cee1e |
| Medium: hourly TTL missing | Manual step added to SPEC.md | 2d2bef3 |
| Medium: hourly limit on agent JSON | Limit counts only form posts; SPEC D4 and REQ-006 updated | 7429c6a |
| Low: concurrent confirmation | Atomic claim in a Firestore transaction | c7bb203 |
| Low: weak hourly test | The first ten calls are asserted to pass | 1bebb37 |

The atomic claim is covered by unit tests of the predicate. The transaction itself is not
exercised against a Firestore emulator, which is not set up in this repo.

## Review

Round 3 on 2026-11-04 is a self-assessment: the implementer is opencode and no independent
reviewer is available. It records zero findings for the code. The gate note stays open.

`validate_verification.py` exits 1, for two reasons:
- tier1 is red because of prettier and `npm test` failures in files outside this feature
  (`code-contrast`, `autowriter-run`, and other prettier files), so the gate note counts as
  an open finding.
- `- **Independent review:** pending (self-assessment)`.

`phase` stays `implement` until both are resolved by the author, not by this agent.
