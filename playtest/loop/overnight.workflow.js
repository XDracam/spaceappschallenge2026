export const meta = {
  name: 'overnight-playtest',
  description: 'Loop: four naive agents play the game, findings are triaged, allowed fixes are made, gated and committed on the playtest branch',
  whenToUse: 'Unattended polishing run in a dedicated git worktree. Never run it in a checkout someone is working in.',
  phases: [
    { title: 'Preflight', detail: 'dedicated worktree, clean tree, right branch' },
    { title: 'Start', detail: 'build the game and open four stations' },
    { title: 'Play', detail: 'four players with no knowledge of the game' },
    { title: 'Triage', detail: 'classify what they struggled with' },
    { title: 'Fix', detail: 'bugs and clarity only, small diffs' },
    { title: 'Gate', detail: 'typecheck, build, commit or revert' },
    { title: 'Wrap-up', detail: 'playtest record and morning list' },
  ],
}

// args: {
//   repo:       absolute path of the dedicated worktree (forward slashes)
//   branch:     branch that worktree is on; the loop commits there and never pushes
//   stamp:      prefix for round ids, e.g. "1114"
//   maxRounds:  hard cap on rounds (default 8)
//   stopHour:   local hour (0-23) after which no new round starts (default 7)
//   minutes:    session length per round (default 30)
//   speed:      calendar speed relative to the game's default (default 0.5)
//   manualLobbyEvery: every Nth round the players do the lobby themselves (default 3; 0 = never)
//   maxFixes:   findings the fixer may address per round (default 4)
//   playerModel: model for the players (default "sonnet")
// }
const A = args ?? {}
const REPO = A.repo
const BRANCH = A.branch
if (!REPO || !BRANCH || !A.stamp) throw new Error('args.repo, args.branch and args.stamp are required')
const MAX_ROUNDS = A.maxRounds ?? 8
const STOP_HOUR = A.stopHour ?? 7
const MINUTES = A.minutes ?? 30
const SPEED = A.speed ?? 0.5
const MANUAL_EVERY = A.manualLobbyEvery ?? 3
const MAX_FIXES = A.maxFixes ?? 4
const PLAYER_MODEL = A.playerModel ?? 'sonnet'
const PT = `${REPO}/playtest`
const PT_CLI = `${PT}/harness/pt.mjs`

const OK = { type: 'object', properties: { ok: { type: 'boolean' }, detail: { type: 'string' } }, required: ['ok', 'detail'] }

// ------------------------------------------------------------------ preflight

phase('Preflight')
const pre = await agent(
  `Check that an unattended job may change code in the git checkout at "${REPO}". Run these and report; change nothing.\n` +
  `1. git -C "${REPO}" rev-parse --abbrev-ref HEAD   -> must print exactly "${BRANCH}", and must not be main or master.\n` +
  `2. git -C "${REPO}" status --porcelain            -> must print nothing (clean tree).\n` +
  `3. These must exist: "${PT}/harness/server.mjs", "${PT}/node_modules/playwright-core", "${REPO}/game/node_modules/vite".\n` +
  `4. node "${PT}/harness/ptadmin.mjs" status        -> must say "harness not running".\n` +
  `ok is true only if all four hold. In detail, say which one failed and what you saw.`,
  { label: 'preflight', phase: 'Preflight', schema: OK, model: 'haiku', effort: 'low' })
if (!pre?.ok) return { stopped: 'preflight failed', detail: pre?.detail ?? 'no answer' }

// ------------------------------------------------------------------ round pieces

const playerPrompt = (n) =>
  `You are a player in a playtest. Your complete instructions are in the file "${PT}/briefs/player.md". ` +
  `Read that one file now, with the Read tool. In it, {{N}} is ${n} and {{PT}} is ${PT_CLI}. ` +
  `It is the only file you may open apart from the screenshots your own command prints. ` +
  `The session lasts about ${MINUTES} minutes. Follow the brief until the command says SESSION OVER, then answer with the final report it asks for, in normal full sentences.`

const TRIAGE = {
  type: 'object',
  properties: {
    progress: { type: 'string', description: 'how far the team got, one sentence' },
    missionStarted: { type: 'boolean' },
    launched: { type: 'boolean' },
    goalsAchieved: { type: 'string', description: 'e.g. "1 of 2", or "none", or "unknown"' },
    fixable: { type: 'number', description: 'findings of class bug or clarity' },
    design: { type: 'number' },
    artifacts: { type: 'number' },
    worst: { type: 'array', items: { type: 'string' }, description: 'titles of the three worst findings' },
  },
  required: ['progress', 'missionStarted', 'launched', 'goalsAchieved', 'fixable', 'design', 'artifacts', 'worst'],
}
const FIX = {
  type: 'object',
  properties: {
    fixed: { type: 'number' },
    needsDesign: { type: 'number' },
    files: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string', description: 'one line per fix: what the player will now see' },
  },
  required: ['fixed', 'needsDesign', 'files', 'summary'],
}
const GATE = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'typecheck and build passed' },
    committed: { type: 'boolean' },
    reverted: { type: 'boolean' },
    commit: { type: 'string', description: 'short hash, or empty' },
    detail: { type: 'string' },
  },
  required: ['ok', 'committed', 'reverted', 'commit', 'detail'],
}

