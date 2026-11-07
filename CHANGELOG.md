# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-11-07

First tagged release of the personal site, covering everything built since the infrastructure spike.

### Added

- Add the Astro 7 SSR site on Firebase App Hosting, with a Zod-validated content layer as the single source for the home, catalog, `llms.txt`, JSON-LD, resume and MCP tools.
- Add the portfolio and lab catalogs with a static case page per project, grouped archive blocks and verifiable project links.
- Add the blog with archive by year, draft support in staging, reading mode, Giscus comments and an RSS feed.
- Add the Terminal Noir design system with a Paper light theme, theme boot before first paint and contrast gates for every text token.
- Add the command palette with a prerendered search index, `G` + letter navigation and a lazily loaded module.
- Add the AI view of every page (`<page>.md` and `<page>/ia`), plus `llms.txt`, `AGENTS.md`, `resume.json`, `resume.txt`, a sitemap and an MCP server with five read tools.
- Add the `/now` page with Spotify, Xbox and GitHub sources, per-source caching and sections that fail independently.
- Add the sales landing and service pages, with a services catalog tied to the cases that prove each service and a quote flow.
- Add the hire briefing endpoint and the contact form, with validation, size caps, rate limiting, a honeypot and Turnstile support.
- Add the newsletter with double opt-in, pending confirmations, resend after 24 hours and confirmation on a button press.
- Add server-side visit analytics (middleware, `/v.gif` pixel and `/go` outbound tracking) with traffic classification and bounded daily counters.
- Add the `stats` tool, a Rust TUI and web panel that reads visits, funnel and leads from Firestore.
- Add the `/setup`, `/releases` and `/privacidade` pages, and the generative case art with the pointer-field effect.
- Add the resume page at `/curriculo` as a standalone sheet without the site header and footer, with a download button fixed to the bottom of the screen.
- Add the optional name, company and e-mail form for the CV download, now inside a native dialog with no JavaScript, with a thank-you e-mail and a 12-month retention.
- Add homelab staging (`deploy-staging.sh`) and a stats panel deploy, both behind Caddy.

### Changed

- Move the post, note and legacy library paths onto a single posts access layer.
- Replace the render-blocking stylesheet request with inlined CSS and fingerprint the fonts, preloading the heading weight.
- Stop deferring the post cover, which is the LCP element, and stop reading scroll position at load.
- Drop source images already optimised into variants from the build.
- Raise the client JavaScript budget under a named-exception gate, keeping every script measured in the build.

### Removed

- Remove the legacy notes routes in favour of redirects to `/posts` and `/[slug]`.
- Remove the download gate page layout at `/curriculo`, replaced by the resume sheet with a download dialog.

### Fixed

- Fix the sales subdomain and public hosts so forwarded HTTPS and headers are trusted.
- Fix newsletter token confirmation so it happens in one atomic step instead of on GET.
- Fix the theme toggle so it keeps working without `MediaQueryList` listeners.
- Fail at boot when only one of the two Turnstile keys is configured.

### Security

- Deny every public read of the Firestore briefings and validate, cap and rate-limit hire submissions before anything else.
- Limit form posts to ten per hour and keep e-mail addresses out of every machine-readable route.
- Raise the code theme above WCAG AA contrast and gate it in the test suite.

---
