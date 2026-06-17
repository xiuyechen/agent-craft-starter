# Project notes

## What this is
PPC circuit-modeling analysis. Trial-level recordings from posterior parietal
cortex during a motion-discrimination decision task. (Sample data — see
`data/README.md`.)

## Open question
**Does pre-movement PPC activity predict choice before movement onset?**
- Does `ppc_rate_premove` predict `choice` above chance?
- Does the prediction get stronger as stimulus `coherence` increases?
- Is the effect consistent across the 12 sessions, or driven by a few?

## Status
- [x] data loaded (`analysis/load_data.py`)
- [ ] choice-prediction analysis
- [ ] coherence split
- [ ] per-session consistency check
- [ ] figures