const rounds = []
let startFailures = 0
let gateFailures = 0
let dry = 0

for (let i = 1; i <= MAX_ROUNDS; i++) {
  const round = `${A.stamp}-r${String(i).padStart(2, '0')}`
  const lobby = MANUAL_EVERY > 0 && i % MANUAL_EVERY === 1 ? 'manual' : 'auto'

  // Stop when morning has come. Evening hours (12-23) never count as morning.
  const clock = await agent(
    `Run: date +%H   and answer with that hour as a number (0-23). Round marker: ${round}.`,
    { label: `clock ${round}`, phase: 'Start', model: 'haiku', effort: 'low',
      schema: { type: 'object', properties: { hour: { type: 'number' } }, required: ['hour'] } })
  if (clock && clock.hour >= STOP_HOUR && clock.hour < 12) { log(`It is ${clock.hour}:00 — no new round.`); break }

  // ---- start
  const start = await agent(
    `Start one playtest round and report whether it is ready. Run exactly this, and wait for it (up to 4 minutes):\n` +
    `node "${PT}/harness/start.mjs" --round ${round} --lobby ${lobby} --minutes ${MINUTES} --speed ${SPEED}\n` +
    `ok is true only if the output contains a line starting with READY. Otherwise put the output in detail. ` +
    `If the output says a harness is already running, run: node "${PT}/harness/ptadmin.mjs" stop "stale"   then wait 5 seconds and run the start command once more. Do nothing else.`,
    { label: `start ${round}`, phase: 'Start', schema: OK, model: 'haiku', effort: 'low' })
  if (!start?.ok) {
    startFailures++
    log(`${round}: harness did not start (${(start?.detail ?? 'no answer').slice(0, 200)})`)
    rounds.push({ round, lobby, started: false, detail: start?.detail ?? '' })
    if (startFailures >= 2) { log('Two rounds failed to start — stopping.'); break }
    continue
  }
  startFailures = 0

  // ---- play (barrier: triage needs all four reports)
  const reports = await parallel([1, 2, 3, 4].map((n) => () =>
    agent(playerPrompt(n), { label: `${round} player ${n}`, phase: 'Play', model: PLAYER_MODEL, agentType: 'general-purpose' })))
  const got = reports.filter(Boolean).length
  log(`${round}: ${got}/4 player reports`)

  // ---- triage
  const reportText = reports.map((r, k) => `=== PLAYER ${k + 1} REPORT ===\n${r ?? '(this player returned no report)'}`).join('\n\n')
  const triage = await agent(
    `Triage playtest round ${round} of the game in "${REPO}".\n` +
    `First: run   node "${PT}/harness/ptadmin.mjs" stop "players done"   (it may answer "harness not running"; fine), wait until "${PT}/runs/${round}/summary.json" exists (up to 30 seconds), ` +
    `and save the four player reports below as "${PT}/runs/${round}/reports/p1.md" … "p4.md", unchanged.\n` +
    `Then follow "${PT}/briefs/triage.md" exactly, with {{ROUND}} = ${round}. "${PT}/runs/${round}/meta.json" holds the round's settings: the calendar ran at ${SPEED}x speed and the lobby was "${lobby}" ` +
    `(with "auto" the players were seated by the harness, so nothing about the lobby can be learned from this round).\n` +
    `Finally append one entry for this round to "${PT}/ledger.json" (a JSON array; create it if missing): ` +
    `{ "round", "lobby", "progress", "findings": [{ "id", "title", "class", "severity", "repeatOf" }] }.\n\n${reportText}`,
    { label: `triage ${round}`, phase: 'Triage', schema: TRIAGE })
  if (!triage) { rounds.push({ round, lobby, started: true, reports: got, triage: null }); continue }

  // ---- fix
  let fix = null
  let gate = null
  if (triage.fixable > 0) {
    dry = 0
    fix = await agent(
      `Fix findings from playtest round ${round} in "${REPO}". Follow "${PT}/briefs/fixer.md" exactly, with {{ROUND}} = ${round} and {{MAX_FIXES}} = ${MAX_FIXES}. ` +
      `You are working in a dedicated checkout on branch "${BRANCH}"; do not commit.`,
      { label: `fix ${round}`, phase: 'Fix', schema: FIX })

    // ---- gate + commit (or revert)
    gate = await agent(
      `Gate the uncommitted changes in "${REPO}" (branch "${BRANCH}") made after playtest round ${round}.\n` +
      `1. git -C "${REPO}" status --porcelain. If nothing changed: ok true, committed false, reverted false, done.\n` +
      `2. Only files under game/src/ and the file playtest/ledger.json may be changed. Anything else: restore it with git checkout -- <file> (or delete it if untracked) and say so in detail.\n` +
      `3. In "${REPO}/game" run: npx tsc --noEmit   then   npx vite build --outDir "${PT}/runs/${round}/gate-dist" --emptyOutDir\n` +
      `4. If both pass: git -C "${REPO}" add game/src playtest/ledger.json, then commit with this message (two -m flags):\n` +
      `   subject: "Playtest ${round}: " followed by a short summary of the fixes (under 70 characters in total)\n` +
      `   body: one line per fix, taken from "${PT}/runs/${round}/fixes.json" ("what"), then a blank line, then exactly: Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>\n` +
      `   Report the short hash. ok true, committed true.\n` +
      `5. If either fails: do not try to repair the code. Run git -C "${REPO}" checkout -- game/src   and   git -C "${REPO}" clean -fd game/src   so the tree is back at the last commit, keep playtest/ledger.json as it is and commit only that file with subject "Playtest ${round}: ledger (fixes reverted)" and the same Co-Authored-By line. ok false, reverted true, and put the first error lines in detail.\n` +
      `Never push. Never switch branches. Never touch any other checkout.`,
      { label: `gate ${round}`, phase: 'Gate', schema: GATE, model: 'sonnet' })
    if (gate && !gate.ok) gateFailures++; else gateFailures = 0
  } else {
    dry++
    log(`${round}: nothing fixable (${triage.design} design, ${triage.artifacts} artifacts)`)
  }

  rounds.push({ round, lobby, started: true, reports: got, triage, fix, gate })
  log(`${round}: ${triage.progress} | fixable ${triage.fixable}, design ${triage.design} | ${gate?.committed ? `committed ${gate.commit}` : gate?.reverted ? 'fixes reverted' : 'no commit'}`)

  if (gateFailures >= 2) { log('Fixes failed the gate two rounds in a row — stopping.'); break }
  if (dry >= 2) { log('Two rounds in a row with nothing fixable — stopping.'); break }
}

