---
slug: site-that-talks-to-ai-via-mcp
translationOf: como-construi-meu-site-que-conversa-com-ia-via-mcp
title: "How I built my new 2026 site that talks to AI via MCP"
seoTitle: "How I built my site that talks to AI via MCP"
summary: "The cobbler's children have no shoes: an AI engineer without a site that talks to AI. How I rebuilt mine, with an MCP server, a machine version of every page and seven automated gates."
markers:
  - astro
  - mcp
  - ai
extras:
  - "5 MCP tools, 7 automated gates"
  - "Astro 7 · App Hosting · MCP"
keyPoints:
  - "An MCP server with five tools lets an agent query profile, cases and résumé without guessing the HTML."
  - "Every page has a .md and /ia version, tied by a single table; a path outside it returns 404."
  - "Seven gates turn rules that only lived in documents into tests, and each one was seen red before it counted."
snapshot:
  items:
    - label: Framework
      value: Astro 7
    - label: Hosting
      value: Firebase App Hosting
    - label: Protocol
      value: MCP
    - label: Adapter
      value: "@astrojs/node"
    - label: Gates
      value: seven gates
---

The cobbler's children have no shoes. I work in AI engineering and software development, and my site talked to no AI at all. It was a page that sold "full-stack web developer" to whoever opened it, and to an agent doing screening it was just HTML to scrape and guess from.

I started rebuilding in August, laid the foundation in two days and stopped. In October I came back, and this time I went all the way.

