# Lessons

<!-- Rendered by <skill-dir>/scripts/lessons.py; never edit by hand. -->

## Confirmed

None.

## Candidates

- **L-001** `i18n` (review_finding): Route every visible label through the locale dictionary, including compact variants and links hidden behind feature flags.
  - Features: i18n-sales; sources: src/components/sales/ServiceDetail.astro:41, src/components/sales/StepsTimeline.astro:27, src/components/sales/ServiceBlocks.astro:46
- **L-002** `i18n` (weak_test): Render every localized component variant and feature-flag branch in tests; a word-marker dictionary alone does not prove that the UI is fully translated.
  - Features: i18n-sales; sources: tests/sales/pages-en.test.ts:46

## Quarantined

None.
