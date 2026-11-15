// science station game logic: reducers (defineActions('science', …)) and tick handlers (onTick).
// Imported eagerly by core/registerStations.ts — must not import UI code.
//
// Loop (D-020): Procurement asks science to develop a part (research requests). The science player
// finds a route through the tech tree and starts projects. A project spends its cost at once and runs
// for months on the shared calendar. Comms researchPace modifiers speed it up or slow it down, and a
// comms block pauses it. At its end it is rolled with the shared seeded rng: success makes the tech
// researched and raises the planner's research limits or unlocks parts; failure leaves the tech
// available to retry.
import { defineActions, onTick, type ActionCtx } from '../../core/actions';
import { pushNews, setFlag } from '../../core/coreActions';
import type { Effect, ResearchProject } from '../../core/model';
import type { GameState } from '../../core/state';
import { DAYS_PER_MONTH } from '../../core/state';
import type { ScienceSlice } from './slice';
import { initialScienceSlice } from './slice';
import { TECH_BY_ID } from './data/techs';
import { FAILURE_LINES } from './data/flavour';
import { describeGrant, describeRequest, requestCovered, running } from './model/research';
import { blockInfo, startCheck } from './model/tree';

/** Fill slice and shared research fields missing from older saves. */
function ensure(s: GameState): ScienceSlice {
  const d = initialScienceSlice();
  const x = (s.science ??= d) as Partial<ScienceSlice>;
  x.slots ??= d.slots;
  x.researched ??= d.researched;
  x.info ??= d.info;
  s.research.modifiers ??= [];
  s.research.requests ??= [];
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

function resolve(s: GameState, ctx: ActionCtx, p: ResearchProject): void {
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
  applyEffects(s, p.effects);
  const gains = tech.gives.map(describeGrant).join('; ');
  pushNews(s, {
    from: 'science',
    text: `Science finished "${tech.name}".${gains ? ` ${gains}.` : ' It opens the way to further techs.'}`,
    affects: tech.gives.length ? ['planner', 'procurement'] : [], internal: tech.gives.length > 0,
  }, ctx.newId);
}

/** Close requests that research has met, and withdraw those whose task is gone. */
function settleRequests(s: GameState, ctx: ActionCtx): void {
  for (const q of s.research.requests) {
    if (q.status !== 'open') continue;
    const task = s.market.tasks.find((t) => t.id === q.taskId);
    if (!task || task.status !== 'open') { q.status = 'withdrawn'; continue; }
    if (requestCovered(s.research, q)) {
      q.status = 'done';
      q.doneAt = ctx.day;
      setFlag(s, 'research.breakthrough', true);
      pushNews(s, {
        from: 'science',
        text: `Science delivered what Procurement asked for: ${describeRequest(q)}. "${task.title}" can now be bought within research.`,
        affects: ['procurement', 'planner'], internal: true,
      }, ctx.newId);
    }
  }
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
      startedAt: ctx.day, endsAt: ctx.day + tech.months * DAYS_PER_MONTH,
      status: 'running', successChance: tech.chance, effects,
    });
    sl.info[projectId] = { techId };
  },

  /** Stop a running project. Half of the unspent share of its cost comes back. */
  cancelProject(s, ctx, projectId: string) {
    const sl = ensure(s);
    const p = s.research.projects.find((x) => x.id === projectId && x.status === 'running');
    if (!p) return;
    const total = Math.max(1, p.endsAt - p.startedAt);
    const left = Math.min(1, Math.max(0, (p.endsAt - ctx.day) / total));
    const refund = Math.round(p.costM * left * 0.5 * 10) / 10;
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
    if (p.endsAt <= toDay) resolve(s, ctx, p);
  }
  if (s.research.modifiers.length) s.research.modifiers = s.research.modifiers.filter((m) => m.untilDay > toDay);
  settleRequests(s, ctx);
});
