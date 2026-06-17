# Module 4: Monitor Outcomes, Not Actions

## The story

A sync script runs every 5 minutes — commits and pushes to GitHub. It has error handling:
if the push fails, you get an alert. Months pass. You check GitHub. Nothing's updated since
February. What happened? The local branch was `main`; the remote default was `master`.
Every push *succeeded* — to a branch nobody was looking at. The **action** (push)
completed. The **outcome** (remote is current) never happened.

## The principle

**"Did the command succeed?" is not the same question as "is the thing I wanted actually
true?"** Error handling catches *failures*. It does not catch *success that doesn't
accomplish what you intended*.

This is the deepest version of "mechanisms over intentions," and it's the one that bites
in a lab. The agent reports "training complete, accuracy 0.94." The action ran. But did it
train on the right split? Did it load the dataset you meant? Did "complete" mean "converged"
or "hit max steps and gave up"? The exit code says nothing about any of that.

## The mechanism

Check the **state of the world**, not the exit code:

```bash
# Action monitoring — necessary but not sufficient
git push origin main || echo "push failed"

# Outcome monitoring — catches what action monitoring misses
UNPUSHED=$(git rev-list origin/main..HEAD --count)
[ "$UNPUSHED" -gt 0 ] && echo "WARNING: $UNPUSHED commits not on remote"
```

The outcome check doesn't care *why* things drifted. It just asks: **is the thing I care
about actually true?** For an experiment, the outcome check is: re-load the saved results
and assert the shape, the split sizes, the label balance — independently of what the
training script *said* it did.

## Why this is the agent's favorite blind spot

An agent is optimized to complete the task it was given and report success. It will tell
you "done" with total confidence. The adversary isn't the agent's malice — it's your
*trust* in its report. The mechanism is to never grade the work using the worker's own
summary. (You'll see this generalize: "grade in a clean room" — the checker shouldn't be
the thing that did the work.)

## Check yourself

- Give an example from your own work where an action succeeded but the outcome didn't happen.
- The agent says "I refactored the pipeline and all tests pass." What's the *outcome* check
  you'd run that doesn't trust that sentence?