// ------------------------------------------------------------------ wrap-up

phase('Wrap-up')
const played = rounds.filter((r) => r.started && r.triage)
let wrap = null
if (played.length) {
  wrap = await agent(
    `Write up an unattended agent playtest run of the game in "${REPO}" (branch "${BRANCH}"). Rounds: ${played.map((r) => r.round).join(', ')}. ` +
    `Evidence per round is in "${PT}/runs/<round>/" (triage.md, findings.json, fixes.json, summary.json, reports/); the history is "${PT}/ledger.json"; commits are in git log.\n` +
    `Read "${REPO}/AGENTS.md" first and keep to it: record observations, do not present anything as an accepted decision, do not claim enjoyment or absence of waiting was shown.\n` +
    `Write two files and commit them on "${BRANCH}" (never push), commit message subject "Playtest ${A.stamp}: record and morning list", body ending with: Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>\n` +
    `1. "${REPO}/docs/playtests/2026-${A.stamp.slice(0, 2)}-${A.stamp.slice(2, 4)}-agent-playtest-loop.md" — follow docs/playtests/TEMPLATE.md. Participants are AI agents with no knowledge of the game; say so, and say what that can and cannot show. ` +
    `Include a table: round, lobby mode, how far the team got, goals achieved, findings by class, commit. Add a link to it in docs/README.md next to the other playtests.\n` +
    `2. "${PT}/morning.md" — for the team to read first: (a) what was changed, per commit, one line each, with the finding it answers; (b) every finding of class design, grouped, worst first, with its evidence and proposal — these were deliberately not touched and need a decision; ` +
    `(c) findings that came back after a fix (repeatOf); (d) anything that got worse from one round to the next; (e) how to drop the night's work: the exact git command to delete branch "${BRANCH}".\n` +
    `Answer with the path of morning.md and a five-line summary.`,
    { label: 'morning report', phase: 'Wrap-up' })
}

return {
  rounds: rounds.map((r) => ({
    round: r.round, lobby: r.lobby, started: r.started, reports: r.reports ?? 0,
    progress: r.triage?.progress ?? null, goals: r.triage?.goalsAchieved ?? null,
    fixable: r.triage?.fixable ?? 0, design: r.triage?.design ?? 0,
    fixed: r.fix?.fixed ?? 0, commit: r.gate?.commit ?? '', reverted: !!r.gate?.reverted,
  })),
  wrap,
}
