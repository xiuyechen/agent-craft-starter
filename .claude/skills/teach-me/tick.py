#!/usr/bin/env python3
"""tick.py — the mastery-gate mechanism for /teach-me (M1).

WHY THIS EXISTS (Principle 05, learned the hard way in the C2 loop): "tick a module only when the
student has mastered it" was prose — an intention — and intentions drift. A rubber-stamped tick is
INVISIBLE in the transcript (it looks like a normal tick), which is exactly the kind of silent
failure that must be mechanized rather than asked-for. So the tick is no longer something the tutor
narrates; it is COMPUTED from a per-module state record. A module is tickable iff its record is
complete, and "complete" requires the student's own words in the gate fields. The tutor cannot type
a `[x]` by hand — it must route the decision through this script, which refuses to tick an
incomplete record. Same non-bypassable shape that finally made C2 bind: the artifact, not the
agent's judgment, owns the outcome.

This does NOT grade understanding — that is M2's clean-room grader's job (this script trusts the
`quiz.passed` flag it's handed). This script enforces COMPLETENESS and ORDER: you can't tick without
a why, a passed quiz, AND a non-trivial transfer, and the transfer must be present BEFORE the tick
(killing the D1 "transfer asked after the tick" failure structurally — you literally cannot produce
a ticked line without the transfer field filled).

USAGE — render the whole checklist from the current state (this is the ONLY way to show the
checklist; never hand-type one):
    python3 tick.py render <<'JSON'
    { "modules": [
        {"module":"01-the-model-and-the-harness","why":"...","quiz":{"passed":true},"transfer":"..."},
        {"module":"02-the-system-prompt","why":"","quiz":{"passed":false},"transfer":""}
    ] }
    JSON

— or check a single module before ticking it:
    python3 tick.py check <<'JSON'
    {"module":"03-context","why":"...","quiz":{"passed":true},"transfer":"..."}
    JSON

OUTPUT (render): the checklist as the student should see it, plus a machine summary:
    {"checklist": "[x] 01-the-model-and-the-harness\n[ ] 02-the-system-prompt",
     "ticked": ["01-..."], "open": ["02-..."],
     "blocked": {"02-the-system-prompt": ["why is empty","quiz not passed","transfer is empty"]}}

OUTPUT (check): {"module": "...", "tickable": false, "missing": ["transfer is empty"]}

A module is TICKABLE iff ALL of:
  - why          : non-empty, and not a trivial stub (>= MIN_WORDS words)
  - quiz.passed  : true
  - transfer     : non-empty, and not a trivial stub (>= MIN_WORDS words)
The why/transfer word floors are a guard against filling the field with "yes" to pass the gate;
they are deliberately low (real mastery answers clear them easily) and are NOT a quality judge —
quality is M2's job. This is a completeness gate, not a grader.

stdlib only, no deps, no file writes, no network — transforms the state you hand it.
"""
import argparse
import json
import sys

# Minimum word count for why/transfer to count as "filled" (anti-stub guard, not a quality bar).
MIN_WORDS = 4


def _stub(s):
    """True if the field is empty or too short to be a real answer."""
    return not s or len(str(s).split()) < MIN_WORDS


def reasons_blocked(m):
    """Return the list of reasons this module is NOT tickable (empty list == tickable)."""
    out = []
    if _stub(m.get("why")):
        out.append("why is empty or too short (needs the student's own words)")
    quiz = m.get("quiz") or {}
    if not quiz.get("passed"):
        out.append("quiz not passed")
    if _stub(m.get("transfer")):
        out.append("transfer is empty or too short (needs a real-work connection, asked BEFORE the tick)")
    return out


def render(modules):
    lines, ticked, open_, blocked = [], [], [], {}
    for m in modules:
        name = m.get("module", "<unnamed>")
        why_not = reasons_blocked(m)
        if why_not:
            lines.append("[ ] %s" % name)
            open_.append(name)
            blocked[name] = why_not
        else:
            lines.append("[x] %s" % name)
            ticked.append(name)
    return {
        "checklist": "\n".join(lines),
        "ticked": ticked,
        "open": open_,
        "blocked": blocked,
    }


def check(m):
    why_not = reasons_blocked(m)
    return {"module": m.get("module", "<unnamed>"), "tickable": not why_not, "missing": why_not}


def main():
    ap = argparse.ArgumentParser(description="Compute /teach-me module ticks from a state record (completeness gate).")
    ap.add_argument("mode", choices=["render", "check"], help="render the whole checklist, or check one module")
    args = ap.parse_args()

    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": "stdin is not valid JSON: %s" % e}))
        sys.exit(2)

    if args.mode == "render":
        modules = payload.get("modules")
        if not isinstance(modules, list):
            print(json.dumps({"error": "render needs {\"modules\": [...]}"}))
            sys.exit(2)
        print(json.dumps(render(modules), indent=2))
    else:
        print(json.dumps(check(payload), indent=2))


if __name__ == "__main__":
    main()
