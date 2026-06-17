"""Entry point for the PPC decision-task analysis.

STUB — intentionally thin. This is where the workshop builds from.

Goal (see ../notes.md): test whether pre-movement PPC activity predicts choice,
and whether that prediction strengthens with stimulus coherence.
"""

import csv
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "trials.csv"


def load_trials():
    """Load the trial table as a list of dicts. One row per trial."""
    with open(DATA) as f:
        rows = list(csv.DictReader(f))
    # cast numeric columns
    for r in rows:
        r["trial"] = int(r["trial"])
        r["ppc_rate_premove"] = float(r["ppc_rate_premove"])
        r["choice"] = int(r["choice"])
        r["rt_ms"] = float(r["rt_ms"])
        r["coherence"] = float(r["coherence"])
    return rows


def main():
    trials = load_trials()
    sessions = sorted({r["session"] for r in trials})
    print(f"loaded {len(trials)} trials across {len(sessions)} sessions")
    # TODO: does ppc_rate_premove predict choice above chance?
    # TODO: split by coherence — does the prediction strengthen with coherence?
    # TODO: per-session vs. pooled — is the effect consistent across sessions?


if __name__ == "__main__":
    main()
