---
slug: aeo-vs-seo-is-seo-dead
translationOf: aeo-vs-seo-sera-que-o-seo-morreu
title: "AEO vs SEO: is SEO dead?"
summary: "SEO is for whoever clicks the search result; AEO is for whoever answers in the reader's place. How I prepared my site for both, and what 15 days of data showed about who reads what."
markers:
  - seo
  - ai
  - agents
extras:
  - "3 in 4 agent reads were on machine routes"
  - "llms.txt · robots.txt · JSON-LD · MCP"
keyPoints:
  - "In 15 days, three in four AI agent reads were the .md version or the /ia view of the pages, not the HTML."
  - "llms.txt, which every AEO guide tells you to create, got 6 agent reads and 65 from people."
  - "The site's MCP got 149 connections and only 2 tool calls, one of them my own test."
snapshot:
  items:
    - label: "Site"
      value: "Astro 7 SSR"
    - label: "Machine routes"
      value: "llms.txt · AGENTS.md · .md"
    - label: "Structured data"
      value: "JSON-LD"
    - label: "Agents"
      value: "MCP · /api/hire"
    - label: "Measurement"
      value: "server-side analytics"
---

Today the site panel showed 488 people, 15 AI agents and 1,335 bots. And zero tool calls on the MCP server I left there precisely for agents.

![Live analytics panel strip for the site: 488 people today, 496 page views, 15 agents, 1,335 bots, 73 outbound link clicks, 1 lead and 0 MCP tools.](../../assets/posts/2026/aeo-painel-ao-vivo.webp)

You can ask whether SEO is dead, now that a lot of people ask ChatGPT instead of searching on Google. Before answering, it is worth looking at who actually reads your site. Mine is read by people, by search engines and by agents, and each one wants a different format. The numbers from 15 days show something I did not expect: **for an AI agent, HTML is the format it reads least on my site.**

## SEO is for whoever clicks, AEO is for whoever answers

<abbr title="Search Engine Optimization">SEO</abbr> (search engine optimization) is making your page rank well when someone searches, so that person clicks and reaches you. <abbr title="Answer Engine Optimization">AEO</abbr> (answer engine optimization) is making an assistant like ChatGPT, Perplexity or Claude read your content, understand it and use it in the answer it gives, often without the person ever opening your site.

| | SEO | AEO |
|---|---|---|
| Who reads first | the search crawler | the crawler or agent of an assistant |
| What it wants | to know what the page is about and whether it deserves a position | clean content, to cite or answer |
| Who arrives at the end | a person, via the click | sometimes nobody: the answer is enough |
| How you measure | position and clicks from search | reads of machine routes and citations |

My reason for doing the second column was very practical. When I rewrote the site in 2026, my work over the previous year was building AI agent tooling, and nothing in the public material said that to the agents that already screen candidates before a recruiter reads anything. If the agent does not find it, the job never arrives.

## SEO is still there, and it is the base for both

Before anything for AI, the site has the usual SEO: `sitemap.xml`, an absolute canonical URL on every page, a share image generated per page, RSS and an `seoTitle` when the post title is too long for the search result.

