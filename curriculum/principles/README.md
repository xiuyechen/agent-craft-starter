# Principles — Agent Craft

The second of the two tracks in this repo. Do the **[Anatomy of Claude Code](../tour/)**
tour first — it teaches you *what the parts are*. This track teaches you *how to wield them
well*. (You can read these modules, but reading isn't the test — run `/teach-me` and let it
quiz you until you can explain each one back.)

Spine: **mechanisms over intentions.** A good intention ("I'll be careful") is not a
mechanism. A mechanism is something that makes the failure structurally hard. Every
module is one mechanism.

| Module | One line |
|--------|----------|
| `01-attention-bottleneck.md` | The limit isn't the AI's capability — it's your attention to direct it. |
| `02-scope-ratio.md` | Point an agent at too big a task and it rearranges the mess instead of removing it. |
| `03-index-that-points.md` | A `CLAUDE.md` that points at your files beats re-explaining your project every session. |
| `04-monitor-outcomes.md` | "The command succeeded" is not "the thing I wanted is true." Check the world, not the exit code. |
| `05-guardrails-not-good-behavior.md` | A rule in `CLAUDE.md` is an intention. A deny-list and a hook are a wall. For irreversible loss, build the wall. |

Order matters for the first two (they're the *why*); 03 and 04 are the two mechanisms
you'll use on day one. 05 is the spine in its purest form — and it's *live in this repo*:
`.claude/settings.json` plus `.claude/hooks/guard.sh` actually block `rm` and refuse to let
an agent delete its way out of a full disk. Each module names a part of the machine — and
now that you've taken the tour, those names already mean something.

*Condensed from the full 8-lesson Agent Craft curriculum for a first, beginner session.*
