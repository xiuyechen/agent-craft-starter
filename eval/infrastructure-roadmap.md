# /teach-me — infrastructure roadmap & migration decision points

**Written:** 2026-06-25. **Question this answers:** at what point does "markdown + small Python scripts
in a git repo" stop being adequate and become a liability — and how do we SEE that boundary coming
instead of hitting it under load? Companion to `mechanism-redesign.md` (the *what*) — this is the
*on-what-substrate, and when-to-change-it*.

## The fork: two futures, and only one of them migrates

Before any roadmap: **decide which thing you're building, because the answer flips the whole plan.**

- **Future A — the teaching artifact.** The skill exists to *demonstrate* "mechanisms over intentions"
  to PIs/labs who clone the repo. The plumbing IS the lesson: a person reading `tick.py` and
  `path.json` learns the principle from the mechanism being legible. Here, **files-in-git is not a
  prototype — it is arguably the correct END STATE.** Migrating to a database would *hide* the
  mechanism behind an API and make the artifact worse. Scale need: ~1 student (the reader), maybe a
  workshop cohort each on their own clone.
- **Future B — the actual tutoring product.** The skill is the seed of a system that tutors many real
  students over time, where someone other than the learner needs to see progress (an instructor
  dashboard, a cohort view, longitudinal data). Here files-in-git is a genuine prototype and WILL
  need to migrate. Scale need: many students, concurrent, queried across.

**Most of the value of this doc is forcing that choice early.** A huge amount of wasted engineering
comes from building Future B's infrastructure for a Future A goal. Default assumption unless decided
otherwise: **we are building Future A**, and we only move toward B when a concrete pull (below)
appears. Mark the moment that pull appears — don't pre-build for it.

## The substrate ladder (rungs, cheapest first)

Each rung is adequate until a specific signal says it isn't. Stay on the lowest rung that holds.

