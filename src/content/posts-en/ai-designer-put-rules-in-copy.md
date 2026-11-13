---
slug: ai-designer-put-rules-in-copy
translationOf: o-designer-de-ia-pos-a-regra-de-negocio-no-texto
title: "The AI designer put the business rule in the copy: my prompt told it to"
summary: "Google Stitch designed the screens for two of my projects well and wrote into them what I only wanted it to respect. How I now separate the instruction for the designer from the copy for the customer."
markers:
  - ai
  - design
  - agents
extras:
  - "17 routes audited against Stitch by screenshot"
  - "Google Stitch · Grok · Playwright · Vitest"
keyPoints:
  - "Stitch decides layout and visuals. Text, numbers and data come from the product, written in the prompt or the spec, never invented by it."
  - "A design restriction with no declared destination becomes on-screen copy: the block must say it does not become a banner, badge or caption."
  - "A number invented by the designer only leaves the page for good when it becomes a test that can fail."
snapshot:
  items:
    - label: "Designer"
      value: "Google Stitch"
    - label: "Prompts"
      value: "Grok + Claude Code"
    - label: "Port"
      value: "skill stitch-fidelity"
    - label: "Visual diff"
      value: "Playwright · compare.py"
    - label: "Number gate"
      value: "Vitest"
---

