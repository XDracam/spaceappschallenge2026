import type { BodyId, FlightState, TrajectorySegment, Vec2 } from '../model/types';
import { BODIES } from '../data/bodies';
import { DAY_S } from '../model/units';
import {
  bodyPosition, bodyVelocity, circularSpeed, orbitalPeriodDays, transferRelation, type Relation,
} from './ephemeris';
import { lambert2D } from './lambert';
import { sampleConic } from './kepler';
import { angleBetween, norm, scale, sub, unit } from './vec';

// Transfer, flyby and orbit-change costs (patched conics, closed form).
// Internals in km, km/s, s; results in m/s and days.

export const TRAJ_POINTS = 64;

/** Burn from a circular orbit of radius r to hyperbolic excess speed vinf (or the reverse capture). km/s. */
export function escapeDvKms(mu: number, r: number, vinf: number): number {
  return Math.sqrt(vinf * vinf + (2 * mu) / r) - Math.sqrt(mu / r);
}

export function hohmann(mu: number, r1: number, r2: number): { dvMs: number; tofDays: number } {
  if (Math.abs(r1 - r2) < 1e-9) return { dvMs: 0, tofDays: 0 };
  const a = (r1 + r2) / 2;
  const dv1 = Math.abs(Math.sqrt(mu / r1) * (Math.sqrt((2 * r2) / (r1 + r2)) - 1));
  const dv2 = Math.abs(Math.sqrt(mu / r2) * (1 - Math.sqrt((2 * r1) / (r1 + r2))));
  return { dvMs: (dv1 + dv2) * 1000, tofDays: (Math.PI * Math.sqrt((a * a * a) / mu)) / DAY_S };
}

const parkRadius = (id: BodyId, altKm: number) => BODIES[id].radiusKm + altKm;
const lowRadius = (id: BodyId) => BODIES[id].radiusKm + BODIES[id].lowOrbitAltKm;

// ------------------------------------------------------------ Lambert cache

type LambertSol = { v1: Vec2; v2: Vec2 } | null;
const lambertCache = new Map<string, LambertSol>();

/** Lambert between two siblings around their common parent (cached for evaluate()). */
function siblingLambert(from: BodyId, target: BodyId, departDay: number, travelDays: number): LambertSol {
  const key = `${from}>${target}@${departDay.toFixed(4)}+${travelDays.toFixed(4)}`;
  const hit = lambertCache.get(key);
  if (hit !== undefined || lambertCache.has(key)) return hit ?? null;
  const center = BODIES[from].parent as BodyId;
  const sol = lambert2D(
    bodyPosition(from, departDay), bodyPosition(target, departDay + travelDays),
    travelDays * DAY_S, BODIES[center].muKm3s2,
  );
  if (lambertCache.size > 5000) lambertCache.clear();
  lambertCache.set(key, sol);
  return sol;
}

// ---------------------------------------------------------- impulsive transfer

export interface TransferSolution {
  relation: Relation;
  centerBody: BodyId;
  departDay: number;
  travelDays: number;      // actual (Hohmann for moon/parent transfers)
  arrivalDay: number;
  dvDepartMs: number;      // burn from the parking orbit
  captureLowMs: number;    // capture into the target's low orbit (for heat maps)
  vInfArr: Vec2;           // arrival excess velocity relative to target
  trajectory?: TrajectorySegment;
}

