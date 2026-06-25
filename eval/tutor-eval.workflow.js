export const meta = {
  name: 'tutor-eval',
  description: 'Faithfully eval the /teach-me tutor: simulate a student against the real skill, judge against the skill\'s own promises, render a demo transcript',
  whenToUse: 'After editing a teaching skill, or to produce a stroll-through demo. args: {persona, track, lane, source, maxExchanges}',
  phases: [
    { title: 'Load product' },
    { title: 'Extract rubric' },
    { title: 'Simulate session' },
    { title: 'Judge panel' },
    { title: 'Synthesize verdict' },
  ],
}

// ---- normalize args ----
// CONFIRMED 2026-06-24: args can arrive as a JSON *string* rather than a parsed object
// (depending on the invocation path), which silently sends every field to its default —
// the bug that wasted ~1.3M tokens on 2026-06-23. Parse defensively so the harness is robust
// no matter how args arrive. Always check the logged `cfg` matches intent before trusting a run.
let _args = args
if (typeof _args === 'string') {
  try { _args = JSON.parse(_args) } catch (e) { _args = {} }
}
if (!_args || typeof _args !== 'object') _args = {}

// ---- config from args (with defaults matching the first demo cell) ----
const cfg = {
  persona: _args.persona || 'anxious-beginner',
  track: _args.track || 'tour',            // 'tour' | 'principles'
  lane: _args.lane || 'recognition-first', // 'recall' | 'recognition-first'
  source: _args.source || 'public',        // 'public' (raw GitHub) | 'dev' (local tree)
  maxExchanges: _args.maxExchanges || 14,   // student+tutor turn pairs before forced wrap
  modulesToRun: _args.modulesToRun || 2,    // teach this many modules fully, then graceful "...continues"
  // probe: cheap targeted scenario that exercises ONE cluster of spec criteria without a full
  // session. 'full' = normal run. Keeps the goal-loop from re-running everything per fix.
  probe: _args.probe || 'full',
}

// Probe definitions: each injects an extra instruction into the STUDENT so the right behavior
// gets exercised, and sets a tight turn budget. Judges still score the whole spec, but only the
// probe's target criteria will be exercised — the rest come back not-exercised (expected).
const PROBES = {
  full:          { inject: '',                                                                      maxExchanges: cfg.maxExchanges, modulesToRun: cfg.modulesToRun, targets: 'all' },
  'quiz-spread': { inject: 'Move briskly: answer each quiz correctly and give a short why, so we reach at least 3 quizzes quickly. Do not stall.', maxExchanges: 8, modulesToRun: 4, targets: 'C2 (answer-position spread across ≥3 quizzes)' },
  'wrong-answer':{ inject: 'On the FIRST quiz, deliberately pick an answer you think is WRONG (a plausible distractor), and give a confident-but-mistaken why. See how the tutor handles it. After it corrects you, engage with the correction.', maxExchanges: 6, modulesToRun: 1, targets: 'C5 (wrong-answer named & gated, not glossed)' },
  ending:        { inject: 'Move briskly and correctly so the session reaches a natural stopping point within a couple of modules; then let the tutor close.', maxExchanges: 7, modulesToRun: 2, targets: 'F (finish-vs-pause honesty)' },
}
const probe = PROBES[cfg.probe] || PROBES.full
const effMaxExchanges = probe.maxExchanges
const effModulesToRun = probe.modulesToRun

const RAW = 'https://raw.githubusercontent.com/xiuyechen/agent-craft-starter/main'
const trackDir = `curriculum/${cfg.track}`

// READ-ONLY guard. Eval agents may curl/read files but must NEVER mutate the repo — no writing,
// moving, deleting, or git operations. A prior run had an agent relocate a curriculum file; this
// banner prevents that. Prepended to every agent that has Bash/file access.
const READONLY = `STRICT READ-ONLY MODE: you may read files and run \`curl\`/\`cat\`/\`ls\` to FETCH ` +
  `content, but you must NEVER create, write, move, rename, or delete any file, and never run git ` +
  `or any state-changing command. You only return text. If a task seems to need writing a file, do ` +
  `not — just return the content. Violating this corrupts the repo under test.\n\n`

