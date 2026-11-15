// Pure procurement rules shared by the reducers (logic.ts) and the view (Station.tsx):
// prices with comms modifiers, research gating, fit checks, coverage, refunds.
// No UI imports, no randomness.
import type { Allocation, Budget, Call, Contract, Criterion, Market, Offer, PartKind, Task } from '../../core/model';
import type { GameState } from '../../core/state';
import { budgetAvailableM } from '../../core/state';
import { MISSION } from '../../core/mission';
import { beyondResearch, partName, statDefs, variantLabel, PART_KIND_LABEL } from '../planner/data/parts';
import { CATALOGUE_OFFER_BY_ID, CATALOGUE_OFFERS, RESOURCE_BY_ID } from './data/catalogue';
import { DAYS_PER_MONTH, round1 } from './data/pricing';

export { DAYS_PER_MONTH };

/**
 * The part of GameState procurement rules read. GameState satisfies it; the view
 * builds a JSON snapshot of it so it re-renders only when these parts change.
 */
export interface PView {
  market: Market;
  budget: Budget;
  research: Pick<GameState['research'], 'limits' | 'unlocked'> & Partial<Pick<GameState['research'], 'projects' | 'requests'>>;
  clock: { day: number };
  planner: { plan: { launchDay: number } };
  /** Industry trust (comms): strong (> 70) −10 % prices and lead times, strained (< 30) +10 %. */
  comms?: { trust: { industry: number } };
}

/** Comms passive modifier from industry trust, in % (same rule as comms' passiveModifiers). */
export function industryPct(s: PView): number {
  const t = s.comms?.trust.industry ?? 50;
  return t > 70 ? -10 : t < 30 ? 10 : 0;
}

