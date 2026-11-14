import type { Vec2 } from '../model/types';

// Small 2D vector helpers (km, km/s).

export const v2 = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
/** z component of the 3D cross product. */
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;
export const norm = (a: Vec2): number => Math.hypot(a.x, a.y);
export function unit(a: Vec2): Vec2 {
  const n = norm(a);
  return n > 0 ? { x: a.x / n, y: a.y / n } : { x: 1, y: 0 };
}
/** Unsigned angle between two vectors (rad). */
export const angleBetween = (a: Vec2, b: Vec2): number => Math.atan2(Math.abs(cross(a, b)), dot(a, b));
export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
