# Agent Craft — Starter

A starter repo for the **Agent Craft** workshop: learning to work well with coding agents
like Claude Code.

You clone this, set up Claude Code, and run a tutor that teaches the core ideas by quizzing
you rather than lecturing. The repo is also a small, realistic project (synthetic
neuroscience data) so you practice on something shaped like real lab work.

The spine of the workshop is **mechanisms over intentions**. "I'll be careful with the
agent" is an intention. A mechanism is something that makes the failure structurally hard.
The homework is to internalize four of them.

## The homework

Full instructions in [`HOMEWORK.md`](HOMEWORK.md). In short:

1. Set up your workspace (steps below).
2. Clone this repo and open it in VS Code.
3. Open a Claude Code terminal in the repo and run `/teach-me`. It tutors you through the
   four modules in `curriculum/`, quizzing you until you can explain each back.
4. For each module, name where that failure shows up in your own work. That's the real
   deliverable.

You're done when you can state all four mechanisms in one sentence each, with a real
example of each from your own work.

## Setup (one time)

You need VS Code, git, and Claude Code.

1. Install [VS Code](https://code.visualstudio.com/).
2. Install [Claude Code](https://docs.claude.com/en/docs/claude-code) and confirm it works:
   `claude --version`.
3. Clone this repo and open the folder in VS Code:
   ```bash
   git clone <REPO_URL>
   cd agent-craft-starter
   ```
   Then `File → Open Folder…` and select `agent-craft-starter`.
4. Open VS Code's integrated terminal (`` Ctrl+` ``), make sure it's in the repo directory,
   and run `claude`.
5. Ask it: "what does this project do?" It should already know, because the repo has a
   `CLAUDE.md` that points it at the right files. That is module 3, working live.
6. Run the tutor:
   ```
   /teach-me
   ```
   If the skill doesn't trigger, type: "teach me the curriculum in this repo".

On HPC, the same flow works: clone into your scratch or project space, `cd` in, run
`claude`. If `claude` isn't available on your node yet, do the homework locally first.

## What's in here

```
agent-craft-starter/
├── README.md
├── HOMEWORK.md           # the assignment, in full
├── CLAUDE.md             # the index that points Claude at the project (module 3)
├── curriculum/           # the four modules /teach-me tutors you through
├── .claude/skills/teach-me/SKILL.md   # the tutor skill (runs on clone, no install)
├── data/                 # synthetic trial table + schema
├── analysis/load_data.py # a runnable stub
├── notes.md              # the project's open question
└── DEMO.md               # the side-by-side context demo
```

The repo is itself an example of what module 3 teaches: a skill plus an index that points
at it.

---

*Workshop teaching material. The data is synthetic and the project is a scaffold, not real
analysis.*
