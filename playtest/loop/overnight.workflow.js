export const meta = {
  name: 'overnight-playtest',
  description: 'Loop until morning: four naive agents play the game, findings are triaged, small fixes and one root rework per round are made, gated and committed on the playtest branch',
  whenToUse: 'Unattended polishing run in a dedicated git worktree. Never run it in a checkout someone is working in.',
  phases: [
    { title: 'Preflight', detail: 'dedicated worktree, clean tree, right branch' },
    { title: 'Start', detail: 'build the game and open four stations' },
    { title: 'Play', detail: 'four players with no knowledge of the game' },
    { title: 'Triage', detail: 'classify findings, judge the previous changes' },
    { title: 'Polish', detail: 'bugs and unclear screens, small diffs' },
    { title: 'Rework', detail: 'one root problem per round: systems, rules, content' },
    { title: 'Judge', detail: 'an agent who did not make the change accepts only what is clearly better' },
    { title: 'Gate', detail: 'typecheck, build, commit or revert' },
    { title: 'Wrap-up', detail: 'playtest record and morning list' },
  ],
}

// args: {
//   repo:       absolute path of the dedicated worktree (forward slashes)
//   branch:     branch that worktree is on; the loop commits there and never pushes
//   avoid:      absolute path of the team's own checkout, which no agent may touch
//   stamp:      prefix for round ids, e.g. "1115"
//   seed:       optional { round, reworkPick }: a round already played and triaged; its findings are worked on before round 1
//   maxRounds:  hard cap on rounds (default 8)
//   improveLastRound: false = after the last round only triage, no further changes (default true)
//   stopHour:   local hour (0-23) from which no new round starts (default 7)
//   minutes:    session length per round (default 30)
//   speed:      calendar speed relative to the game's default (default 0.5)
//   manualLobbyEvery: every Nth round the players do the lobby themselves (default 3; 0 = never)
//   maxFixes:   findings the polish step may address per round (default 4)
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
// pushToMain: true = every judge-accepted, gated commit is rebased onto origin/main and pushed there (deploys the site)
const PUSH = A.pushToMain === true
const PT = `${REPO}/playtest`
const PT_CLI = `${PT}/harness/pt.mjs`
const TRAILER = 'Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>'

const WHERE =
  `You work only in the git checkout at "${REPO}" (branch "${BRANCH}"). Use absolute paths, and "git -C "${REPO}" …" for git. ` +
  (A.avoid ? `A second checkout of the same project exists at "${A.avoid}": it belongs to the team. Never read from it, write to it or run a command in it. ` : '') +
  `Never switch branches. Never push, except where a step tells you to.`

const OK = { type: 'object', properties: { ok: { type: 'boolean' }, head: { type: 'string', description: 'short hash of HEAD' }, detail: { type: 'string' } }, required: ['ok', 'head', 'detail'] }
const TRIAGE = {
  type: 'object',
  properties: {
    progress: { type: 'string', description: 'how far the team got, one sentence' },
    launched: { type: 'boolean' },
    goalsAchieved: { type: 'string', description: 'e.g. "1 of 2", "none", "unknown"' },
    fixable: { type: 'number', description: 'findings of class bug or clarity whose symptomOf is null' },
    design: { type: 'number' },
    artifacts: { type: 'number' },
    worst: { type: 'array', items: { type: 'string' }, description: 'titles of the three worst findings' },
    reworkPick: { type: 'string', description: 'id of the design finding to rework next, or empty string' },
    reworkWhy: { type: 'string' },
    revertCommits: { type: 'array', items: { type: 'string' }, description: 'short hashes of earlier changes that harmed play; usually empty' },
    verdicts: { type: 'string', description: 'one line per change of the previous round: helped / no effect / harmed' },
  },
  required: ['progress', 'launched', 'goalsAchieved', 'fixable', 'design', 'artifacts', 'worst', 'reworkPick', 'reworkWhy', 'revertCommits', 'verdicts'],
}
const WORK = {
  type: 'object',
  properties: {
    changed: { type: 'boolean', description: 'true if you left changes in the working tree' },
    summary: { type: 'string', description: 'what the players will now see, one line per change' },
    notVerified: { type: 'string' },
  },
  required: ['changed', 'summary', 'notVerified'],
}
const GATE = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'typecheck and build passed, or nothing to gate' },
    committed: { type: 'boolean' },
    reverted: { type: 'boolean' },
    commit: { type: 'string', description: 'short hash, or empty' },
    detail: { type: 'string' },
  },
  required: ['ok', 'committed', 'reverted', 'commit', 'detail'],
}

