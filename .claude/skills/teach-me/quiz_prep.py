#!/usr/bin/env python3
"""quiz_prep.py — the C2 guardrail for /teach-me.

WHY THIS EXISTS (Principle 05 — guardrails, not good behavior): the tutor was *told* in prose
to rotate the correct-answer position and keep options parallel in length. Two eval rounds proved
it cannot self-administer either rule while composing pedagogy — it parked the answer in B (B,B,B
then B,B,B,D) and made the correct option the longest. So we move position + length out of the
model's judgment and into a mechanism. The model supplies the *content*; this script owns the two
things it provably can't police: WHERE the correct answer sits, and that options don't differ
in length enough to telegraph.

USAGE (the tutor calls this before each gating quiz):
    python3 .claude/skills/teach-me/quiz_prep.py <<'JSON'
    {
      "stem": "When the agent 'remembered' your CLAUDE.md this session, what actually happened?",
      "correct": "The harness re-read CLAUDE.md off disk and put it in the context window.",
      "distractors": [
        "The model stored it in its weights after the first time it saw it.",
        "There is a shared memory the model and harness both write to between sessions.",
        "The previous session's context carried over automatically."
      ]
    }
    JSON

SLOT ASSIGNMENT IS STATELESS — derived by hashing the quiz stem, NOT by a session counter.
An earlier version rotated by --quiz-number (quiz 1→A, 2→B, ...), but that requires the tutor to
correctly count how many quizzes it has already posed across turns — and it doesn't: in practice
the counter resets and the answer parks in slot A. Hashing the stem removes the dependency
entirely: each quiz's slot is a pure function of its own text, so it needs no memory, can't be
reset, and still distributes across A/B/C/D (different stems hash to different slots) while being
unguessable to the student. `--quiz-number` is still accepted for back-compat but ignored for
placement unless `--rotate-by-number` is passed.

OUTPUT: JSON to stdout with the rendered options in fixed order and the correct letter, e.g.
    {"correct_letter": "C", "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
     "rendered": "A. ...\nB. ...\nC. ...\nD. ...",
     "length_warning": null}
The tutor renders `rendered` verbatim and must NOT reveal `correct_letter` to the student until
they commit. If `length_warning` is non-null, the correct option is a length outlier — the tutor
should pad the shorter options or trim the correct one and re-run, so length carries no signal.

This is intentionally tiny and dependency-free (stdlib only) so it runs anywhere a student cloned
the repo. It does not phone home, read other files, or write anything — it transforms one quiz.
"""
import argparse
import hashlib
import json
import sys

SLOTS = ["A", "B", "C", "D"]


def slot_from_stem(stem):
    """Deterministic, stateless slot in [0,4) from the quiz stem. A stable hash (not Python's
    salted hash()) so the same stem always lands the same slot across processes/sessions."""
    h = hashlib.sha256(stem.strip().encode("utf-8")).hexdigest()
    return int(h, 16) % 4


def prepare(stem, correct, distractors, quiz_number=None, rotate_by_number=False):
    if len(distractors) != 3:
        raise ValueError("need exactly 3 distractors, got %d" % len(distractors))

    # Slot assignment. Default: hash the stem (stateless — no counter to get wrong). Opt-in:
    # rotate by quiz number, kept only for back-compat / deliberate use.
    if rotate_by_number:
        if quiz_number is None or quiz_number < 1:
            raise ValueError("--rotate-by-number needs a 1-based --quiz-number")
        correct_idx = (quiz_number - 1) % 4
    else:
        correct_idx = slot_from_stem(stem)
    correct_letter = SLOTS[correct_idx]

    # Place distractors in the remaining slots in given order (stable, no shuffle needed — the
    # rotation already breaks position-pattern, and a stable order keeps the tutor's post-commit
    # walk predictable).
    options = {}
    d = list(distractors)
    for i, slot in enumerate(SLOTS):
        options[slot] = correct if i == correct_idx else d.pop(0)

    # Length-tell guard: the correct option must not be a length outlier. Compare word counts;
    # flag if the correct option is >40% longer than the mean of the distractors (the empirical
    # tell the skeptic caught — correct option was "the longest, most fully-reasoned one").
    def wc(s):
        return len(s.split())

    correct_wc = wc(correct)
    distractor_wcs = [wc(x) for x in distractors]
    mean_d = sum(distractor_wcs) / len(distractor_wcs) if distractor_wcs else 0
    length_warning = None
    if mean_d > 0 and correct_wc > 1.4 * mean_d:
        length_warning = (
            "Correct option is %d words vs distractor mean %.1f — a length tell. "
            "Pad the distractors or trim the correct option to parity and re-run."
            % (correct_wc, mean_d)
        )

    rendered = "\n".join("%s. %s" % (slot, options[slot]) for slot in SLOTS)
    return {
        "slot_method": "quiz-number" if rotate_by_number else "stem-hash",
        "correct_letter": correct_letter,
        "options": options,
        "rendered": rendered,
        "length_warning": length_warning,
    }


def main():
    ap = argparse.ArgumentParser(description="Prepare a /teach-me quiz: fix answer slot (stateless, by stem hash) + check length parity.")
    ap.add_argument("--quiz-number", type=int, default=None, help="1-based gating-quiz index; only used with --rotate-by-number (back-compat)")
    ap.add_argument("--rotate-by-number", action="store_true", help="opt into the old counter-based rotation instead of stem-hash placement")
    args = ap.parse_args()

    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": "stdin is not valid JSON: %s" % e}), file=sys.stdout)
        sys.exit(2)

    try:
        out = prepare(
            payload["stem"],
            payload["correct"],
            payload["distractors"],
            quiz_number=args.quiz_number,
            rotate_by_number=args.rotate_by_number,
        )
    except (KeyError, ValueError) as e:
        print(json.dumps({"error": str(e)}), file=sys.stdout)
        sys.exit(2)

    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
