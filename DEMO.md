# How to run the Session 1 side-by-side demo

The payoff moment of Session 1 (see `../session-1-flow.md`, Beat 4). Same prompt to
two fresh sessions; the only difference is whether `CLAUDE.md` is present.

**The prompt (identical in both):**
> "What is this project and what should I work on? Where does the data live?"

## Session A — the stranger (no CLAUDE.md)
```bash
git clone <neuro-starter>  ./demo-A
cd demo-A
mv CLAUDE.md _CLAUDE.md.hidden    # remove the index
claude
# paste the prompt → expect generic answer, asks you to explain, guesses from filenames
```

## Session B — context (with CLAUDE.md)
```bash
git clone <neuro-starter>  ./demo-B
cd demo-B
claude
# paste the prompt → expect specifics it could ONLY get by following the index:
#   - "PPC decision-task analysis"
#   - data in data/ (12 sessions, schema), entry point analysis/load_data.py (a stub)
#   - open question from notes.md: does pre-movement PPC activity predict choice?
```

## Why this lands (and defuses the skeptic)
Session B names things you **never said this session** — it *followed pointers* in
CLAUDE.md to `data/README.md` and `notes.md` and read them. Not memory, not a trick:
a mechanism. That's the spine, made visible.

## Production
- **Record both runs in advance** (asciinema / screen capture) as a fallback. The
  whole emotional payoff rides on this; don't let wifi kill it.
- Verify Session B's answer is *correct and specific* before recording — re-run if the
  model gives a vague answer; you want the contrast undeniable.
- The CLAUDE.md here is **pure pointers, no behavioral rules** — that's deliberate.
  Behavior/skills are Session 2's escalation (the index will point to skills, not just
  files).
