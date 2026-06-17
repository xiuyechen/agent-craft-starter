# Module 2: The Snow-Shoveling Problem (Scope Ratio)

## The story

It's snowing. Clear a path from your door to the car — grab a shovel, ten minutes, done.
Now point that same shovel at a **parking lot**. You push snow aside, but the piles you
make block your next pass. An hour later you haven't *removed* snow — you've *rearranged*
it, and it's still snowing.

That's what happens when you point an agent at a task much bigger than its scope.

## The insight

The variable that matters is the **ratio of agent scope to task scope**, and there's a
phase transition:

| Situation | Ratio | What happens |
|-----------|-------|--------------|
| Short path + shovel | ~1:1 | Edges are close. Push to the boundary. Done. |
| Parking lot + shovel | ~1:1000 | No nearby edge. Piles interfere. You need a *strategy*. |
| Parking lot + plow | ~1:1 | Capability matches scope. Simple again. |

Most lab work with an agent is the middle row: the agent makes *local* progress
(fix this function, clean this file), but local progress doesn't add up to *global*
progress without a strategy layer. It optimizes the lane it can see; the piles two lanes
over keep growing.

## What to do about it (the mechanism)

Two moves, both about restoring a ~1:1 ratio:

1. **Shrink the task to the shovel.** Decompose. Don't say "organize this messy
   codebase" — say "move all the plotting functions into `viz.py` and update the imports."
   One pass, visible edges.
2. **Grow the shovel to the lot.** Orchestrate. Give the agent a strategy and let it
   spawn sub-tasks — but only once *you've* defined the global plan. You are the plow's
   steering; the agent is the blade.

The failure mode to recognize: ten files of "progress" that don't reduce the actual
problem. That's rearranged snow. (You'll see this again — it's the same shape as
"monitor outcomes, not actions.")

## Check yourself

- Why does a capable agent produce *more files* but not *less problem* on a too-big task?
- You're handed a 5,000-line repo to "clean up." Which lever do you reach for first, and
  what's the smallest first pass with visible edges?
