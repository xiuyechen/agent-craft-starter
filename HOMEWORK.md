# Homework: Agent Craft

> **Never used Claude Code (or a terminal)?** Do the **[setup
> guide](https://xiuyechen.github.io/agent-craft-starter/setup-guide.html)** first — it walks
> you from nothing installed to the tutor running, on Mac or Windows, with a check at every
> step. Then come back here. If `git clone` and `claude --version` are already familiar, skip it.

This is not "write code that does X" homework — the agent makes that trivial, and it
wouldn't teach you anything. This homework builds three things: a **mental map of what
Claude Code actually is** (its parts), a **working agent setup you'll actually use**, and
**five mental models** for when the agent goes wrong. The deliverable is your own
understanding plus a setup you keep.

Estimated time: **60–75 min.** Do it before Session 2 if you can.

---

## Part 0 — Take the tour (~15 min)

Before the hands-on parts, get the vocabulary. In a Claude Code terminal **inside this
repo**, run `/teach-me` and ask for the **Anatomy of Claude Code** track — six short
modules on the parts of the machine: the model and the harness, the system prompt, context,
CLAUDE.md, tools, and sessions/turns/hooks. It quizzes you until you can explain each part
back.

**Done when:** you can say, for each part, what problem it solves and whether it's something
*you* control or something Anthropic ships. (This is the tour in `curriculum/tour/`.)

> Why first: Parts A and B below both refer to these parts by name. Take the tour and the
> rest of the homework stops being jargon.

---

## Part A — Set up your workspace (~20 min)

The goal: stop using AI in a single chat window that forgets your project every time.
Persistent context lives in a *file in your repo*, not in your memory of the conversation.

### Level 1 — One CLAUDE.md (10 min)
1. Open your *own* main project in VS Code (or this repo if you don't have one yet).
2. Create a `CLAUDE.md` at the project root.
3. Write 3–5 lines: what the project is, language/framework, any conventions
   (e.g. "raw data is read-only in `/nfs/...`, never overwrite it; processed data → `results/`").
4. Open a Claude Code terminal in that directory (`claude`).
5. Ask: **"what do you know about this project?"** — it should reference your CLAUDE.md.

**Checkpoint:** Claude answers using your CLAUDE.md, not a generic guess.

### Level 2 — Scoped context with subdirectories (10 min)
1. Pick two subdirectories (e.g. `data/` and `analysis/`).
2. Add a `CLAUDE.md` to one with a *specific* instruction ("data files are TSV, not CSV"
   or "always use conda env `ppc`").
3. Open two terminals — one `cd`'d into each subdirectory — and run `claude` in both.
4. Ask both the same question. Notice the different context.

**Checkpoint:** the terminal in the folder with its own CLAUDE.md gives a more specific answer.

> This *is* CLAUDE.md from the tour (Anatomy 04) and the "index that points" principle
> (Principles 03). You're not reading about the mechanism — you're building it.

---

## Part B — Learn the five mechanisms (~25 min)

1. In a Claude Code terminal **inside this repo**, run:
   ```
   /teach-me
   ```
   and ask for the **Agent Craft principles** track (you did the Anatomy tour in Part 0).
2. It tutors you through `curriculum/principles/` — five short modules. It will **quiz you**
   and won't advance until you can explain each one back. That's deliberate: the point is
   verified understanding, not "I read it."
3. For each module, the tutor will ask the transfer question: **"where does this failure
   show up in your own lab work?"** Have a real answer ready — that's where the learning
   actually sticks.

The five mechanisms:
| # | Mechanism (one line) |
|---|----------------------|
| 1 | The limit is your attention to direct the AI, not the AI's capability. |
| 2 | Too-big a task → the agent rearranges the mess instead of removing it. Decompose or orchestrate. |
| 3 | A `CLAUDE.md` that points at your files beats re-explaining your project every session. |
| 4 | "The command succeeded" ≠ "the thing I wanted is true." Check the world, not the exit code. |
| 5 | A rule in `CLAUDE.md` is an intention; a deny-list + hook is a wall. For irreversible loss, build the wall. |

**Done when:** you can state all five in one sentence each, *and* you've named a real
example of each from your own work.

> Module 5 is live in this repo. This starter ships a real guardrail: `.claude/settings.json`
> blocks `rm`, and `.claude/hooks/guard.sh` refuses to let the agent delete files to free a
> full disk (the failure that ate someone's weekend sweep). It uses `trash` instead — install
> it once so the recoverable path works: `brew install trash` (macOS) or
> `pip install trash-cli` (Linux). Try it: ask the agent to `rm` something and watch it get
> blocked.

---

## A note on how this feels

Some people feel uneasy using AI for coding — it can change what made the work satisfying,
and you may swing between "it's so smart" and "then why do I feel dumb." That's normal and
worth naming. A useful split: separate **what's personally important to you to do yourself**
from **what just needs to get done.** The agent is for the second pile. The five mechanisms
are how you stay in control of both piles instead of being managed by the tool. Bring this
to Session 2 — it's part of the discussion, not a side issue.
