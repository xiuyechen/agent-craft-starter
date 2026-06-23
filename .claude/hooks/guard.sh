#!/usr/bin/env bash
#
# guard.sh — a PreToolUse hook. This is the *mechanism* behind two rules that
# would otherwise be only intentions written in CLAUDE.md:
#
#   1. Never bulk-delete. `rm` is banned; use `trash` (recoverable).
#   2. Never delete to free space. If the disk is nearly full, STOP and
#      escalate to the human — don't start deleting files to make room.
#
# Claude Code runs this before every Bash call. We read the proposed command
# from stdin (JSON), and exit 2 to BLOCK it — the stderr text goes back to the
# model as the reason, so it self-corrects instead of just failing.
#
# This is the failure this guards against: an agent left running for a day on a
# hyperparameter sweep fills the disk, then "helpfully" starts deleting files
# to keep going. The deny-list in settings.json stops the `rm`; this hook also
# stops the agent from getting into the situation in the first place.

set -euo pipefail

input="$(cat)"

# Extract the command string from the hook's JSON payload. Prefer jq; fall back
# to a tolerant grep so the hook still works on a bare machine.
if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"
else
  cmd="$(printf '%s' "$input" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:[[:space:]]*"//; s/"$//')"
fi

block() {
  # exit code 2 = block the tool call; stderr is fed back to the model.
  echo "$1" >&2
  exit 2
}

# --- Rule 1: no rm. Redirect to trash. ------------------------------------
# settings.json already denies these, but the hook gives a *teaching* message
# (why, and what to do instead) rather than a bare permission error.
if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])(rm|rmdir|shred)([[:space:]]|$)'; then
  block "BLOCKED: '$cmd' uses a destructive delete.
Use 'trash <path>' instead — it's recoverable. If 'trash' isn't installed:
  macOS:  brew install trash
  Linux:  pip install trash-cli   (then use 'trash-put')
If you genuinely need to remove something permanently, ask the human first."
fi

if printf '%s' "$cmd" | grep -Eq 'find\b.*(-delete|-exec[[:space:]]+rm)'; then
  block "BLOCKED: '$cmd' bulk-deletes via find. Use 'trash' on specific paths instead, and ask the human before removing anything in bulk."
fi

# --- Rule 2: disk-full → escalate, don't delete. --------------------------
# Check the filesystem holding the project. If we're over the threshold, block
# EVERYTHING (not just deletes) so a long-running agent can't quietly keep
# churning a full disk — it has to surface the problem to the human.
THRESHOLD=90  # percent used
proj="${CLAUDE_PROJECT_DIR:-$PWD}"
used="$(df -P "$proj" 2>/dev/null | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"

if [ -n "${used:-}" ] && [ "$used" -ge "$THRESHOLD" ] 2>/dev/null; then
  block "BLOCKED: disk is ${used}% full on the volume holding this project (threshold ${THRESHOLD}%).
STOP. Do not delete files to free space. Escalate to the human:
  - Report what's filling the disk (e.g. 'du -sh */ | sort -h' — read-only, safe to run).
  - Likely culprits in a sweep: checkpoints, logs, wandb runs, __pycache__.
  - Let the human decide what to remove or where to move it.
Deleting to keep a job alive is how a sweep turns into a data-loss incident."
fi

exit 0
