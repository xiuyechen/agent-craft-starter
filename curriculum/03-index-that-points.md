# Module 3: The Index That Points (CLAUDE.md)

## The problem

Most people use an AI in a single chat window with no persistent context. Every session
starts from zero — you re-explain the project every morning. It's like a research
assistant with amnesia.

## The mechanism

A **`CLAUDE.md` at your project root**. Claude Code reads it automatically at the start of
every session in that directory. It's not a README for humans — it's an *index that points
the agent* at where things are and what the rules are, so you never re-explain.

This repo has one. Open `CLAUDE.md` in the root and read it — it's short on purpose. It
says what the project is, where the data and analysis live, and what the current question
is. That's why, when you open Claude Code here and ask "what does this project do?", it
already knows.

## The two properties that make it work

1. **It points, it doesn't duplicate.** A good `CLAUDE.md` says *"data schema is in
   `data/README.md`"* — it doesn't copy the schema in. One source of truth. (If two files
   must say the same thing, you've created a sync problem; see Module 4's cousin,
   "generate, don't sync.")
2. **It's freeform and yours.** There's no template to fill. Write the 3–5 lines *you*
   keep having to re-explain. For a lab project that might be: *"raw data is read-only in
   `/nfs/...`, processed data goes in `results/`, never overwrite raw files, we use conda
   env `ppc`."* That single line prevents a whole class of mistakes.

## Scoping it

You can put a `CLAUDE.md` in a *subdirectory* too. A `data/CLAUDE.md` that says "these are
TSVs, not CSVs" only loads when the agent is working in `data/`. Open one terminal in
`data/` and one in `analysis/` and they carry different context — no contamination.

## Check yourself

- What's the difference between a `README.md` and a `CLAUDE.md`? (Who's the audience?)
- Why is "point at the schema" better than "paste the schema in"? What breaks if you paste?
- Name one line you'd put in *your* lab project's `CLAUDE.md` that would save you a
  recurring re-explanation.