/** Chemical (impulsive) transfer from a circular orbit at `altKm` around `from` to `target`. */
export function solveTransfer(
  from: BodyId, altKm: number, target: BodyId, departDay: number, travelDays: number, withTrajectory = true,
): TransferSolution | null {
  const rel = transferRelation(from, target);
  if (!rel) return null;
  const A = BODIES[from];
  const T = BODIES[target];
  const rPark = parkRadius(from, altKm);

  if (rel === 'sibling') {
    if (!(travelDays > 0)) return null;
    const C = A.parent as BodyId;
    const sol = siblingLambert(from, target, departDay, travelDays);
    if (!sol) return null;
    const vInfDep = sub(sol.v1, bodyVelocity(from, departDay));
    const vInfArr = sub(sol.v2, bodyVelocity(target, departDay + travelDays));
    const out: TransferSolution = {
      relation: rel, centerBody: C, departDay, travelDays, arrivalDay: departDay + travelDays,
      dvDepartMs: escapeDvKms(A.muKm3s2, rPark, norm(vInfDep)) * 1000,
      captureLowMs: escapeDvKms(T.muKm3s2, lowRadius(target), norm(vInfArr)) * 1000,
      vInfArr,
    };
    if (withTrajectory) {
      out.trajectory = {
        centerBody: C, startDay: departDay, endDay: departDay + travelDays,
        points: sampleConic(bodyPosition(from, departDay), sol.v1, BODIES[C].muKm3s2, travelDays * DAY_S, TRAJ_POINTS),
      };
    }
    return out;
  }

  if (rel === 'child') {
    // Hohmann from the parking orbit to the moon's orbit, around `from`.
    const mu = A.muKm3s2;
    const r1 = rPark;
    const r2 = T.orbitRadiusKm;
    const sum = r1 + r2;
    const tof = (Math.PI * Math.sqrt(Math.pow(sum / 2, 3) / mu)) / DAY_S;
    const vDep = Math.sqrt(mu * (2 / r1 - 2 / sum));
    const vArr = Math.sqrt(mu * (2 / r2 - 2 / sum));
    const arrival = departDay + tof;
    const vT = bodyVelocity(target, arrival);
    const vInfArr = scale(unit(vT), vArr - norm(vT));
    const out: TransferSolution = {
      relation: rel, centerBody: from, departDay, travelDays: tof, arrivalDay: arrival,
      dvDepartMs: Math.abs(vDep - circularSpeed(mu, r1)) * 1000,
      captureLowMs: escapeDvKms(T.muKm3s2, lowRadius(target), norm(vInfArr)) * 1000,
      vInfArr,
    };
    if (withTrajectory) {
      const pT = bodyPosition(target, arrival);
      const th0 = Math.atan2(pT.y, pT.x) - Math.PI;
      const r0 = { x: r1 * Math.cos(th0), y: r1 * Math.sin(th0) };
      const v0 = { x: -vDep * Math.sin(th0), y: vDep * Math.cos(th0) };
      out.trajectory = {
        centerBody: from, startDay: departDay, endDay: arrival,
        points: sampleConic(r0, v0, mu, tof * DAY_S, TRAJ_POINTS),
      };
    }
    return out;
  }

  // rel === 'parent': escape the moon, fall to the parent's low orbit.
  const mu = T.muKm3s2;
  const ra = A.orbitRadiusKm;
  const rp = lowRadius(target);
  const sum = ra + rp;
  const tof = (Math.PI * Math.sqrt(Math.pow(sum / 2, 3) / mu)) / DAY_S;
  const vMoon = circularSpeed(mu, ra);
  const vApo = Math.sqrt((mu * 2 * rp) / (ra * sum));
  const vPeri = Math.sqrt((mu * 2 * ra) / (rp * sum));
  const arrival = departDay + tof;
  const pA = bodyPosition(from, departDay);
  const dirA = unit(bodyVelocity(from, departDay));
  // At periapsis (opposite the departure point) the velocity points along -dirA.
  const vInfArr = scale(dirA, -(vPeri - circularSpeed(mu, rp)));
  const out: TransferSolution = {
    relation: rel, centerBody: target, departDay, travelDays: tof, arrivalDay: arrival,
    dvDepartMs: escapeDvKms(A.muKm3s2, rPark, Math.abs(vMoon - vApo)) * 1000,
    captureLowMs: (vPeri - circularSpeed(mu, rp)) * 1000,
    vInfArr,
  };
  if (withTrajectory) {
    out.trajectory = {
      centerBody: target, startDay: departDay, endDay: arrival,
      points: sampleConic(pA, scale(dirA, vApo), mu, tof * DAY_S, TRAJ_POINTS),
    };
  }
  return out;
}

// ------------------------------------------------------------------ ion

/** Low-thrust spiral delta-v (m/s) from a parking orbit around `from` to the low orbit of `target`. */
export function ionTransferDvMs(from: BodyId, altKm: number, target: BodyId): number | null {
  const rel = transferRelation(from, target);
  if (!rel) return null;
  const A = BODIES[from];
  const T = BODIES[target];
  const rPark = parkRadius(from, altKm);
  let dv: number;
  if (rel === 'sibling') {
    const muC = BODIES[A.parent as BodyId].muKm3s2;
    dv = circularSpeed(A.muKm3s2, rPark)
      + Math.abs(circularSpeed(muC, A.orbitRadiusKm) - circularSpeed(muC, T.orbitRadiusKm))
      + circularSpeed(T.muKm3s2, lowRadius(target));
  } else if (rel === 'child') {
    dv = Math.abs(circularSpeed(A.muKm3s2, rPark) - circularSpeed(A.muKm3s2, T.orbitRadiusKm))
      + circularSpeed(T.muKm3s2, lowRadius(target));
  } else {
    dv = circularSpeed(A.muKm3s2, rPark)
      + Math.abs(circularSpeed(T.muKm3s2, A.orbitRadiusKm) - circularSpeed(T.muKm3s2, lowRadius(target)));
  }
  return dv * 1000;
}

