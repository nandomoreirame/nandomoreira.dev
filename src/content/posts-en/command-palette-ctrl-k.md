---
slug: command-palette-ctrl-k
translationOf: paleta-de-comandos-ctrl-k-no-meu-site
title: "Ctrl+K on my site: a command palette that only downloads when someone hits the key"
summary: "Site-wide search, G + letter shortcuts and single-key actions, in plain TypeScript with no library. Anyone who never opens the palette downloads nothing of it, and what cost the most bytes was the loader, not the palette."
markers:
  - front-end
  - javascript
  - accessibility
  - performance
extras:
  - "Palette at about 3 KB gzip, downloaded on the first Ctrl+K"
  - "TypeScript · <dialog> · Vitest · happy-dom"
keyPoints:
  - "The palette is a separate file: anyone who never hits Ctrl+K downloads not a byte of it."
  - "For about a hundred items, stripping accents and requiring every term is enough; a fuzzy search lib would blow the budget."
  - "What weighed was import(): Vite's helper cost about 717 B gzip and the script budget rose to 2304 B."
snapshot:
  items:
    - label: "Framework"
      value: "Astro 7"
    - label: "Palette"
      value: "TypeScript, no dependency"
    - label: "Index"
      value: "/search.json at build"
    - label: "Budget"
      value: "4 KB gzip"
    - label: "Tests"
      value: "Vitest + happy-dom"
---

