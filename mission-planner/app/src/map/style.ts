import type { BodyId } from '../model/types';

export const COLORS = {
  bg: '#0b0f17',
  orbit: '#2a3550',
  orbitHover: '#3f5280',
  text: '#e6edf7',
  muted: '#8a97ad',
  fail: '#ff5d5d',
  warn: '#f2b84b',
  panel: 'rgba(16, 22, 34, 0.94)',
  panelBorder: '#2a3550',
};

export const BRANCH_COLORS = ['#5fb3ff', '#c78bff', '#ffa657', '#4cc38a'];

export function branchColor(index: number): string {
  return BRANCH_COLORS[((index % BRANCH_COLORS.length) + BRANCH_COLORS.length) % BRANCH_COLORS.length];
}

export const FONT = '12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_BOLD = '600 12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_TITLE = '600 14px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Minimum on-screen disc radius per body (CSS px). */
export const BODY_PX: Record<BodyId, number> = {
  sun: 10,
  mercury: 5,
  venus: 6,
  earth: 6.5,
  mars: 5.5,
  vesta: 3,
  ceres: 3,
  jupiter: 8,
  moon: 4,
  phobos: 3,
  deimos: 3,
  io: 4,
  europa: 4,
  ganymede: 4,
  callisto: 4,
};

/** Hit / drag tuning. */
export const DRAG_THRESHOLD_PX = 4;
export const RING_HIT_BAND_PX = 8;
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 60;
