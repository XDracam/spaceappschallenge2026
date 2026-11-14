import type { Vec2 } from '../model/types';
import { cross, norm } from './vec';

// Lambert's problem in 2D: prograde (counter-clockwise), single revolution.
// Izzo's algorithm (2015), M = 0. Robust near 180 deg transfers, which the
// f/g universal-variable formulation is not.

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function hypergeometricF(z: number, tol: number): number {
  let sj = 1;
  let cj = 1;
  let err = 1;
  let j = 0;
  while (err > tol && j < 200) {
    const cj1 = (((cj * (3 + j) * (1 + j)) / (2.5 + j)) * z) / (j + 1);
    sj += cj1;
    err = Math.abs(cj1);
    cj = cj1;
    j++;
  }
  return sj;
}

function x2tofLagrange(x: number, lambda: number): number {
  const a = 1 / (1 - x * x);
  if (a > 0) {
    const alfa = 2 * Math.acos(clamp(x, -1, 1));
    let beta = 2 * Math.asin(Math.sqrt(clamp((lambda * lambda) / a, 0, 1)));
    if (lambda < 0) beta = -beta;
    return (a * Math.sqrt(a) * (alfa - Math.sin(alfa) - (beta - Math.sin(beta)))) / 2;
  }
  const alfa = 2 * Math.acosh(x);
  let beta = 2 * Math.asinh(Math.sqrt((-lambda * lambda) / a));
  if (lambda < 0) beta = -beta;
  return (-a * Math.sqrt(-a) * (beta - Math.sinh(beta) - (alfa - Math.sinh(alfa)))) / 2;
}

/** Non-dimensional time of flight for x (M = 0). */
function x2tof(x: number, lambda: number): number {
  const dist = Math.abs(x - 1);
  if (dist < 0.2 && dist > 0.01) return x2tofLagrange(x, lambda);
  const K = lambda * lambda;
  const E = x * x - 1;
  const rho = Math.abs(E);
  const z = Math.sqrt(1 + K * E);
  if (dist <= 0.01) {
    const eta = z - lambda * x;
    const s1 = 0.5 * (1 - lambda - x * eta);
    const q = (4 / 3) * hypergeometricF(s1, 1e-11);
    return (eta * eta * eta * q + 4 * lambda * eta) / 2;
  }
  const y = Math.sqrt(rho);
  const g = x * z - lambda * E;
  let d: number;
  if (E < 0) d = Math.acos(clamp(g, -1, 1));
  else d = Math.log(y * (z - lambda * x) + g);
  return (x - lambda * z - d / y) / E;
}

function dTdx(x: number, T: number, lambda: number): [number, number, number] {
  const l2 = lambda * lambda;
  const l3 = l2 * lambda;
  const umx2 = 1 - x * x;
  const y = Math.sqrt(1 - l2 * umx2);
  const y2 = y * y;
  const y3 = y2 * y;
  const d1 = (3 * T * x - 2 + (2 * l3 * x) / y) / umx2;
  const d2 = (3 * T + 5 * x * d1 + (2 * (1 - l2) * l3) / y3) / umx2;
  const d3 = (7 * x * d2 + 8 * d1 - (6 * (1 - l2) * l2 * l3 * x) / y3 / y2) / umx2;
  return [d1, d2, d3];
}

function householder(T: number, x0: number, lambda: number): number {
  let x = x0;
  for (let it = 0; it < 20; it++) {
    const tof = x2tof(x, lambda);
    const [d1, d2, d3] = dTdx(x, tof, lambda);
    const delta = tof - T;
    const d1sq = d1 * d1;
    let xn = x - (delta * (d1sq - (delta * d2) / 2)) / (d1 * (d1sq - delta * d2) + (d3 * delta * delta) / 6);
    if (!Number.isFinite(xn)) return NaN;
    if (xn <= -1) xn = (x - 1) / 2;
    const err = Math.abs(x - xn);
    x = xn;
    if (err < 1e-11) break;
  }
  return x;
}

/**
 * Velocities at r1 (departure) and r2 (arrival) of the prograde single-revolution
 * conic connecting them in tofS seconds around a body with gravitational parameter mu.
 */
export function lambert2D(r1: Vec2, r2: Vec2, tofS: number, mu: number): { v1: Vec2; v2: Vec2 } | null {
  const r1n = norm(r1);
  const r2n = norm(r2);
  const c = Math.hypot(r2.x - r1.x, r2.y - r1.y);
  if (!(tofS > 0) || r1n <= 0 || r2n <= 0 || c < 1e-9 * (r1n + r2n)) return null;
  const s = (r1n + r2n + c) / 2;
  const ir1 = { x: r1.x / r1n, y: r1.y / r1n };
  const ir2 = { x: r2.x / r2n, y: r2.y / r2n };
  let lambda = Math.sqrt(Math.max(0, 1 - c / s));
  if (cross(ir1, ir2) < 0) lambda = -lambda;
  const it1 = { x: -ir1.y, y: ir1.x };
  const it2 = { x: -ir2.y, y: ir2.x };
  const T = Math.sqrt((2 * mu) / (s * s * s)) * tofS;

  const T00 = Math.acos(lambda) + lambda * Math.sqrt(1 - lambda * lambda);
  const T1 = (2 / 3) * (1 - lambda * lambda * lambda);
  let x0: number;
  if (T >= T00) x0 = Math.pow(T00 / T, 2 / 3) - 1;
  else if (T < T1) x0 = (2.5 * T1 * (T1 - T)) / (T * Math.max(1e-12, 1 - Math.pow(lambda, 5))) + 1;
  else x0 = Math.pow(T / T00, Math.LN2 / Math.log(T1 / T00)) - 1;
  const x = householder(T, x0, lambda);
  if (!Number.isFinite(x) || x <= -1) return null;

  const gamma = Math.sqrt((mu * s) / 2);
  const rho = (r1n - r2n) / c;
  const sigma = Math.sqrt(Math.max(0, 1 - rho * rho));
  const y = Math.sqrt(1 - lambda * lambda + lambda * lambda * x * x);
  const vr1 = (gamma * (lambda * y - x - rho * (lambda * y + x))) / r1n;
  const vr2 = (-gamma * (lambda * y - x + rho * (lambda * y + x))) / r2n;
  const vt = gamma * sigma * (y + lambda * x);
  const vt1 = vt / r1n;
  const vt2 = vt / r2n;
  const v1 = { x: vr1 * ir1.x + vt1 * it1.x, y: vr1 * ir1.y + vt1 * it1.y };
  const v2 = { x: vr2 * ir2.x + vt2 * it2.x, y: vr2 * ir2.y + vt2 * it2.y };
  if (![v1.x, v1.y, v2.x, v2.y].every(Number.isFinite)) return null;
  return { v1, v2 };
}