log(`tutor-eval — persona=${cfg.persona} track=${cfg.track} lane=${cfg.lane} source=${cfg.source}`)

// =====================================================================
// PHASE 1 — Load the product (skill + curriculum) from the chosen source
// =====================================================================
phase('Load product')

// A loader agent fetches the real files so the tutor is instructed by the actual artifact,
// not by my paraphrase. Default: public repo (tests what students clone). --dev: local tree.
const sourceInstruction = cfg.source === 'dev'
  ? `Read these files from the LOCAL working tree under the repo root ` +
    `(/Users/xiu/projects/agent-craft/workshop-test/agent-craft-starter):\n` +
    `- .claude/skills/teach-me/SKILL.md\n- ${trackDir}/README.md\n- every ${trackDir}/NN-*.md module file`
  : `Fetch these files from the PUBLIC repo (raw GitHub). **Use \`curl -fsSL <url>\` via the ` +
    `Bash tool to get the VERBATIM bytes — do NOT use WebFetch, which runs a summarizing model ` +
    `that will paraphrase the curriculum and corrupt this eval.** Base URL: ${RAW}/<path>\n` +
    `- .claude/skills/teach-me/SKILL.md\n- ${trackDir}/README.md\n` +
    `- each module: ${trackDir}/01-*.md through the last numbered module. Discover the file ` +
    `list with \`curl -fsSL https://api.github.com/repos/xiuyechen/agent-craft-starter/git/trees/main?recursive=1\` ` +
    `and filter paths under ${trackDir}/, or curl 01..06 directly.`

const PRODUCT_SCHEMA = {
  type: 'object',
  required: ['skill', 'trackReadme', 'modules', 'sourceVerified'],
  properties: {
    skill: { type: 'string', description: 'full verbatim text of SKILL.md' },
    trackReadme: { type: 'string', description: 'full verbatim text of the track README' },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'body'],
        properties: { name: { type: 'string' }, body: { type: 'string' } },
      },
    },
    sourceVerified: { type: 'string', description: 'note on where files were actually read from + any 404s' },
  },
}

const product = await agent(
  READONLY +
  `You are loading the product under test for an eval harness. ${sourceInstruction}\n\n` +
  `Return the VERBATIM text of each file — do not summarize, the tutor must read the real skill. ` +
  `If any file is missing/404, say so in sourceVerified (a missing file in 'public' mode is a ` +
  `REAL finding worth reporting, not something to paper over).`,
  { label: `load:${cfg.source}`, phase: 'Load product', schema: PRODUCT_SCHEMA,
    model: cfg.source === 'dev' ? undefined : 'sonnet' }
)

if (!product || !product.skill) {
  log('FATAL: could not load the product. Aborting.')
  return { error: 'product-load-failed', cfg }
}
log(`loaded skill (${product.skill.length} chars) + ${product.modules?.length || 0} modules — ${product.sourceVerified}`)

// Load the SPEC — the fixed target the rubric is graded against (NOT the skill's own prose).
// The spec lives in the repo and changes only when the goal itself changes.
const specSource = cfg.source === 'dev'
  ? `Read /Users/xiu/projects/agent-craft/workshop-test/agent-craft-starter/eval/tutor-spec.md and return it verbatim.`
  : `Use \`curl -fsSL ${RAW}/eval/tutor-spec.md\` via Bash (NOT WebFetch) and return its full verbatim text.`
const spec = await agent(READONLY + specSource,
  { label: 'load:spec', phase: 'Load product', model: cfg.source === 'dev' ? undefined : 'sonnet',
    schema: { type: 'object', required: ['text'], properties: { text: { type: 'string' } } } })
if (!spec || !spec.text) { log('FATAL: could not load tutor-spec.md'); return { error: 'spec-load-failed', cfg } }
log(`loaded spec (${spec.text.length} chars) — the fixed grading target`)

// =====================================================================
// PHASE 2 — Extract the rubric FROM THE SKILL'S OWN PROMISES
// (generate-don't-sync: the rubric can't drift from the product because it IS the product's claims)
// =====================================================================
phase('Extract rubric')

