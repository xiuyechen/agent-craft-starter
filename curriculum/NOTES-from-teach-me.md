# Notes from a /teach-me session — 2026-06-18

Record of a completed tutoring pass through the curriculum, plus one revision to make
in a later session. (Repo revision deferred to a future session.)

## Status: curriculum completed (verified)

Sue worked through all four modules via `/teach-me`, mastery-gated — each module
demonstrated by restating it back and passing a gating quiz, not just read.

- **01 — Attention Bottleneck.** The constraint is your attention, not the AI's
  capability. Agents are reactive; they won't volunteer the step back. Fix: build the
  prompt into the environment.
- **02 — Scope Ratio.** Too-big task → rearranged snow, not removed. It's the ratio of
  agent scope to task scope; the nearby edge vanishes. Fix: shrink the task (decompose)
  or grow the shovel (orchestrate) — human supplies the direction either way.
- **03 — Index That Points.** CLAUDE.md is an index for the agent, not a README for
  humans. Point, don't duplicate (duplication → stale-sync). Freeform; scopable to
  subdirs.
- **04 — Monitor Outcomes, Not Actions.** Action success ≠ outcome true (push-to-wrong-
  branch). Error handling only catches failures, not wrong-success. Check the state of
  the world; grade in a clean room (checker ≠ worker).
- **Spine:** mechanisms over intentions — each module replaces a "remember / be careful /
  trust the report" with a structure that makes the failure hard.

## Revision — DONE (2026-06-21)

**The CLAUDE.md forward-reference is fixed, and the fix turned out to be structural.**
Rather than just gloss it, we added a whole second track that introduces CLAUDE.md (and the
rest of the machine) *before* the principles use it.

The curriculum is now **two tracks**, done in order (see `curriculum/README.md`):

1. **`tour/` — "Anatomy of Claude Code"** (NEW, 6 modules): a structural crash-course in the
   parts — model+harness, system prompt, context, CLAUDE.md, tools/MCP, sessions/turns/hooks.
   Bottom-up; each part sits on the previous. Descriptive, not principled. Structural facts
   verified against the live Claude Code docs via the claude-code-guide agent.
2. **`principles/` — "Agent Craft"** (the original 4 modules, moved here): mechanisms over
   intentions. Module 1's CLAUDE.md line now carries a gloss pointing at the tour + Module 3.

Rationale for tour-first (Sue's call): you can't internalize "CLAUDE.md is an index that
points" until you know what CLAUDE.md *is*. The tour gives vocabulary; the principles give
judgment. Each principle is really a statement about a part the tour introduced — the
`/teach-me` skill ends with a bridge question that makes students connect the two.

Also rewired to match: top-level `curriculum/README.md` (new two-track map), the `teach-me`
skill (now track-aware: asks which track, teaches tour-first, why-before-what adapted per
track, synthesis + bridge at the end), root `CLAUDE.md`, `README.md`, `HOMEWORK.md` (new
"Part 0 — Take the tour" before the hands-on parts).
