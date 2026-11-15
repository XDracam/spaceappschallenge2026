// science station game logic: reducers (defineActions('science', …)) and tick handlers (onTick).
// Imported eagerly by core/registerStations.ts — must not import UI code.
//
// Loop (D-020, changed by playtest 1115m-r01): science sees what the planner's design needs beyond
// research (model/research.ts designNeeds), finds a route through the tech tree and starts projects. A project spends its cost at once and runs
// for months on the shared calendar. Comms researchPace modifiers speed it up or slow it down, and a
// comms block pauses it. At its end it is rolled with the shared seeded rng: success makes the tech
// researched and raises the planner's research limits or unlocks parts; failure leaves the tech
// available to retry.
//
// Part tests (playtest 1115d-r01): a team can also test a delivered part of the design (model/tests.ts).
// A test is a project with a partId; it always works and halves the part's risk of failure, if it ends
// before the launch.
import { defineActions, onTick, type ActionCtx } from '../../core/actions';
import { pushNews, setFlag } from '../../core/coreActions';
import type { Effect, ResearchProject } from '../../core/model';
import type { GameState } from '../../core/state';
import { DAYS_PER_MONTH } from '../../core/state';
import type { ScienceSlice } from './slice';
import { initialScienceSlice } from './slice';
import { TECH_BY_ID } from './data/techs';
import { FAILURE_LINES } from './data/flavour';
import { cancellationRefund, covered, describeGrant, describeNeed, designNeeds, running } from './model/research';
import { blockInfo, startCheck, techMonths } from './model/tree';
import { partTests, testCheck, testContracts, testDays } from './model/tests';

/** Fill slice and shared research fields missing from older saves. */
function ensure(s: GameState): ScienceSlice {
  const d = initialScienceSlice();
  const x = (s.science ??= d) as Partial<ScienceSlice>;
  x.slots ??= d.slots;
  x.researched ??= d.researched;
  x.info ??= d.info;
  s.research.modifiers ??= [];
  s.research.access ??= {};
  return s.science;
}

function applyEffects(s: GameState, effects: Effect[]): void {
  for (const e of effects) {
    if (e.kind === 'researchLimit') s.research.limits[e.key] = Math.max(s.research.limits[e.key] ?? -Infinity, e.value);
    else if (e.kind === 'unlock') { if (!s.research.unlocked.includes(e.key)) s.research.unlocked.push(e.key); }
    else if (e.kind === 'flag') setFlag(s, e.flag, e.on);
  }
}

function pick<T>(list: T[], ctx: ActionCtx): T {
  return list[Math.floor(ctx.rng() * list.length) % list.length];
}

const fmtPct = (v: number) => `${Math.round(v * 1000) / 10} %`;

/** A part test ends: the part's contracts are marked as tested (half the risk of failure). */
function resolveTest(s: GameState, ctx: ActionCtx, p: ResearchProject): void {
  const before = partTests(s).find((t) => t.partId === p.partId);
  const lots = testContracts(s, p.partId!);
  // The part left the design or its contract was cancelled while the team was testing.
  if (!before || !lots.length) { p.status = 'failed'; return; }
  for (const c of lots) c.tested = true;
  p.status = 'succeeded';
  pushNews(s, {
    from: 'science',
    text: `Science tested the ${before.name}${before.product ? ` (${before.product})` : ''}: reliability ${fmtPct(before.reliability)} → ${fmtPct(before.after)}.`,
    affects: ['planner', 'procurement'], internal: true,
  }, ctx.newId);
}

function resolve(s: GameState, ctx: ActionCtx, p: ResearchProject): void {
  if (p.partId) { resolveTest(s, ctx, p); return; }
  const sl = ensure(s);
  const info = sl.info[p.id];
  const tech = p.techId ? TECH_BY_ID[p.techId] : undefined;
  const ok = ctx.rng() < p.successChance;
  if (info) { info.endedAt = ctx.day; info.paused = false; }
  if (!tech) { p.status = 'failed'; return; }

  if (!ok) {
    p.status = 'failed';
    setFlag(s, 'research.failed', true);
    pushNews(s, { from: 'science', text: `Science: "${tech.name}" did not work out. ${pick(FAILURE_LINES, ctx)} It can be tried again.`, affects: [], internal: false }, ctx.newId);
    return;
  }
  p.status = 'succeeded';
  if (!sl.researched.includes(tech.id)) sl.researched.push(tech.id);
  const needed = designNeeds(s);
  applyEffects(s, p.effects);
  // What the design was waiting for and this project delivered: Procurement can now buy it.
  const met = needed.filter((n) => covered(s.research, n.key, n.value));
  if (met.length) {
    setFlag(s, 'research.breakthrough', true);
    pushNews(s, {
      from: 'science',
      text: `Science finished "${tech.name}": ${met.map(describeNeed).join(' and ')} ${met.length > 1 ? 'are' : 'is'} now within research. Procurement can buy ${met.length > 1 ? 'them' : 'it'} from the catalogue.`,
      affects: ['procurement', 'planner'], internal: true,
    }, ctx.newId);
    return;
  }
  const gains = tech.gives.map(describeGrant).join('; ');
  pushNews(s, {
    from: 'science',
    text: `Science finished "${tech.name}".${gains ? ` ${gains}.` : ' It opens the way to further techs.'}`,
    affects: tech.gives.length ? ['planner', 'procurement'] : [], internal: tech.gives.length > 0,
  }, ctx.newId);
}