**Rung 0 — in-context only (where we were before M1).** State lives in the conversation. No trace.
*Adequate for:* nothing we want — this is the "vibes" failure the paper trail exists to kill.
→ leave immediately (that's M1).

**Rung 1 — flat files in the repo (WHERE WE ARE GOING NOW).** `learners/<student>/path.json`,
generated `progress.md`, appended `sessions/<date>.md`. Scripts (`tick.py`, `quiz_prep.py`) read/write
them. Git is the history/versioning layer for free.
*Adequate for:* one student per clone; a workshop cohort each on their own clone; full single-student
paper trail; demonstrating the principle. **This is the correct end state for Future A.**
*Becomes a liability when →* see Decision Point 1.

**Rung 2 — structured local files + a schema (SQLite or JSON-schema-validated files).** Same machine,
but state is in one queryable place with a validated shape. SQLite buys: queries across students,
transactions (no half-written JSON), concurrent-safe reads.
*Adequate for:* one instructor tracking a handful of students on one machine; "show me everyone's
progress" becoming a real question; state shape stabilizing enough to be worth enforcing.
*Becomes a liability when →* Decision Point 2.

**Rung 3 — a real database + a service (Postgres + an API).** State is server-side, multi-user,
concurrent, backed up, access-controlled.
*Adequate for:* many students at once, an instructor dashboard, students on different machines, data
that must outlive any one repo clone. This is Future B's home.
*Becomes a liability when →* you're past prototype; normal product scaling, out of this doc's scope.

## Decision points — the SIGNALS that mean "climb a rung" (not a calendar)

Each is a concrete, observable trigger. When you see it, the migration is a *choice you saw coming*.
Until you see it, climbing is premature infrastructure.

**DP-1 — Rung 1 → Rung 2. Climb when ANY of:**
- You need to answer "**how are all my students doing?**" — i.e. a query ACROSS learner files, not
  within one. (grep-ing N json files is the smell.)
- Two processes write the same learner file (concurrent sessions, or a session + a batch job) and you
  get a **corrupted/half-written JSON**. Transactions become worth it.
- The state shape has **changed under you twice** and a malformed `path.json` silently broke a tick —
  you now want a schema that *rejects* bad state rather than trusting the writer.
- `path.json` files are **big enough that re-reading/re-writing the whole file per quiz is slow** (you
  feel the latency). Unlikely at student scale, but it's a clean signal.
*If none of these is true, STAY ON RUNG 1.* "It would be cleaner in a DB" is not a signal — it's the
build reflex. (The CLAUDE.md "Look Before You Build" rule applies to ourselves here.)

**DP-2 — Rung 2 → Rung 3. Climb when ANY of:**
- **Someone who is not the learner needs live access** to progress (instructor dashboard, cohort
  view) — i.e. the data must leave the learner's machine.
- **Multiple students concurrently**, not one-at-a-time on one machine.
- Data must be **backed up / audited / access-controlled** beyond what git on one laptop gives (FERPA
  enters here if these are real Yale students — that's a hard gate, see below).
- You need **uptime / it's a service people depend on**, not a tool someone runs.
*This is the Future-A → Future-B border.* Crossing it is committing to product engineering. Do it
deliberately, ideally with the prototype's file format as the seed of the schema (Rung 1/2 JSON →
Rung 3 tables is a clean migration if the shape was validated at Rung 2).

**DP-0 — the FERPA gate (overrides everything).** The moment real identifiable student data from a
Yale course touches this, the substrate question is no longer "what's convenient" — it's "what's
compliant." Per the repo's own teaching-index FERPA note, student data has location rules. **If this
ever tutors real enrolled students with real names/grades, you are NOT on the file-ladder anymore —
you are in a system with a compliance boundary, jump straight to a vetted Rung 3.** Until then,
synthetic/self/workshop-volunteer data only, and say so.

## What to build now, and what to explicitly NOT build

**Build now (Rung 1):**
- `learners/<student>/path.json` — the M1 state objects, persisted (this is M1 "Version B").
- `progress.md` — GENERATED from `path.json` (Principle 06, generate-don't-sync; never hand-edited).
- `sessions/<date>.md` — appended per session; the paper trail.
- `tick.py` already computes ticks from state (done). Add a `--write` path that persists, or keep
  writes in the skill and `tick.py` pure — decide when wiring.
- `.gitignore` `learners/` (per-student, local, not committed to the shared starter; and a step toward
  the FERPA posture — don't commit student traces).

**Do NOT build now (and mark WHY, so it's a decision not an oversight):**
- ❌ A database. No DP-1 signal yet. Files + git are the right Rung-1 substrate.
- ❌ An API / service. No DP-2 signal — no non-learner consumer exists.
- ❌ Auth / multi-user. One learner per clone.
- ❌ A schema-validation layer. Build it at DP-1's "shape changed twice" signal, not before — premature
  schema is as much a trap as premature DB.
- ❌ A migration script Rung1→Rung2. Write it WHEN you climb, against the real shape, not speculatively.

## How this pairs with the mechanism redesign

The mechanism axis (intention→mechanism) and the substrate axis (files→DB) are independent — don't
conflate them. **A mechanism can live at any rung.** `tick.py` is a real mechanism on Rung 1 (files);
it would still be a mechanism as a stored procedure on Rung 3. So: build the *mechanisms* now (M1,
then M2) on Rung 1, and climb the *substrate* ladder only on the signals above. We get disciplined
gating long before we need a database — which is the whole point of doing it on cheap infrastructure
first.

## Roadmap summary (the one-screen version)

| Now | M1 on Rung 1: persist state to files, generate the checklist, paper trail. (THIS sprint.) |
| Next | M2 clean-room sub-agents (author + grade) on Rung 1. Still files. |
| Then | Canonical-vs-adaptive split + per-module mastery bars (still files). |
| DP-1 | Climb to SQLite/schema IFF a cross-student query or a write-corruption appears. |
| DP-2 | Climb to Postgres+API IFF a non-learner consumer or concurrency or backup need appears. |
| DP-0 | FERPA: real student data → jump to vetted Rung 3, no exceptions. |

**Default posture: assume Future A (files are the end state) until a DP signal proves otherwise. Mark
the signal when it appears; do not pre-build for it.**