// ------------------------------------------------------------------ steps

/** Typecheck + build the uncommitted changes; commit them as one commit, or put the tree back. */
const gate = (round, kind, subjectHint) => agent(
  `${WHERE}\nGate the uncommitted changes made by the "${kind}" step after playtest round ${round}.\n` +
  `1. git -C "${REPO}" status --porcelain. If nothing under game/src/ or playtest/harness/ changed: answer ok true, committed false, reverted false (first restore playtest/changes.md with git checkout if it changed).\n` +
  `2. Only these may be changed: files under game/src/, playtest/harness/server.mjs, playtest/changes.md. Restore anything else with git checkout -- <file> (delete it if untracked, except under playtest/runs/) and mention it in detail. Leave playtest/ledger.json alone.\n` +
  `3. In "${REPO}/game" run: npx tsc --noEmit   then   npx vite build --outDir "${PT}/runs/${round}/gate-dist" --emptyOutDir   Also run: node --check "${PT}/harness/server.mjs"\n` +
  `4. If all pass: git -C "${REPO}" add game/src playtest/harness/server.mjs playtest/changes.md   and commit with two -m flags. ` +
  `A judge has already accepted these changes; if "${PT}/runs/${round}/judge-${kind}.json" exists, mention only accepted findings in the message. ` +
  `Subject: "Playtest ${round} ${kind}: " plus a short summary (${subjectHint}), under 72 characters in total. Body: one line per change taken from "${PT}/runs/${round}/${kind === 'rework' ? 'rework.json' : 'fixes.json'}", a blank line, then exactly: ${TRAILER}\n` +
  (PUSH
    ? `   Then publish it to the team's main branch: git -C "${REPO}" fetch origin, git -C "${REPO}" rebase origin/main. If the rebase conflicts: git -C "${REPO}" rebase --abort, keep the commit only here and say "not pushed: conflict" in detail. ` +
      `Otherwise run npx tsc --noEmit in "${REPO}/game" again; if it passes, git -C "${REPO}" push origin HEAD:main (never --force; if the push is rejected, fetch, rebase and try once more, then give up and say so). If tsc fails after the rebase, do not push; say so in detail.\n`
    : '') +
  `   Answer ok true, committed true, and the short hash.\n` +
  `5. If any fails: do not repair the code. Put the tree back: git -C "${REPO}" checkout -- game/src playtest/harness playtest/changes.md   and   git -C "${REPO}" clean -fd game/src. ` +
  `Answer ok false, reverted true, with the first error lines in detail, and append those lines to "${PT}/runs/${round}/gate-failures.txt".`,
  { label: `gate ${kind} ${round}`, phase: 'Gate', schema: GATE, model: 'sonnet' })

const polish = (round) => agent(
  `${WHERE}\nPolish step after playtest round ${round}. Follow "${PT}/briefs/fixer.md" exactly, with {{ROUND}} = ${round} and {{MAX_FIXES}} = ${MAX_FIXES}. Do not commit; a later step does.`,
  { label: `polish ${round}`, phase: 'Polish', schema: WORK })