Today any [MCP](https://modelcontextprotocol.io) client connects to it:

```bash
claude mcp add --transport http nandomoreira https://nandomoreira.dev/api/mcp
```

The reply I got when I ran it in my terminal was this:

```text
Added HTTP MCP server nandomoreira with URL: https://nandomoreira.dev/api/mcp to local config
```

No ceremony. From then on, an agent that needs to know what I have already shipped calls `list_projects` and answers from a structured list, not from a guess about my HTML.

## Two audiences, and one of them has no eyes

Before any code I wrote four documents: brief, PRD, MVP scope and design guidelines. The brief fits in one sentence: a portfolio that is itself the demonstration of what it claims, written for humans and for machines.

The human reader is the technical evaluator, CTO or tech lead, who wants to see a working artifact and an explained decision. The other is the agent that screens for them, more and more common, and that wants to extract competence, availability and evidence without hallucinating.

The brief also listed the risks, and the most likely one was not technical: the cases never getting written and the site shipping with placeholders (anyone who has rebuilt a portfolio knows that movie). The way out was process: the eight cases went into a sprint **before** the home.

## First, prove the platform can take it

The site is [Astro](https://astro.build) 7 in SSR mode, published on Firebase App Hosting. The platform's official adapter had been at version 0.0.1 since January 2025, a single version. Abandoned, in practice.

Because the whole machine side depends on server routes, the first sprint was a two-day spike with a stop criterion written before starting: either plan A ships to production, or I go to plan B, a static site with Cloud Functions. Plan A shipped on day one, with `@astrojs/node` in standalone mode. The decision landed in an ADR, with the discarded alternatives.

## One source only, and a test that enforces it

Content lives in two collections, `projects` and `profile`, validated by schema. From them come the home, the cases, `llms.txt`, JSON-LD, the résumé and the MCP tools.

A single source of truth usually lasts until the first page in a hurry reads the collection directly. Here it is a test: if any file outside the access layer calls `getCollection`, the suite goes red.

```ts
for await (const file of glob('src/**/*.{ts,astro}')) {
  const normalized = file.replaceAll('\\', '/');
  if (ALLOWED.includes(normalized)) continue;

  if (readFileSync(file, 'utf8').includes('getCollection(')) {
    offenders.push(normalized);
  }
}

expect(offenders).toEqual([]);
```

For this site that weighs more than usual. If the home says one thing and the MCP another, the agent answers wrong with confidence, which is exactly what the site exists to prevent.

## The MCP server

The idea of putting an MCP server on a portfolio is not mine. It came from [Ruben Marcus's site](https://www.rubenmarcus.dev/pt/), which exposes the portfolio to agents and tells how he did it in an [article about building the portfolio with AI agents](https://www.rubenmarcus.dev/pt/blog/como-construi-este-portfolio-com-agentes-de-ia).

Mine has five tools:

| Tool | What it returns |
|---|---|
| `get_profile` | Who I am, what I do, where I am |
| `check_availability` | Availability and the date of the last update |
| `list_projects` | The cases, with stack and verifiable links |
| `get_project` | A full case by slug |
| `get_resume` | The structured résumé |

The route uses the official SDK with the Streamable HTTP transport, which takes a `Request` and returns a `Response`, the same shape as an Astro SSR route. The detail that matters is in the comment:

```ts
/**
 * One server AND one transport per request.
 *
 * Hoisting either to module scope is the natural shape and the wrong one: in
 * stateless mode a shared instance collides request IDs between concurrent
 * clients, and this backend serves with concurrency 80.
 */
const handle = async (request: Request): Promise<Response> => {
  const server = await createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  return closeWhenDrained(await transport.handleRequest(request), server);
};
```

Creating the server once, at the top of the module, is the natural way to write it and the wrong way here: with 80 concurrent requests on one instance, different clients swap request IDs with each other. It works in a single-client test and breaks in production with two.

Closing the server also had a trap. In a `finally`, the response came out empty; without closing, one server per request was left behind. Codex found it, reviewing code another model had written. The fix was to close only when the response stream ends.

The [/en/mcp](/en/mcp) page shows how to connect in Claude Code, Claude, ChatGPT and any MCP client.

## Every page has a machine version

Not every agent speaks MCP. For the ones that only read, each page has the `<page>.md` version, plain markdown, and the `<page>/ia` version, the page as an agent would see it. A button in the corner switches between the human view and the AI view.

A single table maps path to markdown, and a page outside it returns 404. I prefer an honest 404 to markdown generated in the dark.

The machine side is completed by `llms.txt`, `AGENTS.md`, the résumé in `resume.json` and `resume.txt`, and JSON-LD. The list of what an answer engine looks for came from [aeo.js](https://aeojs.org), also from Ruben. I did not install the library: I used what it generates as a reference and implemented each route in the project, coming from the same content layer as the pages. His checker, [check.aeojs.org](https://check.aeojs.org), is what I used to measure the result.

## An agent can hire me

`POST /api/hire` takes a proposal as JSON, straight from an agent that finished screening. The schema rejects unknown keys instead of storing them silently, and every field has a size limit. The same endpoint serves the [contact](/en/contact) form for people.

And no e-mail appears on the machine routes. A test sweeps all of them looking for e-mail, key, absolute path and private IP, because the premise is a crawler that ignores `robots.txt`.

## Seven gates

A rule written in a document stops nobody from breaking it on a Friday night. So every rule that mattered became a test:

| Gate | What it blocks |
|---|---|
| Contrast | Color pair below 4.5:1 |
| Value off the scale | Loose color and arbitrary Tailwind value |
| Client JavaScript | Second script, or the only one above 1.5 KB gzip |
| Single source | `getCollection` outside the access layer |
| Schema breaks the build | Invalid content reaching production |
| Single CTA | Two same-weight buttons on the home |
| Leak | E-mail, key, absolute path, private IP on machine routes |

**A gate is only ready after it has gone red.** For each one I wrote the case that should fail and watched it fail.

The JavaScript one says a lot about the site: there is **one** client script, about 700 bytes gzip, that does the pointer effect, the copy button and the header background on scroll. No framework in the browser.

And there is the rule about numbers with context. I have 964 stars on GitHub, but about 700 came from 2018 Jekyll themes. Showing the total without saying that would be selling AI work with social proof from another era, so the component that displays a number breaks if it does not get the explanation with it.

## What went wrong

Some problems only showed up in production:

- **The redirect that did not redirect.** On a prerendered page, a 301 redirect becomes a document with a meta refresh served with status 200. In the browser it works; for crawler and cache, it is no redirect. The tests were green because they looked for the string `301` in the code.
- **The 403 behind the proxy.** Astro checks the origin of forms and, behind the App Hosting proxy, thought the request came over HTTP. Every contact form submit came back 403.
- **The message that vanished.** The form said success and nothing reached Firestore: a service account permission was missing, and the write failed quietly.
- **The password manager on the honeypot.** The hidden field that catches bots was named `website`, and the password manager (probably 1Password) filled it on its own. Real people's messages went to the spam pile.

## How it was built

With agents, in a research, plan and implement flow where Claude Code leads, Grok writes and Codex reviews. I told how it works in [RPI flow with three agents](/en/rpi-flow-with-three-agents). In numbers: 16 specs, 16 plans and more than 1,400 tests.

## Trend or demonstration

I think a site with an MCP server may become a trend among developers and AI engineers. For me, it is a demonstration: if I say I build tooling for agents, my own site has to be consumable by one.

If you are evaluating someone for an AI problem, you can start with the agent:

```bash
claude mcp add --transport http nandomoreira https://nandomoreira.dev/api/mcp
```

Or the human path, on the [contact](/en/contact) page.
