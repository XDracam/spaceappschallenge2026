// Shared Science-support terms: the review and host reducer use the same rules.
import { FACILITY_BY_ID, MAX_HIRED_TEAMS, RENT_MONTHS, TEAM_OFFER_BY_ID, hiredTeams } from '../../core/facilities';
import { budgetAvailableM, DAYS_PER_MONTH, type GameState } from '../../core/state';

export type SupportPurchase = { type: 'facility'; facilityId: string; months: number | 'buy' } | { type: 'team'; offerId: string };
type SupportState = Pick<GameState, 'research' | 'budget'> & { clock: Pick<GameState['clock'], 'day'>; meta: Pick<GameState['meta'], 'phase'> };
export interface SupportQuote { name: string; costM: number; from: number; until?: number; blocked: string }

export function quoteSupport(s: SupportState, purchase: SupportPurchase): SupportQuote {
  const day = s.clock.day;
  const q: SupportQuote = { name: 'Unavailable supply', costM: 0, from: day, blocked: '' };
  if (purchase.type === 'team') {
    const o = TEAM_OFFER_BY_ID[purchase.offerId];
    if (!o) return { ...q, blocked: 'This research team is no longer offered.' };
    q.name = o.label; q.costM = o.feeM; q.from = day + o.leadDays;
    if (o.months !== undefined) q.until = q.from + o.months * DAYS_PER_MONTH;
    if (hiredTeams(s.research, day).length >= MAX_HIRED_TEAMS) q.blocked = `All ${MAX_HIRED_TEAMS} hired-team slots are filled.`;
  } else {
    const f = FACILITY_BY_ID[purchase.facilityId];
    if (!f) return { ...q, blocked: 'This facility is no longer offered.' };
    q.name = f.name; q.from = day + f.leadDays;
    const held = (s.research.facilities ?? []).filter(l => l.facilityId === f.id);
    if (held.some(l => l.until === undefined)) q.blocked = 'Already owned; no additional purchase is needed.';
    if (purchase.months === 'buy') {
      if (f.buyM === undefined) return { ...q, blocked: 'This facility is available to rent only.' };
      q.costM = f.buyM; q.from = day + f.leadDays * 2;
    } else {
      if (!RENT_MONTHS.includes(purchase.months)) return { ...q, blocked: 'Choose a 3, 6 or 12 month rental.' };
      q.costM = Math.round(f.rentPerMonthM * purchase.months * 1000) / 1000;
      q.from = Math.max(q.from, ...held.map(l => l.until ?? 0));
      q.until = q.from + purchase.months * DAYS_PER_MONTH;
    }
  }
  if (s.meta.phase !== 'planning') q.blocked = 'Purchases are available during mission preparation.';
  else if (!q.blocked && q.costM > budgetAvailableM(s.budget) + 1e-9) q.blocked = 'Not enough shared budget. Choose a cheaper option or request funding.';
  return q;
}
