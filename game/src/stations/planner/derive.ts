// Planner views derived from the shared GameState (pure, no UI imports).
// Part state is never stored: it follows the shared market (D-006 terms):
//   open Task → Ordered; allocation with an active contract → Contracted
//   (Late when it is expected after the launch day); delivered contract → Delivered.
// Contracted parts use the contract's real stats, mass and reliability.
import type { Contract, Task } from '../../core/model';
import type { GameState } from '../../core/state';
import { MISSION } from '../../core/mission';
import type { Evaluation, Part, PartContract, PartState, PlannerGame, Rocket } from './model/types';
import { allParts } from './model/rocketUtils';
import { evaluate } from './physics';

/** Tasks the planner authored (one or more per design part over time). */
export function plannerTasks(s: GameState): Task[] {
  return s.market.tasks.filter((t) => t.authorRole === 'planner' && !!t.partId);
}

export interface PartProcurement {
  status: PartState;
  /** Open task (ordered) or the task the contract is allocated to. */
  task?: Task;
  /** Contract supplying the part (the pending one first). */
  contract?: Contract;
}

const LIVE: Contract['status'][] = ['active', 'delivered'];

/** Procurement state of one design part, derived from tasks, allocations and contracts. */
export function partProcurement(s: GameState, partId: string): PartProcurement {
  const tasks = s.market.tasks.filter((t) => t.authorRole === 'planner' && t.partId === partId);
  if (!tasks.length) return { status: 'draft' };
  const taskIds = new Set(tasks.map((t) => t.id));
  const live: { taskId: string; quantity: number; contract: Contract }[] = [];
  for (const a of s.market.allocations) {
    if (!taskIds.has(a.taskId) || a.status === 'released') continue;
    const contract = s.market.contracts.find((c) => c.id === a.contractId);
    if (!contract || !LIVE.includes(contract.status)) continue;
    live.push({ taskId: a.taskId, quantity: a.quantity, contract });
  }
  const openTask = [...tasks].reverse().find((t) => t.status === 'open');
  if (live.length) {
    const task = tasks.find((t) => t.id === live[0].taskId)!;
    const need = task.criteria[0]?.quantity ?? 1;
    const have = live.reduce((n, x) => n + Math.max(0, x.quantity || 0), 0);
    // A partial allocation keeps the part "ordered" while the task is still open.
    if (have >= need || !openTask) {
      const pending = live.filter((x) => x.contract.status === 'active');
      const launchDay = s.planner.plan.launchDay;
      const late = pending.find((x) => x.contract.expectedAt > launchDay + 1e-9);
      const status: PartState = pending.length === 0 ? 'delivered' : late ? 'late' : 'contracted';
      return { status, task, contract: (late ?? pending[0] ?? live[0]).contract };
    }
  }
  if (openTask) return { status: 'ordered', task: openTask, ...(live[0] ? { contract: live[0].contract } : {}) };
  return { status: 'draft' };
}

/** 'draft' | 'ordered' | 'contracted' | 'delivered' | 'late' for a design part. */
export function partStatus(s: GameState, partId: string): PartState {
  return partProcurement(s, partId).status;
}

/** True while the planner may still change the part's sliders (draft or ordered). */
export function partEditable(s: GameState, partId: string): boolean {
  const st = partStatus(s, partId);
  return st === 'draft' || st === 'ordered';
}

/** A copy of the part with its derived state; contracted parts carry the contract's real stats, mass and reliability. */
export function actualPart(s: GameState, part: Part, proc: PartProcurement = partProcurement(s, part.id)): Part {
  const p: Part = { ...part, stats: { ...part.stats }, state: proc.status };
  delete p.taskId;
  delete p.contractId;
  delete p.actualMassT;
  delete p.reliability;
  if (proc.task) p.taskId = proc.task.id;
  const c = proc.contract;
  if (c && (proc.status === 'contracted' || proc.status === 'delivered' || proc.status === 'late')) {
    const o = c.offerSnapshot;
    p.contractId = c.id;
    for (const [k, v] of Object.entries(o.resource?.stats ?? {})) if (Number.isFinite(v)) p.stats[k] = v;
    if (Number.isFinite(o.resource?.massT) && o.resource.massT > 0) p.actualMassT = o.resource.massT;
    if (Number.isFinite(o.reliability) && o.reliability > 0) p.reliability = Math.min(1, o.reliability);
  }
  return p;
}

