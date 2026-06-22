# Module 4: CLAUDE.md

## Your slice of the context

Module 3 said: the agent only knows what's in its context, and the context resets every
session. So how do you stop re-explaining your project every single morning?

**CLAUDE.md.** It's a plain markdown file you put in your project, and the harness reads it
into the context automatically at the start of every session in that directory. It's the
first piece of the machine that's *yours to write* — the system prompt is Anthropic's,
the conversation is whatever you both say, but CLAUDE.md is the context you author on
purpose.

## See it in this repo

This project has one. Open `CLAUDE.md` in the repo root — it's short. It says what the
project is, where the data and analysis live, and what the current question is. That's why,
when you open Claude Code here and ask "what does this project do?", it already knows: the
file was in the context before you typed.

That file is also why the agent knew about *this curriculum* and the `/teach-me` skill.

## Where CLAUDE.md can live

There are three levels, and they stack:

```
~/.claude/CLAUDE.md        → applies to ALL your projects (your personal defaults)
<repo>/CLAUDE.md           → this project (loads every session here)
<repo>/data/CLAUDE.md      → just this subdirectory (loads when work is in data/)
```

A `data/CLAUDE.md` saying "these are TSVs, not CSVs, and they're read-only" only shows up
when the agent is working in `data/`. Scope the context to where it's relevant.

## Config vs. context — a common mix-up

CLAUDE.md is **not** a settings file. It doesn't *configure* the harness; it's just text
the model reads, the same way it reads your messages. There's a separate `settings.json`
for actual configuration (permissions, hooks — Module 6). A good test:

- "I want the agent to *know* X about my project" → CLAUDE.md (it's context).
- "I want something to *happen automatically* every time" → settings/hooks (it's config).

## This is only the introduction

You now know *what* CLAUDE.md is and *where* it lives. There's a craft to writing a *good*
one — what to put in, what to leave out, why pointing at a file beats pasting its contents.
That's the **[Principles track, Module 3: The Index That Points](../../principles/03-index-that-points.md)**.
For the tour, this is enough: it's the file you write to load your project into context,
every session, for free.

## Check yourself

- CLAUDE.md and the chat both end up as text in the context. So what's the point of
  CLAUDE.md — what does it give you that just telling the agent each session doesn't?
- You're working in `analysis/` and want a rule that *only* applies there. Where does it go?
- Is CLAUDE.md a config file? If you wanted the agent to *do* something automatically every
  session, would CLAUDE.md be the right place? Why or why not?