const rework = (round, finding) => agent(
  `${WHERE}\nRework step after playtest round ${round}. Follow "${PT}/briefs/rework.md" exactly, with {{ROUND}} = ${round} and {{FINDING}} = ${finding}. Do not commit; a later step does. ` +
  `If you start a check session, stop it before you answer.`,
  { label: `rework ${finding}`, phase: 'Rework', schema: WORK })

const JUDGE = {
  type: 'object',
  properties: {
    accepted: { type: 'array', items: { type: 'string' }, description: 'finding ids whose change is clearly better' },
    rejected: { type: 'array', items: { type: 'string' }, description: 'finding ids whose change does not go in' },
    reasons: { type: 'string', description: 'one line per finding: verdict and why' },
  },
  required: ['accepted', 'rejected', 'reasons'],
}

/** A fresh agent that did not make the change and was not told the author's reasons. */
const judge = (round, kind, finding) => agent(
  `${WHERE}\nJudge step after playtest round ${round}. Follow "${PT}/briefs/judge.md" exactly, with {{ROUND}} = ${round}, {{KIND}} = ${kind}, {{FINDING}} = ${finding || '(see fixes.json)'} and ` +
  `{{CHANGE}} = the uncommitted changes in the working tree: git -C "${REPO}" status --porcelain and git -C "${REPO}" diff (new files are untracked; read them). ` +
  `"${PT}/runs/${round}/${kind === 'rework' ? 'rework.json' : 'fixes.json'}" maps files to findings. ` +
  `You change no file under game/. Stop your session on port 4740 before you answer. In your answer every judged finding id appears in exactly one of accepted / rejected.`,
  { label: `judge ${kind} ${round}`, phase: 'Judge', schema: JUDGE })

/** Put the tree back (fully or for the rejected findings) and keep a record of what the judge turned down. */
const discard = (round, kind, verdict, all) => agent(
  `${WHERE}\nThe judge of round ${round} rejected ${all ? 'all' : 'some'} changes of the "${kind}" step: ${verdict.rejected.join(', ')}. Its reasons:\n${verdict.reasons}\n` +
  (all
    ? `Put the tree back exactly: git -C "${REPO}" checkout -- game/src playtest/harness playtest/changes.md   and   git -C "${REPO}" clean -fd game/src.\n`
    : `Remove only the rejected ones from the working tree and keep the accepted ones (${verdict.accepted.join(', ')}) exactly as they are. "${PT}/runs/${round}/fixes.json" says which files belong to which finding; use git -C "${REPO}" diff to find the hunks. ` +
      `Where a file carries hunks of both, undo only the rejected hunks. Also remove the rejected findings' lines from the uncommitted part of "${PT}/changes.md". Then run npx tsc --noEmit in "${REPO}/game"; if it fails because the changes were entangled, put the whole tree back as described for a full rejection and say so.\n`) +
  `Then append to "${PT}/rejected.md" (create it with a first line "# Changes the judge turned down" if missing) a heading "## ${round} — ${kind}" and, per rejected finding, one line with the judge's reason and what a next attempt should do differently (see "${PT}/runs/${round}/judge-${kind}.json"). ` +
  `Commit only that file: subject "Playtest ${round}: judge rejected ${kind} changes", body ending with: ${TRAILER}\n` +
  `changed: true if accepted changes remain in the working tree. summary: what you removed. notVerified: anything you could not check.`,
  { label: `discard ${kind} ${round}`, phase: 'Judge', schema: WORK, model: 'sonnet' })

/** One step: author -> judge -> (drop what was rejected) -> gate. */
async function step(round, kind, finding, author, hint) {
  const out = { work: null, judge: null, gate: null }
  out.work = await author()
  if (!out.work?.changed) return out
  out.judge = await judge(round, kind, finding)
  if (!out.judge) {
    // No verdict is not an acceptance: nothing goes in unjudged.
    out.judge = { accepted: [], rejected: [finding || 'all'], reasons: 'The judge gave no verdict.' }
    await discard(round, kind, out.judge, true)
    return out
  }
  if (out.judge.rejected.length) {
    const left = await discard(round, kind, out.judge, out.judge.accepted.length === 0)
    if (!out.judge.accepted.length || !left?.changed) return out
  }
  out.gate = await gate(round, kind, hint)
  return out
}

