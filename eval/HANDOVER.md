# Handover — tomorrow's serious eval round (`/goal`-driven)

**Written:** 2026-06-23 evening. **Goal for tomorrow:** use the `/goal` skill to actually
*drive* the tutor skill to meet `eval/tutor-spec.md`, not just measure it once. Today we built
the harness and confirmed it finds real bugs; we did NOT complete a convergent `/goal` loop.

---

## TL;DR of where things stand

- **Harness works and finds real bugs.** `eval/tutor-eval.workflow.js` simulates a persona
  student against the real tutor skill and judges the transcript against a **fixed spec**
  (`eval/tutor-spec.md`), with 3 adversarial lenses (pedagogue / guardian / skeptic).
- **Skill is meaningfully improved and pushed.** Confirmed fixes: ask-which-track, teach-from-
  the-file, finish-vs-pause, register praise-creep guard. (See git log around commit `065639c`.)
- **Everything is committed & pushed** to `xiuyechen/agent-craft-starter@main`. `public == dev`,
  so source-mode discrepancies are no longer a confound.
- **Demo shipped:** `demo.html` → live at
  https://xiuyechen.github.io/agent-craft-starter/demo.html , linked from setup-guide + HOMEWORK.

## Round log — 2026-06-24 evening (/goal loop, source:dev)