// ------------------------------------------------------------------ calendar

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Calendar date of a game day (day 0 = the active mission's start, read at call time). */
export function dayToDate(day: number): Date {
  return new Date(Date.parse(`${MISSION.startDateISO}T00:00:00Z`) + Math.floor(day) * 86_400_000);
}
export function fmtDate(day: number): string {
  const d = dayToDate(day);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function fmtMonth(day: number): string {
  const d = dayToDate(day);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function fmtDuration(days: number): string {
  const a = Math.abs(days);
  if (a < 45) return `${Math.round(days)} d`;
  return `${Math.round((days / DAYS_PER_MONTH) * 10) / 10} mo`;
}
export function fmtM(v: number): string {
  if (Math.abs(v) >= 100) return `${Math.round(v)} M`;
  return `${round1(v)} M`;
}
export function fmtPct(v: number): string {
  return `${Math.round(v * 1000) / 10} %`;
}

// ------------------------------------------------------------------- stats

export function partLabel(kind: PartKind, variant: string): string {
  return partName(kind, variant);
}
export function kindLabel(kind: PartKind): string {
  return PART_KIND_LABEL[kind];
}
export { variantLabel };

interface StatInfo { label: string; unit: string; factor: number }
export function statInfo(kind: PartKind, variant: string, key: string): StatInfo {
  const def = statDefs(kind, variant).find((d) => d.key === key);
  if (!def) return { label: key, unit: '', factor: 1 };
  return { label: def.label, unit: def.displayUnit ?? def.unit, factor: def.displayFactor ?? 1 };
}
function trim(v: number): string {
  const a = Math.abs(v);
  const r = a >= 100 ? Math.round(v) : a >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
  return r.toLocaleString('en-US');
}
export function fmtStatValue(kind: PartKind, variant: string, key: string, value: number): string {
  const info = statInfo(kind, variant, key);
  return `${trim(value * info.factor)}${info.unit ? ` ${info.unit}` : ''}`;
}
export function fmtStats(kind: PartKind, variant: string, stats: Record<string, number>): string {
  return statDefs(kind, variant)
    .map((d) => `${d.unit ? '' : `${d.label} `}${fmtStatValue(kind, variant, d.key, stats[d.key] ?? 0)}`)
    .join(' · ');
}

// ---------------------------------------------------------------- research

type ResearchView = PView['research'];

/** Research / unlock keys a part with these stats exceeds (planner rule). */
export function beyondKeys(kind: PartKind, variant: string, stats: Record<string, number>, research: ResearchView): string[] {
  return beyondResearch({ id: 'x', kind, variant, name: '', stats, state: 'draft' }, research.limits, research.unlocked);
}

export function describeBeyond(key: string, stats: Record<string, number>, research: ResearchView): string {
  const parts = key.split('.');
  const kind = parts[0] as PartKind;
  const variant = parts[1];
  if (parts.length === 2) return `${partLabel(kind, variant)} not unlocked`;
  const stat = parts[2];
  const info = statInfo(kind, variant, stat);
  return `${info.label} ${fmtStatValue(kind, variant, stat, stats[stat] ?? 0)} > ${fmtStatValue(kind, variant, stat, research.limits[key] ?? 0)} researched`;
}

// --------------------------------------------------------------- modifiers

/** Price multiplier from active comms priceModifier effects (pct sums). */
export function priceMultiplier(s: PView): number {
  let pct = 0;
  for (const m of s.market.modifiers) {
    if (m.effect.kind === 'priceModifier' && m.untilDay > s.clock.day) pct += m.effect.pct;
  }
  pct += industryPct(s);
  return Math.max(0.2, 1 + pct / 100);
}

/** Extra days added to new contracts by active deliveryDelay modifiers. */
export function deliveryShiftDays(s: PView): number {
  let months = 0;
  for (const m of s.market.modifiers) {
    if (m.effect.kind === 'deliveryDelay' && m.untilDay > s.clock.day) months += m.effect.months;
  }
  return months * DAYS_PER_MONTH;
}

// ------------------------------------------------------------------ offers

export function findOffer(s: PView, offerId: string): Offer | undefined {
  return CATALOGUE_OFFER_BY_ID[offerId] ?? s.market.offers.find((o) => o.id === offerId);
}

/** Price per unit now (catalogue prices follow comms price modifiers). */
export function unitPriceM(s: PView, offer: Offer): number {
  if (offer.source === 'catalogue') return round1(offer.priceM * priceMultiplier(s));
  return offer.priceM / Math.max(1, offer.quantity);
}

/** Why an Offer cannot be signed at all right now ('' if it can). */
export function unavailableReason(s: PView, offer: Offer): string {
  if (offer.source === 'catalogue') {
    const r = offer.resourceId ? RESOURCE_BY_ID[offer.resourceId] : undefined;
    if (!r) return 'Unknown Resource';
    const beyond = beyondKeys(r.partKind, r.variant, r.stats, s.research);
    if (beyond.length) return `Beyond research — tender only (${describeBeyond(beyond[0], r.stats, s.research)})`;
    return '';
  }
  if (offer.status !== 'available') return offer.status === 'accepted' ? 'Already signed' : 'Withdrawn';
  if (offer.expiresAt !== undefined && offer.expiresAt <= s.clock.day) return 'Expired';
  return '';
}

export function expectedArrival(s: PView, offer: Offer): number {
  return s.clock.day + leadTimeDays(s, offer) + deliveryShiftDays(s);
}

/** Lead time now, adjusted by industry trust. */
export function leadTimeDays(s: PView, offer: Offer): number {
  return Math.round(offer.leadTimeDays * (1 + industryPct(s) / 100));
}

// --------------------------------------------------------------------- fit

/** Unmet criterion comparisons, e.g. "Isp 440 s < 445 s". Empty = fits. */
export function fitFailures(res: Offer['resource'], c: Criterion): string[] {
  if (res.partKind !== c.partKind || res.variant !== c.variant) {
    return [`Different part: ${partLabel(res.partKind, res.variant)}`];
  }
  const out: string[] = [];
  for (const [key, min] of Object.entries(c.minimums)) {
    const v = res.stats[key] ?? 0;
    if (v < min - 1e-9) {
      const info = statInfo(c.partKind, c.variant, key);
      out.push(`${info.label} ${fmtStatValue(c.partKind, c.variant, key, v)} < ${fmtStatValue(c.partKind, c.variant, key, min)}`);
    }
  }
  return out;
}

export function sameKind(res: Offer['resource'], c: Criterion): boolean {
  return res.partKind === c.partKind && res.variant === c.variant;
}

// ---------------------------------------------------------------- coverage

export function liveAllocations(s: PView, taskId: string, criterionId: string): Allocation[] {
  return s.market.allocations.filter((a) => a.taskId === taskId && a.criterionId === criterionId && a.status !== 'released');
}

export function contractOf(s: PView, id: string): Contract | undefined {
  return s.market.contracts.find((c) => c.id === id);
}

export type CoverageStatus = 'uncovered' | 'partial' | 'contracted' | 'delivered';

export interface Coverage {
  status: CoverageStatus;
  needed: number;
  covered: number;
  delivered: number;
  missing: number;
  contracts: Contract[];
  /** Latest expected arrival among covering active contracts. */
  expectedAt?: number;
  late: boolean;
  /** Fit problems of contracted supply against the current minimums (task revised). */
  mismatch: string[];
  openCall?: Call;
}

export function criterionCoverage(s: PView, task: Task, c: Criterion): Coverage {
  const allocs = liveAllocations(s, task.id, c.id);
  let covered = 0;
  let delivered = 0;
  let expectedAt: number | undefined;
  const contracts: Contract[] = [];
  const mismatch: string[] = [];
  for (const a of allocs) {
    const k = contractOf(s, a.contractId);
    if (!k || (k.status !== 'active' && k.status !== 'delivered')) continue;
    covered += a.quantity;
    contracts.push(k);
    if (k.status === 'delivered') delivered += a.quantity;
    else expectedAt = Math.max(expectedAt ?? 0, k.expectedAt);
    mismatch.push(...fitFailures(k.offerSnapshot.resource, c));
  }
  const missing = Math.max(0, c.quantity - covered);
  const status: CoverageStatus = covered === 0 ? 'uncovered' : missing > 0 ? 'partial' : delivered >= c.quantity ? 'delivered' : 'contracted';
  const late = expectedAt !== undefined && expectedAt > task.neededAt;
  const openCall = s.market.calls.find((k) => k.taskId === task.id && k.criterionId === c.id && k.status === 'open');
  return { status, needed: c.quantity, covered, delivered, missing, contracts, expectedAt, late, mismatch: [...new Set(mismatch)], openCall };
}

// -------------------------------------------------------------- assessment

export interface OfferAssessment {
  offer: Offer;
  unitPriceM: number;
  quantity: number;
  totalPriceM: number;
  expectedAt: number;
  failures: string[];
  fits: boolean;
  late: boolean;
  affordable: boolean;
  /** Non-empty when the Offer cannot be signed now (research, expiry …). */
  unavailable: string;
}

export function assessOffer(s: PView, offer: Offer, task?: Task, c?: Criterion, quantity?: number): OfferAssessment {
  const unit = unitPriceM(s, offer);
  const qty = Math.max(1, quantity ?? (c && task ? Math.max(1, criterionCoverage(s, task, c).missing) : 1));
  const total = round1(unit * qty);
  const expectedAt = expectedArrival(s, offer);
  const failures = c ? fitFailures(offer.resource, c) : [];
  return {
    offer,
    unitPriceM: unit,
    quantity: qty,
    totalPriceM: total,
    expectedAt,
    failures,
    fits: failures.length === 0,
    late: task ? expectedAt > task.neededAt : expectedAt > s.planner.plan.launchDay,
    affordable: total <= budgetAvailableM(s.budget) + 1e-9,
    unavailable: unavailableReason(s, offer),
  };
}

/** Every Offer of the criterion's part kind/variant (catalogue + calls + comms), ranked. */
export function offersForCriterion(s: PView, task: Task, c: Criterion): OfferAssessment[] {
  const pool = [
    ...CATALOGUE_OFFERS.filter((o) => sameKind(o.resource, c)),
    ...s.market.offers.filter((o) => sameKind(o.resource, c) && o.status === 'available'),
  ];
  return pool.map((o) => assessOffer(s, o, task, c)).sort(rankAssessments);
}

/** Auto-suggest order: signable, fits, on time, affordable, then cheapest, then most reliable. */
export function rankAssessments(a: OfferAssessment, b: OfferAssessment): number {
  const score = (x: OfferAssessment) => (x.unavailable ? 8 : 0) + (x.fits ? 0 : 4) + (x.late ? 2 : 0) + (x.affordable ? 0 : 1);
  return score(a) - score(b) || a.totalPriceM - b.totalPriceM || b.offer.reliability - a.offer.reliability;
}

export function suggestion(list: OfferAssessment[]): OfferAssessment | undefined {
  const best = list[0];
  return best && !best.unavailable && best.fits ? best : undefined;
}

// ------------------------------------------------------------------- money

export { budgetAvailableM };

/**
 * Refund on cancellation (authored rule): the supplier keeps cancellationPct of
 * the price at signing; the refundable share then falls linearly to 0 at the
 * expected delivery day. refund = price × (1 − cancellationPct) × remaining/lead.
 */
export function refundM(k: Contract, day: number): number {
  if (k.status !== 'active') return 0;
  const baseline = k.baselineExpectedAt ?? k.expectedAt;
  const lead = Math.max(1, baseline - k.signedAt);
  const remaining = Math.min(1, Math.max(0, (baseline - day) / lead));
  return round1(k.offerSnapshot.priceM * (1 - k.offerSnapshot.cancellationPct) * remaining);
}

// ------------------------------------------------------------------- tasks

export function taskCode(t: Task): string {
  const n = t.id.match(/(\d+)$/);
  return `T-${n ? n[1].padStart(2, '0') : t.id}`;
}

export function openTasks(s: PView): Task[] {
  return s.market.tasks.filter((t) => t.status === 'open');
}

export function resourceOf(offer: Offer) {
  return offer.resourceId ? RESOURCE_BY_ID[offer.resourceId] : undefined;
}

// All order and amendment decisions use these same quotes in the view and host.
import type { DeliveryOption, DeliveryOptionId, OrderDraft } from '../../core/model';
import { SCHEDULES, SUPPLIER_BY_ID } from './data/suppliers';
import { callTemplates } from './data/calls';
import { baseLeadMonths, clamp, estimateCostM, estimateMassT, kindReliability, round3 } from './data/pricing';
import { defaultStats } from '../planner/data/parts';

export function deliveryOptions(offer: Offer): DeliveryOption[] {
  return offer.deliveryOptions ?? (offer.source === 'comms' ? [{ id: 'standard', daysFactor: 1, priceFactor: 1 }] : SCHEDULES[offer.supplierId]?.options ?? [{ id: 'standard', daysFactor: 1, priceFactor: 1 }]);
}
export function freeContractQuantity(s: PView, contractId: string): number {
  const k = contractOf(s, contractId);
  if (!k || !['active', 'delivered'].includes(k.status)) return 0;
  return Math.max(0, k.offerSnapshot.quantity - s.market.allocations.filter(a => a.contractId === contractId && a.status !== 'released').reduce((n, a) => n + a.quantity, 0));
}
export interface OrderQuote { draft: OrderDraft; offer?: Offer; quantity: number; totalM: number; expectedAt: number; unavailable: string; failures: string[]; late: boolean; token: string }
export function quoteOrder(s: PView, draft: OrderDraft): OrderQuote {
  const offer = findOffer(s, draft.offerId);
  const option = offer && deliveryOptions(offer).find(o => o.id === draft.delivery);
  const qty = draft.quantity;
  let unavailable = !offer ? 'Offer no longer exists' : unavailableReason(s, offer);
  if (!Number.isInteger(qty) || qty < 1) unavailable = 'Enter a positive whole quantity';
  if (offer && offer.source !== 'catalogue' && qty > (offer.remainingQuantity ?? offer.quantity)) unavailable = 'Offer quantity no longer available';
  if (offer?.wholeOfferOnly && qty !== (offer.remainingQuantity ?? offer.quantity)) unavailable = 'Whole Offer only';
  if (!option) unavailable = 'Delivery option unavailable';
  let failures: string[] = [];
  let taskState: unknown;
  let neededAt = draft.neededAt;
  if (draft.destination.kind === 'task') {
    const dest = draft.destination;
    const task = s.market.tasks.find(t => t.id === dest.taskId && t.status === 'open');
    const c = task?.criteria.find(x => x.id === dest.criterionId);
    taskState = task && c ? [task.revision, task.neededAt, criterionCoverage(s, task, c).covered] : null;
    if (task) neededAt = task.neededAt;
    if (!task || !c) unavailable = 'Task or criterion no longer available';
    else if (offer) {
      failures = fitFailures(offer.resource, c);
      const lots = liveAllocations(s, task.id, c.id).map(a => contractOf(s, a.contractId)).filter((k): k is Contract => !!k && ['active','delivered'].includes(k.status));
      if (lots.some(k => !sameHardware(k.offerSnapshot.resource, offer.resource))) failures.push('Hardware differs from existing allocation');
    }
  }
  const totalM = offer && option ? round1((offer.source === 'catalogue' ? offer.priceM * priceMultiplier(s) : offer.priceM / Math.max(1, offer.quantity)) * qty * option.priceFactor) : 0;
  const expectedAt = offer && option ? Math.floor(s.clock.day) + Math.round(leadTimeDays(s, offer) * option.daysFactor) + deliveryShiftDays(s) : 0;
  if (totalM > budgetAvailableM(s.budget) + 1e-9) unavailable = 'Insufficient available funds';
  const token = JSON.stringify([draft, offer?.revision, offer?.remainingQuantity, totalM, expectedAt, unavailable, failures, taskState, budgetAvailableM(s.budget)]);
  return { draft, offer, quantity: qty, totalM, expectedAt, unavailable, failures, late: neededAt !== undefined && expectedAt > neededAt, token };
}
export function sameHardware(a: Offer['resource'], b: Offer['resource']): boolean {
  return a.partKind === b.partKind && a.variant === b.variant && a.massT === b.massT && JSON.stringify(Object.entries(a.stats).sort()) === JSON.stringify(Object.entries(b.stats).sort());
}
export interface AmendmentQuote { contract?: Contract; delivery: DeliveryOptionId; expectedAt: number; feeM: number; eventDelayDays: number; unavailable: string; token: string }
export function quoteAmendment(s: PView, contractId: string, delivery: DeliveryOptionId): AmendmentQuote {
  const contract = contractOf(s, contractId);
  const option = contract && deliveryOptions(contract.offerSnapshot).find(o => o.id === delivery);
  let unavailable = !contract || contract.status !== 'active' ? 'Contract is not active' : '';
  if (!option) unavailable = 'Delivery option unavailable';
  if (contract && s.clock.day >= (contract.amendmentCutoff ?? contract.baselineExpectedAt ?? contract.expectedAt)) unavailable = 'Amendment cutoff passed';
  const base = contract?.baselineExpectedAt ?? contract?.expectedAt ?? 0;
  const signed = contract?.signedAt ?? 0;
  const originalLead = Math.max(1, base - signed);
  const initial = contract && deliveryOptions(contract.offerSnapshot).find(o => o.id === (contract.initialDelivery ?? contract.delivery ?? 'standard'));
  const last = contract?.amendments?.at(-1);
  // Events mutate expectedAt; keep their total relative to the last accepted quote.
  // The original signed schedule never moves, so repeated amendments cannot compound acceleration.
  const eventDelayDays = Math.max(0, (last?.eventDelayDays ?? 0) + (contract ? contract.expectedAt - (last?.to ?? base) : 0));
  const eventFactor = delivery === 'priority' ? 0.25 : delivery === 'standard' ? 0.5 : 1;
  const target = signed + originalLead * (option?.daysFactor ?? 1) / (initial?.daysFactor ?? 1) + eventDelayDays * eventFactor;
  const expectedAt = contract && option ? Math.max(Math.floor(s.clock.day) + 1, Math.round(target)) : 0;
  const feeM = contract && expectedAt < contract.expectedAt ? round1(contract.offerSnapshot.priceM * 0.15 * (contract.expectedAt - expectedAt) / Math.max(1, originalLead)) : 0;
  if (feeM > budgetAvailableM(s.budget) + 1e-9) unavailable = 'Insufficient available funds';
  const token = JSON.stringify([contractId, contract?.revision, delivery, expectedAt, feeM, unavailable, budgetAvailableM(s.budget)]);
  return { contract, delivery, expectedAt, feeM, eventDelayDays, unavailable, token };
}
export interface CallPreviewOffer { supplierId: string; supplierName: string; priceM: number; expectedAt: number; offer: Offer }
export function previewCall(s: PView, criterion: Criterion, quantity: number, window: 7 | 14 | 30): CallPreviewOffer[] {
  const beyond = beyondKeys(criterion.partKind, criterion.variant, criterion.minimums, s.research).length > 0;
  return callTemplates(criterion.partKind, beyond).filter(t => (SCHEDULES[t.supplierId]?.responseDays ?? 30) <= window).map(t => {
    const base = defaultStats(criterion.partKind, criterion.variant);
    const stats = Object.fromEntries(Object.entries({...base, ...criterion.minimums}).map(([k,v]) => [k, Math.max(v, k === 'level' ? Math.ceil(v) : round3(v * t.statFactor))]));
    const sup = SCHEDULES[t.supplierId];
    const lead = Math.round(clamp(baseLeadMonths(criterion.partKind, criterion.variant, stats) + t.leadDeltaMonths, 2, 14) * DAYS_PER_MONTH);
    const priceM = round1(Math.max(0.1, estimateCostM(criterion.partKind, criterion.variant, stats) * t.priceFactor * priceMultiplier(s)) * quantity);
    const offer: Offer = { id:'', revision:1, supplierId:t.supplierId, supplierName: SUPPLIER_BY_ID[t.supplierId].name, resource:{name:`${SUPPLIER_BY_ID[t.supplierId].name} custom ${partLabel(criterion.partKind, criterion.variant).toLowerCase()}`, partKind:criterion.partKind, variant:criterion.variant, stats, massT:round3(estimateMassT(criterion.partKind, criterion.variant, stats) * (beyond ? 1.05 : 1))}, quantity, remainingQuantity:quantity, priceM, leadTimeDays:lead, reliability:round3(clamp(kindReliability(criterion.partKind, criterion.variant) + t.reliabilityDelta, 0.8, 0.995)), cancellationPct: SUPPLIER_BY_ID[t.supplierId].cancellationPct, source:'call', status:'available', deliveryOptions:structuredClone(sup.options) };
    return { supplierId:t.supplierId, supplierName:offer.supplierName, priceM, expectedAt:Math.floor(s.clock.day)+window+Math.round(lead*(1+industryPct(s)/100))+deliveryShiftDays(s), offer };
  });
}

export function cancellationToken(s: PView, contractId: string): string {
  const k = contractOf(s, contractId);
  return JSON.stringify([contractId, k?.revision, k ? refundM(k, s.clock.day) : null]);
}
