# Module 2: The System Prompt

## The model doesn't know it's an agent

A raw model predicts text. It has no idea it's "Claude Code," that it has tools, that it's
allowed to edit files, or that it should work in turns with a human. Something has to *tell*
it all that — before you ever type a word.

That something is the **system prompt**.

## What it is

The system prompt is a block of instructions the harness puts at the very front of the
text the model sees, every session. It's where the model is told:

- **its role** — "you are an agent that helps with software engineering tasks,"
- **what tools exist** and how to call them,
- **the environment** — what OS, what working directory, today's date,
- **how to behave** — be concise, confirm before risky actions, follow the project's rules.

That's what turns "a model that predicts text" into "an agent that gets things done." The
agent-ness isn't in the model's weights; it's largely *instructions*, delivered fresh each
session.

## The one thing to internalize: you don't write it

The system prompt is written and maintained by Anthropic, and it changes as Claude Code
gets updated. You generally **never see it and never edit it.** This matters because it
draws the line for the rest of the tour:

> The **system prompt** is how *Anthropic* configures the agent.
> **CLAUDE.md, skills, and hooks** (coming up) are how *you* configure the agent.

When you want to change how your agent behaves, you don't go looking for the system prompt —
you reach for the parts that are yours. Knowing the system prompt exists is enough; knowing
it's *not your lever* is the actual lesson.

## A useful mental picture

Think of starting a session as the harness assembling a stack of text for the model:

```
┌──────────────────────────────┐
│ SYSTEM PROMPT  (Anthropic's)  │  ← role, tools, environment, behavior
├──────────────────────────────┤
│ CLAUDE.md      (yours)        │  ← your project's context   (Module 4)
├──────────────────────────────┤
│ the conversation so far       │  ← grows as you talk        (Module 3)
└──────────────────────────────┘
```

All of it is just text going into the model. The system prompt is the layer you inherit;
everything below it is the layer you own.

## Check yourself

- What does the system prompt give the model that a raw "predict the next word" model
  doesn't have? Name two.
- Who writes the system prompt, and what does that tell you about where to make changes when
  you want *your* agent to behave differently?
