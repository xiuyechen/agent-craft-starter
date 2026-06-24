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

## The two OPEN bugs to close tomorrow (the point of the round)

1. **C2 — answer-position spread (NOT confirmed fixed).** The skill originally always put the
   correct quiz answer in **B** (a gameable pattern; "don't always pick A" was satisfied by
   "always pick B"). The skill text now says "check your last 2–3 positions and vary across
   A/B/C/D." **This has not been verified in behavior** — the only post-fix runs were too short
   (≤2 quizzes) to prove spread. **Needs a run with ≥3 quizzes** (probe `quiz-spread`, or a full
   6-module run) and a check that the correct letter actually moves.
2. **C3/C6/C8 — student must articulate the why before the tick.** The tutor sometimes accepts a
   bare letter-pick and supplies the reasoning itself, instead of making the student produce it.
   My C8 edit ("walk every option yourself") may have nudged it toward the tutor talking *more* —
   watch that it didn't make C3 worse. This is the subtlest remaining gap.

Also never properly exercised: **C5 (wrong-answer handling)** — the simulated students kept
answering correctly. The `wrong-answer` probe + `overconfident-skimmer` persona is built to force
it but hasn't produced a clean run yet.

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

1. **`args` may not thread through `Workflow({scriptPath, args})`.** Today, three probe launches
   came back with `cfg.probe:"full"` and `cfg.source:"public"` — i.e. the args were IGNORED and
   defaults used. This wasted ~1.3M tokens on runs that tested the wrong thing. **Before any real
   round: run ONE tiny probe and verify the returned `cfg` matches the args you passed.** If args
   don't thread, the fallback is to edit the `cfg` defaults at the top of the workflow each
   iteration instead of passing args (uglier, but reliable). This determines how `/goal` must
   drive the harness — via args, or via script edits.
2. **Workflow tasks can die silently (infra).** A probe today produced a 0-byte output file and
   vanished from the task list — not a logic error, an infra hiccup. `TaskOutput` also threw
   internal errors twice. **Verify a run actually completed (non-empty output, `specMet` present)
   before trusting it.** Don't block-wait indefinitely; check the output file size.
3. **Results don't auto-save to `eval/runs/`.** Workflow scripts can't write files. Today I
   hand-extracted verdicts via a python one-liner (see below). **A real improvement for tomorrow:
   add a final workflow step that spawns an agent to write the verdict JSON to
   `eval/runs/<stamp>_<persona>_<probe>.json`** so nothing depends on manual copying.
   Extraction one-liner (output file → runs/):
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
