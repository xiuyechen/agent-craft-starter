# Anatomy of Claude Code

The first of the two tracks in this repo, and the one to do first. It's a **structural
tour** — a crash course in the parts of Claude Code, the way a tourist learns enough of a
language to get around before the trip. The goal isn't mastery; it's that the words start
to mean something. After this, the [Principles](../principles/) track (mechanisms over
intentions) teaches you to *wield* these parts well.

We take the machine apart one piece at a time, from the bottom up. Each piece sits on the
ones before it.

| Module | The part | One line |
|--------|----------|----------|
| `01-the-model-and-the-harness.md` | LLM + harness | Underneath is a Claude model. Claude Code is the harness that turns it into an agent. |
| `02-the-system-prompt.md` | System prompt | The hidden instructions that make the model *act* like an agent. You don't write these. |
| `03-context.md` | Context window | Everything the model can see this turn. Finite, and it fills up. |
| `04-claude-md.md` | CLAUDE.md | The file *you* write that the agent auto-reads every session. Your context, on purpose. |
| `05-tools.md` | Tools (+ MCP) | What lets the agent *do* things — read files, run commands, reach the world — instead of only predicting text. |
| `06-sessions-turns-hooks.md` | Sessions, turns, hooks, extras | The dialogue you actually have, and what you can wire into the gaps between turns. |

Read them in order — later modules lean on earlier ones. Or, better, run `/teach-me` and
let it tutor you through the track and quiz you until each part sticks.

*A note on accuracy:* Claude Code changes fast. This tour aims for the durable shape — the
parts and how they fit — not the exact menu of flags. When a detail here disagrees with
the live docs, the docs win.