Hit `Ctrl+K` on any page of this site (or `⌘K`, on a Mac). A field opens saying "Type a command or search…", and from there you can find a post by typing the title without accents, copy the page link with `L` or go to the blog with `G` then `B`, without even opening the palette. The idea came from [zenorocha.com](https://zenorocha.com), which does this with [kbar](https://github.com/timc1/kbar), a React library.

Here there is no React in the browser, and I do not want there to be. The site only accepts client JavaScript by a named exception, and a test fails the build if any script outside the list shows up (I told that rule in the [post about the site that talks via MCP](/en/site-that-talks-to-ai-via-mcp)). So the question I had was how much a command palette costs for people who will never open it, and the answer I wanted was zero. If your site downloads the whole search on first visit to serve the few people who hit `Ctrl+K`, everyone is paying for them.

## The palette lives in a file nobody downloads without asking

Before the palette, the site had a single script on every page, the pointer effect, with a budget of 1536 bytes gzip and 1158 used. That left 378 bytes, and a command palette does not fit in that.

Extending that script was out, always loading the palette was out, and a second script on every page was out too. **The pointer script only got the loader:** it listens for `Ctrl+K`, the button click and the letter `G`, and the first time it `import()`s the palette module, which the build splits into its own file.

```ts
const palette = () => import('../../scripts/palette');
// ...
if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
  event.preventDefault();
  palette().then((module) => module.open(document.activeElement as HTMLElement));
}
```

The module became the third exception of the [JavaScript gate](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/design-system/no-client-js.build-test.ts): up to 4 KB gzip, and only as an on-demand downloaded file. If one day it shows up as a `<script>` straight on the page, the test fails. In today's build, [`palette.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/scripts/palette.ts) comes out at 3050 bytes gzip.

The search content follows the same logic. The index is a `/search.json` generated at build with the pages, the current posts, the archived ones, the cases and the services (today that is a hundred items, and drafts do not enter). The palette fetches that file the first time it opens and reuses it afterward. Embedding the index in the HTML would weigh on every page, and a per-request server search would lose the CDN cache that the static file uses. If the `fetch` fails, the palette keeps the actions and the "Go to", and warns that search is unavailable.

And without JavaScript the palette simply does not exist: the button and the hint start hidden, and what shows both is the loader. I thought about a server-rendered `/search` page and dropped it, because it is more code to maintain and the site already navigates with no palette at all.

## The byte I had not counted

The plan assumed the loader fit in the 378 free bytes. It did not. Vite wraps every client `import()` in a helper called `__vitePreload`, which alone costs about 717 bytes gzip, and the pointer script went to 2040 bytes, above the 1536 budget.

The gate stopped the build, which is its job. From there there were three paths:

| Option | What happened |
|---|---|
| Strip the helper with a Vite plugin | Discarded |
| A second script on every page | Discarded, the rule remains one script per page |
| Raise the pointer script budget | Chosen: 2304 bytes gzip, since October 19, 2026 |

The change was written into the spec and the project's `CLAUDE.md`, with the date, the reason (the `__vitePreload`) and the new number, which the test started enforcing. Anything new hung on that script has to fit in the same 2304 bytes, or it asks for another recorded decision.

## Search without a library

kbar has fuzzy search, and the reflex would be to grab a [Fuse.js](https://www.fusejs.io) or similar. For about a hundred items that is dead weight, and the dependency alone would blow the 4 KB. The whole search is this function, in [`match.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/search/match.ts):

```ts
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const scoreOf = (item: Searchable, query: string): number => {
  const words = terms(query);
  if (words.length === 0) return 0;
  const title = normalize(item.title);
  const keywords = normalize((item.keywords ?? []).join(' '));
  const summary = normalize(item.summary ?? '');
  let score = 0;
  for (const word of words) {
    const hit = (title.includes(word) ? 3 : 0) + (keywords.includes(word) ? 2 : 0) + (summary.includes(word) ? 1 : 0);
    if (hit === 0) return 0;
    score += hit;
  }
  return score;
};
```

Everything becomes lowercase and accent-free, every typed term must appear, and the title weighs more than the tags, which weigh more than the summary. Someone who types "sessoes" finds the Red Dead Online sessions post, and on a Portuguese blog that is the case that matters most. Posts from 2015 to 2019 also enter the index, always last and in the "Archive" group.

## Single-letter shortcuts, which I had avoided

The first version of the spec only had the `G` + letter sequence (`G H` for home, `G B` for the blog, `G P` for the portfolio and so on), with a one-second window between the two keys. A bare key was left out on purpose, so nobody would trigger an action by accident while reading.

Mid-implementation I changed my mind and kept the short shortcuts, like on Zeno's site. Today, outside any text field, a single letter does this:

| Key | Action |
|---|---|
| `L` | Copies the page link |
| `E` | Goes to contact |
| `M` | Opens the page's `.md` version |
| `I` | Opens the AI version (or goes back to the human one) |
| `S` | Opens the site's source code on GitHub, in a new tab |
| `T` | Switches the theme between Noir and Paper |

No letter fires with `Ctrl`, `Alt` or `Meta`, nor inside a field. On a touch screen (`hover: none`) the letter shortcuts disappear, even with a keyboard plugged in, and only the button opens the palette. The home hero lost the buttons it had and kept only the "Press Ctrl K" hint, and the gate that required exactly one primary button on the home started accepting zero.

The palette is a modal `<dialog>`, with the field as a `combobox` tied to a `listbox`: the arrows move the active option (via `aria-activedescendant`), `Enter` chooses, `Esc` closes and returns focus to whoever opened it, and an `aria-live` region announces how many results there are. Transitions are CSS only, with `@starting-style`, and with `prefers-reduced-motion` it opens and closes with no animation. To test open, close, focus and keyboard without depending on a screenshot, [happy-dom](https://github.com/capricorn86/happy-dom) came in as a development dependency, used only in the palette module test.

## What broke after it was done

The feature closed with 15 tasks and the review with no open findings. Even so, three bugs showed up afterward, and all three went through the loader, the part with the fewest bytes.

The first showed up the same day. A second `Ctrl+K` with the palette open wiped what was already typed, and letters typed while the module was still downloading were lost: on a slow network, a quick `G B` went nowhere. Now those letters wait in a queue and are delivered as soon as the module arrives.

The second came the next day, along with the Paper theme. I put `T` in the palette to switch the theme, but the loader only downloaded the module when the letter was `G`, `L`, `E`, `M`, `S` or `I`. On a freshly opened page, `T` fell into the void. The loader test started pulling the letter list from the palette controller itself, instead of repeating the list by hand.

The third showed up three days after the palette. I wrote an app for Astro's Dev Toolbar (only in `astro dev`) where I highlight a post excerpt and write the review in a text box. Every letter typed in that box reached the palette as a shortcut. The loader looked at `event.target` to know whether the key came from a field, but the toolbar lives inside a shadow DOM, and a listener on `document` receives the shadow host element as the target, not the `textarea` inside. To it, I was typing on the page. The fix was to look at the first element of `composedPath()`, which crosses the shadow and returns the real field ([`bare-letter.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/search/bare-letter.ts)):

```ts
/**
 * A bare letter reaches the palette unless it was typed in a field.
 * The caller passes `composedPath()[0]`: a document listener's `target` is the
 * shadow host, so a textarea in the dev toolbar would look like the page.
 */
export const forwardBareLetter = (origin: Origin, event: KeyEvent, touch: boolean): boolean => {
  const field = !!origin && (origin.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(origin.tagName));
  return !event.ctrlKey && !event.metaKey && !event.altKey && /^[a-z]$/i.test(event.key) && !touch && !field;
};
```

If you have a global keyboard shortcut on your site and some web component with a text field (a chat widget, an embedded form), it is worth checking whether you are looking at `target` or `composedPath()`.

## What remains

The palette stays as it is: a file downloaded on demand, a 35-line search with no dependency and a budget that went up once, with date and reason written down. The next feature that touches the same script is the site translation, and it will have to fit in the same 2304 bytes. The code is in the [site repository](https://github.com/nandomoreirame/nandomoreira.dev), for anyone who wants to take the idea to theirs.

`dialog.close()`