The piece that serves both worlds is structured data, a JSON-LD block ([the schema.org format](https://schema.org) that describes the page in fields, not in prose) in the `<head>`. The site declares who I am (`Person`), what the site is (`WebSite`), what each page is (`WebPage`) and each portfolio project (`SoftwareApplication` when it has a live link, `CreativeWork` when it does not). Search engines use that to build the result. Agents use it so they do not have to guess who wrote what.

One detail that costs a single line and avoids pain: every JSON-LD goes through one function that escapes `<`. Without that, a title with `</script>` closes the tag in the middle of the content, and a test fails anyone who tries to reimplement the escape elsewhere.

## Allow AI crawlers by name

The `robots.txt` with `User-agent: *` and `Allow: /` already lets everyone in. Even so, mine lists the AI crawlers one by one:

```ts
export const ANSWER_ENGINE_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
] as const;
```

The comment in the code explains why: the list documents the intent, and survives the day I tighten the default rule. If `*` ever becomes `Disallow`, the nine still get in, and nobody has to remember that they existed.

Just do not confuse that with security. `robots.txt` is a polite request, and a rude crawler ignores it. The real protection is having nothing sensitive on public routes, and the site has a test that scans the machine routes for email, keys, absolute paths and private IPs.

## Give every page a Markdown version

That was the technique that worked most, and I have the number.

Every page on the site has a Markdown sibling: `/en/treating-dotfiles-as-software` has `/en/treating-dotfiles-as-software.md`, with the clean text, a header with title, URL and date, and no menu, footer or script. There is also an `/ia` version, the same thing rendered for a person to see how the agent sees the page. Both come from a single table (path to Markdown), and a page outside it returns 404. The HTML announces the sibling in the `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/tratando-dotfiles-como-software.md" />
```

The site analytics classifies each visit by user agent into people, AI agents, search engines and other bots, and measures on the server, with no browser script. From October 14 to 28, content reads by AI agents looked like this:

| Format | Agent reads |
|---|---|
| `.md` | 429 |
| `/ia` | 376 |
| HTML | 245 |

Three in four reads were on the two versions built for machines, and the most read of all is plain Markdown. The agent prefers the clean text when you offer it, and it finds the version on its own.

## The llms.txt almost nobody read

Every AEO guide tells you to create `llms.txt`, a Markdown index at the site root, with a summary of who you are and annotated links to the pages that matter ([the proposal is here](https://llmstxt.org)). Mine has existed since launch, along with an `llms-full.txt` with everything in a single file, and both are generated from the same data layer as the pages. A hand-written `llms.txt` goes stale on the first portfolio change.

In the same period, `llms.txt` got 6 AI agent reads. And 65 visits classified as people (I suspect curious developers, but the analytics does not keep the user agent, so there is no way to know).

`AGENTS.md` is the same idea for another audience: a hiring brief, with services, availability and how to call the endpoints. It got 10 agent reads and 116 from people. Both stay up, because they cost nothing to maintain. But if I had to pick only one thing to do today, I would do the Markdown version of every page before `llms.txt`.

## The MCP nobody calls

The site also has an MCP server (the [Model Context Protocol](https://modelcontextprotocol.io), a standard way for an assistant to call functions on a service) at `/api/mcp`, with five tools: list projects, detail a project, profile, resume and availability. And a `/api/hire`, so an agent can send a proposal on someone's behalf. I covered how I built that [in the MCP post](/en/site-that-talks-to-ai-via-mcp).

On the 17th, the panel showed agent access under "Live" and zero under "Tool calls". I thought it was a counting bug. It was not. The raw event showed only the connection sequence: `server/discover`, `initialize`, `notifications/initialized`, `tools/list`. That is the handshake Claude Code does when it opens a session with MCP configured. The tool is only called if the model decides to use one, and nobody had decided. To prove it, I called `get_profile` in production and the counter went from nothing to 1.

Over the 15 days, there were 149 connections and 2 tool calls. One of them was that test of mine. And to make it worse (for me), some of the connections are mine: the cookie that marks my visits does not ride along on an MCP call, and the 19 connections from the `claude-code` client are my own sessions.

MCP works. It is just that today an agent that reaches the site reads the Markdown and leaves, instead of connecting and asking.

## Is SEO dead?

The numbers on my site pull both ways. In 15 days, search brought few people: 17 visits from Google, 2 from Bing and 2 from DuckDuckGo, against 168 from LinkedIn. And agents read the site more than a thousand times, without me knowing how many of those reads became an answer for someone. But everything I did for agents sits on top of what SEO already asked for: the `sitemap.xml` with every page, the canonical URL that says which version counts and the JSON-LD that says who wrote it.

I keep doing both, in the same code. Every new page is born with the HTML for the human, the Markdown version for the agent and the structured data for both.

`User-agent: *`