/** Cosmetic spiral for ion transfers (uniform in time). */
export function ionTrajectory(
  from: BodyId, altKm: number, target: BodyId, departDay: number, travelDays: number,
): TrajectorySegment | undefined {
  const rel = transferRelation(from, target);
  if (!rel) return undefined;
  const arrival = departDay + travelDays;
  let center: BodyId;
  let p0: Vec2;
  let p1: Vec2;
  if (rel === 'sibling') {
    center = BODIES[from].parent as BodyId;
    p0 = bodyPosition(from, departDay);
    p1 = bodyPosition(target, arrival);
  } else if (rel === 'child') {
    center = from;
    p1 = bodyPosition(target, arrival);
    const th = Math.atan2(p1.y, p1.x) - Math.PI;
    const r = parkRadius(from, altKm);
    p0 = { x: r * Math.cos(th), y: r * Math.sin(th) };
  } else {
    center = target;
    p0 = bodyPosition(from, departDay);
    const th = Math.atan2(p0.y, p0.x) + Math.PI;
    const r = lowRadius(target);
    p1 = { x: r * Math.cos(th), y: r * Math.sin(th) };
  }
  const a0 = Math.atan2(p0.y, p0.x);
  let a1 = Math.atan2(p1.y, p1.x);
  while (a1 <= a0) a1 += 2 * Math.PI;
  const rA = norm(p0);
  const rB = norm(p1);
  const points: Vec2[] = [];
  for (let i = 0; i < TRAJ_POINTS; i++) {
    const t = i / (TRAJ_POINTS - 1);
    const r = rA + (rB - rA) * t;
    const a = a0 + (a1 - a0) * t;
    points.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
  }
  return { centerBody: center, points, startDay: departDay, endDay: arrival };
}

// ---------------------------------------------------------------- flyby

export interface FlybySolution {
  dvMs: number;
  vInfArr: Vec2;
  arrivalDay: number;
  turnDeg: number;
  turnMaxDeg: number;
  trajectory?: TrajectorySegment;
}

/** Powered flyby of `body` (arriving with vIn on `day`) toward sibling `target`. */
export function solveFlyby(
  body: BodyId, vIn: Vec2, day: number, target: BodyId, periapsisAltKm: number, travelDays: number, withTrajectory = true,
): FlybySolution | null {
  if (transferRelation(body, target) !== 'sibling' || !(travelDays > 0)) return null;
  const B = BODIES[body];
  const C = B.parent as BodyId;
  const sol = siblingLambert(body, target, day, travelDays);
  if (!sol) return null;
  const vOut = sub(sol.v1, bodyVelocity(body, day));
  const vInMag = norm(vIn);
  const vOutMag = norm(vOut);
  const rp = B.radiusKm + Math.max(0, periapsisAltKm);
  const turnMax = vInMag > 0 ? 2 * Math.asin(1 / (1 + (rp * vInMag * vInMag) / B.muKm3s2)) : Math.PI;
  const turn = angleBetween(vIn, vOut);
  let dv = Math.abs(vOutMag - vInMag);
  if (turn > turnMax) dv += 2 * vOutMag * Math.sin((turn - turnMax) / 2);
  const out: FlybySolution = {
    dvMs: dv * 1000,
    vInfArr: sub(sol.v2, bodyVelocity(target, day + travelDays)),
    arrivalDay: day + travelDays,
    turnDeg: (turn * 180) / Math.PI,
    turnMaxDeg: (turnMax * 180) / Math.PI,
  };
  if (withTrajectory) {
    out.trajectory = {
      centerBody: C, startDay: day, endDay: day + travelDays,
      points: sampleConic(bodyPosition(body, day), sol.v1, BODIES[C].muKm3s2, travelDays * DAY_S, TRAJ_POINTS),
    };
  }
  return out;
}

/** Cheapest flyby travel time over a range (coarse scan). */
export function bestFlybyTravel(
  body: BodyId, vIn: Vec2, day: number, target: BodyId, periapsisAltKm: number, travel: [number, number],
): number {
  let best = (travel[0] + travel[1]) / 2;
  let bestDv = Infinity;
  const n = 80;
  for (let i = 0; i < n; i++) {
    const t = travel[0] + ((travel[1] - travel[0]) * i) / (n - 1);
    const fb = solveFlyby(body, vIn, day, target, periapsisAltKm, t, false);
    if (fb && fb.dvMs < bestDv) {
      bestDv = fb.dvMs;
      best = t;
    }
  }
  return best;
}

// ------------------------------------------------------------ ranges & grid

