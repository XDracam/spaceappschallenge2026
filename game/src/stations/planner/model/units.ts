export const G0 = 9.80665;                // m/s^2
export const AU_KM = 149_597_870.7;
export const DAY_S = 86_400;
export const DAYS_PER_MONTH = 30.44;
/** Agency calendar rate: 1 real minute = 1 calendar month. */
export const DEFAULT_DAYS_PER_SECOND = DAYS_PER_MONTH / 60;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayToDate(day: number, startISO: string): Date {
  const d = new Date(startISO + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.floor(day));
  return d;
}

/** "14 Mar 2031" */
export function formatDay(day: number, startISO: string): string {
  const d = dayToDate(day, startISO);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Mar 2031" */
export function formatMonth(day: number, startISO: string): string {
  const d = dayToDate(day, startISO);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "1 y 3 mo" / "5 mo" / "12 d" */
export function formatDuration(days: number): string {
  const sign = days < 0 ? '-' : '';
  days = Math.abs(days);
  if (days < 45) return `${sign}${Math.round(days)} d`;
  const months = Math.round(days / DAYS_PER_MONTH);
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${sign}${m} mo`;
  return m === 0 ? `${sign}${y} y` : `${sign}${y} y ${m} mo`;
}

export function formatDv(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} km/s` : `${Math.round(ms)} m/s`;
}

export function formatMass(t: number): string {
  if (t >= 100) return `${t.toFixed(0)} t`;
  if (t >= 1) return `${t.toFixed(2)} t`;
  return `${(t * 1000).toFixed(0)} kg`;
}

export function formatMoney(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} B` : `${m.toFixed(1)} M`;
}
