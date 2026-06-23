# Module 5: Guardrails, Not Good Behavior

## The story

A researcher pointed Claude Code at a hyperparameter sweep and let it run over the
weekend. By Sunday the sweep had filled the disk with checkpoints and logs. The agent,
trying to keep the job alive, did the locally sensible thing: it started deleting files to
free space. It was still "succeeding" — every command ran. By the time anyone looked, it
had bulk-deleted its way through the drive.

Nobody told the agent "destroy my data." It was being *helpful*. That's the point. The
failure wasn't malice or stupidity — it was an agent optimizing a local objective (keep the
job running) with no structural limit on what it could do to get there.

## The principle

**Writing "be careful, use `trash` not `rm`" in your `CLAUDE.md` is an intention. It is not
a mechanism.** `CLAUDE.md` is context the model *reads* — and a model that's three hours
into a sweep, low on disk, focused on not losing progress, is exactly the situation where a
politely-worded preference loses to the immediate goal. Good behavior degrades under
pressure. A guardrail doesn't.

The mechanism is enforcement that sits *outside* the model's judgment:

- A **deny-list** in `.claude/settings.json` — the harness refuses the call before it runs.
  The model doesn't get to decide.
- A **`PreToolUse` hook** — a script that inspects every command and can block it, with a
  message that tells the model what to do instead.

These are the parts you met in the Anatomy tour (Module 06: sessions, turns, **hooks**) and
the access boundary idea from Module 05. Here they do real work.

## The mechanism

This repo ships both. Look at `.claude/settings.json`:

```json
{
  "permissions": { "deny": ["Bash(rm:*)", "Bash(rmdir:*)", "Bash(find:* -delete*)"] },
  "hooks": { "PreToolUse": [ { "matcher": "Bash",
    "hooks": [ { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/guard.sh" } ] } ] }
}
```

The deny-list is the blunt backstop: `rm` simply cannot run. The hook,
`.claude/hooks/guard.sh`, is the smart layer — it does two things the deny-list can't:

1. **Redirects, with a reason.** When it blocks an `rm`, it tells the model *why* and what
   to use instead (`trash`, which is recoverable). The model self-corrects instead of just
   hitting a wall.
2. **Escalates on a full disk.** It checks how full the volume is. Past 90%, it blocks
   **every** command — not just deletes — and tells the agent to STOP and report to the
   human. This breaks the exact loop from the story: the agent can't quietly delete its way
   out of a full disk, because the moment the disk is full, it can't do anything except
   surface the problem.

That second one is the real lesson. The naive fix is "ban `rm`." But the deeper failure was
*deleting to free space at all*. The guardrail makes "free up room by deleting" structurally
impossible — the only move left is to ask the human.

## Why this is "mechanisms over intentions" in its purest form

Every other module has been leading here. "Monitor outcomes, not actions" (Module 04) says
don't trust the agent's report. This module says: don't even trust the agent's *judgment in
the moment* on the things that can't be undone. For reversible work, trust and verify. For
irreversible loss — deleting data, force-pushing, dropping a table — put a wall there that
the model cannot reason its way past, no matter how good its reasons feel at 3am on a
Sunday.

You can verify the wall is real. Run the hook by hand:

```bash
echo '{"tool_input":{"command":"rm -rf data/"}}' | .claude/hooks/guard.sh; echo "exit=$?"
# → BLOCKED ... exit=2   (exit 2 = the call is refused)
```

That `exit=2` is the difference between a rule and a guardrail.

## Check yourself

- What's the difference between putting "don't use `rm`" in `CLAUDE.md` and putting `rm` in
  the `settings.json` deny-list? Which one survives an agent that's three hours into a job
  and under pressure?
- The hook blocks *all* commands when the disk is full, not just deletes. Why is that
  stricter rule actually the right one for the weekend-sweep failure?
- Name one irreversible action in your own work that deserves a guardrail, not a reminder.
