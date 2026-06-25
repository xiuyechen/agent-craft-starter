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
