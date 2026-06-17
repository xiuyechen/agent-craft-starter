# Module 1: The Attention Bottleneck

## The story

A research team was writing a paper and cited ~30 references. The workflow was: search →
read the abstracts → summarize. The obvious next step — *download and actually read the
full PDFs* — never happened. Not because the AI couldn't (it could), but because nobody
asked. The tool existed, the capability existed, the need existed. The connection was
never made, because the human's attention was elsewhere.

## The insight

The bottleneck in working with an AI agent is **not the AI's capability. It's your
attention for directing it.**

```
AI capability:   [========================] very wide
Your attention:  [====]                     narrow at any moment
What happens:    [====]                     only where you point
```

The agent flows like water — wherever you direct it. Unexplored directions stay
unexplored. It will not pause mid-task to say "hey, should we reconsider step 2?"

## Why it happens

- Agents are **reactive by default** — they solve what's in front of them, they don't
  audit your whole workflow for gaps.
- You assume the AI will flag the important thing; the AI assumes you'll ask for it.
- Task momentum creates tunnel vision. Deep in step 5, you don't revisit step 2.

## What to do about it (the mechanism)

You can't fix a bottleneck by trying harder to pay attention — attention is the scarce
thing. Instead, **build the prompt into the environment** so the agent surfaces gaps
without you remembering to ask. The crudest version: a line in your `CLAUDE.md` that says
*"at natural stopping points, name one thing we haven't explored."* That's a mechanism.
"I'll remember to think broadly" is an intention, and intentions are exactly what the
bottleneck eats.

## Check yourself

- Why doesn't a capable agent just *tell* you about the better approach?
- What's the difference between widening the AI's capability and widening your attention —
  which one is actually the constraint?