The contrateum.dev landing came back from [Google Stitch](https://stitch.withgoogle.com) (Google's interface generator, which draws screens from a prompt) with a banner like this: a `BLIND MATCH` badge and, beside it, "Blind criterion: no photo, name, initials, GitHub or repository." The rest of the layout looked good. That sentence was the product's privacy rule written for the visitor, looking like a construction-site sign.

My first reaction was to blame Stitch: "it put the implicit business rule into the copy, Blind criterion? we are not going to communicate that aggressively". Except the banner line is almost word for word the last line of the prompt I had sent. Asking whether the AI designer is good goes nowhere (the screens were good). The useful question is what from your prompt ends up on the screen, because if you use one of these generators to get a product off the ground, everything you write to it can show up for the customer, including what was only meant for it to respect. My position, after ten days and two projects with Stitch: **the AI designer decides the layout, and the text and the data belong to the product.**

## First came the numbers

On 18/10 I asked Claude Code for a prompt for Stitch to design the sales page of my site, aimed at people who are not technical and do not quite know what they want: institutional site, online store, blog, web product, my workflow and the Firebase tools explained without jargon. The screens came back great and full of numbers nobody measured: `99.98% no ar`, `R$ 14.890 hoje`, `< 1.5s`, `99.99% Uptime`, `100 pontos de presença`, "Reply within 24 business hours", even a `© 2025` in the footer. The project images were invented too.

None of that is mine. I do not sell services at a fixed price ("it will always depend on the negotiation and on what the client wants, the price will vary a lot"), and I never promised a reply deadline. The page spec got the rule: the copy comes from the approved prompt and from the screen, and every number, metric, price, deadline and badge that Stitch invented stays out. The images became real screenshots of the live sites.

A rule that lives only in the spec disappears on the third copy tweak. It became a test. The [`tests/helpers/invented-numbers.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/helpers/invented-numbers.ts) looks through the visible text of the sales pages for percentages, amounts in reais, time metrics and "uptime". And the first case in [`tests/sales/copy.test.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/sales/copy.test.ts) proves the gate can fail, using Stitch's own numbers:

```ts
it('can fail: it catches every figure the Stitch made up', () => {
  for (const sample of [
    '99.98% no ar',
    'R$ 14.890 hoje',
    '< 1.5s',
    'Retorno em até 24 horas úteis',
    '99.99% Uptime',
  ]) {
    expect(inventedNumbersIn(sample), sample).not.toEqual([]);
  }
});
```

A real number gets in by named exception. On 21/10 I passed the payment terms, and they were allowed only as that exact text: a percentage anywhere else on the page still fails. The page is live at [contrate.nandomoreira.dev](https://contrate.nandomoreira.dev).

## Then I was the one who wrote the rule on the screen

contrateum.dev is a project of mine that matches jobs and developers by stack. At its center lives a privacy rule, and it is simple to state in general terms: some of what identifies the developer only shows up to the company at the right moment in the flow. It holds the product together. It does not sell anything.

On 23/10 I asked Grok for a prompt for Stitch to redo the landing around that rule. The prompt came out polished (hex colors, card anatomy, fake data, section order) and with three problems I did not see before pasting:

- the H1 was the rule itself: "The job finds the technical profile. The identity does not.";
- the subtitle explained who sees what and when, with "authorized unlock" in the middle of the sentence;
- the last line asked: "Note on the screen itself what is forbidden on the card: photo, name, initials, GitHub, repository."

Stitch did exactly what the last line asked. It took the list, invented the `BLIND MATCH` label and the name "Blind criterion" and put the note on the page as if it were content. When I asked for a fix, Grok itself found the cause in the prompt: the instruction was read literally, and "authorized unlock" had also come from there. Stitch's part was the English label and the construction-sign tone. The rest was written by an agent at my request, and I was the one who approved and pasted it.

The hero fix, side by side:

| | First prompt | Corrected prompt |
|---|---|---|
| H1 | "The job finds the technical profile. The identity does not." | "The job finds the stack you master." |
| Trust line | "Free for devs · Identity protected · Match by job" | "Free for devs · By stack · By job" |
| Last line | "Note on the screen itself what is forbidden on the card" | "Do not write the privacy rule on top of the layout." |

The reply I gave when the new screen arrived was "looks great, loved it".

## How I write the prompt now

The model that draws does not distinguish "rule you gave me" from "copy you want on the page": everything that goes into the prompt is material. The version that worked splits the prompt into blocks, each with a destination stated in writing.

1. Tone, in one line of what the person gets: "Talk about what the person gains: the right job, the stack that matches, what is missing, the score of that fit. Do not threaten, do not forbid, do not announce a rule."
2. **Designer restrictions, in a block that declares itself invisible.** That is the block that was missing from the first prompt. The first sentence of the block says where it does not go:

```text
Estas restrições são suas, na hora de desenhar. Não viram texto, faixa,
selo, badge, legenda nem anotação na tela:

- Não escreva "Critério cego", "Blind match", "proibido", "é proibido",
  "não pode", "identidade protegida" ...
```

3. The product rule appears in one place only, chosen by me. In contrateum it stayed in one of the "How it works" steps, and the prompt closes the door on the rest: "Everywhere else on the page, do not repeat."
4. Literal copy: every visible string goes written in the prompt, under "Do not rewrite these texts." Stitch keeps the rest.
5. Ban on inventing: "Do not invent prices in reais, percentages, testimonials, client logos or statistics." The sales-page lesson, now in the prompt before the screen, not after.
6. What does not exist does not get a place. A field the card does not show does not become a blurred field: "Do not blur those fields and do not draw the space for them." A blur also communicates the rule, only in pixels.

If you are going to try this on your project, start with item 2. That is what separates the rule the designer respects from the rule it publishes.

## One document only, pasted into every call

That same night I asked for the app screens, and then another kind of noise showed up: every tweak became a new prompt, and the new prompt over-corrected. I asked to hide part of the developer's name before the right time, and the next prompt hid the whole name, initial included. I had to rewrite what could appear.

When I sat down to review the Stitch screens against what was planned, before implementing, the diagnosis was mine and short: "the prompts were attempts to tweak the Stitch screens, that is why they contradict each other". The four earlier prompts became history, and one adjustments document took over. It has the product's main rule at the top, one section per screen and a context block that gets pasted at the start of every call to Stitch: the product in one paragraph, the colors, the font, the headers and the same fake data across every screen. That way the profile screen and the search screen come out with the same version of the rule.

The project inventory reached 35 screens registered in Stitch. The mobile versions of eleven of them I decided not to generate ("leave it, we will do that during development"), and the mobile for each route came out in the code.

## From Stitch to code without reinterpreting

Stitch exports HTML with Tailwind classes. The agent that implemented the first screens rewrote everything "inspired" by the design, and the result diverged the way I described at the time: the company signup "is grotesque", the login had the app header when in Stitch it was only the centered form, and the developer onboarding was stretched. Even an example state from Stitch leaked into the code: onboarding step 2 opened active ("I think Stitch put step 2 active as an example").

I asked it to look for a public skill that would make the agent follow the design and, if none fit, create one. It became `stitch-fidelity`, a skill of mine that runs in Claude Code, Grok and Codex. It starts from a split that is the same as the prompt: "Stitch decides layout and visuals; the project decides data and copy. Never import Stitch's invented data, tabs or policies."

The port copies the export markup and swaps only what belongs to the project: color and font for the tokens, icons, data and text, links and interaction. Then a script with [Playwright](https://playwright.dev) (which opens the page in a real browser) takes a screenshot of the route and compares it with the Stitch PNG:

```bash
uv run --with playwright==1.58.0 --with pillow python <skill>/scripts/compare.py \
  --url http://localhost:4321/<rota> --ref docs/design/stitch/screens/<tela>.png \
  --width 1280 --out .stitch-diff/<tela>
```

Two numbers come out. `layout_diff` measures how much the edges of the two screenshots fail to match (0 is the same structure, 1 is another page). `content_x` says where the content starts and ends horizontally, and that is what catches a stretched form right away. A third metric, the pixel difference, went in the trash: on the dark theme every screen scored between 3 and 8% and said nothing.

The 25/10 audit went through 17 routes. The first root cause was a single constant: a global 1200px container applied on every page, when Stitch sets the width screen by screen. In Stitch the company signup spanned 384 to 862px; after the port, 408 to 838px. That route's `layout_diff` dropped from 0.90 to 0.77. It does not reach zero, and part of what remains is product text and data, which I want different on purpose.

## What I decided

- Stitch draws. Text, numbers and data come from me, written in the prompt or the spec.
- A design restriction goes in a block that says, in the first sentence, that it does not become copy.
- The product rule appears where I choose, once.
- A number on a sales page goes through a test that has already proved it fails.

`edit_screens()`
