# Learner-Model Map — design note (on-ramp to the AI-tutor-curriculum knowledge map)

**Written:** 2026-06-24. **Status:** Version A (within-session) drafted into SKILL.md today.
Version B (persistent) + continuity eval are tomorrow's milestone — this note is the spec so the
decisions don't evaporate.

## Why this exists

`/teach-me` should maintain a **knowledge-representation map** of the learner relative to the
fixed curriculum, not just walk modules in order. This is a deliberate on-ramp to the broader
`ai-tutor-curriculum` knowledge-map work (the 7-doc canon, the rubber-stamp problem). This skill is
the easy case to prototype the representation in: the curriculum is small (6 tour + 5 principles),
fixed, and already has a known dependency order (`curriculum/README.md`). The *ontology already
exists* — we're tracking a learner against it, not inventing it.

## The three versions (do them in order)

- **A — within-session map (DONE today, prompt-only).** The tutor maintains the structure in
  context as it teaches and shows it (the visible checklist, now with evidence fields). Adapts:
  skips held ground, doubles back on shaky whys. Dies at session end. No new files, no eval change.
- **B — persistent map (TOMORROW).** Same structure, written to a git-ignored path at session end,
  read at session start. Survives sessions: "last time the attention-bottleneck *why* was shaky —
  let's re-check before moving on." Needs a write seam + a schema.
- **C — continuity eval (after B).** A persistent map only proves its worth ACROSS sessions, which
  `tutor-spec.md` (single-transcript) structurally cannot judge. Needs a two-session harness run:
  session 1 writes the map, session 2 reads it and is graded on whether it USED it.

## The map: unit, states, evidence

**Coordinate system:** the 11 fixed modules (tour 01–06, principles 01–05), in their README order.

**Per-module node:**
| field | values | source |
|-------|--------|--------|
| `status` | `untouched` / `shaky` / `ticked` | updated as evidence arrives |
| `prior` | free text — what they believed at restate-first | captured before teaching |
| `gap` | free text — the specific misunderstanding the quiz/explanation exposed | during the module |
| `why_demonstrated` | bool — did they explain the *why* in their own words | the gate |
| `quiz_passed` | bool | the gate |
| `transfer_connected` | bool — did they point to it in their OWN work | the rubber-stamp test |
| `notes` | free text — anything worth resuming on | end of module |

**The load-bearing field is `transfer_connected`.** A correct quiz with a flat transfer is the
rubber-stamp failure: passed the gate, doesn't own the concept. The map is where that distinction
gets RECORDED instead of evaporating. A node is only truly `ticked` when why + quiz + transfer all hold.

**Open design question (decide tomorrow):** binary states vs. a confidence gradient (0–1) per node.
Binary is simpler and matches the current tick-gate; a gradient captures "shaky but improving" and
is closer to what the bigger curriculum will need. Recommend: keep `status` 3-valued for the skill,
but record the underlying booleans so a gradient can be derived later without re-instrumenting.

## Version B — the two real costs

1. **Write seam (collides with the READONLY convention).** Eval agents are strictly read-only and
   the skill has never written files. B means the *tutor* writes state at session end. Decisions:
   - **Where:** git-ignored, per-learner. Proposal: `.claude/learner-model.json` (machine-read/written)
     with an optional `progress.md` human-readable mirror. Add to `.gitignore` alongside the existing
     "per-user local state" block — it fits that convention, doesn't fight it.
   - **Format:** JSON for the machine state (clean to read/diff/validate); the skill may also render a
     markdown view for the learner. If both exist, **generate the .md from the .json — don't sync two
     hand-maintained files** (Principle 06, generate-don't-sync; a hand-synced pair is the anti-pattern).
   - **Eval impact:** the harness must either (a) run the real skill which now writes, in a scratch
     dir, or (b) keep eval agents read-only and have the harness itself persist a simulated map. Lean (a):
     test the real artifact, isolate the write to a temp path so the repo under test stays clean.
2. **Single-transcript eval can't see continuity.** `tutor-spec.md` grades one session. B's value is
   cross-session. → Version C below.

## Version C — continuity eval (after B works)

New eval dimension the current spec doesn't have. Shape:
- Run session 1 (persona learns modules 1–3, leaves module 2's *why* deliberately shaky via a probe).
- Persist the map.
- Run session 2 with the SAME persona + the written map present.
- Judge: did session 2 (i) read the map, (ii) re-check the shaky node before advancing, (iii) NOT
  re-teach already-ticked modules from scratch? Add as a new criterion cluster (call it **G —
  continuity**) to `tutor-spec.md`, or a sibling `tutor-spec-continuity.md`.
- New persona/probe likely needed: a `returning-learner` probe that seeds a prior map.

## Sequencing decision (2026-06-24)

- **Tonight:** the `/goal` loop stays aimed ONLY at C1/C2/D1 against the single-session spec. Version A
  is in the skill but the loop is NOT asked to optimize it (no eval criterion for it yet) — it's a
  free improvement that shouldn't muddy what the loop converges on.
- **Tomorrow:** build B (write seam + schema + `.gitignore` entry), then C (continuity eval). THEN a
  goal loop can target continuity.

## Don't-forget

- The map is **per-learner and local** — never committed back to the shared starter repo.
- `transfer_connected` is the field that earns its keep; protect it from degrading into "quiz passed."
- This prototype's job is to surface the bigger curriculum's representation questions in miniature
  (unit of knowledge, states, evidence→update rule) where 11 fixed modules make them observable.