/** Polish, then one rework, each as its own commit so either can be dropped alone. */
async function improve(round, fixable, pick) {
  const p = fixable > 0 ? await step(round, 'polish', '', () => polish(round), 'the accepted fixes') : null
  const r = pick ? await step(round, 'rework', pick, () => rework(round, pick), `finding ${pick}`) : null
  return { polish: p?.work ?? null, polishJudge: p?.judge ?? null, polishGate: p?.gate ?? null, rework: r?.work ?? null, reworkJudge: r?.judge ?? null, reworkGate: r?.gate ?? null }
}

const startRound = (round, lobby) => agent(
  `${WHERE}\nFirst bring the branch up to date with the team's latest work, so the round plays the current game: ` +
  `git -C "${REPO}" fetch origin   then   git -C "${REPO}" merge --no-edit origin/main. ` +
  `If the merge conflicts: git -C "${REPO}" merge --abort, answer ok false and list the conflicting files in detail — do not start the round. ` +
  `If game/package-lock.json changed in the merge, run npm ci in "${REPO}/game".\n` +
  `Then start one playtest round and report whether it is ready. Run exactly this, and wait for it (up to 4 minutes):\n` +
  `node "${PT}/harness/start.mjs" --round ${round} --lobby ${lobby} --minutes ${MINUTES} --speed ${SPEED}\n` +
  `ok is true only if the output contains a line starting with READY; otherwise put the output in detail. ` +
  `If the output says a harness is already running, run: node "${PT}/harness/ptadmin.mjs" stop "stale"   wait 5 seconds, and run the start command once more. ` +
  `Also run: git -C "${REPO}" rev-parse --short HEAD   and give its output as head. Do nothing else.`,
  { label: `start ${round}`, phase: 'Start', schema: OK, model: 'haiku', effort: 'low' })

const playerPrompt = (n) =>
  `You are a player in a playtest. Your complete instructions are in the file "${PT}/briefs/player.md". ` +
  `Read that one file now, with the Read tool. In it, {{N}} is ${n} and {{PT}} is ${PT_CLI}. ` +
  `It is the only file you may open apart from the screenshots your own command prints. ` +
  `The session lasts at most ${MINUTES} minutes. Follow the brief until the command says SESSION OVER, then answer with the final report it asks for, in normal full sentences.`

// ------------------------------------------------------------------ preflight

phase('Preflight')
const pre = await agent(
  `Check that an unattended job may change code in the git checkout at "${REPO}". Run these and report; change nothing.\n` +
  `1. git -C "${REPO}" rev-parse --abbrev-ref HEAD   -> must print exactly "${BRANCH}", and must not be main or master.\n` +
  `2. git -C "${REPO}" status --porcelain            -> must print nothing (clean tree).\n` +
  `3. These must exist: "${PT}/harness/server.mjs", "${PT}/briefs/rework.md", "${PT}/node_modules/playwright-core", "${REPO}/game/node_modules/vite".\n` +
  `4. node "${PT}/harness/ptadmin.mjs" status        -> must say "harness not running".\n` +
  `ok is true only if all four hold. In detail, say which one failed and what you saw. head: output of git -C "${REPO}" rev-parse --short HEAD.`,
  { label: 'preflight', phase: 'Preflight', schema: OK, model: 'haiku', effort: 'low' })
if (!pre?.ok) return { stopped: 'preflight failed', detail: pre?.detail ?? 'no answer' }

const rounds = []
let goodHead = pre.head            // HEAD at the last point the game was known to start
let idle = 0

// ------------------------------------------------------------------ seed: act on a round that was already played

