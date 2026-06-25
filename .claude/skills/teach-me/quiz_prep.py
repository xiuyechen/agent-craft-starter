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
    python3 .claude/skills/teach-me/quiz_prep.py --quiz-number N <<'JSON'
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

--quiz-number is 1-based and counts gating quizzes in the session (quiz 1, 2, 3, ...). The
correct slot rotates A,B,C,D,A,... by (quiz_number-1) % 4 — deterministic, not by feel.

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
import json
import sys

SLOTS = ["A", "B", "C", "D"]


def prepare(quiz_number, stem, correct, distractors):
    if quiz_number < 1:
        raise ValueError("quiz-number is 1-based; got %r" % quiz_number)
    if len(distractors) != 3:
        raise ValueError("need exactly 3 distractors, got %d" % len(distractors))

    # Deterministic rotation: the correct answer's slot is fixed by quiz order, not by the
    # model's intuition. quiz 1 -> A, 2 -> B, 3 -> C, 4 -> D, 5 -> A, ...
    correct_idx = (quiz_number - 1) % 4
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
        "quiz_number": quiz_number,
        "correct_letter": correct_letter,
        "options": options,
        "rendered": rendered,
        "length_warning": length_warning,
    }


def main():
    ap = argparse.ArgumentParser(description="Prepare a /teach-me quiz: fix answer slot + check length parity.")
    ap.add_argument("--quiz-number", type=int, required=True, help="1-based gating-quiz index in the session")
    args = ap.parse_args()

    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": "stdin is not valid JSON: %s" % e}), file=sys.stdout)
        sys.exit(2)

    try:
        out = prepare(
            args.quiz_number,
            payload["stem"],
            payload["correct"],
            payload["distractors"],
        )
    except (KeyError, ValueError) as e:
        print(json.dumps({"error": str(e)}), file=sys.stdout)
        sys.exit(2)

    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
