# Module 3: Context

## The model has no memory — only what's in front of it

Here's the fact that explains the most confusing agent behavior: **the model has no memory
between turns.** Each time it generates a response, it sees one big block of text and
predicts from that. Everything it "knows" right now is in that block. Nothing else exists
to it.

That block is the **context** (or *context window*). It's the single most important concept
in this tour, because almost every other part of Claude Code is really a way of *getting the
right text into the context.*

## What's in it

By the time the model generates a reply, the context holds, roughly:

```
┌─────────────────────────────────────────────┐
│ system prompt            (Module 2)          │
│ CLAUDE.md                (Module 4)          │
│ the conversation so far  (your turns + its)  │
│ tool results             (files it read,     │
│                           command output)    │
│ loaded skills, memory, … (Module 6)          │
└─────────────────────────────────────────────┘
                  ↓
            the model reads ALL of this,
            then predicts the next reply
```

When the agent "knows" your data schema, it's because the schema is sitting in the context —
either CLAUDE.md pointed at it or the agent read the file this session. When it "doesn't
know" something, it's almost always because that something isn't in the context.

## It's finite, and it fills up

The context window has a size limit. A long session — lots of files read, lots of command
output, lots of back-and-forth — fills it up. When it gets close to full, the harness
**compacts**: it summarizes the older parts of the conversation to make room, keeping your
requests and the important bits, dropping the verbatim noise.

Two practical consequences:

1. **Context is a budget, not infinite scrollback.** Dumping a 10,000-line log into the
   chat costs you room the model could have used for actual reasoning. What you let into
   context is a choice.
2. **After compaction, detail can be lost.** If the agent seems to "forget" something from
   an hour ago, it may have been summarized away. Re-state it, or — better — put durable
   facts somewhere that reloads every session (that's Module 4).

## Why this reframes everything

Once you see the agent as "a model reasoning over whatever text is currently in its
context," a lot of advice stops being folklore and becomes obvious:

- *Why does CLAUDE.md help?* It puts your project into context automatically, every session.
- *Why split work across terminals?* Separate sessions, separate contexts — no cross-talk.
- *Why does the agent miss the obvious file?* It was never read, so it's not in context.

You're not managing an AI's mind. You're managing what's in the window.

## Check yourself

- The agent answers a question wrong about a file you never opened this session. In
  context-terms, what went wrong?
- What does "compaction" do, and why might the agent seem to forget something from earlier
  in a long session?
- Why is pasting a giant log into the chat not free, even if it fits?