export const scienceActions = defineActions('science', {
  /** Start researching a tech. projectId is made by the UI. Spends the cost at once. */
  startTech(s, ctx, projectId: string, techId: string) {
    const sl = ensure(s);
    if (s.research.projects.some((p) => p.id === projectId)) return;
    if (!startCheck(s, techId).ok) return;
    const tech = TECH_BY_ID[techId];
    s.budget.spentM = Math.round((s.budget.spentM + tech.costM) * 100) / 100;
    const effects: Effect[] = tech.gives.map((g) => (g.kind === 'unlock' ? { kind: 'unlock', key: g.key } : { kind: 'researchLimit', key: g.key, value: g.value }));
    s.research.projects.push({
      id: projectId, title: tech.name, techId, costM: tech.costM,
      startedAt: ctx.day, endsAt: ctx.day + techMonths(tech) * DAYS_PER_MONTH,
      status: 'running', successChance: tech.chance, effects,
    });
    sl.info[projectId] = { techId };
  },

  /** Start testing a delivered part of the design. projectId is made by the UI. Spends the cost at once. */
  startTest(s, ctx, projectId: string, partId: string) {
    ensure(s);
    if (s.research.projects.some((p) => p.id === projectId)) return;
    if (!testCheck(s, partId).ok) return;
    const t = partTests(s).find((x) => x.partId === partId)!;
    s.budget.spentM = Math.round((s.budget.spentM + t.costM) * 100) / 100;
    s.research.projects.push({
      id: projectId, title: `Test: ${t.name}`, partId, costM: t.costM,
      startedAt: ctx.day, endsAt: ctx.day + testDays(),
      status: 'running', successChance: 1, effects: [],
    });
  },

  /** Stop a running project. Half of the unspent share of its cost comes back. */
  cancelProject(s, ctx, projectId: string) {
    const sl = ensure(s);
    const p = s.research.projects.find((x) => x.id === projectId && x.status === 'running');
    if (!p) return;
    const refund = cancellationRefund(p, ctx.day);
    s.budget.spentM = Math.max(0, Math.round((s.budget.spentM - refund) * 100) / 100);
    p.status = 'failed';
    const info = sl.info[projectId];
    if (info) { info.cancelled = true; info.endedAt = ctx.day; info.paused = false; }
  },
});

onTick('science', (s, ctx, fromDay, toDay) => {
  const sl = ensure(s);
  const dt = toDay - fromDay;
  // Comms researchPace effects: +pct % runs faster (ends earlier), −pct % slower.
  const pct = Math.max(-90, s.research.modifiers.filter((m) => m.untilDay > fromDay).reduce((a, m) => a + m.effect.pct, 0));
  for (const p of running(s.research)) {
    const tech = p.techId ? TECH_BY_ID[p.techId] : undefined;
    const info = sl.info[p.id];
    if (tech && blockInfo(tech, s.research.access).blocked) {
      // Comms blocked the tech: the clock stops for this project until comms enables it again.
      p.endsAt += dt;
      if (info && !info.paused) {
        info.paused = true;
        pushNews(s, { from: 'science', text: `Science paused "${tech.name}": comms has blocked it.`, affects: [], internal: false }, ctx.newId);
      }
      continue;
    }
    if (info?.paused) {
      info.paused = false;
      if (tech) pushNews(s, { from: 'science', text: `Science resumed "${tech.name}".`, affects: [], internal: false }, ctx.newId);
    }
    if (pct !== 0) p.endsAt -= dt * (pct / 100);
    // A test has to be finished before the launch (the planner's handler runs first and may have launched).
    if (p.partId && s.meta.phase !== 'planning') continue;
    if (p.endsAt <= toDay) resolve(s, ctx, p);
  }
  if (s.research.modifiers.length) s.research.modifiers = s.research.modifiers.filter((m) => m.untilDay > toDay);
});