if (A.seed?.round) {
  log(`Working on the findings of ${A.seed.round} before the first round.`)
  const s = await improve(A.seed.round, 1, A.seed.reworkPick ?? '')
  rounds.push({ round: A.seed.round, seed: true, improve: s })
  log(`${A.seed.round}: polish ${s.polishGate?.committed ? s.polishGate.commit : 'no commit'}, rework ${s.reworkGate?.committed ? s.reworkGate.commit : 'no commit'}`)
}

// ------------------------------------------------------------------ rounds

for (let i = 1; i <= MAX_ROUNDS; i++) {
  const round = `${A.stamp}-r${String(i).padStart(2, '0')}`
  const lobby = MANUAL_EVERY > 0 && i % MANUAL_EVERY === 1 ? 'manual' : 'auto'

  // Stop when morning has come. Afternoon and evening hours never count as morning.
  const clock = await agent(
    `Run: date +%H   and answer with that hour as a number (0-23). Round marker: ${round}.`,
    { label: `clock ${round}`, phase: 'Start', model: 'haiku', effort: 'low',
      schema: { type: 'object', properties: { hour: { type: 'number' } }, required: ['hour'] } })
  if (clock && clock.hour >= STOP_HOUR && clock.hour < 12) { log(`It is ${clock.hour}:00 — no new round.`); break }

  // ---- start; if the game no longer starts, take back the changes since it last did
  let runId = round
  let start = await startRound(round, lobby)
  if (!start?.ok) {
    log(`${round}: did not start (${(start?.detail ?? 'no answer').slice(0, 160)}) — reverting changes since ${goodHead}`)
    const undo = await agent(
      `${WHERE}\nThe game no longer starts in a playtest after recent commits. Take those commits back, keeping history.\n` +
      `1. Read "${PT}/runs/${round}/harness.log" and, if present, "${PT}/runs/${round}/lobby-fail.txt" and "build-error.txt" to see why.\n` +
      `2. List: git -C "${REPO}" log --format="%h %s" ${goodHead}..HEAD -- game/src playtest/harness   (newest first). Keep only commits whose subject starts with "Playtest " — those are this loop's own. ` +
      `Commits by anyone else came in from the team's main branch: never revert those. If no loop commit is left, or the cause you found lies in a teammate's commit or in the harness, answer ok false and say so.\n` +
      `3. For each hash in that order: git -C "${REPO}" revert --no-edit <hash>. If one conflicts: git -C "${REPO}" revert --abort and stop.\n` +
      `4. Append to "${PT}/changes.md" a heading "## ${round} — reverted" with one line per reverted commit and the reason, and commit that file (subject "Playtest ${round}: note reverts", body ending with: ${TRAILER}).\n` +
      `ok true if every listed commit was reverted. head: git -C "${REPO}" rev-parse --short HEAD. detail: the cause you found and what you reverted.`,
      { label: `recover ${round}`, phase: 'Start', schema: OK, model: 'sonnet' })
    if (undo?.ok) {
      runId = `${round}b`
      start = await startRound(runId, lobby)
    }
    if (!start?.ok) {
      rounds.push({ round, lobby, started: false, detail: `${start?.detail ?? ''} | recovery: ${undo?.detail ?? 'none'}` })
      log('The game does not start and recovery did not help — stopping.')
      break
    }
  }
  goodHead = start.head || goodHead

  // ---- play (barrier: triage needs all four reports)
  const reports = await parallel([1, 2, 3, 4].map((n) => () =>
    agent(playerPrompt(n), { label: `${runId} player ${n}`, phase: 'Play', model: PLAYER_MODEL, agentType: 'general-purpose' })))
  const got = reports.filter(Boolean).length
  log(`${runId}: ${got}/4 player reports`)
  if (got === 0) {
    log('No player answered — agents are unavailable (usage limit or outage). Stopping this run; it can be started again.')
    return { stopped: 'agents unavailable', rounds: rounds.map((r) => r.round) }
  }

  // ---- triage
  const reportText = reports.map((r, k) => `=== PLAYER ${k + 1} REPORT ===\n${r ?? '(this player returned no report)'}`).join('\n\n')
  const triage = await agent(
    `${WHERE}\nTriage playtest round ${runId}.\n` +
    `First: run   node "${PT}/harness/ptadmin.mjs" stop "players done"   (it may answer "harness not running"; fine), wait until "${PT}/runs/${runId}/summary.json" exists (up to 30 seconds), ` +
    `and save the four player reports below as "${PT}/runs/${runId}/reports/p1.md" … "p4.md", unchanged.\n` +
    `Then follow "${PT}/briefs/triage.md" exactly, with {{ROUND}} = ${runId}. The calendar ran at ${SPEED}x speed and the lobby was "${lobby}" ` +
    `(with "auto" the harness seated the players, so this round says nothing about the lobby).\n` +
    `Finally append one entry for this round to "${PT}/ledger.json" (a JSON array): ` +
    `{ "round", "lobby", "speedScale", "progress", "verdicts", "reverted": [hashes], "reworkPick", "findings": [{ "id", "title", "class", "severity", "symptomOf", "repeatOf" }] } ` +
    `and commit only that file: subject "Playtest ${runId}: ledger", body ending with: ${TRAILER}\n\n${reportText}`,
    { label: `triage ${runId}`, phase: 'Triage', schema: TRIAGE })
  if (!triage) { rounds.push({ round: runId, lobby, started: true, reports: got, triage: null }); continue }

  // ---- take back changes that harmed play
  let reverted = null
  if (triage.revertCommits.length) {
    reverted = await agent(
      `${WHERE}\nTriage of round ${runId} judged these commits to have harmed play: ${triage.revertCommits.join(', ')}. Reasons: ${triage.verdicts}\n` +
      `Only commits whose subject starts with "Playtest " may be reverted; skip any other hash and say so. For each, newest first: git -C "${REPO}" revert --no-edit <hash>. If one conflicts: git -C "${REPO}" revert --abort, skip it and say so.\n` +
      `Then in "${REPO}/game" run npx tsc --noEmit. If it fails, undo your reverts (git -C "${REPO}" reset --hard to the HEAD you started from) and answer ok false.\n` +
      `Append to "${PT}/changes.md" a heading "## ${runId} — reverted" with one line per reverted commit and the reason; commit that file (subject "Playtest ${runId}: note reverts", body ending with: ${TRAILER}).\n` +
      (PUSH ? `If tsc passed, publish: git -C "${REPO}" fetch origin, git -C "${REPO}" rebase origin/main (on conflict: git -C "${REPO}" rebase --abort and do not push), then git -C "${REPO}" push origin HEAD:main (never --force).\n` : '') +
      `head: git -C "${REPO}" rev-parse --short HEAD.`,
      { label: `revert ${runId}`, phase: 'Gate', schema: OK, model: 'sonnet' })
    log(`${runId}: reverted ${triage.revertCommits.join(', ')} — ${reverted?.ok ? 'done' : 'failed'}`)
  }

  // ---- improve (skipped after the last round when the run is only meant to show how earlier changes played)
  const imp = i === MAX_ROUNDS && A.improveLastRound === false
    ? { polish: null, polishJudge: null, polishGate: null, rework: null, reworkJudge: null, reworkGate: null }
    : await improve(runId, triage.fixable, triage.reworkPick)
  rounds.push({ round: runId, lobby, started: true, reports: got, triage, reverted, improve: imp })
  log(`${runId}: ${triage.progress} | goals ${triage.goalsAchieved} | polish ${imp.polishGate?.committed ? imp.polishGate.commit : '—'} | rework ${triage.reworkPick || 'none'} ${imp.reworkGate?.committed ? imp.reworkGate.commit : imp.reworkJudge?.rejected?.length ? '(judge rejected)' : imp.reworkGate?.reverted ? '(failed gate)' : '—'}`)

  if (triage.fixable === 0 && !triage.reworkPick) idle++; else idle = 0
  if (idle >= 2) { log('Two rounds in a row with nothing to change — stopping.'); break }
}

