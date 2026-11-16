// UI formatting: the engine's helpers (src/state/format.ts) plus a few UI-only ones.

import { formatMissionDate, formatMoneyM } from '../../../shared/format';
export { formatDuration } from '../state/format';
export const formatDay = formatMissionDate;
/** Budget summaries keep tenths of a million; commitments never round to whole M. */
export const formatMoney = (value: number) => formatMoneyM(value, { billions: true });

/** Signed number with a real minus: "+5", "−3", "+2 mo". */
export function signed(n: number, unit = ''): string {
  const v = Number.isInteger(n) ? Math.abs(n) : +Math.abs(n).toFixed(1);
  return `${n < 0 ? '−' : '+'}${v}${unit}`;
}

/** Real-time "m:ss" (or "h:mm:ss"). */
export function formatRealTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function plural(n: number, word: string, many = `${word}s`): string {
  return `${n} ${n === 1 ? word : many}`;
}