/** Map every part of a rocket (returns a new rocket; the input is not modified). */
export function mapRocketParts(rocket: Rocket, fn: (p: Part) => Part): Rocket {
  const stage = (st: Rocket['stages'][number]) => ({ ...st, engine: fn(st.engine), tanks: st.tanks.map(fn) });
  return {
    stages: rocket.stages.map(stage),
    spacecraft: rocket.spacecraft.map((sc) => ({ ...sc, stages: sc.stages.map(stage), equipment: sc.equipment.map(fn) })),
  };
}

/** The planner's rocket as it will fly: derived part states, contracted parts with their real values. */
export function effectiveRocket(s: GameState): Rocket {
  return mapRocketParts(s.planner.rocket, (p) => actualPart(s, p));
}

/** Contracts allocated to planner tasks, as the planner shows them. */
export function partContracts(s: GameState): PartContract[] {
  const tasks = new Map(plannerTasks(s).map((t) => [t.id, t]));
  const out: PartContract[] = [];
  const seen = new Set<string>();
  for (const a of s.market.allocations) {
    const task = tasks.get(a.taskId);
    if (!task || a.status === 'released' || seen.has(a.contractId)) continue;
    const c = s.market.contracts.find((x) => x.id === a.contractId);
    if (!c) continue;
    seen.add(c.id);
    const o = c.offerSnapshot;
    out.push({
      id: c.id,
      taskId: task.id,
      partId: task.partId!,
      partName: task.criteria.find((cr) => cr.id === a.criterionId)?.label ?? task.title,
      supplier: o.supplierName,
      priceM: o.priceM,
      signedDay: c.signedAt,
      deliveryDay: c.status === 'delivered' && c.deliveredAt !== undefined ? c.deliveredAt : c.expectedAt,
      reliability: o.reliability,
      actualStats: { ...(o.resource?.stats ?? {}) },
      actualMassT: o.resource?.massT ?? 0,
      cancellationPct: o.cancellationPct,
      status: c.status === 'active' ? 'running' : c.status === 'delivered' ? 'delivered' : 'cancelled',
      ...(c.refundM !== undefined ? { refundM: c.refundM } : {}),
    });
  }
  return out;
}

/** Planner-shaped game object for physics (evaluate / playthrough / options) and the planner UI. */
export function plannerGame(s: GameState): PlannerGame {
  const b = s.budget;
  return {
    mission: MISSION,
    rocket: effectiveRocket(s),
    plan: s.planner.plan,
    contracts: partContracts(s),
    research: s.research.limits,
    unlocked: s.research.unlocked,
    versions: s.planner.versions,
    phase: s.meta.phase === 'launched' || s.meta.phase === 'finished' ? 'launched' : 'planning',
    playthroughSeed: s.planner.playthroughSeed,
    budget: { totalM: b.fundingTotalM, spentM: b.spentM, committedM: b.committedM, availableM: b.fundingTotalM - b.spentM - b.committedM },
  };
}

/** Everything plannerGame() reads; equal keys give equal planner views. */
export function plannerKey(s: GameState): string {
  const tasks = plannerTasks(s);
  const taskIds = new Set(tasks.map((t) => t.id));
  const allocs = s.market.allocations.filter((a) => taskIds.has(a.taskId));
  const cids = new Set(allocs.map((a) => a.contractId));
  return JSON.stringify([
    s.planner, s.research.limits, s.research.unlocked, tasks, allocs,
    s.market.contracts.filter((c) => cids.has(c.id)), s.budget, s.meta.phase,
  ]);
}

// The shared store replaces every object on each action (structuredClone), so
// the view is memoised on content, not identity.
let cache: { state: GameState; key: string; game: PlannerGame } | null = null;

/** plannerGame(s), memoised: returns the same object while the planner's inputs are unchanged. */
export function cachedPlannerGame(s: GameState): PlannerGame {
  if (cache && cache.state === s) return cache.game;
  const key = plannerKey(s);
  if (cache && cache.key === key) {
    cache.state = s;
    return cache.game;
  }
  cache = { state: s, key, game: plannerGame(s) };
  return cache.game;
}

const evaluations = new WeakMap<PlannerGame, Evaluation>();

/** Live simulation test of a planner view (memoised per view object). */
export function evaluationOf(game: PlannerGame): Evaluation {
  let ev = evaluations.get(game);
  if (!ev) {
    ev = evaluate(game);
    evaluations.set(game, ev);
  }
  return ev;
}

/** Shared design flags read by comms events. */
export function designFlags(rocket: Rocket): { rtg: boolean; ion: boolean } {
  const parts = allParts(rocket).map((l) => l.part);
  return {
    rtg: parts.some((p) => p.kind === 'power' && p.variant === 'rtg'),
    ion: parts.some((p) => p.kind === 'engine' && p.variant === 'ion'),
  };
}