// ------------------------------------------------------------------ wrap-up

phase('Wrap-up')
const played = rounds.filter((r) => r.started && r.triage)
const wrap = await agent(
  `${WHERE}\nWrite up tonight's unattended playtest loop. Rounds played: ${played.map((r) => r.round).join(', ') || 'none'}${A.seed?.round ? `; it began by working on the findings of ${A.seed.round}` : ''}. ` +
  `Evidence per round is in "${PT}/runs/<round>/" (triage.md, findings.json, fixes.json, rework.json, summary.json, reports/); the history is "${PT}/ledger.json" and "${PT}/changes.md"; the commits are in git log ${pre.head}..HEAD.\n` +
  `Read "${REPO}/AGENTS.md" and "${REPO}/docs/notes/2026-11-15-overnight-playtest-autonomy.md" first. The loop was allowed to change rules and content without approval, but nothing it changed is an accepted decision: record what was done and observed, and leave the choice to the team. Do not claim that enjoyment or the absence of waiting was shown; the players were AI agents.\n` +
  `Write two files and commit them (subject "Playtest ${A.stamp}: record and morning list", body ending with: ${TRAILER}):\n` +
  `1. "${REPO}/docs/playtests/2026-${A.stamp.slice(0, 2)}-${A.stamp.slice(2, 4)}-agent-playtest-loop.md" — follow docs/playtests/TEMPLATE.md. Include a table: round, lobby mode, how far the team got, goals achieved, findings by class, changes made, changes reverted. Add a row for it in docs/README.md next to the other playtests.\n` +
  `2. "${PT}/morning.md" — what the team reads first. (a) Three sentences: where the game stands compared with yesterday evening. ` +
  `(b) Every rework, one block each: commit hash, the problem and its evidence, what is different for players, what later rounds showed about it, what it could have unbalanced, and the exact command to drop it (git revert <hash>). Order them by how much you would keep them. ` +
  `(c) Polish commits, one line each. (d) Changes the judge turned down ("${PT}/rejected.md") and changes the loop reverted itself, and why. (e) Design findings still open, worst first. (f) Findings that kept coming back. ` +
  `(g) How to take the work: the team's checkout "${A.avoid ?? 'the main checkout'}" may hold uncommitted work that this branch already contains as its first commit — say to commit or stash there first, then merge "${BRANCH}" or cherry-pick single commits; and the command to delete the branch and this worktree if none of it is wanted.\n` +
  (PUSH ? `After the commit, publish it: git -C "${REPO}" fetch origin, git -C "${REPO}" rebase origin/main (on conflict: git -C "${REPO}" rebase --abort and do not push), then git -C "${REPO}" push origin HEAD:main (never --force).\n` : '') +
  `Answer with a ten-line summary of the night.`,
  { label: 'morning report', phase: 'Wrap-up' })

return {
  rounds: rounds.map((r) => ({
    round: r.round, seed: !!r.seed, lobby: r.lobby ?? null, started: r.started ?? true, reports: r.reports ?? 0,
    progress: r.triage?.progress ?? null, goals: r.triage?.goalsAchieved ?? null,
    fixable: r.triage?.fixable ?? 0, design: r.triage?.design ?? 0,
    reworkPick: r.triage?.reworkPick ?? (r.seed ? A.seed.reworkPick : ''),
    polishCommit: r.improve?.polishGate?.commit ?? '', reworkCommit: r.improve?.reworkGate?.commit ?? '',
    reworkFailedGate: !!r.improve?.reworkGate?.reverted, reverted: r.triage?.revertCommits ?? [],
    judgeRejected: [...(r.improve?.polishJudge?.rejected ?? []), ...(r.improve?.reworkJudge?.rejected ?? [])],
  })),
  wrap,
}
