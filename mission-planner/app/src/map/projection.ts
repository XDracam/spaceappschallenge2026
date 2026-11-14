import type { BodyId, Vec2 } from '../model/types';
import { BODIES, childrenOf } from '../data/bodies';

/**
 * Radial sqrt projection about the view centre: a point at distance r (km)
 * from the centre body lands at k * zoom * sqrt(r) pixels from the screen
 * origin, keeping its direction. Every map point (bodies, orbits,
 * trajectories) goes through the same mapping so they stay consistent.
 */
export interface Projection {
  /** Screen position (CSS px) of the view centre body, including pan. */
  ox: number;
  oy: number;
  /** k * zoom: pixels per sqrt(km). */
  scale: number;
}

export function toScreen(p: Projection, v: Vec2): Vec2 {
  const r = Math.hypot(v.x, v.y);
  if (!(r > 0)) return { x: p.ox, y: p.oy };
  const s = (p.scale * Math.sqrt(r)) / r;
  // Inertial frame is counter-clockwise from +x; screen y points down.
  return { x: p.ox + v.x * s, y: p.oy - v.y * s };
}

export function radiusPx(p: Projection, rKm: number): number {
  return p.scale * Math.sqrt(Math.max(0, rKm));
}

/** Distance (km) from the centre that should fit the view at zoom 1. */
export function viewExtentKm(center: BodyId): number {
  if (center === 'sun') return BODIES.jupiter.orbitRadiusKm;
  const moons = childrenOf(center);
  if (moons.length === 0) return BODIES[center].radiusKm * 20;
  return Math.max(...moons.map((m) => m.orbitRadiusKm));
}

/** k such that the view extent lands at `fitPx` from the centre. */
export function fitScale(center: BodyId, fitPx: number): number {
  return fitPx / Math.sqrt(viewExtentKm(center));
}
