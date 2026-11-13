---
slug: blog-comments-without-page-weight
translationOf: comentarios-no-blog-sem-pesar-a-pagina
title: "Blog comments without page weight: Giscus only loads when you reach the end"
summary: "The blog got comments through GitHub Discussions. Anyone who reads the post and closes the tab downloads nothing from Giscus: a loader of about 1 KB waits until the section nears the screen, and a test fails the build if it goes over 2 KB."
markers:
  - front-end
  - javascript
  - performance
  - github
  - privacy
extras:
  - "1045 B gzip loader, 2048 B build ceiling"
  - "Giscus · GitHub Discussions · IntersectionObserver"
keyPoints:
  - "The Giscus script and iframe only load when the comments section is 240 px from the screen; before that, nothing from giscus.app."
  - "The loader is the fifth JavaScript gate exception, with its own marker and a 2048 B gzip ceiling. Any other script fails the build."
  - "Giscus replies 'Discussion not found' for every post with no comments. Treating that as an error put the failure message on the whole blog."
snapshot:
  items:
    - label: "Comments"
      value: "Giscus"
    - label: "Storage"
      value: "GitHub Discussions"
    - label: "Category"
      value: "Blog (Announcements)"
    - label: "Loader"
      value: "1045 B gzip, 2048 B ceiling"
    - label: "Trigger"
      value: "IntersectionObserver, 240px"
    - label: "Timeout"
      value: "8 s"
---

