# /teach-me redesign — mechanisms where failure is fatal, intentions where judgment is the point

**Written:** 2026-06-25, after the 6-round C2 loop. **Status:** design, not yet built.
**Companion docs:** `eval/learner-model-design.md` (the state-object turns out to BE this redesign's
core mechanism), `eval/HANDOVER.md` (the C2 finding this generalizes).

## What the loop actually taught us

We spent ~4.5M tokens making ONE behavior (C2, answer-position) bind. The fix that worked was not
"write a script" — it was: **create an artifact the agent must route its action through, where the
artifact, not the agent's judgment, determines the outcome.** The agent ran the script for two
rounds and *still* failed, because the script's output was advisory; it only bound once the agent
*could not render a quiz any other way* than by pasting the script's output.

That is Principle 05 ("guardrails, not good behavior") stated precisely:

> A guardrail the agent can route around is just an intention with a script next to it. A mechanism
> is a structure where the wrong action is not available, not merely discouraged.

**The uncomfortable corollary:** C2 was the only behavior we mechanized. Every other gating behavior
in the skill is still an intention — a paragraph asking the model to be good. And the eval has been
showing us this the whole time, in the regression signatures:

- **A1** (offer the track): pass (R1–3) → fail (R4) → partial (R5–6). Same prose, different outcome.
- **C4** (walk all distractors): pass (R1–5) → fail (R6) under a "move fast" student.
- **E1** (praise-creep): fail → fixed → flickers back to partial on chatty runs.

These are not bugs to patch once more. **Drift-under-load is the fingerprint of intention-based
control.** A prose rule holds until attention is elsewhere (a hurried student, a long session), then
silently stops holding. Patching the wording buys one more round; it does not change the kind of
thing the rule is.

## The balance principle (this is the whole design)

**Do NOT mechanize everything.** Over-mechanizing is its own failure mode: it makes the tutor robotic,
and a script that "enforces" warmth or good pedagogy is either trivially gameable or actively harmful.
The skill of this redesign is the *cut*:

> **Mechanize what must not fail and whose failure is invisible. Leave to intention what is genuine
> judgment and whose failure is self-evident.**

