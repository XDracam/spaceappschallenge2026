import type { Vec2 } from '../model/types';
import { dot, norm } from './vec';

// Two-body propagation with universal variables (km, km/s, s).

function stumpffC(z: number): number {
  if (z > 1e-6) return (1 - Math.cos(Math.sqrt(z))) / z;
  if (z < -1e-6) return (Math.cosh(Math.sqrt(-z)) - 1) / -z;
  return 0.5 - z / 24;
}

function stumpffS(z: number): number {
  if (z > 1e-6) {
    const s = Math.sqrt(z);
    return (s - Math.sin(s)) / (s * s * s);
  }
  if (z < -1e-6) {
    const s = Math.sqrt(-z);
    return (Math.sinh(s) - s) / (s * s * s);
  }
  return 1 / 6 - z / 120;
}

export function propagate(r0: Vec2, v0: Vec2, dt: number, mu: number): { r: Vec2; v: Vec2 } {
  const r0n = norm(r0);
  const vr0 = dot(r0, v0) / r0n;
  const alpha = 2 / r0n - dot(v0, v0) / mu;
  const sqmu = Math.sqrt(mu);
  let chi = (sqmu * dt) / r0n;
  for (let i = 0; i < 60; i++) {
    const z = alpha * chi * chi;
    const C = stumpffC(z);
    const S = stumpffS(z);
    const F = ((r0n * vr0) / sqmu) * chi * chi * C + (1 - alpha * r0n) * chi * chi * chi * S + r0n * chi - sqmu * dt;
    const dF = ((r0n * vr0) / sqmu) * chi * (1 - z * S) + (1 - alpha * r0n) * chi * chi * C + r0n;
    const step = F / dF;
    chi -= step;
    if (Math.abs(step) < 1e-9 * Math.max(1, Math.abs(chi))) break;
  }
  const z = alpha * chi * chi;
  const C = stumpffC(z);
  const S = stumpffS(z);
  const f = 1 - ((chi * chi) / r0n) * C;
  const g = dt - ((chi * chi * chi) / sqmu) * S;
  const r = { x: f * r0.x + g * v0.x, y: f * r0.y + g * v0.y };
  const rn = norm(r);
  const fdot = (sqmu / (rn * r0n)) * (alpha * chi * chi * chi * S - chi);
  const gdot = 1 - ((chi * chi) / rn) * C;
  return { r, v: { x: fdot * r0.x + gdot * v0.x, y: fdot * r0.y + gdot * v0.y } };
}

/** n points along a conic, uniformly spaced in time over durationS (first point = r0). */
export function sampleConic(r0: Vec2, v0: Vec2, mu: number, durationS: number, n: number): Vec2[] {
  const pts: Vec2[] = [r0];
  const dt = durationS / (n - 1);
  let r = r0;
  let v = v0;
  for (let i = 1; i < n; i++) {
    const s = propagate(r, v, dt, mu);
    r = s.r;
    v = s.v;
    pts.push(r);
  }
  return pts;
}