Rig fully verified this session: args thread (fix #1), verdicts auto-save (fix #3). Both probes
echoed cfg correctly. Findings across 3 cheap probes (~2.2M tokens):

- **C5 (wrong-answer) — CLOSED.** wrong-answer probe + overconfident-skimmer: tutor named the
  wrong pick, held the gate, re-taught, ticked only after correct restatement. Was never-exercised
  before; now exercised AND passing.
- **E1 (praise-creep) — CLOSED in one prose edit.** R1 failed ("nearly every turn opens with
  Correct/Good/exactly"). Added a hard rule: don't open a turn with a praise word; ≤1 affirmation
  per 3 consecutive turns. R2 guardian: "affirmations almost entirely reasoning-anchored, no creep."
- **C2 (position spread) — STILL FAILING, and now diagnosed as a prose-resistant case.** Two
  prose mechanisms tried, both ignored by the model:
  - "vary the position / check your pattern" → R1 gave B,B,B (always-B).
  - explicit deterministic rotation (q1→A,q2→B,q3→C,q4→D, count the quizzes) → R2 gave B,B,B,D.
    The model will not reliably self-administer a counting rule while composing pedagogy; it
    defaults to B.
  - Compounding: the skeptic found a SECOND prose-resistant tell (showing as C1 partial) — the
    correct option is repeatedly the **longest / most fully-reasoned** one, a length giveaway. The
    prose already says "parallel in length and tone"; the model ignored that too (it naturally
    writes the true claim more fully).
  - **CONCLUSION: this is the Principle-05 case the design note anticipated — C2 + length-leak
    should escalate from prose to a MECHANISM.** Proposed: a tiny quiz-prep helper the skill calls
    before each quiz — model supplies stem + 4 option-claims + which is correct; the script owns
    (a) correct-slot by rotation, (b) length-parity normalization, (c) the rendered A/B/C/D block.
    Model owns content, script owns the two things it can't self-police. See learner-model-design.md
    §"C2 escalation". Deferred as an explicit decision (adds a script + invocation step — bigger than
    a prose edit, and the loop's mandate was edit-only). **Do NOT keep burning rounds on prose
    variants for C2 — the evidence is in.**

## ⭐ THE C2 FINDING (2026-06-24, after 5 rounds / ~3.7M tokens) — read this first

C2 (answer-position spread) **never closed**, across FIVE rounds and FOUR distinct mechanisms.
The sequence of fixes and what each produced:
1. prose "vary the position / check your pattern" → always-B (B,B,B)
2. prose deterministic rotation (q1→A…q4→D, count the quizzes) → always-B (B,B,B,D)
3. quiz_prep.py rotation by --quiz-number + absolute path so the tutor can run it → always-A
   (tutor didn't increment the counter across stateless turns; called quiz-number=1 repeatedly)
4. quiz_prep.py slot by SHA-256 of the stem (stateless, no counter) → always-C

**The decisive diagnosis (verified, not inferred):** in round 5 the script returned `correct_letter:A`
for both graded quizzes, but the tutor rendered the correct answer in slot **C** both times. **The
tutor ran the mechanism and then ignored its output**, re-deriving its own option arrangement when
it composed the human-readable A/B/C/D block. (Verified by re-running quiz_prep.py on the exact
stems from the transcript: script said A, student saw C.)

**This is the most important result of the whole exercise, and it IS Principle 05 (guardrails, not
good behavior) demonstrated on the tutor itself:** *a guardrail the agent can route around is not a
guardrail — it's just another intention with a script next to it.* The script "owns" placement only
if the agent structurally cannot place options any other way. Here the script's output was advisory
text in the agent's context, and the agent regenerated instead of pasting it.

**RESOLVED round 6 (2026-06-24):** the fix below worked. Requiring the tutor to paste the script's
`rendered` block VERBATIM (skill + harness prompt: "this is the only way you may show A/B/C/D; the
shown letter MUST equal the script's correct_letter; don't author options by hand") made the
guardrail bind. R6 positions were C,C,A — **C2 PASS** (two distinct positions, no single slot holds
all; skeptic: "clears the test, weak though — C twice"). The five-round arc (intention → better
intention → tool-as-suggestion → tool-the-agent-ignores → tool-the-agent-can't-bypass → PASS) is
intact and is the teaching artifact. Note C2 is *passing but weak* (hash gives spread, not
uniformity); fine for the spec bar. Caveat: making the eval ASSERT shown-letter==correct_letter
per quiz (a harness check) would make C2 regression-proof — still worth adding.

**Original framing of the fix (kept for the writeup):** make the mechanism NON-BYPASSABLE. The script
already returns a `rendered` block; the skill must require the tutor to paste `rendered` VERBATIM as
the only way it ever shows a quiz, and forbid composing an A/B/C/D block by hand at all. Better still
if the rendering path makes hand-composition impossible rather than merely forbidden (e.g. the tutor
must echo the script's exact stdout). Test that the slot the student sees == the script's
`correct_letter` (the harness could even assert this automatically per quiz). Until the student-visible
letter is provably the script's letter, C2 cannot pass and no amount of prompt-wording will fix it.

**Teaching artifact:** this five-round arc — intention → better intention → tool-as-suggestion →
tool-the-agent-ignores → tool-the-agent-can't-bypass — is a near-perfect worked example for the
Agent Craft curriculum's Principle 05 lesson. Worth writing up as a case study regardless of the fix.

## FINAL STATE after 6 rounds (~4.5M tokens) — where to pick up
Last quiz-spread probe (R6): `specMet:false`, openItems `{fail:[C4], partial:[A1,C1], unexercised:[C5,F1]}`.
- **C2 PASS** (the hard one — non-bypassable mechanism, see above).
- **C4 regressed to fail** this run: tutor confirmed the pick but did NOT walk all four distractors.
  C4 passed in rounds 1–5; this run's student carried a "move quickly" directive, which likely
  compressed the post-commit walk. **Check if it's persona-induced or a real regression before
  fixing** — re-run quiz-spread WITHOUT the hurry directive, or run a normal full run. If real, the
  skill's "walk every option after commit" rule (step 6) needs reinforcing.
- **A1 partial**: track offered but tour pre-framed as the settled default ("we're set up for the
  tour today"). Soften the opening so the track is a fully open question, not a default.
- **C1 partial**: mild length tell on quiz 2 (correct option carried an extra clause). The
  length_warning guard exists but only fires >40% over distractor mean; tighten or heed it.
- **C5 / F1 unexercised**: quiz-spread can't exercise them. NEXT: a `wrong-answer` probe (C5) and an
  `ending` probe (F1), then ONE full run to satisfy the goal's specMet condition. Full run ~1M tokens.

**To reach specMet:true:** close C4 + A1 + C1 on cheap probes, then a full run (C2 spread already
holds, C5 needs the wrong-answer path). Est. 2–3 more cheap probes + 1 full run.

## What CLOSED this session
- **C5** (wrong-answer re-teach) — exercised + passing.
- **E1** (praise-creep) — closed round 1–2 (occasionally flickers to "partial" on a chatty run; the
  hard no-praise-opener rule mostly holds. Watch it.).
- **D1** (transfer gates the tick) — reordered to why→quiz→transfer→tick; now PASS.
- **Answer-leak via narrated placement** — the round-3 regression (tutor printing "quiz 4 → slot D")
  is fixed by the no-narrate rule; round 4–5 leak hygiene is clean.

## The OPEN bugs to close tomorrow — PRIORITIZED from a real full run

A clean FULL run against the **pushed** skill (21 turns, `runs/..._FULL_public-postcommit.json`)
scored **12 pass / 3 partial / 0 fail / 1 not-exercised**, `specMet:false`. The open items, in
priority order with concrete evidence:

1. **C1 — answer LEAK (partial, new, concrete).** Quiz 2's lead-in prose repeated the exact
   wording of the correct option ("the parts that are yours," "not your lever") — the student
   said outright "you just said it pretty clearly." The skill must forbid the pre-quiz teaching
   from echoing the correct option's phrasing. Two of three quizzes were clean; this one
   telegraphed. **Highest-value fix.**
2. **D1 — transfer asked AFTER the tick (partial, structural).** The tutor ticks the module on
   the quiz pass, THEN asks "point to it in your own work." So a flat transfer answer can't block
   progression — the transfer isn't gating. Fix the ordering: ask transfer BEFORE ticking, and
   let an unconnected answer hold the tick.
3. **C2 — answer-position spread (partial, improved but not solved).** Sequence was **B/C/B** —
   the always-B fix partially took (used C once) but still leans B 2-of-3. Needs to actually
   rotate. (Still best tested with ≥3 quizzes.)
4. **A4 — opening overwhelm (partial).** The opening front-loaded two setup questions
   (track + check-method); the student said "both questions at once, okay. Sorry." Mild. Consider
   asking the track first, then the lane, sequentially.
5. **C5 — wrong-answer handling (STILL not-exercised).** The simulated student answered every
   quiz correctly, so the wrong-answer re-teach path has never been tested. Use the
   `wrong-answer` probe + `overconfident-skimmer` persona — but see args caveat below; today that
   probe could not be selected because args don't thread.

Note C3/C6/C8 (student-articulates-why) came back **pass** in this run — the tutor did walk all
options post-commit and had the student's reasoning on record before each tick. So my earlier
worry there is currently NOT a problem; watch it doesn't regress when fixing C1/D1.

## How to run the harness

```
Workflow({ scriptPath: "eval/tutor-eval.workflow.js",
  args: { persona, track, lane, source, probe } })
```
- `source`: **`public`** (tests the pushed repo — what students clone) or `dev` (local tree, for
  testing unpushed edits). Default `public`.
- `probe`: `full` | `quiz-spread` (≥3 quizzes, tests C2) | `wrong-answer` (forces a wrong answer,
  tests C5) | `ending` (tests F finish-vs-pause). Probes are CHEAP (~150–250k) vs a full run (~1M).
- `persona`: `anxious-beginner` (demo audience), `overconfident-skimmer` (for wrong-answer),
  `sharp-but-impatient`, `silent-staller`, `non-native-english`. See `eval/personas.md`.
- Output: a verdict JSON with `specMet`, `openItems {fail,partial,unexercised}`, `scores[]` with
  evidence, and the full `transcript[]`.

## ⚠️ KNOWN HARNESS ISSUES — fix these FIRST tomorrow, before spending tokens

1. **`args` threading — ROOT CAUSE FOUND & FIXED 2026-06-24.** The bug was not Workflow infra:
   `args` arrives as a JSON **string**, not a parsed object, so `args.probe` was `undefined` and
   every field silently fell to its default (`cfg.probe:"full"` etc.) — the ~1.3M-token waste on
   06-23. **Fix:** the harness now parses defensively at the top (`if typeof args === 'string'
   JSON.parse it`), so passing `args` works regardless of invocation path. **Verified** with two
   no-agent probes: passing `{probe:"quiz-spread", source:"dev", persona:"overconfident-skimmer"}`
   now yields exactly that `cfg`. **Consequence: pass args normally** — `/goal` drives the harness
   via `Workflow({scriptPath, args:{...}})`, no more editing defaults. STILL verify the logged
   `cfg` matches intent before trusting a run (cheap insurance).
2. **Workflow tasks can die silently (infra).** A probe today produced a 0-byte output file and
   vanished from the task list — not a logic error, an infra hiccup. `TaskOutput` also threw
   internal errors twice. **Verify a run actually completed (non-empty output, `specMet` present)
   before trusting it.** Don't block-wait indefinitely; check the output file size.
3. **Results auto-save to `eval/runs/` — DONE 2026-06-24.** Added Phase 6 ("Persist verdict"):
   a single WRITE-SCOPED agent (exempt from READONLY, for one file only) timestamps via `date`
   and writes the verdict to `eval/runs/<stamp>_<persona>_<probe>.json`, byte-faithful. The run's
   returned `result` now also carries `savedPath`. No more manual python extraction. Verified with
   a throwaway persist-test (file round-tripped clean). The old extraction one-liner is no longer
   needed but kept here as a fallback if Phase 6 ever fails:
   ```
   python3 -c "import json,sys; w=json.load(open(sys.argv[1])); r=w.get('result',w);
   r=json.loads(r) if isinstance(r,str) else r; json.dump(r,open(sys.argv[2],'w'),indent=2)" <output> <dest.json>
   ```
4. **Eval agents are now read-only** (a `READONLY` banner was added after an agent moved a
   curriculum file). Keep it. If you add agents, prepend `READONLY`.
5. **Harness-fidelity fix 2026-06-24: the simulated tutor can now run scripts.** The tutor agent
   was a chat-only role ("produce ONLY the next message", toolCalls:0), so it could not execute
   the new `quiz_prep.py` guardrail — the skill's tool-dependent behavior was invisible to the
   eval. `tutorSystem` now tells the tutor it runs LIVE in the repo cwd and MUST run quiz_prep.py
   via Bash before each quiz (final output still only the chat message). This is fidelity, not
   teaching-to-the-test — spec and curriculum untouched; we just let the simulated tutor do what
   the real tutor would. Watch that the tutor actually calls it (toolCalls > 0 on quiz turns).

## How `/goal` drives this (the actual plan for tomorrow)

`/goal` is a **built-in Claude Code skill the USER types in the terminal** — Claude cannot invoke
it. It runs the main loop each turn, and a small fast model checks whether a condition (judged
ONLY from what's surfaced in the transcript) holds; if not, another turn fires. Docs:
https://code.claude.com/docs/en/goal

Because the evaluator only sees the transcript, each turn Claude must **run the harness and
surface the verdict** so the condition can be judged. Suggested condition (paste into terminal):

```
/goal Drive .claude/skills/teach-me/SKILL.md to meet eval/tutor-spec.md. Each round: run the
tutor-eval workflow (start with cheap probes — quiz-spread for C2, wrong-answer w/
overconfident-skimmer for C5 — then a full run to integrate), print the returned specMet and
openItems, then edit ONLY SKILL.md (and eval/personas.md if needed) to close the top fail/partial.
First verify args actually applied by checking the returned cfg. Succeed when a FULL run returns
specMet:true with C2 spread confirmed over >=3 quizzes and C5 actually exercised. Edit only the
skill and personas, never tutor-spec.md. Stop after 6 rounds.
```

**Budget note:** full runs are ~1M tokens. Use cheap probes to localize fixes; reserve full runs
for integration checks. Today's misfires show: verify the rig before fanning out.

## Files (all under `eval/`)
- `tutor-spec.md` — the FIXED target (A–F, each with a pass bar + fail tell). Don't teach to the
  test by editing this; change it only if the *goal itself* was wrong.
- `tutor-eval.workflow.js` — the harness (simulate → judge → verdict; probe modes; read-only agents).
- `personas.md` — student persona library.
- `render.js` — verdict JSON → demo HTML. `node eval/render.js <run.json> demo.html`.
- `render-spec.md` — what the demo page must contain.
- `runs/` — saved verdicts. v3 (`*_dev-v3.json`) is the cleanest post-fix run (rendered into demo.html).
- `manual/NOTES-from-teach-me.md` — human notes (moved here from curriculum/).

## Deferred enhancement (not blocking)
**Multi-persona tabbed demo.** `demo.html` currently shows ONE persona (anxious-beginner). A
tabbed page switching between personas (anxious / skimmer / impatient) would show the tutor
*adapting* — far more convincing for PIs. Blocked on having real multi-persona runs, which
tomorrow's round will produce. Extend `render.js` to take multiple run JSONs → one tabbed page.