Since October 22, new posts on this blog end in a section called "Leave a comment and let's discuss this article". If you read halfway and close the tab, your browser asked nothing of [Giscus](https://giscus.app): its script and the iframe with the comment box only enter when the section nears the screen. Until then, what exists on the page is a loader that, in that day's build, came out at 1045 bytes gzip.

Every comments tutorial answers which tool to use. That is the easy part. The question I had was how much a comments widget costs for people who only came to read, because a third-party embed loaded with the text charges everyone, including anyone who never scrolls to the end. **A comment is the last thing in the post, so it is the last thing the page should download.** If your blog loads Disqus or another widget at the top of the page, that is what is happening there.

## Why Giscus, and why a category just for it

Giscus stores each thread in [GitHub Discussions](https://docs.github.com/pt/discussions) of the site's own repository. To comment, the person signs in with their GitHub account, and I moderate there. There is no comments API of mine, no database, no secret in the code: what goes to the browser are two public identifiers, the repository's and the category's, which live in [`giscus-config.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/posts/giscus-config.ts) for anyone who wants to look.

[utterances](https://utteranc.es) does the same thing on top of Issues. It stayed out. I wanted post threads in a space that would not mix with site bugs and tasks, and Discussions gives that. For the same reason I created a dedicated category, `Blog`, of type Announcements: in it only the integration opens a new topic, and anyone who arrives comments inside the post's topic.

Each post finds its thread by the URL path, in strict mode, because without it Giscus does a fuzzy search and can join two posts with similar slugs into the same discussion. There is a cost. If a slug changes, the old thread is left behind and only comes back with a hand-made migration. I took that cost on purpose: I would rather lose the link than mix the wrong post's conversation.

Comments only show on current posts. The 2015 to 2019 archive stays without them, and the old Disqus comments from that era were not imported (migrating those threads is another job).

## The loader waits until the section gets close

The section ships ready from the build, with the config in `data-*` attributes, and a small script decides when to call Giscus. What decides is an [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), the browser API that reports when an element enters (or nears) the visible area, without listening to scroll:

```ts
const observer = new view.IntersectionObserver(
  entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    load();
  },
  { rootMargin: '240px 0px' },
);
observer.observe(section);
```

The 240 px `rootMargin` starts the load a little before the section appears, so the box is already there when you arrive. `load()` builds the `<script src="https://giscus.app/client.js">` with the section attributes, puts it on the page, and starts an 8-second timer. If the script fails or Giscus does not answer in that time, a short notice shows up and the post stays there, whole. The full code is in [`giscus-loader.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/posts/giscus-loader.ts).

Giscus talks to the page over `postMessage`, and the loader ignores any message that does not come from `https://giscus.app`. It is one line (`if (event.origin !== GISCUS_ORIGIN) return;`), and without it any iframe on the page could pretend to be the widget.

The site has two themes, Noir and Paper, and the widget needs to follow the switch without a reload. A `MutationObserver` watches the `data-theme` attribute on `<html>` and sends the new theme to the iframe. There is a second one watching the section itself, and that is the less obvious detail: the iframe is born after the script, and if someone switches the theme in that window, the switch is lost. With the second observer, the theme goes along when the iframe appears.

## The gate does not let anyone hang anything else

This site only accepts client JavaScript by a named exception. A build test fails any script outside the list (the budget and the why are in the [command palette post](/en/command-palette-ctrl-k)), and the Giscus loader became the fifth exception: marked by `data-giscus-loader`, only on current posts, with a ceiling of 2048 bytes gzip. The real widget, the one from giscus.app, does not count in that budget because it never becomes part of the page the server delivers.

The bit of the [gate helper](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/helpers/client-scripts.ts) that enforces this:

```ts
if (script.includes(GISCUS_MARKER)) {
  const size = gzipSync(script).length;
  return size > GISCUS_BUDGET_BYTES
    ? [`${route}: giscus loader is ${size} B gzip, budget ${GISCUS_BUDGET_BYTES}`]
    : [];
}
```

And the [build test](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/design-system/no-client-js.build-test.ts) started accepting, in the assets folder, only a file that carries one of the known markers. If tomorrow I want to hang a reaction, a counter, or any frill on the section, either it fits in 2048 bytes, or it is another decision written in the project's `CLAUDE.md`, with date and reason.

## The box that would not load on localhost

With the implementation ready, I opened a post on `localhost:4321` and the comment box was not there. My first suspicion was localhost, and the question I asked the agent was literally that: why does the box not load on localhost?

Localhost had nothing to do with it. The loader does not inject the widget if the repository id or the category id is missing, and the `Blog` category did not exist on GitHub yet. I created the category, asked for the id, and on the first lookup it was in the wrong place. With the right id in the config, the box still did not show, now with a different error: Giscus answered 403, "giscus is not installed on this repository". The Giscus app still needed to be installed on the repository. After that, it appeared.

The funny part (or not so much) is that the spec already knew. In the verified claims table, the line "the repository is public, Discussions is enabled, and the Giscus app has access" was the only one marked as an assumption, and it was exactly the one that blocked. The tests run with fixed ids and a fake Giscus, so none of them could know that, on the GitHub side, the category and the app did not exist yet.

## A post with no comments is not an error

With the box showing up, the second problem came. The failure message was on every post. Giscus, when the page still has no discussion, sends a `Discussion not found` error over `postMessage`, and the loader treated any error as failure. Since no post had a comment yet, the whole blog said comments had failed to load.

The fix was to split the two cases. `Discussion not found` becomes an empty state (the comment box stays there, working), and only the rest becomes failure:

```ts
if (giscus.error === GISCUS_EMPTY_DISCUSSION_ERROR) {
  clearTimer();
  showEmpty();
  return;
}
if (giscus.error) {
  fail();
  return;
}
```

I had already swapped the failure text earlier, right on the first look: it was "Comments failed to load. The post text is still available." and became "Oops, failed to load comments. Come back later.". The empty state, which I asked for as "no comments have been sent yet, be the first" or something like that, became "No comments yet. Be the first to write one.", in italics. And the section title stopped being "Comments".

## Where the section sits

The spec said the section came right after the author block, and the first version even came after it, only outside the `<article>`, misaligned with the text. I moved it inside myself, below `AuthorBox`, aligned with the article. Today a test checks the order: the section sits inside the `<article>`, after the author block and before the related posts.

## What stuck

- Comments through GitHub Discussions, in a blog-only category, one thread per post path, with no backend and no secret in the browser.
- Nothing from Giscus before the section is 240 px from the screen, and a 2048 bytes gzip ceiling for the loader, enforced at build.
- The privacy policy now says that when the section gets close, the browser requests the script from giscus.app, and that the comment stays public on GitHub.

The code is in the [site repository](https://github.com/nandomoreirame/nandomoreira.dev), and the threads, in its [Discussions](https://github.com/nandomoreirame/nandomoreira.dev/discussions).

`observer.disconnect()`
