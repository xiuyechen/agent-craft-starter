# Module 6: Sessions, Turns, Hooks — and the Extras

We've built the agent from the bottom up: a model (1), wrapped in a harness that gives it a
system prompt (2), a context (3) you shape with CLAUDE.md (4), and tools to act with (5).
This last module is the part you actually touch: **the dialogue, and what you can wire into
it.**

## Sessions and turns

A **session** is one continuous dialogue with the agent, tied to a directory. It has a
single context (Module 3) that grows as you talk. Open Claude Code in a folder, you start a
session; the conversation accumulates until you end it.

A session proceeds in **turns**, like a conversation:

```
you speak → agent works (thinks, calls tools, replies) → you speak → …
```

Within its turn the agent might call many tools and do a lot; then control comes back to
you. Two sessions in two directories have two separate contexts — which is why opening one
terminal in `data/` and one in `analysis/` keeps their work from bleeding together.

## The gaps between turns: hooks

Here's the part that surprises people. The harness lets you run **your own code at fixed
moments** in a session's life — *whether or not the model wants to.* These are **hooks**.
They fire on events like:

- **before each prompt** is sent (`UserPromptSubmit`),
- **before a tool runs** (`PreToolUse`) — you can inspect or block it,
- **after a tool runs** (`PostToolUse`) — e.g. auto-format any file just edited,
- **when the agent stops** (`Stop`), **when a session starts** (`SessionStart`), and more.

Hooks are configured in **`settings.json`**, and — critically — **the harness runs them,
not the model.** That's the difference between a wish and a guarantee:

> Asking the agent in CLAUDE.md "please run the linter after editing" is an *intention* —
> the model might forget. A `PostToolUse` hook that runs the linter is a *mechanism* — it
> happens every time, deterministically.

(If that "intention vs. mechanism" framing rings a bell, good — it's the entire spine of the
[Principles track](../../principles/). Hooks are where the harness hands you the tool to
turn intentions into mechanisms.)

## The extras (bells and whistles)

On top of the core, Claude Code layers conveniences. You don't need to master these now —
just recognize the names:

- **Slash commands / skills** — reusable capabilities you invoke with `/name` (or the agent
  invokes when relevant). This repo's **`/teach-me`** is one: a markdown skill that turns
  the agent into a tutor for this curriculum. Skills load into context *on demand*, so they
  don't cost you context until used.
- **Memory** — facts that persist across sessions and get injected into context at startup.
  CLAUDE.md is the kind *you* write; there's also memory the agent maintains itself. Either
  way, the trick is the same one from Module 3: get durable facts back into the context for
  free.
- **Subagents** — the agent can spawn a *separate* agent with its *own* fresh context to go
  do a focused job and report back, without cluttering the main session's context.
- **Permissions** — also in `settings.json`: which tools run freely, which need your
  "allow?" confirmation.

Notice the through-line: nearly every extra is, underneath, a way of **managing the context**
or **wiring the turns**. Same two levers, dressed up.

## The whole machine, in one view

```
SESSION (one dialogue, one context, tied to a directory)
│
├─ turn → turn → turn …            you and the agent take turns
│         each turn: model reasons over the CONTEXT, calls TOOLS, replies
│
├─ the CONTEXT each turn holds:
│     SYSTEM PROMPT (Anthropic's) + CLAUDE.md (yours) + conversation + tool results + skills/memory
│
└─ HOOKS fire at fixed moments (settings.json) — run by the harness, guaranteed
```

That's the anatomy. You now speak the language. The [Principles track](../../principles/)
teaches you to use it well — and you'll find every principle there is really a statement
about one of these parts.

## Check yourself

- What's the difference between a *session* and a *turn*?
- You want a check to run *every* time the agent edits a file, with no chance the model
  forgets. CLAUDE.md note, or a hook? Why — and who runs each?
- Pick any "extra" (skills, memory, subagents). In one sentence, how is it really just
  managing the context or wiring the turns?
