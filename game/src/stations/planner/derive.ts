// Planner views derived from the shared GameState (pure, no UI imports).
// Part state is never stored: it follows the shared market (D-006 terms):
//   open Task → Ordered; allocation with an active contract → Contracted
//   (Late when it is expected after the launch day); delivered contract → Delivered.
// Contracted parts use the contract's real stats, mass and reliability.
import { contractReliability, type Contract, type Task } from '../../core/model';
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
  lots?: { quantity: number; contract: Contract; compatible: boolean }[];
  need?: number;
  incompatible?: boolean;
}

const LIVE: Contract['status'][] = ['active', 'delivered'];

/** Procurement state of one design part, derived from tasks, allocations and contracts. */
export function partProcurement(s: GameState, partId: string): PartProcurement {
  const tasks = s.market.tasks.filter((t) => t.authorRole === 'planner' && t.partId === partId);
  if (!tasks.length) return { status: 'draft' };
  // Only the latest non-withdrawn task represents this part's current order.
  const task = [...tasks].reverse().find(t => t.status !== 'withdrawn');
  if (!task) return { status: 'draft' };
  const criterion = task.criteria[0];
  const need = criterion?.quantity ?? 1;
  const lots = s.market.allocations.flatMap(a => {
    if (a.taskId !== task.id || a.criterionId !== criterion?.id || a.status === 'released' || a.quantity <= 0) return [];
    const contract = s.market.contracts.find(c => c.id === a.contractId && LIVE.includes(c.status));
    return contract ? [{ quantity: a.quantity, contract, compatible: true }] : [];
  });
  const base = lots[0]?.contract.offerSnapshot.resource;
  const sameStats = (a: Record<string, number>, b: Record<string, number>) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every(k => a[k] === b[k]);
  };
  for (const lot of lots) {
    const r = lot.contract.offerSnapshot.resource;
    lot.compatible = !!base && !!criterion && r.partKind === criterion.partKind && r.variant === criterion.variant && Object.entries(criterion.minimums).every(([key, value]) => (r.stats[key] ?? -Infinity) >= value) && r.partKind === base.partKind && r.variant === base.variant && r.massT === base.massT && sameStats(r.stats, base.stats);
  }
  const incompatible = lots.some(x => !x.compatible);
  const have = lots.reduce((n, x) => n + x.quantity, 0);
  if (!lots.length || have < need || incompatible) return { status: 'ordered', task, lots, need, incompatible };
  const pending = lots.filter(x => x.contract.status === 'active');
  const late = pending.find(x => x.contract.expectedAt > s.planner.plan.launchDay + 1e-9);
  const status: PartState = !pending.length ? 'delivered' : late ? 'late' : 'contracted';
  return { status, task, lots, need, incompatible, contract: (late ?? pending[0] ?? lots[0]).contract };
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
  if (proc.lots) p.supplyDetails = { need: proc.need ?? 1, incompatible: !!proc.incompatible, contributions: proc.lots.map(x => ({ supplier: x.contract.offerSnapshot.supplierName, quantity: x.quantity, status: x.contract.status, day: x.contract.status === 'delivered' ? (x.contract.deliveredAt ?? x.contract.expectedAt) : x.contract.expectedAt, compatible: x.compatible })) };
  const c = proc.contract;
  if (c && (proc.status === 'contracted' || proc.status === 'delivered' || proc.status === 'late')) {
    const o = c.offerSnapshot;
    p.contractId = c.id;
    for (const [k, v] of Object.entries(o.resource?.stats ?? {})) if (Number.isFinite(v)) p.stats[k] = v;
    if (Number.isFinite(o.resource?.massT) && o.resource.massT > 0) p.actualMassT = o.resource.massT;
    if (proc.lots?.length) {
      const count = proc.lots.reduce((sum, lot) => sum + lot.quantity, 0);
      p.reliability = proc.lots.some(lot => contractReliability(lot.contract) <= 0) ? 0 : Math.exp(proc.lots.reduce((sum, lot) => sum + lot.quantity * Math.log(Math.min(1, contractReliability(lot.contract))), 0) / count);
    }
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
      reliability: contractReliability(c),
      ...(c.tested ? { tested: true } : {}),
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
    groundStation: s.events.flags.includes('service.groundStation'),
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
    s.market.contracts.filter((c) => cids.has(c.id)), s.budget, s.meta.phase, s.events.flags.includes('service.groundStation'),
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
