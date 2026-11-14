import type { Rocket, Spacecraft, Stage, StageBurn } from '../model/types';
import { PROPULSION } from '../data/propulsion';
import { equipmentMassT, stageDryMassT, stageFuelT, stageIsp, stageThrustKN } from '../data/parts';
import { DAYS_PER_MONTH, G0 } from '../model/units';

// Staging and the rocket equation. Masses in t, thrust kN, delta-v m/s.

const EPS_FUEL = 1e-9;

export interface StageRt {
  stage: Stage;
  ownerId: string;     // 'rocket' or spacecraft id
  ownerName: string;
  fuel: number;        // remaining fuel (t)
  dry: number;         // dry mass (t)
  isp: number;
  thrustKN: number;
  boilOff: number;     // fraction lost per month
  dropped: boolean;
  dvUsed: number;      // delta-v delivered on the current branch (m/s)
}

export interface StackRt {
  stages: StageRt[];          // firing order
  spacecraft: Spacecraft[];   // attached spacecraft, branch order
  lastBoilDay: number;
}

export function buildStack(rocket: Rocket, spacecraftIds: string[], withRocketStages: boolean, day: number): StackRt {
  const stageRt = (stage: Stage, ownerId: string, ownerName: string): StageRt => ({
    stage, ownerId, ownerName,
    fuel: stageFuelT(stage),
    dry: stageDryMassT(stage),
    isp: stageIsp(stage),
    thrustKN: stageThrustKN(stage),
    boilOff: PROPULSION[stage.propulsion]?.boilOffPerMonth ?? 0,
    dropped: false,
    dvUsed: 0,
  });
  const spacecraft = spacecraftIds
    .map((id) => rocket.spacecraft.find((s) => s.id === id))
    .filter((s): s is Spacecraft => !!s);
  const stages: StageRt[] = [];
  if (withRocketStages) for (const st of rocket.stages) stages.push(stageRt(st, 'rocket', 'Rocket'));
  for (const sc of spacecraft) for (const st of sc.stages) stages.push(stageRt(st, sc.id, sc.name));
  return { stages, spacecraft, lastBoilDay: day };
}

export function stackMassT(s: StackRt): number {
  let m = 0;
  for (const st of s.stages) if (!st.dropped) m += st.dry + st.fuel;
  for (const sc of s.spacecraft) m += equipmentMassT(sc);
  return m;
}

/** First stage that would fire next. */
export function activeStage(s: StackRt): StageRt | undefined {
  return s.stages.find((st) => !st.dropped && st.fuel > EPS_FUEL);
}

export function applyBoilOff(s: StackRt, day: number): void {
  const months = (day - s.lastBoilDay) / DAYS_PER_MONTH;
  if (!(months > 0)) return;
  for (const st of s.stages) {
    if (!st.dropped && st.boilOff > 0) st.fuel *= Math.pow(1 - st.boilOff, months);
  }
  s.lastBoilDay = day;
}

/** Delta-v each remaining stage could still give, burning everything in order. */
export function stagePotentials(s: StackRt): Map<StageRt, number> {
  const out = new Map<StageRt, number>();
  let m = stackMassT(s);
  for (const st of s.stages) {
    if (st.dropped) continue;
    if (st.fuel > EPS_FUEL && m - st.fuel > 0) {
      out.set(st, st.isp * G0 * Math.log(m / (m - st.fuel)));
    } else out.set(st, 0);
    m -= st.fuel + st.dry;
  }
  return out;
}

export function remainingDvMs(s: StackRt): number {
  let sum = 0;
  for (const v of stagePotentials(s).values()) sum += v;
  return sum;
}

export interface FiredStage {
  st: StageRt;
  twr: number;          // at ignition in this maneuver, vs the given gravity
  fuelUsed: number;     // t
}

export interface BurnResult {
  burns: StageBurn[];
  achievedMs: number;
  short: boolean;
  fired: FiredStage[];
}

/** Burn dvMs from the stack, staging as tanks run dry. Mutates the stack. */
export function burn(s: StackRt, dvMs: number, gravity: number): BurnResult {
  const res: BurnResult = { burns: [], achievedMs: 0, short: false, fired: [] };
  let need = dvMs;
  while (need > 1e-6) {
    const st = s.stages.find((x) => !x.dropped);
    if (!st) {
      res.short = true;
      break;
    }
    if (st.fuel <= EPS_FUEL) {
      st.dropped = true;
      continue;
    }
    const m = stackMassT(s);
    const ve = st.isp * G0;
    const avail = m - st.fuel > 0 ? ve * Math.log(m / (m - st.fuel)) : Infinity;
    const fired: FiredStage = { st, twr: st.thrustKN / (m * gravity), fuelUsed: 0 };
    res.fired.push(fired);
    const use = Math.min(need, avail);
    const fuelUsed = avail <= need ? st.fuel : m * (1 - Math.exp(-use / ve));
    st.fuel = Math.max(0, st.fuel - fuelUsed);
    fired.fuelUsed = fuelUsed;
    st.dvUsed += use;
    res.burns.push({ stageId: st.stage.id, dvMs: use });
    res.achievedMs += use;
    need -= use;
    if (st.fuel <= EPS_FUEL) st.dropped = true;
  }
  return res;
}

/** Move the listed spacecraft (and their stages) to a new stack. Mutates `s`. */
export function splitStack(s: StackRt, spacecraftIds: string[]): StackRt {
  const ids = new Set(spacecraftIds);
  const child: StackRt = {
    stages: s.stages
      .filter((st) => ids.has(st.ownerId) && !st.dropped)
      .map((st) => ({ ...st, dvUsed: 0 })),
    spacecraft: s.spacecraft.filter((sc) => ids.has(sc.id)),
    lastBoilDay: s.lastBoilDay,
  };
  s.stages = s.stages.filter((st) => !ids.has(st.ownerId));
  s.spacecraft = s.spacecraft.filter((sc) => !ids.has(sc.id));
  return child;
}
