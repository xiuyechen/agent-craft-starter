# PPC Decision-Task Analysis

An index. Claude reads this at the start of every session — it points to the
real files so you don't have to re-explain the project each time.

## What this project is
Analysis of posterior parietal cortex (PPC) recordings during a motion-discrimination
decision task. (Sample/synthetic data for now.)

## Where things live
- **Data**: `data/` — trial-level table; schema in `data/README.md`
- **Analysis**: `analysis/load_data.py` — entry point (currently a stub)
- **Open question & status**: `notes.md`

## The current question
Does pre-movement PPC activity (`ppc_rate_premove`) predict `choice` before movement
onset, and does the prediction strengthen with stimulus `coherence`? See `notes.md`.

## This is also a workshop repo
Besides being a sample project, this repo carries the Agent Craft homework:
- `curriculum/` — four short modules on working well with agents.
- `.claude/skills/teach-me/` — a tutor skill. If the user runs `/teach-me` or says
  "teach me the curriculum," follow that skill: tutor them through `curriculum/` in order,
  mastery-gated, quizzing to confirm understanding. Don't just summarize the modules.
- `HOMEWORK.md` / `README.md` — the assignment and setup steps.
