# Data — PPC decision task (SAMPLE / FABRICATED)

> ⚠️ This is **synthetic** data for a workshop demo. Not real recordings.
> It mirrors the *shape* of a posterior parietal cortex (PPC) decision-task
> dataset so the workshop repo feels like a real lab project.

## `trials.csv`

Trial-level table. 12 sessions, ~55–70 trials each (772 trials total).

| column | meaning |
|--------|---------|
| `session` | session id (`sess01`…`sess12`) |
| `trial` | trial index within session |
| `ppc_rate_premove` | mean PPC population firing rate in the pre-movement window (−500–0 ms), spikes/s |
| `choice` | the animal's eventual choice (0 = left, 1 = right) |
| `rt_ms` | reaction time, ms |
| `coherence` | motion coherence of the stimulus (0 = pure noise) |

## The question this dataset is meant to probe
Does **pre-movement** PPC activity carry choice information *before* movement
onset — i.e., can `ppc_rate_premove` predict `choice` above chance, and does that
prediction strengthen with stimulus `coherence`? See `../notes.md`.
