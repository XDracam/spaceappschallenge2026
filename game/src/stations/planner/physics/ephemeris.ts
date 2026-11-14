import type { BodyId, Vec2 } from '../model/types';
import { BODIES, BODY_LIST } from '../data/bodies';
import { DAY_S } from '../model/units';
import { add, norm, sub } from './vec';

// Circular, coplanar, counter-clockwise orbits around each body's parent.

const periodCache = new Map<BodyId, number>();

export function orbitalPeriodDays(id: BodyId): number {
  let p = periodCache.get(id);
  if (p === undefined) {
    const b = BODIES[id];
    if (!b.parent) p = 0;
    else {
      const mu = BODIES[b.parent].muKm3s2;
      const r = b.orbitRadiusKm;
      p = (2 * Math.PI * Math.sqrt((r * r * r) / mu)) / DAY_S;
    }
    periodCache.set(id, p);
  }
  return p;
}

/** Angle of the body on its orbit (rad, counter-clockwise from +x). */
export function bodyAngle(id: BodyId, day: number): number {
  const b = BODIES[id];
  if (!b.parent) return 0;
  return ((b.phaseAtEpochDeg + (360 * day) / orbitalPeriodDays(id)) * Math.PI) / 180;
}

export function bodyPosition(id: BodyId, day: number): Vec2 {
  const b = BODIES[id];
  if (!b.parent) return { x: 0, y: 0 };
  const a = bodyAngle(id, day);
  return { x: b.orbitRadiusKm * Math.cos(a), y: b.orbitRadiusKm * Math.sin(a) };
}

export function bodyVelocity(id: BodyId, day: number): Vec2 {
  const b = BODIES[id];
  if (!b.parent) return { x: 0, y: 0 };
  const a = bodyAngle(id, day);
  const v = Math.sqrt(BODIES[b.parent].muKm3s2 / b.orbitRadiusKm);
  return { x: -v * Math.sin(a), y: v * Math.cos(a) };
}

export function bodyPositionAbs(id: BodyId, day: number): Vec2 {
  let p: Vec2 = { x: 0, y: 0 };
  let cur: BodyId | null = id;
  while (cur && BODIES[cur].parent) {
    p = add(p, bodyPosition(cur, day));
    cur = BODIES[cur].parent;
  }
  return p;
}

export function sunDistanceKm(id: BodyId, day: number): number {
  return Math.max(1, norm(bodyPositionAbs(id, day)));
}

export function earthDistanceKm(id: BodyId, day: number): number {
  return norm(sub(bodyPositionAbs(id, day), bodyPositionAbs('earth', day)));
}

export function siblingsOf(id: BodyId): BodyId[] {
  const parent = BODIES[id].parent;
  if (!parent) return [];
  return BODY_LIST.filter((b) => b.parent === parent && b.id !== id).map((b) => b.id);
}

export function childrenIdsOf(id: BodyId): BodyId[] {
  return BODY_LIST.filter((b) => b.parent === id).map((b) => b.id);
}

export type Relation = 'sibling' | 'child' | 'parent';

/** How a transfer from `from` to `to` works, or null if not offered. */
export function transferRelation(from: BodyId, to: BodyId): Relation | null {
  if (from === to) return null;
  const pf = BODIES[from].parent;
  const pt = BODIES[to].parent;
  if (pf && pf === pt) return 'sibling';
  if (pt === from) return 'child';
  if (pf === to && to !== 'sun') return 'parent';
  return null;
}

export const circularSpeed = (mu: number, r: number): number => Math.sqrt(mu / r);
