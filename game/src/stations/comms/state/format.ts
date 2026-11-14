// Small formatting helpers for the UI and for news text. Pure, no framework imports.

import type { Effect, EventInstance, StakeholderId } from '../model/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86_400_000;
const MINUS = '−';

export const STAKEHOLDER_LABEL: Record<StakeholderId, string> = {
  government: 'Government',
  industry: 'Industry',
  public: 'Public',
  partners: 'Partners',
};

/** Agency calendar day → "14 Mar 2030" (day 0 = startISO). */
export function formatDay(day: number, startISO: string): string {
  const [y, m, d] = startISO.split('-').map(Number);
  const t = new Date(Date.UTC(y, (m || 1) - 1, d || 1) + Math.floor(day) * DAY_MS);
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}

/** Duration in days → "5 d", "3 wk", "2 mo", "1.5 yr". */
export function formatDuration(days: number): string {
  const d = Math.max(0, days);
  if (d < 1) return '<1 d';
  if (d < 14) return `${Math.round(d)} d`;
  if (d < 60) return `${Math.round(d / 7)} wk`;
  if (d < 730) return `${Math.round(d / 30.44)} mo`;
  return `${(d / 365.25).toFixed(1)} yr`;
}

function num(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) return `${parseFloat((a / 1000).toFixed(a >= 10_000 ? 0 : 2))} B`;
  return `${Number.isInteger(a) || a >= 10 ? Math.round(a) : a.toFixed(1)} M`;
}

/** Money in millions → "12 M", "2.5 M", "1.2 B", negative with a real minus sign. */
export function formatMoney(m: number): string {
  return `${m < 0 ? MINUS : ''}${num(m)}`;
}

/** Signed money delta → "+20 M" / "−50 M". */
export function formatMoneyDelta(m: number): string {
  return `${m < 0 ? MINUS : '+'}${num(m)}`;
}

/** Signed integer/percentage → "+10" / "−5". */
export function formatSigned(n: number): string {
  return `${n < 0 ? MINUS : '+'}${Math.abs(Math.round(n * 10) / 10)}`;
}

/** Calendar days left to answer (0 when due). */
export function daysLeft(instance: Pick<EventInstance, 'deadlineDay'>, day: number): number {
  return Math.max(0, instance.deadlineDay - day);
}

function months(n: number): string {
  const a = Math.abs(n);
  return `${a} month${a === 1 ? '' : 's'}`;
}

/** One-line description of an effect (used for news lines and for revealing exact outcomes). */
export function describeEffect(e: Effect): string {
  switch (e.kind) {
    case 'trust':
      return `${STAKEHOLDER_LABEL[e.stakeholder]} trust ${formatSigned(e.delta)}`;
    case 'budget':
      return `Budget ${formatMoneyDelta(e.deltaM)}`;
    case 'deliveryDelay': {
      const what = e.scope === 'next' ? 'Next delivery' : 'Deliveries';
      return e.months >= 0 ? `${what} delayed ${months(e.months)}` : `${what} ${months(e.months)} earlier`;
    }
    case 'priceModifier':
      return `Procurement prices ${formatSigned(e.pct)} % for ${months(e.months)}`;
    case 'offer':
      return `Offer to procurement: ${e.variant} ${e.partKind} from ${e.supplier}, ${formatMoney(e.priceM)}, ${months(e.deliveryMonths)}`;
    case 'researchPace':
      return `Research pace ${formatSigned(e.pct)} % for ${months(e.months)}`;
    case 'researchLimit':
      return `Research limit ${e.key} raised to ${e.value}`;
    case 'unlock':
      return `Unlocked: ${e.key}`;
    case 'service':
      return `Service: ${e.note}`;
    case 'missionConstraint':
      return `Mission constraint: ${e.text}`;
    case 'flag':
      return `${e.on ? 'Set' : 'Cleared'} ${e.flag}`;
    case 'eventOdds':
      return `"${e.tag}" events ×${e.factor} for ${months(e.months)}`;
  }
}