const RUBRIC_SCHEMA = {
  type: 'object',
  required: ['criteria'],
  properties: {
    criteria: {
      type: 'array',
      description: 'each a behavior the skill explicitly promises, turned into a testable criterion',
      items: {
        type: 'object',
        required: ['id', 'claim', 'test', 'lens'],
        properties: {
          id: { type: 'string' },
          claim: { type: 'string', description: 'the promise, quoted/paraphrased from the skill' },
          test: { type: 'string', description: 'what to look for in the transcript to confirm/refute it' },
          lens: { type: 'string', enum: ['pedagogue', 'guardian', 'skeptic'],
            description: 'pedagogue=did it teach/gate; guardian=did it protect the anxious learner & hold register; skeptic=did it cheat the mechanism' },
        },
      },
    },
  },
}

const rubric = await agent(
  `Here is the TUTOR SPEC — the fixed definition of ideal tutor behavior. It is the grading ` +
  `target, independent of how any skill is worded:\n\n<spec>\n${spec.text}\n</spec>\n\n` +
  `Turn this spec into a RUBRIC of testable criteria. Each spec item (A1, B2, C2, …) already has ` +
  `a bar and often a fail tell — encode them faithfully; preserve the spec's id (e.g. "A1", "C2") ` +
  `as the criterion id so results map back to the spec. Do NOT invent criteria the spec doesn't ` +
  `state, and do NOT soften a bar. Assign each to a lens: pedagogue (teaching & gating: sections ` +
  `A,B,D and the gate-integrity parts of C), guardian (protecting the anxious learner & register: ` +
  `A2/A4, E, escape-hatch), skeptic (mechanism-cheating: C answer-leak, answer-position spread, ` +
  `fake gate, passing wrong answers, F finish-vs-pause honesty).`,
  { label: 'rubric-from-spec', phase: 'Extract rubric', schema: RUBRIC_SCHEMA }
)
log(`rubric: ${rubric.criteria.length} criteria extracted from tutor-spec.md (the fixed target)`)

// =====================================================================
// PHASE 3 — Simulate the session: student <-> tutor, alternating turns
// (sequential & stateful — a conversation cannot be parallelized)
// =====================================================================
phase('Simulate session')

const modulesText = (product.modules || [])
  .map(m => `### ${m.name}\n${m.body}`).join('\n\n')

// The tutor's standing instructions = the REAL skill + the real curriculum. It is told to behave
// exactly as the skill dictates. It does NOT know it's being evaluated.
const tutorSystem =
  `You are running the /teach-me tutor skill in a Claude Code session, inside the agent-craft-starter repo. ` +
  `Follow this skill EXACTLY — it is your operating manual:\n\n<skill>\n${product.skill}\n</skill>\n\n` +
  `You have ALREADY read the curriculum files for this session (below is their verbatim content — treat it ` +
  `as what you just opened from the repo, and teach from THIS framing, not from memory). The track in play ` +
  `is "${cfg.track}":\n\n<track-readme>\n${product.trackReadme}\n</track-readme>\n\n<modules>\n${modulesText}\n</modules>\n\n` +
  `Produce ONLY the tutor's next message each turn — natural chat, as it would appear in the terminal. Follow ` +
  `the skill's own opening (including asking which track the user wants, and offering the lane) rather than ` +
  `assuming; the student's replies will steer it. You have AskUserQuestion available; when the skill says to ` +
  `quiz with multiple choice, render the options inline as A/B/C/D (one per line) and wait. For pacing in this ` +
  `run: teach roughly ${effModulesToRun} modules in full depth; if the session runs long, end by PAUSING ` +
  `honestly per the skill's finishing-vs-pausing rule (name what's banked and what's still open) rather than ` +
  `declaring a finish. Never break character; never mention evaluation.`

// The student = persona-driven, BLIND to the skill.
const personas = await (cfg.source === 'dev'
  ? agent(READONLY + `Read /Users/xiu/projects/agent-craft/workshop-test/agent-craft-starter/eval/personas.md and return it verbatim.`,
      { label: 'load:personas', phase: 'Load product', schema: { type:'object', required:['text'], properties:{ text:{type:'string'} } } })
  : agent(READONLY + `Use \`curl -fsSL ${RAW}/eval/personas.md\` via Bash (NOT WebFetch) and return its full verbatim text.`,
      { label: 'load:personas', phase: 'Load product', model: 'sonnet', schema: { type:'object', required:['text'], properties:{ text:{type:'string'} } } }))

