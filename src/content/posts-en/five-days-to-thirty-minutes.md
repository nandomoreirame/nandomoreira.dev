---
slug: five-days-to-thirty-minutes
translationOf: de-cinco-dias-para-trinta-minutos
title: "From five days to thirty minutes: AI in an ETL pipeline"
seoTitle: "From five days to thirty minutes with AI in ETL"
summary: "How preparing a dataset went from nearly a week of manual work to half an hour: API automation, AI where it helps, tests where it can go wrong and the deadline as a product rule."
markers:
  - etl
  - data
  - ai
extras:
  - "5 days → 30 min per dataset"
  - "4,800+ tests · coverage from 0% to 92%"
keyPoints:
  - "Automation before AI: fixed rules for what is predictable, AI only for what is ambiguous."
  - "Queue, safe retries and one stage pulling the next removed the waiting, which was most of the five days."
  - "The deadline became a product rule: each phase has a budget, and the dataset shows on time, at risk or late."
snapshot:
  items:
    - label: Language
      value: Python
    - label: Cloud
      value: Google Cloud
    - label: Interface
      value: React 19
    - label: Database
      value: Firebase
    - label: Tests
      value: 4,800 automated tests
---

When I took over the data operation at Liquid AI, receiving a client's dataset and delivering it ready into the pipeline took around five days. When I left, in September 2026, it took up to thirty minutes.

That number usually prompts the wrong question: "which model did you use?". The gain did not come from a model. It came from pulling manual work out of the path, putting AI where it actually helps, fencing with tests what it can get wrong and turning the deadline into a system rule, instead of a spreadsheet.

This text tells how it went, with no client names and no data. What matters here is the architecture and the decisions.

## The problem

The pipeline turns real-estate developer datasets into mortgage indicators inside the company's products. There are more than twenty clients, and each one sends their data their own way: different formats, columns with different names, different conventions for the same information.

Before, each dataset was a small project. Someone received the file, almost always a spreadsheet, figured out that round's format, treated the data by hand and only then put it into the pipeline. Treatment was a set of notebooks run one client at a time, and the knowledge of "how client X's dataset usually arrives" lived in the head of whoever had already done it.

And the control of all of that lived in a third-party tool, disconnected from the work. Knowing which phase each dataset was in, who owned it and whether it would slip depended on someone updating a board.

Five days were not five days of processing. They were five days of queue, waiting and rework.

