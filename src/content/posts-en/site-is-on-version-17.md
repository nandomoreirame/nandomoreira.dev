---
slug: site-is-on-version-17
translationOf: meu-site-esta-na-versao-17
title: "My site is on version 17, and some versions lasted a day"
seoTitle: "My site is on version 17: ten years of restarts"
summary: "I set out to count how many times I rebuilt my portfolio thinking it was ten. From the repositories that survived on GitHub, it is seventeen, from Jekyll in 2015 to Astro in 2026."
markers:
  - career
  - astro
  - front-end
  - open source
extras:
  - "17 versions since 2015, 10 of them with a live preview"
  - "Jekyll · Nuxt · Gatsby · Next.js · SvelteKit · Astro"
keyPoints:
  - "An attempt that stopped at the first commit is still a version: that is where I tested the idea and dropped it."
  - "A version that kept content in Notion or Sanity never came back live: the token died and took the posts with it."
  - "A .env deleted in a commit stays in history: before opening 16 repositories, every one went through a secret scan."
snapshot:
  items:
    - label: "Current version"
      value: "v17 (Astro 7)"
    - label: "First"
      value: "Jekyll, Nov/2015"
    - label: "Old versions"
      value: "16, public and archived"
    - label: "Previews"
      value: "Firebase Hosting"
    - label: "Secret scan"
      value: "gitleaks"
    - label: "Releases"
      value: "one file per day"
---

In the footer of this site there is a small number: `v17.832`. The 17 is how many times I rebuilt my portfolio since 2015, counting only the ones that left a trail on GitHub. The 832 is how many commits the current version had on the day I wrote this (it climbs on its own).

That number started as a joke. On October 19 I asked Claude to dig up the site's history across my repositories, because I wanted an approximate version tag in the footer, "something like `v10.67.821781` hahahahaha". I guessed it was the tenth version. I was off by seven (and probably by more, I will explain). If you have a portfolio, I bet it also has more versions than you remember: what changes is whether you count the ones that did not work out.

## I thought it was the tenth

The first list that came back had ten sites, one per stack. To land on that number, it left out repositories with one or two commits, the parallel blogs, and `nandomoreira.dev-chat`, the portfolio in conversation form, treated as "a separate project".

I disagreed. My reply was: "they are all versions of my portfolio, some with few commits because it was an idea that did not stick". The chat, in fact, was the last version before this one. With everything in, the count went to twenty. Then I removed three that were never the site (an npm package, a GitHub Pages redirect, and my old résumé) and it closed at **seventeen**.

And seventeen is a low estimate: it is what survived in a repository, and other versions were lost along the way. That is why the versions page starts by saying: "I am not sure how many versions this site has had; probably more than twenty."

## Seventeen restarts in almost eleven years

The first surviving commit is from November 12, 2015, in a Jekyll theme. From there on:

| v | When | Main stack | What was different |
|---|---|---|---|
| 1 | Nov/2015 | Jekyll | The first nandomoreira.me, built by Gulp; became an open theme on GitHub Pages |
| 2 | Jan/2016 | Jekyll | A portfolio separate from the blog, with links checked before publishing |
| 3 | Jul/2016 | Nuxt | Site and blog in Vue.js, installable as an app; the most polished version before this one |
| 4 | Aug/2016 | HTML | A restart in plain HTML. Lasted a day and two commits |
| 5 | Oct/2017 | Middleman | The blog in Ruby, with a service worker to work offline |
| 6 | May/2018 | Nuxt | Back to Nuxt, with translation and my GitHub repositories on the page |
| 7 | Aug/2018 | Jekyll | The blog returned to Jekyll, with Vue.js and Bootstrap on top |
| 8 | Mar/2019 | Gatsby | The move to the nandomoreira.dev domain, with React and GraphQL |
| 9 | Dec/2019 | Gatsby | The blog at blog.nandomoreira.dev, the first version in TypeScript |
| 10 | Aug/2020 | Strapi | A CMS to feed the next site. Stopped at the first commit |
| 11 | Aug/2020 | Next.js | Next.js with content in Sanity, published on Vercel |
| 12 | Jul/2021 | Next.js | Another restart in Next.js. Also stopped at the first commit |
| 13 | Apr/2022 | Remix | Remix with Notion as CMS, built in five days |
| 14 | May/2024 | Next.js | App Router, Tailwind and shadcn/ui, posts still in Notion |
| 15 | Oct/2025 | SvelteKit | SvelteKit with Bun, and the first `CLAUDE.md` in the repository |
| 16 | Jan/2026 | Next.js | The portfolio became a conversation, a chat with AI answering for me |
| 17 | Aug/2026 | Astro | This one |

Reading the table top to bottom you can see what the front-end market did in those years (Gulp and Bower, then SPAs in Vue, then React with GraphQL, then headless CMS, then AI). And you can see that I loop back: Nuxt reappears in v6, Jekyll in v7, Next.js in four different versions.

## What stayed from each one

