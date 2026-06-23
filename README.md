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
   two tracks in `curriculum/` — first the **Anatomy of Claude Code** tour (what the parts
   are), then the **Agent Craft** principles (how to wield them) — quizzing you until you
   can explain each module back.
4. For each module, connect it to your own work: for the tour, point to the part in your own
   setup; for the principles, name where that failure shows up. That's the real deliverable.

You're done when you can name each part of the machine from the tour, state each principle's
mechanism in one sentence, and connect both to your own work.

## Setup (one time)

**New to Claude Code or the terminal?** Follow the **[setup
guide](https://xiuyechen.github.io/agent-craft-starter/setup-guide.html)** instead — same
steps, but beginner-proof, forked for Mac/Windows, with a check after each one. The quick
version:

You need VS Code, git, and Claude Code.

1. Install [VS Code](https://code.visualstudio.com/).
2. Install [Claude Code](https://docs.claude.com/en/docs/claude-code) and confirm it works:
   `claude --version`.
3. Clone this repo and open the folder in VS Code:
   ```bash
   git clone https://github.com/xiuyechen/agent-craft-starter.git
   cd agent-craft-starter
   ```
   Then `File → Open Folder…` and select `agent-craft-starter`.
4. Open VS Code's integrated terminal (`` Ctrl+` ``), make sure it's in the repo directory,
   and run `claude`.
5. Ask it: "what does this project do?" It should already know, because the repo has a
   `CLAUDE.md` that points it at the right files. That is the CLAUDE.md from the tour
   (Anatomy 04) and the "index that points" principle (Principles 03), working live.
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
├── CLAUDE.md             # the index that points Claude at the project (Anatomy 04 / Principles 03)
├── curriculum/           # two tracks /teach-me tutors you through
│   ├── tour/             #   Anatomy of Claude Code — the structural tour (6 modules)
│   └── principles/       #   Agent Craft — mechanisms over intentions (4 modules)
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