![Before flow, top to bottom: the client sends the dataset in several formats, almost always a spreadsheet; someone figures out that round's format; treats the data by hand in notebooks, one client at a time; uploads and triggers the pipeline by hand too; the pipeline builds the indicators, the only automatic part; and validation, which sends the error back to treatment. Between stages, waits for people. Beside it, control on a third-party board updated by hand. Total: about five days](../../assets/posts/2026/esteira-etl-antes.svg)

## Automation first. AI second

The temptation, in 2026, is to start with AI. I started the other way: automate everything that was predictable.

Reading and preparing the data became services, triggered by a call instead of a person. The design separates what changes from what does not: how each client's dataset is read stays at the edges, and the rule that prepares the data stays stable in the middle. A new client becomes a new piece at the edge, not one more `if` in the middle of the rule. (The name for that is hexagonal architecture; the engine is written in Python and runs on Google Cloud.)

AI comes later, helping with what is ambiguous: what a fixed rule does not solve well, because each client describes the same thing a different way. It speeds up the part that used to need a person interpreting the file. What is predictable stays in a fixed rule.

That order matters. AI on top of a manual process only makes the manual process faster at being wrong. AI on top of an automated process solves the leftover that automation cannot reach.

## The operation gained a product

The second move was pulling control out of the third-party tool and bringing it in-house. I built Play Manager, an internal product that became the source of truth for the operation: phase, owner, deadline and health of each dataset, in one place, for the team and for leadership. (Underneath, React 19 and a custom API in [Hono](https://hono.dev) on Firebase, with role-based access control and an AI-assisted insights editor.)

The step that made the difference was taking automation into it. Data preparation started being triggered from the screen itself, instead of someone running a script. Three properties hold that up:

- **Queue.** Each dataset enters a queue instead of competing for attention, and nothing is lost because someone forgot.
- **Retrying does not break things.** Triggering the same stage twice does not duplicate the result. It looks like a detail until someone clicks a button twice, or until a stage fails halfway and needs to be redone. (In engineering, that is called idempotency.)
- **One stage pulls the next.** When a stage finishes, the next one enters the queue on its own. The pipeline moves without someone pushing.

This is where most of the five days disappear. Not because something processes faster, but because the dataset no longer sits waiting for the next person.

## How the pieces connect

![After flow, top to bottom: data intake, in several formats, from each client; Play Manager, with each dataset's card showing phase, owner and deadline; the queues, where each finished stage pulls the next on its own; the data-preparation engine, with a fixed rule for what is predictable, AI only for what is ambiguous and more than 4,800 automated tests; and the ready indicators, in the same pipeline as before. An arrow returns from the indicators to the card, which advances on its own. Result: up to 30 minutes](../../assets/posts/2026/esteira-etl-depois.svg)

Data still arrives in several formats, and almost always goes up through the dataset's own card. From there on, nothing depends on someone remembering: every job enters a queue, each finished stage advances the card and puts the next one in the queue, and a dataset with a problem does not hold the others back. When something leaves the expected path, the card shows an alert instead of freezing the pipeline. **Control is the action showing up only when it can be run**, instead of a lock someone has to clear.

## The deadline became a product rule

A deadline in a spreadsheet is an intention. You discover the delay after it already happened.

In Play Manager, the delivery deadline is a system rule. Each phase has a time budget, and each dataset is classified automatically into one of three situations: **on time**, **at risk** or **late**.

![The pipeline on the card in three phases: 1, prepare the dataset, with the data team; 2, build indicators and report, with the analysts; 3, deliver the report, with the analysts; and done. The owner swaps on its own when the dataset changes phase. Each phase has a time budget, and the card shows on time, at risk or late](../../assets/posts/2026/esteira-etl-etapas.svg)

Each phase has an owner: preparing the dataset belongs to the data team, and from there on it belongs to the analysts. The owner swaps on its own when the dataset changes phase, so nobody has to remember to hand over the baton.

The difference between "at risk" and "late" is the whole point. With it, management sees the delay arriving while there is still time to act, instead of noticing it after the due date. The conversation stops being "why was it late?" and becomes "what we make of this one that is at risk?".

## Where AI can go wrong, tests

A data pipeline has a cruel failure mode: it does not crash, it delivers wrong. A number prepared in a subtly different way passes every stage, reaches the indicator and nobody notices.

That is why speed came together with a test net:

- The preparation engine is backed by more than **4,800 automated tests**. The ones that matter most in a change like this are the ones that compare the before result with the after result, to make sure a change does not alter what should stay the same.
- Two pipelines that already ran in production had **no automated tests**. I wrote 920 tests, took coverage from 0% to **84% and 92%**, and deploy started being blocked whenever the suite failed.

With AI in the middle of the process, that stops being good practice and becomes a requirement. The test is what lets AI help without having to check every output by hand. It applies to the code too: what I wrote with AI went through a test first and through gates before every commit, and I told that flow in [RPI flow with three agents](/en/rpi-flow-with-three-agents).

## The turn without trauma

A new tool often fails for a reason that is not technical: the team has to relearn how to work.

I led the migration by replicating in Play Manager the interaction patterns the team already mastered in the previous tool. Whoever used the old system found the same paths in the new one. The whole portfolio migrated with no divergence that blocked the operation.

It was not the most interesting part technically, but it was one of the ones that weighed most on the result. A better product that nobody adopts cuts no deadline at all.

## What stays

If I had to summarize in three decisions:

1. **Automate before adding AI.** AI solves the ambiguous leftover; what is predictable becomes code.
2. **Take the queue out of people's heads.** Queue, safe retries and one stage pulling the next make the dataset move on its own.
3. **Turn intention into a rule.** Deadline with a budget per phase, deploy blocked when the test fails. What depends on someone remembering ends up forgotten.

The five days did not vanish because a model got smarter. They vanished because the work stopped waiting.

`sys.exit(0)`
