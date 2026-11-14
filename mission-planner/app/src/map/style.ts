import type { BodyId } from '../model/types';

/** Palette shared with the UI (glass panels over a dark space map). */
export const COLORS = {
  bg: '#05080f',
  accent: '#3fc7ff',
  orbit: 'rgba(63, 199, 255, 0.14)',
  orbitMoon: 'rgba(63, 199, 255, 0.09)',
  orbitHover: 'rgba(63, 199, 255, 0.42)',
  text: '#e8f1ff',
  muted: '#8796b0',
  fail: '#ff5f6d',
  warn: '#ffc857',
  glass: 'rgba(14, 22, 38, 0.85)',
  glassHot: 'rgba(22, 38, 64, 0.92)',
  glassBorder: 'rgba(110, 190, 255, 0.16)',
  glassBorderHot: 'rgba(110, 190, 255, 0.42)',
  belt: '#8fb6d8',
  /** Deep-blue glow behind the view centre. */
  centerGlow: '#0e2c5c',
};

export const BRANCH_COLORS = ['#3fc7ff', '#b98cff', '#ffaa5c', '#3fe0a0'];

export function branchColor(index: number): string {
  return BRANCH_COLORS[((index % BRANCH_COLORS.length) + BRANCH_COLORS.length) % BRANCH_COLORS.length];
}

const SANS = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const DISPLAY = '"Exo 2", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Tooltip body text. */
export const FONT = `12px ${SANS}`;
export const FONT_BOLD = `600 12px ${SANS}`;
/** Small uppercase, letter-spaced map labels. */
export const FONT_LABEL = `500 10.5px ${SANS}`;
export const LABEL_SPACING = '1.2px';
export const FONT_HUD = `500 11px ${SANS}`;
export const FONT_HINT = `10.5px ${SANS}`;
export const FONT_TITLE = `600 20px ${DISPLAY}`;

/** Atmosphere rim colour of a large (centre) planet; null = none. */
export const RIM_COLOR: Partial<Record<BodyId, string>> = {
  earth: '#3fc7ff',
  mars: '#ff8a4c',
  jupiter: '#e8c49a',
  venus: '#f3d9a0',
};

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

/** Animation (end-state pulse, star twinkle): at most this many frames per second. */
export const ANIM_FPS = 30;
