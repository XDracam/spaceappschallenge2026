/** Presentation only: amounts are stored in millions; dates use the mission's epoch. */
export function formatMoneyM(value: number, { decimals = 1, minimumDecimals = 0, billions = false }: {
  decimals?: number; minimumDecimals?: number; billions?: boolean;
} = {}): string {
  const unit = billions && Math.abs(value) >= 1000 ? 'B' : 'M';
  const scaled = unit === 'B' ? value / 1000 : value;
  const digits = unit === 'B' ? Math.max(2, decimals) : decimals;
  const rounded = Number(scaled.toFixed(digits));
  const amount = Math.abs(rounded).toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: minimumDecimals, maximumFractionDigits: digits });
  return `${rounded < 0 ? '−' : ''}${amount} ${unit}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** The short date keeps the day and month; full detail also includes the year. */
export function formatMissionDate(day: number, startISO: string, { year = true }: { year?: boolean } = {}): string {
  const date = new Date(`${startISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Math.floor(day));
  return formatCalendarDate(date, { year });
}

/** Render an already-resolved UTC date without parsing or slicing presentation strings. */
export function formatCalendarDate(date: Date, { year = true }: { year?: boolean } = {}): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}${year ? ` ${date.getUTCFullYear()}` : ''}`;
}
