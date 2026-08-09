# AEO structured data check (REQ-006, REQ-007)

**Date:** 2026-08-09  
**Build:** local `npm run build` after aeo-base implementation.

## What was validated (local extraction)

JSON-LD blocks embedded by:

| Page | Expected types | Local check |
|------|----------------|-------------|
| `/` | `Person` (home) + `WebSite` (layout) | Source embeds `personLd` + `websiteLd` |
| `/projetos` | `WebSite` | Layout injects `WebSite` on every page |
| `/projetos/forja` | `WebSite` + `CreativeWork` (no liveUrl) | Case route embeds `serialiseJsonLd(jsonLdForProject(...))` |

## External validators

Submit the live (or staging) URLs when the domain is pointed:

1. [Schema.org Validator](https://validator.schema.org/)
2. [Google Rich Results Test](https://search.google.com/test/rich-results)

| URL | Validator | Result | Notes |
|-----|-----------|--------|-------|
| `/` | Schema.org | PENDING_EXTERNAL | Requires public URL |
| `/` | Rich Results | PENDING_EXTERNAL | Requires public URL |
| `/projetos/forja` | Schema.org | PENDING_EXTERNAL | CreativeWork or SoftwareApplication |

**Summary:** Local structure is correct (`WebSite` global, `Person` on home, project type per case). External validator pass is deferred until a public staging URL is available; record verdicts here after cutover or staging deploy.