/** Hohmann time of flight (days) for a transfer between two bodies (or to/from a moon). */
export function hohmannTravelDays(from: BodyId, target: BodyId, altKm?: number): number {
  const rel = transferRelation(from, target);
  if (rel === 'sibling') {
    const mu = BODIES[BODIES[from].parent as BodyId].muKm3s2;
    return hohmann(mu, BODIES[from].orbitRadiusKm, BODIES[target].orbitRadiusKm).tofDays;
  }
  if (rel === 'child') {
    return hohmann(BODIES[from].muKm3s2, parkRadius(from, altKm ?? BODIES[from].lowOrbitAltKm), BODIES[target].orbitRadiusKm).tofDays;
  }
  if (rel === 'parent') {
    return hohmann(BODIES[target].muKm3s2, BODIES[from].orbitRadiusKm, lowRadius(target)).tofDays;
  }
  return 200;
}

export function transferRanges(from: BodyId, target: BodyId, earliestDay: number): { depart: [number, number]; travel: [number, number] } {
  const rel = transferRelation(from, target);
  if (!rel) return { depart: [earliestDay, earliestDay + 900], travel: [30, 400] };
  const tH = hohmannTravelDays(from, target);
  if (rel === 'sibling') {
    const pA = orbitalPeriodDays(from);
    const pT = orbitalPeriodDays(target);
    const inv = Math.abs(1 / pA - 1 / pT);
    const syn = inv > 1e-12 ? 1 / inv : 1200;
    return { depart: [earliestDay, earliestDay + Math.min(1.2 * syn, 1200)], travel: [0.4 * tH, 2.0 * tH] };
  }
  // Moon / parent transfers: travel time is fixed to the Hohmann value.
  const period = rel === 'child' ? orbitalPeriodDays(target) : orbitalPeriodDays(from);
  return { depart: [earliestDay, earliestDay + Math.max(1, period)], travel: [0.5 * tH, 2.0 * tH] };
}

export interface TransferGrid {
  departDays: number[];
  travelDays: number[];
  dvMs: number[][];
  best: { departDay: number; travelDays: number; dvMs: number };
}

function axis(range: [number, number], n: number): number[] {
  if (n <= 1) return [range[0]];
  return Array.from({ length: n }, (_, i) => range[0] + (i * (range[1] - range[0])) / (n - 1));
}

export function transferGrid(
  from: Extract<FlightState, { kind: 'orbit' }>, target: BodyId,
  departRange: [number, number], travelRange: [number, number], nx: number, ny: number,
): TransferGrid {
  const departDays = axis(departRange, nx);
  const travelDays = axis(travelRange, ny);
  const dvMs: number[][] = travelDays.map(() => departDays.map(() => Infinity));
  const best = { departDay: departDays[0], travelDays: travelDays[0], dvMs: Infinity };
  const rel = transferRelation(from.body, target);
  if (!rel) return { departDays, travelDays, dvMs, best };
  const A = BODIES[from.body];
  const T = BODIES[target];
  const rPark = parkRadius(from.body, from.altitudeKm);
  const rLowT = lowRadius(target);

  if (rel === 'sibling') {
    const muC = BODIES[A.parent as BodyId].muKm3s2;
    const depPos = departDays.map((d) => bodyPosition(from.body, d));
    const depVel = departDays.map((d) => bodyVelocity(from.body, d));
    for (let iy = 0; iy < travelDays.length; iy++) {
      const tof = travelDays[iy];
      if (!(tof > 0)) continue;
      for (let ix = 0; ix < departDays.length; ix++) {
        const arr = departDays[ix] + tof;
        const sol = lambert2D(depPos[ix], bodyPosition(target, arr), tof * DAY_S, muC);
        if (!sol) continue;
        const vd = norm(sub(sol.v1, depVel[ix]));
        const va = norm(sub(sol.v2, bodyVelocity(target, arr)));
        const dv = (escapeDvKms(A.muKm3s2, rPark, vd) + escapeDvKms(T.muKm3s2, rLowT, va)) * 1000;
        dvMs[iy][ix] = dv;
        if (dv < best.dvMs) {
          best.dvMs = dv;
          best.departDay = departDays[ix];
          best.travelDays = tof;
        }
      }
    }
    return { departDays, travelDays, dvMs, best };
  }

  // Moon / parent: Hohmann, independent of the sliders.
  const s = solveTransfer(from.body, from.altitudeKm, target, departDays[0], 1, false);
  if (s) {
    const dv = s.dvDepartMs + (rel === 'parent' ? s.captureLowMs : escapeDvKms(T.muKm3s2, rLowT, norm(s.vInfArr)) * 1000);
    for (const row of dvMs) row.fill(dv);
    best.dvMs = dv;
    best.departDay = departDays[0];
    best.travelDays = s.travelDays;
  }
  return { departDays, travelDays, dvMs, best };
}