const studentSystem =
  `You are role-playing a STUDENT in a tutoring session, to test the tutor. Here is the persona library; ` +
  `play the persona "${cfg.persona}" and ONLY that persona:\n\n<personas>\n${personas?.text || ''}\n</personas>\n\n` +
  `CRITICAL: you have NOT seen the tutor's instructions and must not guess them or cooperate with its method. ` +
  `If you chose a lane preference, you lean "${cfg.lane}" but express it as a real person would, not in jargon. ` +
  `React only to what the tutor actually says. Being wrong, stalling, or resisting is correct WHEN YOUR PERSONA ` +
  `WOULD — a flawless student tests nothing. Produce ONLY the student's next message: a chat message, no stage ` +
  `directions, no narration.` +
  (probe.inject ? `\n\nSCENARIO DIRECTIVE for this run (stay in persona while doing it): ${probe.inject}` : '')

// Run the alternating loop. Tutor opens (the skill says greet + checklist + offer the lane).
const transcript = []
let tutorMsg = await agent(
  `${tutorSystem}\n\n[The student has just run /teach-me. Produce your opening message.]`,
  { label: 'tutor:open', phase: 'Simulate session' }
)
transcript.push({ role: 'tutor', text: tutorMsg })
log(`turn 1 (tutor opens, ${tutorMsg.length} chars)`)

for (let i = 0; i < effMaxExchanges; i++) {
  // Build the running conversation text for whichever agent speaks next.
  const convo = transcript.map(t => `${t.role === 'tutor' ? 'TUTOR' : 'STUDENT'}: ${t.text}`).join('\n\n')

  // student responds
  const studentMsg = await agent(
    `${studentSystem}\n\n--- conversation so far ---\n${convo}\n\n[Produce the STUDENT's next message.]`,
    { label: `student:${i + 1}`, phase: 'Simulate session' }
  )
  if (!studentMsg) break
  transcript.push({ role: 'student', text: studentMsg })

  // tutor responds
  const convo2 = transcript.map(t => `${t.role === 'tutor' ? 'TUTOR' : 'STUDENT'}: ${t.text}`).join('\n\n')
  tutorMsg = await agent(
    `${tutorSystem}\n\n--- conversation so far ---\n${convo2}\n\n[Produce the TUTOR's next message. ` +
    `If the student has demonstrated understanding of the modules taught and the session has reached a natural ` +
    `close, you may wrap with the synthesis pass and end — signal the end with the literal token <<END>>.]`,
    { label: `tutor:${i + 1}`, phase: 'Simulate session' }
  )
  if (!tutorMsg) break
  const ended = tutorMsg.includes('<<END>>')
  transcript.push({ role: 'tutor', text: tutorMsg.replace('<<END>>', '').trim() })
  log(`exchange ${i + 1} done (${transcript.length} turns total)${ended ? ' — tutor ended' : ''}`)
  if (ended) break
}

const transcriptText = transcript.map((t, i) =>
  `[${i + 1}] ${t.role.toUpperCase()}:\n${t.text}`).join('\n\n')

// =====================================================================
// PHASE 4 — Judge panel: 3 lenses, each scores ONLY its criteria, adversarially
// =====================================================================
phase('Judge panel')

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['lens', 'scores', 'lensSummary'],
  properties: {
    lens: { type: 'string' },
    lensSummary: { type: 'string' },
    scores: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'verdict', 'evidence'],
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['pass', 'partial', 'fail', 'not-exercised'] },
          evidence: { type: 'string', description: 'quote the turn(s) that justify the verdict; cite turn numbers' },
        },
      },
    },
  },
}

