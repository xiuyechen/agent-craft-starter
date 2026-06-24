#!/usr/bin/env node
// Render a tutor-eval run (JSON) into a self-contained demo HTML page.
// Usage: node eval/render.js eval/runs/<run>.json [out.html]
// Deterministic: the page is GENERATED from the verdict, never hand-edited.

const fs = require('fs');
const path = require('path');

const inPath = process.argv[2];
if (!inPath) { console.error('usage: node render.js <run.json> [out.html]'); process.exit(1); }
const run = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const outPath = process.argv[3] || path.join(path.dirname(inPath), '..', '..', 'demo.html');

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Light inline formatting for transcript text: **bold**, `code`, and option lines (A. / B.)
function fmt(text) {
  const lines = esc(text).split('\n');
  return lines.map(line => {
    let l = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    // checklist lines
    if (/^\s*-\s*\[[ x]\]/.test(line)) {
      const done = /\[x\]/.test(line);
      l = l.replace(/^\s*-\s*\[[ x]\]\s*/, '');
      return `<div class="cl ${done ? 'done' : ''}"><span class="box">${done ? '✓' : ''}</span>${l}</div>`;
    }
    // quiz option lines: **A.** ... or A. ...
    if (/^\s*(<strong>)?[A-D]\.(<\/strong>)?\s/.test(line)) {
      return `<div class="opt">${l}</div>`;
    }
    if (line.trim() === '') return '<div class="sp"></div>';
    return `<div class="ln">${l}</div>`;
  }).join('');
}

const vClass = { pass: 'v-pass', partial: 'v-partial', fail: 'v-fail', 'not-exercised': 'v-na' };
const vLabel = { pass: 'PASS', partial: 'PARTIAL', fail: 'FAIL', 'not-exercised': 'N/A' };
const lensName = { pedagogue: 'Pedagogue', guardian: 'Guardian', skeptic: 'Skeptic' };
const lensTag = {
  pedagogue: 'did it teach &amp; gate',
  guardian: 'did it protect the anxious learner &amp; hold register',
  skeptic: 'did it cheat the mechanism',
};

const c = run.cfg;
const t = run.tally;
const byId = Object.fromEntries(run.rubric.map(r => [r.id, r]));

// scorecard grouped by lens
const lensOrder = ['pedagogue', 'guardian', 'skeptic'];
const scoresByLens = {};
run.scores.forEach(s => { (scoresByLens[s.lens] ||= []).push(s); });

const summaryByLens = Object.fromEntries((run.lensSummaries || []).map(l => [l.lens, l.summary]));

const transcriptHTML = run.transcript.map((turn, i) => {
  const who = turn.role === 'tutor' ? 'Tutor' : 'Student';
  return `<div class="turn ${turn.role}">
    <div class="turn-meta"><span class="turn-n">${i + 1}</span><span class="turn-who">${who}</span></div>
    <div class="turn-body">${fmt(turn.text)}</div>
  </div>`;
}).join('\n');

const scorecardHTML = lensOrder.filter(l => scoresByLens[l]).map(lens => {
  const rows = scoresByLens[lens].map(s => {
    const claim = byId[s.id]?.claim || '';
    return `<div class="crit">
      <div class="crit-head">
        <span class="crit-id">${esc(s.id)}</span>
        <span class="badge ${vClass[s.verdict]}">${vLabel[s.verdict]}</span>
      </div>
      <div class="crit-claim">${esc(claim)}</div>
      <details class="crit-ev"><summary>evidence</summary><div>${esc(s.evidence)}</div></details>
    </div>`;
  }).join('');
  return `<section class="lens">
    <h3 class="lens-h"><span class="lens-name">${lensName[lens]}</span><span class="lens-tag">${lensTag[lens]}</span></h3>
    <p class="lens-sum">${esc(summaryByLens[lens] || '')}</p>
    <div class="crits">${rows}</div>
  </section>`;
}).join('\n');

