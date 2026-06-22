# Module 1: The Model and the Harness

## Start at the bottom

Underneath everything is a **large language model** — a Claude model (Opus, Sonnet,
Haiku). On its own, a model does exactly one thing: given some text, it predicts what text
comes next. That's it. It can't open a file, run a command, or remember yesterday. It's a
very good guesser about language, and nothing more.

So how does that become a thing that edits your code, runs your tests, and picks up where
it left off this morning?

## The harness

**Claude Code is a *harness* wrapped around the model.** The harness is everything that
isn't the model itself: it feeds the model text, reads the model's output, and — crucially
— when the model says "I'd like to read `data/trials.tsv`," the harness actually goes and
reads the file, then hands the contents back to the model as more text.

```
        ┌─────────────────────────────────────────┐
        │  HARNESS (Claude Code)                    │
        │   • assembles the text the model sees     │
        │   • runs the tools the model asks for     │
        │   • manages the session, the turns        │
        │   ┌───────────────────────────────────┐   │
        │   │  MODEL  (a Claude LLM)            │   │
        │   │   text in  →  text out            │   │
        │   └───────────────────────────────────┘   │
        └─────────────────────────────────────────┘
```

The model is the engine. The harness is the car — the wheels, the steering, the dashboard.
You don't drive an engine; you drive a car. **Almost everything you'll learn in this tour
is part of the harness, not the model.** CLAUDE.md, tools, sessions, hooks — the harness.

## Why this distinction is the whole foundation

People say "the AI did X" or "the AI forgot Y." Usually the interesting part wasn't the
model at all — it was the harness. The model didn't "remember" your project; the harness
fed it your `CLAUDE.md`. The model didn't "decide to run the tests"; it emitted a request,
and the harness ran them. Keep asking *"model, or harness?"* and Claude Code stops being
magic and starts being a system you can reason about — and configure.

It also tells you where your leverage is. You can't reach into the model's weights. You
*can* shape almost everything the harness does. That's the rest of this tour.

## Check yourself

- The model can only turn text into more text. Name two things "Claude Code" does that the
  model itself cannot — and say who actually does them.
- "Claude remembered my project from yesterday." Model, or harness? What actually happened?