- A **silently-failed gate** (tutor ticks a module the student didn't master) is invisible — the
  transcript looks fine, the student leaves with a false sense of understanding. **Mechanize.**
- A **cold restate-first** or a **flat "why" explanation** is self-evident — you can see it in the
  text, and forcing it with a script would make the tutor ask wooden scripted questions. **Intention.**

The test for "mechanize this?": *If this fails, would I be able to tell from the transcript?* If no
(the failure hides), it needs a mechanism. If yes (the failure shows), a well-written intention plus
the eval catching it is enough.

## The cut, behavior by behavior

| Behavior | Failure visible? | Decision | Mechanism form |
|---|---|---|---|
| Answer position / length (C2/C1) | No (looks like a normal quiz) | **MECHANISM** | quiz_prep.py (done; extend for leak/length) |
| **Tick = mastery** (the rubber stamp) | **No** (a rubber-stamped tick is invisible) | **MECHANISM** | state object (§M1) |
| **Grading the answer** (did it count?) | **No** (self-grading conflict) | **MECHANISM** | clean-room grader (§M2) |
| Read-the-file-before-teaching | Partly (drift is subtle) | **MECHANISM (light)** | hash check (§M3) |
| Walk all distractors after commit (C4) | Yes-ish | **INTENTION**, eval-caught | — |
| Transfer before tick (D1) | No (ordering hides) | **folded into M1** | state object field |
| Restate-first (B1) | Yes | **INTENTION** | — |
| Why before what (B2) | Yes | **INTENTION** | — |
| Offer track / lane (A1/A2) | Yes | **INTENTION** | — |
| Praise-creep (E1) | Yes | **INTENTION**, eval-caught | (optional lint, §M3-opt) |
| Register / warmth / meet-them-where-they-are | Yes, and judgment | **INTENTION** — emphatically | — |

Three mechanisms, the rest intentions. That ratio is the design.

---

## M1 — The tick gate as a state object (the central fix)

**Problem it kills:** the rubber stamp. Today "tick a module" is a free-text claim the tutor makes in
prose. Nothing structurally stops it from ticking a module the student fumbled — and "I'll only tick
on mastery" is exactly the kind of intention that drifts. The transfer-before-tick ordering (D1) is
the same problem: prose ordering the agent can reorder.

**Mechanism:** a module cannot be ticked until a structured record for it is complete, and completing
it requires the student's *actual words* in each field. The tick is a *function of the record*, not a
decision the tutor narrates.

State object, one per module:
```json
{
  "module": "03-context",
  "status": "untouched | shaky | ticked",
  "prior":      "<the student's own restate-first words, verbatim-ish>",
  "why":        "<the student's own why, in their words>",
  "quiz":       { "asked": true, "correct_letter": "C", "student_pick": "C", "passed": true },
  "transfer":   "<the student's own connection to their real work>",
  "ticked_when": "all of {why, quiz.passed, transfer} are non-empty AND quiz.passed"
}
```
Rules the skill enforces:
- The tutor maintains this object (in-session for Version A; persisted for Version B —
  `learner-model.json`, see `learner-model-design.md`).
- **A module's `status` may become `ticked` ONLY when `why`, `quiz.passed==true`, and `transfer` are
  all populated** — and `transfer` must be the student's words, not the tutor's gloss. A correct quiz
  with empty/flat `transfer` leaves the module `shaky`. This makes D1 (transfer-before-tick)
  structural: you cannot fill `transfer` after the tick because the tick is *computed from* transfer
  being filled.
- The visible checklist is *rendered from* the objects (generate, don't sync — Principle 06): a `[x]`
  appears iff `status==ticked`. The tutor never hand-types a checklist.

**How strong is this?** Medium. It's still the same agent filling the fields, so a determined agent
could write a weak `transfer` and call it filled. M2 closes that hole. But even alone it converts
"remember to gate" into "the gate is a checklist of populated fields," which is a real structural
improvement and is exactly the learner-map you'd queued — the audit just showed it's load-bearing,
not a nice-to-have.

**Build:** Version A = hold the objects in context, render checklist from them. Version B = persist to
`learner-model.json`, render `progress.md` from it. A tiny `tick.py` could *validate* an object and
emit the checklist line (so the "ticked iff complete" rule is computed, not asserted) — that's the
script form, optional but on-spine.

## M2 — The clean-room grader (the deepest mechanism, and it's your own Lesson 3)

**Problem it kills:** the tutor grades its own teaching. The same agent that wants to feel like it
taught well decides whether the student demonstrated mastery. That is the exact conflict of Agent
Craft **Lesson 3, "Grade in a Clean Room"** — an agent can't grade its own homework, and neither can
the session that watched it. Self-grading is the single most intention-based thing in the skill, and
no prose rule fixes a conflict of interest; only structure does.

**Mechanism:** between the student's answer and the `quiz.passed`/`why` fields, insert a **separate
grader sub-agent** that:
- never saw the teaching (clean context — no transcript, no "what the tutor hoped they'd say"),
- receives only: the module's learning objective (from the curriculum file), the question, and the
  student's raw answer,
- returns a structured verdict: `{passed: bool, reasoning_present: bool, gap: string}`.

The tutor may set `quiz.passed`/`why` in the M1 object **only from the grader's verdict**, not from
its own read. Now the gate is graded by something with no stake in the lesson having landed.

**Why this is the real unlock:** M1 makes the *gate* structural; M2 makes the *grading that feeds the
gate* unbiased. Together they close the rubber stamp from both sides — you can't tick without a
complete record (M1), and you can't complete the record's pass-fields without an impartial grade (M2).

**Build:** a sub-agent call (in a real Claude Code session, a Task/sub-agent; the skill describes the
contract). Note this mirrors the eval harness's OWN design — the eval already grades the tutor with a
clean-room judge panel. We'd be giving the *live skill* the same discipline the *eval* already has.
That symmetry is a good sign the design is right.

**Cost/latency caveat (the balance check):** a grader call per quiz adds a round-trip. For a 6-module
session that's ~6 extra sub-agent calls — acceptable. Do NOT also clean-room-grade restate-first or
transfer (judgment, cheap to see, not worth the latency). Grade the *gate-bearing* answer only.

## M3 — Read-before-teach as a hash check (light mechanism)

**Problem it kills:** the tutor teaches a module from memory instead of from the file, drifting from
the actual curriculum. Today enforced by "this is a gate, not a suggestion" (prose — and we know how
that holds).

**Mechanism (light):** before teaching module N, the tutor must run a one-liner that reads the file
and returns a short digest (e.g. `sha + first heading + the module's key term`). The tutor must quote
the key term in its teaching. Cheap, and it makes "I read the file" checkable rather than claimed. A
`module_digest.py` (5 lines) or even a raw `head`/`grep` does it.

**Optional M3-b — praise lint:** a trivial script that scans the tutor's drafted turn for opener
praise-words and warns. Borderline by the balance principle (praise failure is *visible*, so this is
eval-territory), but cheap; include only if E1 keeps flickering. Lean toward NOT building it — it's
the kind of over-mechanization the balance principle warns against.

---

## What explicitly stays an intention (and why that's correct)

These are load-bearing for *quality* but their failure is *visible in the transcript*, and mechanizing
them would make the tutor worse:
- **Restate-first, why-before-what** — genuine pedagogical sequencing; a script enforcing them yields
  wooden scripted questions. The eval's pedagogue lens already catches when they're skipped.
- **Meeting them at their level, the escape hatch, register/warmth** — this is the *humane* core of
  the skill and is pure judgment. A "warmth enforcer" is a contradiction. Leave it, and label it in
  the skill as deliberately intention-based so no one "fixes" it later.
- **Walking distractors (C4)** — visible; keep as intention, let the eval guard it.

**The skill should SAY which is which.** Add a short header to the protocol: "Steps marked 🔒 run
through a mechanism — you cannot complete them by narration. The rest are judgment; do them well." The
honesty about the cut is itself part of teaching the principle.

## Sequencing

1. **M1 Version A** (state objects in-session, checklist rendered from them) — biggest gain, no new
   infra. Fold D1 into it. Re-run quiz-spread + a normal full run; expect D1 to stop regressing.
2. **M2 clean-room grader** — the real rubber-stamp fix. Spec the grader contract, add the sub-agent
   step, re-run. This is the one most likely to move `specMet` honestly.
3. **M1 Version B** (persist + `progress.md` generated from JSON) — the cross-session learner-map,
   now clearly the same project as M1.
4. **M3** read-before-teach digest — light, do alongside whenever.
5. Harness: add the per-quiz assertion `shown_letter == correct_letter` (makes C2 regression-proof),
   and consider a continuity-eval dimension for Version B (see learner-model-design.md §C).

## Are we close to a good design?

Closer in *understanding* than in *code*. Today: 1 mechanism, 9 intentions, and the intentions are the
ones silently failing. After M1+M2: the two invisible-failure behaviors (the tick gate, the grading)
become structural, the quiz hygiene is already structural, and the remaining intentions are the ones
whose failure you can *see* — which is exactly where intentions are fine. That's a defensible design:
**mechanisms on the silent killers, intentions on the visible judgment, and the eval as the backstop
that tells you when an intention has drifted.** We are one or two builds from that, not one or two
rounds of prose-patching from it.