const html = `<title>Agent Craft — Tutor Demo &amp; Eval</title>
<style>
  :root{
    --ground:#0F1620;--ground-raised:#16202C;--ground-sunken:#0A0F16;
    --text:#E8EDF2;--text-dim:#94A3B2;--text-faint:#5E6E7E;
    --accent:#7DE0C2;--accent-deep:#2E5F54;--accent-2:#F2B5A0;--accent-2-deep:#6E3A30;
    --amber:#E8C97D;--rule:#243240;--rule-soft:#1B2530;
    --mono:"JetBrains Mono","SF Mono","Menlo","Consolas",ui-monospace,monospace;
    --display:"Space Grotesk","Avenir Next","Segoe UI",system-ui,sans-serif;
    --body:"Inter",-apple-system,"Segoe UI",system-ui,sans-serif;
    --maxw:820px;
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--ground);color:var(--text);font-family:var(--body);font-size:16.5px;line-height:1.6;-webkit-font-smoothing:antialiased;}
  body::before{content:"";position:fixed;inset:0;background-image:linear-gradient(var(--rule-soft) 1px,transparent 1px),linear-gradient(90deg,var(--rule-soft) 1px,transparent 1px);background-size:38px 38px;opacity:.22;pointer-events:none;z-index:0;}
  .wrap{position:relative;z-index:1;max-width:var(--maxw);margin:0 auto;padding:0 24px 96px;}
  a{color:var(--accent);}
  a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px;}

  header.hero{padding:80px 0 36px;border-bottom:1px solid var(--rule);}
  .eyebrow{font-family:var(--mono);font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin:0 0 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .eyebrow .rule{flex:1;height:1px;background:linear-gradient(90deg,var(--accent-deep),transparent);min-width:30px;}
  .repo-link{font-family:var(--mono);font-size:12px;letter-spacing:.05em;text-transform:none;color:var(--text-dim);text-decoration:none;border-bottom:1px solid var(--rule);}
  .repo-link:hover{color:var(--accent);}
  h1{font-family:var(--display);font-weight:600;font-size:clamp(34px,6vw,52px);line-height:1.04;letter-spacing:-.02em;margin:0 0 20px;}
  h1 .soft{color:var(--text-dim);}
  .lede{font-size:18px;color:var(--text-dim);max-width:62ch;margin:0 0 28px;}
  .lede strong{color:var(--text);}
  .chips{display:flex;flex-wrap:wrap;gap:8px;}
  .chip{font-family:var(--mono);font-size:11.5px;letter-spacing:.04em;color:var(--text-dim);background:var(--ground-raised);border:1px solid var(--rule);border-radius:20px;padding:5px 12px;}
  .chip b{color:var(--accent);font-weight:500;}

  .honesty{margin:28px 0 0;padding:18px 22px;background:var(--ground-raised);border:1px solid var(--rule);border-left:3px solid var(--amber);border-radius:4px;font-size:14.5px;color:var(--text-dim);}
  .honesty b{color:var(--amber);}
  .honesty strong{color:var(--text);}

  .section-label{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:56px 0 6px;display:flex;align-items:center;gap:12px;}
  .section-label::after{content:"";flex:1;height:1px;background:var(--rule);}
  .section-sub{color:var(--text-faint);font-size:14px;margin:0 0 24px;max-width:60ch;}

  /* transcript */
  .turn{display:grid;grid-template-columns:64px 1fr;gap:16px;padding:18px 0;border-bottom:1px solid var(--rule-soft);}
  .turn-meta{text-align:right;font-family:var(--mono);font-size:11px;padding-top:3px;}
  .turn-n{display:block;color:var(--text-faint);}
  .turn-who{display:block;margin-top:3px;letter-spacing:.05em;}
  .turn.tutor .turn-who{color:var(--accent);}
  .turn.student .turn-who{color:var(--accent-2);}
  .turn-body{border-left:2px solid transparent;padding-left:16px;}
  .turn.tutor .turn-body{border-left-color:var(--accent-deep);}
  .turn.student .turn-body{border-left-color:var(--accent-2-deep);}
  .turn.student .turn-body{color:var(--text-dim);}
  .ln{margin:0 0 2px;}
  .sp{height:9px;}
  .turn-body code{font-family:var(--mono);font-size:.85em;background:var(--ground-sunken);border:1px solid var(--rule-soft);padding:1px 5px;border-radius:3px;color:var(--accent);}
  .opt{font-family:var(--mono);font-size:13.5px;background:var(--ground-sunken);border:1px solid var(--rule-soft);border-radius:4px;padding:7px 11px;margin:5px 0;color:var(--text);}
  .cl{font-family:var(--mono);font-size:13.5px;display:flex;gap:9px;align-items:baseline;margin:2px 0;color:var(--text-dim);}
  .cl .box{display:inline-block;width:15px;height:15px;border:1px solid var(--rule);border-radius:3px;text-align:center;line-height:14px;font-size:10px;color:var(--ground);flex:none;}
  .cl.done .box{background:var(--accent);border-color:var(--accent);}
  .cl.done{color:var(--text);}

  /* scorecard */
  .tally{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 28px;}
  .tally .t{font-family:var(--mono);font-size:13px;padding:8px 14px;border-radius:5px;border:1px solid var(--rule);background:var(--ground-raised);}
  .tally .t b{font-size:18px;font-family:var(--display);margin-right:6px;}
  .t.pass b{color:var(--accent);}.t.partial b{color:var(--amber);}.t.fail b{color:var(--accent-2);}.t.na b{color:var(--text-faint);}

  .lens{margin:0 0 36px;}
  .lens-h{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:0 0 8px;font-family:var(--display);}
  .lens-name{font-size:21px;font-weight:600;}
  .lens-tag{font-family:var(--mono);font-size:12px;color:var(--text-faint);letter-spacing:.03em;}
  .lens-sum{color:var(--text-dim);font-size:14.5px;margin:0 0 18px;padding-left:14px;border-left:2px solid var(--rule);}
  .crit{padding:13px 0;border-top:1px solid var(--rule-soft);}
  .crit-head{display:flex;align-items:center;gap:12px;margin-bottom:5px;}
  .crit-id{font-family:var(--mono);font-size:12px;color:var(--text-faint);}
  .badge{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;padding:2px 8px;border-radius:3px;font-weight:600;}
  .v-pass{background:rgba(125,224,194,.14);color:var(--accent);border:1px solid var(--accent-deep);}
  .v-partial{background:rgba(232,201,125,.14);color:var(--amber);border:1px solid #6e5e2e;}
  .v-fail{background:rgba(242,181,160,.14);color:var(--accent-2);border:1px solid var(--accent-2-deep);}
  .v-na{background:var(--ground-sunken);color:var(--text-faint);border:1px solid var(--rule);}
  .crit-claim{font-size:14.5px;color:var(--text);margin-bottom:5px;}
  .crit-ev{font-size:13px;}
  .crit-ev summary{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--text-faint);cursor:pointer;text-transform:uppercase;}
  .crit-ev summary:hover{color:var(--accent);}
  .crit-ev>div{margin-top:8px;color:var(--text-dim);padding-left:12px;border-left:2px solid var(--rule-soft);}

  footer{margin-top:64px;padding-top:28px;border-top:1px solid var(--rule);color:var(--text-faint);font-size:14px;}
  .next{padding:22px 24px;background:var(--ground-raised);border:1px solid var(--rule);border-left:3px solid var(--accent);border-radius:4px;margin-top:18px;}
  .next-label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;}
  .next-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:11px;}
  .next-list a{font-family:var(--display);font-size:16px;font-weight:600;color:var(--text);text-decoration:none;border-bottom:1px solid var(--accent-deep);}
  .next-list a:hover{color:var(--accent);}
  .next-why{color:var(--text-faint);font-size:13.5px;margin-left:6px;}
  .gen-note{margin-top:24px;font-family:var(--mono);font-size:12px;color:var(--text-faint);}

  @media (max-width:560px){
    .turn{grid-template-columns:1fr;gap:6px;}
    .turn-meta{text-align:left;display:flex;gap:10px;}
  }
  @media (prefers-reduced-motion:reduce){*{scroll-behavior:auto;}}
</style>

<div class="wrap">
  <header class="hero">
    <p class="eyebrow">Agent Craft · Tutor Demo<span class="rule"></span><a class="repo-link" href="https://github.com/xiuyechen/agent-craft-starter">view the repo ↗</a></p>
    <h1>Watch the homework happen.<br><span class="soft">A real tutored session — and how we graded it.</span></h1>
    <p class="lede">Before you commit an hour to the homework, read someone else do it. Below is a
    <strong>real simulated session</strong>: a nervous-beginner persona working through the
    <strong>Anatomy of Claude Code</strong> tour with the tutor — followed by an honest
    scorecard of how the tutor scored against <strong>its own stated promises.</strong></p>
    <div class="chips">
      <span class="chip">persona <b>${esc(c.persona)}</b></span>
      <span class="chip">track <b>${esc(c.track)}</b></span>
      <span class="chip">lane <b>${esc(c.lane)}</b></span>
      <span class="chip">source <b>${esc(c.source)} repo</b></span>
      <span class="chip">${run.turns} turns · ${run.rubricSize} criteria</span>
    </div>
    <div class="honesty">
      <b>What this is, honestly.</b> This is not a screen recording. A model played the
      <strong>${esc(c.persona)}</strong> student against the <strong>actual tutor skill fetched
      from the ${esc(c.source)} repo</strong> — the same files you clone. The grades below come
      from an LLM judge panel scoring the transcript against the skill's own promises, so they
      carry the usual judge caveats. We show the partials and gaps, not just the wins — that's
      the point.
    </div>
  </header>

  <p class="section-label">The session</p>
  <p class="section-sub">Tutor turns are mint-edged; the student is coral. The student never saw
  the tutor's instructions, so it can't play along — it stalls, hedges, and self-deprecates like
  a real anxious beginner.</p>
  <div class="transcript">${transcriptHTML}</div>

  <p class="section-label">The scorecard</p>
  <p class="section-sub">Every criterion is extracted from the skill's own text — what it
  <em>promises</em> to do — then graded against the transcript by three adversarial lenses.
  Open "evidence" to see the exact turns cited.</p>
  <div class="tally">
    <span class="t pass"><b>${t.pass}</b>pass</span>
    <span class="t partial"><b>${t.partial}</b>partial</span>
    <span class="t fail"><b>${t.fail}</b>fail</span>
    <span class="t na"><b>${t['not-exercised']}</b>not exercised</span>
  </div>
  ${scorecardHTML}

  <footer>
    <div class="next">
      <span class="next-label">Where to go next</span>
      <ul class="next-list">
        <li><a href="https://xiuyechen.github.io/agent-craft-starter/setup-guide.html">Set up &amp; start →</a><span class="next-why">install, then run the tutor yourself</span></li>
        <li><a href="https://github.com/xiuyechen/agent-craft-starter/blob/main/HOMEWORK.md">The homework →</a><span class="next-why">what you'll actually do</span></li>
        <li><a href="https://github.com/xiuyechen/agent-craft-starter">The repo →</a><span class="next-why">curriculum, the tutor skill, this eval harness</span></li>
      </ul>
    </div>
    <p class="gen-note">Generated by the <code>tutor-eval</code> harness (<code>eval/</code> in the repo)
    from a run against the ${esc(c.source)} repo. Re-runnable after any skill edit — the scorecard
    regenerates from the skill's current promises.</p>
  </footer>
</div>`;

fs.writeFileSync(outPath, html);
console.log('wrote', outPath, `(${html.length} bytes)`);