Some things that are here today started in an old version. TypeScript arrived in v9, in a Gatsby blog, and never left. v13, in Remix, had an easter egg: anyone who typed "batman" on any page got a confetti rain and a YouTube video (the confetti came back on the versions page, without Batman). v15 was the first with a `CLAUDE.md`, the instructions file the AI agent reads before touching the code.

[[FILL IN: what each phase taught you in your own words (Jekyll and Gulp, Nuxt, Gatsby, the headless CMSs) and why v4, v10 and v12 stopped on day one]]

The short versions count for that reason: a repository with one commit is an idea tested and dropped on the same day, with no cost beyond `git init`. Taking those out of the table would make the story cleaner, and less true.

## Why 17 is Astro

What opened this version, in August, was a positioning problem, not a stack problem. The previous site sold a generic "full-stack web developer", while my work over the last twelve months was building tools with AI agents. And v16, the chat one, required the visitor to discover the commands to find anything, and a recruiter does not explore, a recruiter skims. The chat left the air as the site and stayed as a case.

So v17 needed to be a site in sections, quick to read, and at the same time readable by AI agents, which today are part of the screening for whoever hires. [Astro](https://astro.build) solved both halves. It is static by default, with a server only where needed, and the page arrives ready, almost with no JavaScript in the browser. Content lives in Markdown inside the repository itself, and a schema checks every post at build time: a missing field fails before it goes live (Astro 7, TypeScript, Tailwind CSS, Zod, Firebase App Hosting).

The agent side, the MCP server and the first week of building are told in [how I built my site that talks to AI via MCP](/en/site-that-talks-to-ai-via-mcp). I will not repeat them here.

## Opening sixteen repositories without leaking anything

For the versions page to make sense, each version needed a link to the code. Only most of the old repositories were private, and I was about to open eleven years of code written by myself across several phases of life (some with no care for secrets at all).

Before changing any visibility, Claude and I ran [gitleaks](https://github.com/gitleaks/gitleaks) (a scanner that looks for keys and passwords across the entire git history, not only in today's files) on all seventeen. Sanity, Resend, Notion, Instagram and Dribbble tokens showed up. The most didactic case was a `.env` committed in December 2024 and deleted later: the file no longer existed, but the Resend key and the Notion token were still there in history, one `git log -p` away.

We tested them one by one. Seven were dead (revoked or from APIs that no longer exist). One still returned 200: a Dribbble token from 2019, which had already been in two public repositories for years without me knowing. Since it did not appear in any private one, opening the others did not increase exposure; I opened them and revoked the Dribbble one right after.

GitHub still tripped at the end. An archived repository does not change visibility, and the API responds 403. For four of them we had to unarchive, open, and archive again. Today the sixteen old versions are public and archived, and only the current one stays active.

**If you are going to open an old repository, what matters is the history, not the folder.** Deleting the file does not delete the key; revoking does.

## Putting the old versions back online

A link to the code is good, but seeing the site is better. Of the sixteen old versions, three were still live (on GitHub Pages and Netlify). Another seven we republished on Firebase Hosting, each at its own address, like [v3 in Nuxt](https://nandomoreira-v3.web.app/), [v8 in Gatsby](https://nandomoreira-v8.web.app/) and [v15 in SvelteKit](https://nandomoreira-v15.web.app/).

A 2016 build does not run on 2026 Node. Each version was built in a container with the Node or Ruby version of the time (Node 8 for v3, Node 10 for v4 and v7, Node 12 for v8 and v9), and three needed a tweak to compile: a gem pinned below the version that requires Ruby 3, a Google Fonts preload plugin that no longer works, a Babel package pinned to a 2020 version. None of the tweaks went back into the repositories: they stay as they were.

The ones that did not come back tell another story. v11, v13 and v14 fetched content from Sanity or Notion over the API. With the tokens revoked, the code still exists, but there is no post left to show. v16 depended on a paid AI model to answer. Content that lives outside the repository disappears when the key dies, and v17 keeps everything in Markdown inside it.

## One release per working day

The [/releases](/releases) page covers the seventeen versions. [/releases/17](/releases/17) covers only this one, one working day at a time: each day becomes a file with a title, a summary and two to six highlights, and the day's version is `v17.<commits at end of day>`. The first, from August 8, is the foundation, `v17.44`.

The rule for the copy is to tell what a visitor notices, never commit by commit. A script builds the day's draft with the visible commits and the tag; I (or the agent, with a command I review) write in Portuguese what changed. A day that changes nothing for visitors goes into a skipped-days list, with the reason. And if a day with a new feature ends up without a release, the project check warns.

The code for both pages is in the repository, which is now public: the versions list lives in [`src/lib/history/history.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/history/history.ts) and the releases in [`src/data/releases/`](https://github.com/nandomoreirame/nandomoreira.dev/tree/main/src/data/releases).

I decided to count the versions that did not work out, leave every one's code open, and give 17 a record of each working day. When 18 arrives, it goes in the table.

`git init`
