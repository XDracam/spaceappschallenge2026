// Quick fixes for the Rocket panel (pure, no UI imports).
//
// The Δv fix: for the first maneuver that runs out of fuel, find the smallest
// tank size that removes the shortfall. Every editable (draft / ordered) tank of
// a stage flying on that branch is a candidate; each is sized with the planner's
// own evaluation (physics/evaluate.ts), and the candidate whose bigger tank costs
// the least extra wins (ties: the stage that fires last). Bigger tanks also make
// the stages below heavier, so a geometric scan finds the first size that works
// before a binary search narrows it down.
import type { Evaluation, Part, PlannerGame, Stage } from './model/types';
import { allStages } from './model/rocketUtils';
import { estimatedCostM, statDefs } from './data/parts';
import { mapRocketParts } from './derive';
import { evaluate } from './physics';

export interface DvShortfall {
  branchId: string;
  maneuverId: string;
  /** Maneuver label, e.g. "Raise to geostationary orbit". */
  label: string;
  shortMs: number;
}

/** The first maneuver (main branch first) that runs out of fuel, if any. */
export function firstDvShortfall(ev: Evaluation): DvShortfall | undefined {
  for (const b of ev.branches) {
    const m = b.maneuvers.find((r) => r.issues.some((i) => i.code === 'dv'));
    if (m) {
      return {
        branchId: b.branchId, maneuverId: m.maneuverId, label: m.label,
        shortMs: Math.max(0, m.dvRequiredMs - m.dvAvailableBeforeMs),
      };
    }
  }
  return undefined;
}

export type TankFix =
  | { kind: 'tank'; stageId: string; tankId: string; fromT: number; toT: number; extraCostM: number }
  /** No tank size within the slider range removes the shortfall. */
  | { kind: 'none' };

/** Round up to 3 significant digits, then up to the slider step. */
function niceCeil(v: number, step: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(v)) - 2);
  const sig = Math.ceil(v / mag - 1e-9) * mag;
  return Number((Math.ceil(sig / step - 1e-9) * step).toPrecision(12));
}

function withFuel(game: PlannerGame, tankId: string, fuelT: number): PlannerGame {
  return {
    ...game,
    rocket: mapRocketParts(game.rocket, (p) => (p.id === tankId ? { ...p, stats: { ...p.stats, fuelT } } : p)),
  };
}

/** Lift-ratio errors per maneuver id in a branch (to reject fixes that make the rocket too heavy). */
function twrErrors(ev: Evaluation, branchId: string): Set<string> {
  const b = ev.branches.find((x) => x.branchId === branchId);
  const out = new Set<string>();
  for (const m of b?.maneuvers ?? []) {
    if (m.issues.some((i) => i.code === 'twr' && i.severity === 'error')) out.add(m.maneuverId);
  }
  return out;
}

/** True when the branch no longer runs out of fuel and no new lift-off problem appeared. */
function fixes(ev: Evaluation, branchId: string, baseTwr: Set<string>): boolean {
  const b = ev.branches.find((x) => x.branchId === branchId);
  if (!b) return false;
  if (b.maneuvers.some((m) => m.issues.some((i) => i.code === 'dv'))) return false;
  for (const id of twrErrors(ev, branchId)) if (!baseTwr.has(id)) return false;
  return true;
}

interface Candidate { stage: Stage; tank: Part; order: number }

/** Smallest fuel size for one tank that fixes the branch, or undefined; stops early once it costs more than `budgetM`. */
function sizeTank(game: PlannerGame, c: Candidate, sf: DvShortfall, baseTwr: Set<string>, budgetM: number): number | undefined {
  const def = statDefs('tank', c.tank.variant).find((d) => d.key === 'fuelT');
  if (!def) return undefined;
  const from = c.tank.stats.fuelT;
  const max = def.max;
  if (!(from < max)) return undefined;
  const ok = (v: number) => fixes(evaluate(withFuel(game, c.tank.id, v)), sf.branchId, baseTwr);
  const extra = (v: number) => estimatedCostM({ ...c.tank, stats: { ...c.tank.stats, fuelT: v } }) - estimatedCostM(c.tank);

  // Geometric scan for the first size that works.
  let lo = from;
  let hi: number | undefined;
  for (let v = Math.max(from * 1.25, from + def.step); ; v = Math.min(max, v * 1.25)) {
    // Any working size is above `lo`: once that alone costs more than the best fix so far, give up.
    if (extra(lo) >= budgetM) return undefined;
    if (ok(v)) { hi = v; break; }
    if (v >= max) return undefined;
    lo = v;
  }
  // Binary search (log scale) between the last failing and the first working size.
  for (let i = 0; i < 16 && hi / lo > 1.002; i++) {
    const mid = Math.sqrt(lo * hi);
    if (ok(mid)) hi = mid; else lo = mid;
  }
  const nice = Math.min(max, niceCeil(hi, def.step));
  if (nice !== hi && ok(nice)) return nice;
  const stepped = Math.min(max, Number((Math.ceil(hi / def.step - 1e-9) * def.step).toPrecision(12)));
  return ok(stepped) ? stepped : hi;
}

/** Cheapest single-tank fix for the first Δv shortfall; undefined when nothing is short. */
export function findTankFix(game: PlannerGame, ev: Evaluation): TankFix | undefined {
  const sf = firstDvShortfall(ev);
  if (!sf) return undefined;
  const branch = ev.branches.find((b) => b.branchId === sf.branchId);
  const inBranch = new Set(branch?.stageBands.map((b) => b.stageId) ?? []);
  const stages = allStages(game.rocket);
  // Firing order: rocket stages bottom-up, then each spacecraft's stages. Later = fires later.
  const candidates: Candidate[] = [];
  stages.forEach(({ stage }, order) => {
    if (!inBranch.has(stage.id)) return;
    for (const tank of stage.tanks) {
      if (tank.state === 'draft' || tank.state === 'ordered') candidates.push({ stage, tank, order });
    }
  });
  // Upper stages first: they usually give the cheapest fix, which lets the scan stop early on the others.
  candidates.sort((a, b) => b.order - a.order);

  const baseTwr = twrErrors(ev, sf.branchId);
  let best: Extract<TankFix, { kind: 'tank' }> | undefined;
  for (const c of candidates) {
    const toT = sizeTank(game, c, sf, baseTwr, best ? best.extraCostM : Infinity);
    if (toT === undefined) continue;
    const extraCostM = estimatedCostM({ ...c.tank, stats: { ...c.tank.stats, fuelT: toT } }) - estimatedCostM(c.tank);
    if (!best || extraCostM < best.extraCostM - 1e-9) {
      best = { kind: 'tank', stageId: c.stage.id, tankId: c.tank.id, fromT: c.tank.stats.fuelT, toT, extraCostM };
    }
  }
  return best ?? { kind: 'none' };
}

const fixCache = new WeakMap<PlannerGame, TankFix | undefined>();

/** findTankFix, memoised per planner view. `has` tells whether it was computed already. */
export const tankFixCache = {
  has: (game: PlannerGame) => fixCache.has(game),
  get: (game: PlannerGame) => fixCache.get(game),
  compute(game: PlannerGame, ev: Evaluation): TankFix | undefined {
    if (!fixCache.has(game)) fixCache.set(game, findTankFix(game, ev));
    return fixCache.get(game);
  },
};
