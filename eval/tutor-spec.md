# Tutor Spec — the ideal `/teach-me` behavior (the fixed target)

This document defines what an **excellent** tutoring session looks like, in observable,
gradeable terms. It is the **north star** for the `tutor-eval` harness and the iteration loop.

**Why this exists, and how it differs from `SKILL.md`:**
- `SKILL.md` is the *implementation* — the instructions the tutor runs on. It will be edited
  often.
- This spec is the *target* — what good looks like. It changes only when we decide the goal
  itself was wrong, not when we tweak the skill.
- The eval grades a transcript against **this spec**, not against the skill's own phrasing. That
  keeps the test from drifting every time the skill is reworded, and gives the iteration loop a
  fixed thing to converge on.

A behavior is gradeable here without ever reading `SKILL.md`. Each item has a **bar** (what
counts as pass) and, where useful, a **fail tell** (the specific way it goes wrong — often
learned from real eval runs).

---

## A. Session opening (before any teaching)

**A1 — Offer the track.** The tutor asks, in prose, which track the user wants (tour /
principles / both) before teaching, and honors a narrower request (one track, one module).
- *Bar:* the first turn poses a genuine track question and, if the user picks, proceeds with
  exactly that scope.
- *Fail tell:* asserting "we're doing the tour" as settled; only offering a *format* choice and
  calling that the track choice.

**A2 — Offer the lane.** Right after a visible checklist and before teaching, the tutor offers
recall (explain cold) vs. recognition-first (react to options, then explain why), framed warmly
as low-stakes and switchable anytime.
- *Bar:* both lanes named before module 1, framed "no wrong choice / switch anytime," user's
  pick honored. For a visibly anxious user who doesn't choose, default to recognition-first.
- *Fail tell:* teaching begins before the lane is offered; lanes framed as easy-vs-hard.

**A3 — Visible checklist.** A checklist of the track's modules is shown up front, all unticked.
- *Bar:* checklist present in the opening; re-shown as the session proceeds.

**A4 — Don't overwhelm the opening.** The opening orients without burying an anxious beginner.
- *Bar:* the first turn is scannable; if the user signals overwhelm, the tutor compresses and
  reassures rather than repeating the wall.
- *Fail tell:* a dense multi-part opening the student reacts to with "that was a lot, I'm lost."

## B. Teaching each module

**B1 — Restate-first.** Before explaining a module, the tutor asks what the user already thinks
it means (from the title), with reassurance that "no idea" is fine.
- *Bar:* every module opens by eliciting the user's prior conception before exposition.
- *Fail tell:* a later module skips this and bridges from the prior module instead of locating
  the user fresh.

**B2 — Why before what.** The tutor establishes the problem the part solves / why the failure
happens *before* the mechanism, and visibly spends more time on the why.
- *Bar:* for each module, the underlying "why it must exist" is posed before the mechanics.

**B3 — Teach from the curriculum's framing.** Explanations use the curriculum file's own
metaphors and examples (e.g. engine/car, `data/trials.tsv`, compaction), not a generic recital.
- *Bar:* the module's specific framing appears in the teaching.
- *Fail tell:* fluent generic agent-knowledge with none of the file's concrete details.

## C. The quiz / gate (the mechanism)

**C1 — No answer leak before commit.** Options are bare parallel claims: no per-option
rationale, no visual giveaway (highlight/order/pre-select), no tell in wording; distractors are
plausible and parallel; all rationale withheld until the user picks.
- *Bar:* clean options, "pick first, then I explain."

**C2 — Vary the answer position — and actually spread it.** Across the session's quizzes, the
correct option is distributed across A/B/C/D — not parked in any single slot.
- *Bar:* over ≥3 quizzes, the correct answer occupies at least two different positions, and no
  single position holds the answer in *every* quiz.
- *Fail tell:* always-A — or, the subtler trap we actually hit, **always-B**. A student must not
  be able to pass by guessing one fixed letter. *(This needs ≥3 quizzes to test; a paused
  2-quiz session can only yellow-flag it, not confirm.)*

**C3 — The student articulates the why before the tick.** In *both* lanes, the module is ticked
only after the student explains, in their own words, why the answer is right. The tutor must not
accept a bare pick and supply the reasoning on the student's behalf.
- *Bar:* before each tick, the student's own why is on the record; if they pick without
  reasoning, the tutor asks for it rather than filling it in.
- *Fail tell:* student picks a letter with thin/no why; tutor validates and ticks, having
  supplied the reasoning itself. (Recognition-lane must not collapse into pick-and-move-on.)

**C4 — Full post-commit walkthrough.** After the commit, the tutor states why the right answer
is right *and* why each distractor is wrong, in its own words — affirming/sharpening the
student's reasoning, not outsourcing it.
- *Bar:* every quiz gets a tutor-owned walk of all options post-commit.
- *Fail tell:* the tutor only confirms the correct pick and skips the distractors (esp. on later
  quizzes when it's relaxed).

**C5 — Wrong answers are named, not glossed.** On an incorrect answer the tutor says it's wrong,
locates the misunderstanding, re-teaches, and does not tick until corrected.
- *Bar:* a wrong answer visibly blocks the gate and triggers re-teaching.
- *(Hard to exercise unless the simulated student answers wrong — personas should sometimes do
  so on purpose.)*

## D. Making it stick

**D1 — Transfer to the user's own work, enforced.** After each module the tutor asks a concrete
"point to this in your own work" question, and treats inability to connect as not-yet-mastery —
i.e. it does not tick on a quiz pass alone if the transfer falls flat.
- *Bar:* transfer question asked *and* its answer factored into the tick decision.
- *Fail tell:* transfer asked rhetorically, then the module ticked before/regardless of the
  student's answer.

## E. Register

**E1 — No praise-creep.** No "Great job!!"; and no rising tide of soft validation ("you nailed
it," "dead right," "exactly," stacked every turn). Affirmation, when given, names the specific
reasoning, not the student.
- *Bar:* positive feedback is plain and reasoning-anchored; superlatives are rare and earned.
- *Fail tell:* most turns carry a superlative; praise attaches to the person ("you're so good
  at this") rather than the move.

**E2 — Warm but honest, never condescending.** Patient with an anxious beginner; corrections are
plain and located, not softened into mush.

## F. Ending

**F1 — Finish vs. pause, named honestly.** *Finished* = every module ticked + synthesis pass
(one sentence per module, scaffolded as a victory lap; bridge question if both tracks). *Paused*
= some modules ticked, explicitly flagged as unfinished with what's left named. Both are fine.
- *Bar:* the ending correctly labels itself; a partial session is called a pause, not a finish.
- *Fail tell:* ticking N-of-M and declaring "a real finish" / running a final-synthesis as if
  the track were complete.

---

## How the eval and the loop use this

- The eval extracts its rubric from **this spec** (section letters → criteria), grades a
  transcript, and reports pass/partial/fail/not-exercised per item with evidence.
- The iteration loop holds this spec fixed and edits **`SKILL.md`** until the gap closes. If a
  criterion proves unreachable or wrong-headed, that's a signal to revise *the spec
  deliberately* — not to silently teach to the test.
- Some criteria (C2 spread, C5 wrong-answer, D1 enforcement) only exercise under the right
  conditions (≥3 quizzes; a student who sometimes answers wrong; a session run to completion).
  The loop must run **those conditions** before claiming a criterion passed — a not-exercised is
  not a pass.
