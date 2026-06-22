# Module 5: Tools (and MCP)

## From talking to doing

A raw model can only produce text (Module 1). So when the agent reads your file, runs your
tests, or searches the web — what's actually happening? **Tools.**

A tool is a capability the harness offers the model. The model doesn't run the tool itself;
it *asks*. The loop looks like this:

```
model:    "I want to read data/trials.tsv"   (a tool call — still just text)
   ↓
harness:  actually opens the file
   ↓
harness:  puts the file contents back into the context
   ↓
model:    now reasons over what it got, and decides the next step
```

This loop — **call a tool, get a result, reason, call the next tool** — is the whole engine
of agentic behavior. It's how the model reaches past "predict the next word" and acts on the
real world. Each result lands in the context (Module 3), so each tool call makes the model
*better informed* for the next one.

## The built-in toolbox

Out of the box the agent can, roughly:

- **read and write files** — view, edit, create,
- **run commands** — execute bash in your environment,
- **search** — find files and grep through code,
- **reach the web** — fetch a page, run a search,
- **and more** — each is a tool with a name the model knows.

You don't invoke these directly; you describe what you want, and the model chooses tools to
get there. (The harness can gate risky ones behind a permission prompt — that's the "allow
this command?" you'll see.)

## MCP: bring your own tools

The built-in set is fixed, but you can *add* tools through **MCP** (Model Context Protocol).
An MCP server connects the agent to something external — a database, GitHub, Slack, a
literature search, an internal API — and exposes it as more tools the model can call.

This repo has some: there are MCP servers for searching scientific literature (PubMed,
Semantic Scholar, a Zotero library). When the agent searches papers here, it's calling
MCP-provided tools, no different in shape from reading a file.

The mental model: **built-in tools are the agent's hands; MCP is how you give it new hands**
for whatever your work touches.

## Why this is the "doing" layer

Everything in the tour so far was about what the agent *knows* — the system prompt, the
context, CLAUDE.md all shape what text the model sees. Tools are the first part that's about
what the agent *does*. Knowing and doing are different powers, and tools are the bridge:
they turn the model's text-predictions into file edits and command runs and real effects.

Which is exactly why the next module — and the whole Principles track — cares so much about
*checking* what the agent did.

## Check yourself

- Walk the tool loop: the model can only emit text, so how does a file actually get read?
  Who does what?
- What does MCP add that the built-in tools don't, and can you name the kind of tool this
  repo adds through it?
- The system prompt, CLAUDE.md, and context all shape what the agent *knows*. What do tools
  add that those don't?