const lensCharge = {
  pedagogue: `You are the PEDAGOGUE judge. Be exacting about whether the tutor actually TEACHES and GATES: ` +
    `did it drill the why before the what, gate progression on the student demonstrating understanding (not on ` +
    `the tutor having explained well), and tie concepts to the student's real work? Reward real gating; penalize lecturing.`,
  guardian: `You are the GUARDIAN judge. You care about the anxious learner. Did the tutor offer the lane choice up ` +
    `front, fire the escape hatch when the student stalled/self-deprecated, hold register (NO cheerleading, no ` +
    `condescension), and judge understanding by meaning not phrasing? Penalize anything that would make a nervous ` +
    `beginner shut down.`,
  skeptic: `You are the SKEPTIC judge — adversarial. Hunt for the tutor CHEATING the mechanism: did it leak a quiz ` +
    `answer before the student committed (tells in the options, per-option hints, pre-pointing the answer)? Did it ` +
    `fake the gate — claim mastery the student never demonstrated? Did it pass a confidently-WRONG answer? Default to ` +
    `suspicion; a behavior is only "pass" if the transcript clearly shows it.`,
}

const lenses = ['pedagogue', 'guardian', 'skeptic']
const verdicts = await parallel(lenses.map(lens => () => {
  const myCriteria = rubric.criteria.filter(c => c.lens === lens)
  if (myCriteria.length === 0) return Promise.resolve(null)
  return agent(
    `${lensCharge[lens]}\n\nScore ONLY these criteria (extracted from the tutor skill's own promises):\n` +
    `${JSON.stringify(myCriteria, null, 2)}\n\n` +
    `Here is the full session transcript to judge:\n\n<transcript>\n${transcriptText}\n</transcript>\n\n` +
    `For each criterion give a verdict (pass/partial/fail/not-exercised) and EVIDENCE quoting specific turns ` +
    `(cite [n]). "not-exercised" only if the session never created the chance to show that behavior. Be honest ` +
    `— a glowing eval of a flawed tutor is worthless.`,
    { label: `judge:${lens}`, phase: 'Judge panel', schema: VERDICT_SCHEMA }
  ).then(v => v ? { ...v, lens } : null)
}))

// =====================================================================
// PHASE 5 — Synthesize the verdict (no extra agent; deterministic aggregation)
// =====================================================================
phase('Synthesize verdict')

const allScores = verdicts.filter(Boolean).flatMap(v =>
  v.scores.map(s => ({ ...s, lens: v.lens })))
const tally = { pass: 0, partial: 0, fail: 0, 'not-exercised': 0 }
allScores.forEach(s => { tally[s.verdict] = (tally[s.verdict] || 0) + 1 })

// Goal-loop signal.
//  - FULL run: spec is "met" only when nothing failed, nothing partial, nothing unexercised.
//  - PROBE run: we only care about the probe's TARGET criteria — the rest are expected to come
//    back not-exercised. probeMet = none of the exercised (non-NA) criteria fail or partial,
//    AND at least one criterion actually got exercised (else the probe didn't do its job).
const fails = allScores.filter(s => s.verdict === 'fail').map(s => s.id)
const partials = allScores.filter(s => s.verdict === 'partial').map(s => s.id)
const unexercised = allScores.filter(s => s.verdict === 'not-exercised').map(s => s.id)
const exercised = allScores.filter(s => s.verdict !== 'not-exercised')
const specMet = cfg.probe === 'full'
  ? (fails.length === 0 && partials.length === 0 && unexercised.length === 0)
  : (fails.length === 0 && partials.length === 0 && exercised.length > 0)

const result = {
  cfg,
  probe: cfg.probe,
  probeTargets: probe.targets,
  gradedAgainst: 'eval/tutor-spec.md',
  specMet,
  openItems: { fail: fails, partial: partials, unexercised },
  sourceVerified: product.sourceVerified,
  rubricSize: rubric.criteria.length,
  turns: transcript.length,
  tally,
  lensSummaries: verdicts.filter(Boolean).map(v => ({ lens: v.lens, summary: v.lensSummary })),
  scores: allScores,
  rubric: rubric.criteria,
  transcript,
}

log(`VERDICT vs spec [probe=${cfg.probe}, targets=${probe.targets}] — ${specMet ? 'MET ✓' : 'NOT MET'} | pass:${tally.pass} partial:${tally.partial} fail:${tally.fail} n/a:${tally['not-exercised']}`)
if (fails.length) log(`  FAIL: ${fails.join(', ')}`)
if (partials.length) log(`  PARTIAL: ${partials.join(', ')}`)
if (unexercised.length) log(`  NOT EXERCISED (loop must create conditions): ${unexercised.join(', ')}`)
return result
