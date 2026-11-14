// procurement station game logic: reducers (defineActions('procurement', …)) and tick handlers (onTick).
// Imported eagerly by core/registerStations.ts — must not import UI code.
//
// Rules (authored placeholders, see procurement/README.md "Implementation"):
//  - signOffer: price (catalogue × comms price modifiers) is committed at signing if
//    the available Budget covers it; expectedAt = day + lead time + active
//    deliveryDelay modifiers. Catalogue Offers are reusable; Call/comms Offers are
//    single-use. Catalogue Resources beyond research cannot be signed (tender only).
//  - Delivery at expectedAt: committed → spent, allocations reserved → available.
//  - cancelContract: refund = price × (1 − cancellationPct) × time remaining / lead
//    time (rules.ts refundM). committed −= price, spent += price − refund.
//  - Calls close ~1 month after opening; authored templates (data/calls.ts) become
//    Offers built to the criterion's minimums; beyond research: 1.5–3× cost, less reliable.
import { defineActions, onTick, type ActionCtx } from '../../core/actions';
import { pushNews, setFlag } from '../../core/coreActions';
import type { Call, Contract, Criterion, Offer, StationId, Task } from '../../core/model';
import type { GameState } from '../../core/state';
import type { Part } from '../planner/model/types';
import { beyondResearch, defaultStats, statDefs } from '../planner/data/parts';
import { CALL_DURATION_DAYS, CALL_OFFER_VALID_DAYS, callTemplates } from './data/calls';
import { SUPPLIER_BY_ID } from './data/suppliers';
import { baseLeadMonths, clamp, estimateCostM, estimateMassT, kindReliability, round1, round3 } from './data/pricing';
import {
  DAYS_PER_MONTH, beyondKeys, budgetAvailableM, criterionCoverage, deliveryShiftDays, leadTimeDays, findOffer, fmtDate, fmtM,
  offersForCriterion, partLabel, priceMultiplier, refundM, sameKind, taskCode, unavailableReason, unitPriceM,
} from './rules';

const money = (v: number) => Math.round(v * 1000) / 1000;

function news(s: GameState, ctx: ActionCtx, text: string, affects: StationId[] = ['planner']): void {
  pushNews(s, { from: 'procurement', text, affects, internal: true }, ctx.newId);
}

function findCriterion(s: GameState, taskId?: string, criterionId?: string): { task?: Task; crit?: Criterion } {
  if (!taskId) return {};
  const task = s.market.tasks.find((t) => t.id === taskId);
  const crit = task?.criteria.find((c) => c.id === criterionId) ?? (task && !criterionId ? task.criteria[0] : undefined);
  return { task, crit };
}

/** Keep 'contract.late' in sync and announce newly late contracts once. */
function refreshLate(s: GameState, ctx: ActionCtx): void {
  const launch = s.planner.plan.launchDay;
  const late = s.market.contracts.filter((k) => k.status === 'active' && k.expectedAt > launch + 1e-9);
  if (s.events.flags.includes('contract.late') !== late.length > 0) setFlag(s, 'contract.late', late.length > 0);
  const warned = new Set(s.procurement.lateWarned ?? []);
  const next: string[] = [];
  for (const k of late) {
    next.push(k.id);
    if (!warned.has(k.id)) {
      news(s, ctx, `Late delivery: ${k.offerSnapshot.resource.name} (${k.offerSnapshot.supplierName}) arrives ${fmtDate(k.expectedAt)}, after the planned launch ${fmtDate(launch)}.`, ['planner', 'procurement']);
    }
  }
  s.procurement.lateWarned = next;
}

function deliver(s: GameState, ctx: ActionCtx, k: Contract): void {
  k.status = 'delivered';
  k.deliveredAt = k.expectedAt;
  k.revision++;
  s.budget.committedM = money(s.budget.committedM - k.offerSnapshot.priceM);
  s.budget.spentM = money(s.budget.spentM + k.offerSnapshot.priceM);
  const uses: string[] = [];
  for (const a of s.market.allocations) {
    if (a.contractId !== k.id || a.status !== 'reserved') continue;
    a.status = 'available';
    a.revision++;
    const t = s.market.tasks.find((x) => x.id === a.taskId);
    if (t) uses.push(`${taskCode(t)} ${t.title}`);
  }
  const q = k.offerSnapshot.quantity;
  news(s, ctx, `Delivered: ${q > 1 ? `${q}× ` : ''}${k.offerSnapshot.resource.name} from ${k.offerSnapshot.supplierName}${uses.length ? ` for ${uses.join(', ')}` : ''}.`);
}

function roundSig(v: number, digits = 3): number {
  if (v === 0) return 0;
  const p = Math.pow(10, digits - Math.ceil(Math.log10(Math.abs(v))));
  return Math.round(v * p) / p;
}

/** Stats of a tender build: the criterion's minimums scaled by the template. */
function tenderStats(c: Criterion, factor: number): Record<string, number> {
  const base = defaultStats(c.partKind, c.variant);
  const out: Record<string, number> = {};
  for (const def of statDefs(c.partKind, c.variant)) {
    const min = c.minimums[def.key] ?? base[def.key] ?? def.min;
    let v: number;
    if (def.key === 'isp') v = Math.round(min + (factor - 1) * 40);
    else if (def.key === 'performance') v = Math.round((min + (factor - 1) * 10) * 10) / 10;
    else if (def.key === 'level') v = Math.ceil(min);
    else v = roundSig(min * factor, 3);
    out[def.key] = Math.min(def.max, Math.max(min, v));
  }
  return out;
}

const SHORT: Record<string, string> = {
  brightline: 'Brightline', helix: 'Helix', swift: 'Swift', commons: 'Commons', tallis: 'Tallis', meridian: 'Meridian', nova: 'Nova',
};

/** A Call reaches its closing day: authored responses become Offers. */
function closeWithOffers(s: GameState, ctx: ActionCtx, call: Call): void {
  call.status = 'closed';
  call.revision++;
  const { task, crit } = findCriterion(s, call.taskId, call.criterionId);
  if (!task || !crit || task.status !== 'open') {
    news(s, ctx, 'A Call closed without responses: its Task is no longer open.', ['procurement']);
    return;
  }
  const beyond = beyondKeys(crit.partKind, crit.variant, crit.minimums, s.research).length > 0;
  const mult = priceMultiplier(s);
  let cheapest = Infinity;
  for (const tpl of callTemplates(crit.partKind, beyond)) {
    const sup = SUPPLIER_BY_ID[tpl.supplierId];
    const stats = tenderStats(crit, tpl.statFactor);
    const unit = estimateCostM(crit.partKind, crit.variant, stats) * tpl.priceFactor * (0.92 + 0.16 * ctx.rng()) * mult;
    const leadMonths = clamp(baseLeadMonths(crit.partKind, crit.variant, stats) + tpl.leadDeltaMonths + Math.round(ctx.rng() * 2 - 1), 2, 14);
    const qty = Math.max(1, crit.quantity);
    const offer: Offer = {
      id: ctx.newId('offer'),
      revision: 1,
      supplierId: sup.id,
      supplierName: sup.name,
      resource: {
        name: `${SHORT[sup.id] ?? sup.name} custom ${partLabel(crit.partKind, crit.variant).toLowerCase()}`,
        partKind: crit.partKind,
        variant: crit.variant,
        stats,
        massT: round3(estimateMassT(crit.partKind, crit.variant, stats) * (beyond ? 1.05 : 1)),
      },
      quantity: qty,
      priceM: round1(Math.max(0.1, unit) * qty),
      leadTimeDays: Math.round(leadMonths * DAYS_PER_MONTH),
      reliability: round3(clamp(kindReliability(crit.partKind, crit.variant) + tpl.reliabilityDelta, 0.8, 0.995)),
      cancellationPct: sup.cancellationPct,
      expiresAt: call.closesAt + CALL_OFFER_VALID_DAYS,
      callId: call.id,
      source: 'call',
      status: 'available',
    };
    s.market.offers.push(offer);
    call.offerIds.push(offer.id);
    cheapest = Math.min(cheapest, offer.priceM);
  }
  news(s, ctx, `Call answered for ${taskCode(task)} ${crit.label}: ${call.offerIds.length} Offers${beyond ? ' (beyond research — experimental builds)' : ''}, from ${fmtM(cheapest)}.`, ['procurement', 'planner']);
}

function partTask(s: GameState, ctx: ActionCtx, part: Part, quantity: number, owner: string): void {
  if (s.market.tasks.some((t) => t.partId === part.id && t.status === 'open')) return;
  const id = ctx.newId('task');
  s.market.tasks.push({
    id,
    revision: 1,
    authorRole: 'planner',
    title: `${owner} · ${part.name}`,
    criteria: [{ id: `${id}-c1`, label: part.name, partKind: part.kind, variant: part.variant, minimums: { ...part.stats }, quantity }],
    neededAt: s.planner.plan.launchDay,
    priority: part.kind === 'engine' ? 'high' : 'normal',
    status: 'open',
    partId: part.id,
    beyondResearch: beyondResearch(part, s.research.limits, s.research.unlocked),
    createdAt: ctx.day,
    updatedAt: ctx.day,
  });
}

export const procurementActions = defineActions('procurement', {
  /**
   * Sign an Offer → Contract (+ Allocation to the Task criterion if given).
   * quantity: catalogue Offers only (default: the criterion's uncovered quantity, else 1).
   */
  signOffer(s, ctx, offerId: string, taskId?: string, criterionId?: string, quantity?: number) {
    if (s.meta.phase !== 'planning') return;
    const offer = findOffer(s, offerId);
    if (!offer || unavailableReason(s, offer)) return;
    const { task, crit } = findCriterion(s, taskId, criterionId);
    if (taskId && (!task || !crit || task.status !== 'open' || !sameKind(offer.resource, crit))) return;
    const cov = task && crit ? criterionCoverage(s, task, crit) : undefined;
    const qty = offer.source === 'catalogue'
      ? Math.max(1, Math.round(quantity ?? (cov ? Math.max(1, cov.missing) : 1)))
      : offer.quantity;
    const unit = unitPriceM(s, offer);
    const total = round1(unit * qty);
    if (total > budgetAvailableM(s.budget) + 1e-9) return;

    // contract.cheapest: the cheapest of several fitting, signable Offers for this criterion.
    let cheapest = false;
    if (task && crit) {
      const fitting = offersForCriterion(s, task, crit).filter((a) => !a.unavailable && a.fits);
      if (fitting.length >= 2 && fitting.some((a) => a.offer.id === offer.id)) {
        cheapest = unit <= Math.min(...fitting.map((a) => a.unitPriceM)) + 1e-6;
      }
    }

    const contractId = ctx.newId('contract');
    const expectedAt = ctx.day + leadTimeDays(s, offer) + deliveryShiftDays(s);
    s.market.contracts.push({
      id: contractId,
      revision: 1,
      offerSnapshot: { ...structuredClone(offer), quantity: qty, priceM: total, status: 'accepted' },
      signedAt: ctx.day,
      expectedAt,
      status: 'active',
    });
    s.budget.committedM = money(s.budget.committedM + total);
    if (offer.source !== 'catalogue') {
      const o = s.market.offers.find((x) => x.id === offer.id);
      if (o) { o.status = 'accepted'; o.revision++; }
    }
    if (task && crit) {
      s.market.allocations.push({
        id: ctx.newId('alloc'), revision: 1, contractId, taskId: task.id, criterionId: crit.id, quantity: qty, status: 'reserved',
      });
    }
    if (cheapest) setFlag(s, 'contract.cheapest', true);
    news(s, ctx, `Contract signed: ${qty > 1 ? `${qty}× ` : ''}${offer.resource.name} from ${offer.supplierName}, ${fmtM(total)}, arriving ${fmtDate(expectedAt)}${task ? ` for ${taskCode(task)} ${task.title}` : ''}.`);
    refreshLate(s, ctx);
  },

  /** Invite tenders for a Task criterion; Offers arrive when the Call closes (~1 month). */
  openCall(s, ctx, taskId: string, criterionId: string) {
    if (s.meta.phase !== 'planning') return;
    const { task, crit } = findCriterion(s, taskId, criterionId);
    if (!task || !crit || task.status !== 'open') return;
    if (s.market.calls.some((k) => k.taskId === taskId && k.criterionId === crit.id && k.status === 'open')) return;
    const call: Call = {
      id: ctx.newId('call'), revision: 1, taskId, criterionId: crit.id,
      openedAt: ctx.day, closesAt: ctx.day + CALL_DURATION_DAYS, status: 'open', offerIds: [],
    };
    s.market.calls.push(call);
    news(s, ctx, `Call opened for ${taskCode(task)} ${crit.label}: supplier responses by ${fmtDate(call.closesAt)}.`, ['procurement', 'planner']);
  },

  /** Withdraw an open Call (no Offers will arrive). */
  closeCall(s, _ctx, callId: string) {
    const call = s.market.calls.find((k) => k.id === callId);
    if (!call || call.status !== 'open') return;
    call.status = 'withdrawn';
    call.revision++;
  },

  /** Cancel an active Contract: refund by the time-remaining rule, release its allocations. */
  cancelContract(s, ctx, contractId: string) {
    const k = s.market.contracts.find((x) => x.id === contractId);
    if (!k || k.status !== 'active') return;
    const refund = refundM(k, ctx.day);
    const price = k.offerSnapshot.priceM;
    s.budget.committedM = money(s.budget.committedM - price);
    s.budget.spentM = money(s.budget.spentM + price - refund);
    k.status = 'cancelled';
    k.refundM = refund;
    k.revision++;
    for (const a of s.market.allocations) {
      if (a.contractId === k.id && a.status !== 'released') { a.status = 'released'; a.revision++; }
    }
    setFlag(s, 'contract.cancelled', true);
    news(s, ctx, `Contract cancelled: ${k.offerSnapshot.resource.name} (${k.offerSnapshot.supplierName}). Refund ${fmtM(refund)}, fee ${fmtM(price - refund)}.`);
    refreshLate(s, ctx);
  },

  /** Reserve free contracted quantity for a Task criterion. */
  allocate(s, ctx, contractId: string, taskId: string, criterionId: string, quantity?: number) {
    const k = s.market.contracts.find((x) => x.id === contractId);
    if (!k || (k.status !== 'active' && k.status !== 'delivered')) return;
    const { task, crit } = findCriterion(s, taskId, criterionId);
    if (!task || !crit || task.status !== 'open' || !sameKind(k.offerSnapshot.resource, crit)) return;
    const used = s.market.allocations.filter((a) => a.contractId === k.id && a.status !== 'released').reduce((n, a) => n + a.quantity, 0);
    const free = k.offerSnapshot.quantity - used;
    const missing = criterionCoverage(s, task, crit).missing;
    const qty = Math.min(free, missing, Math.max(1, Math.round(quantity ?? missing)));
    if (qty < 1) return;
    s.market.allocations.push({
      id: ctx.newId('alloc'), revision: 1, contractId, taskId, criterionId: crit.id, quantity: qty,
      status: k.status === 'delivered' ? 'available' : 'reserved',
    });
  },

  /** Release an allocation (the contracted supply stays in inventory). */
  release(s, _ctx, allocationId: string) {
    const a = s.market.allocations.find((x) => x.id === allocationId);
    if (!a || a.status === 'released') return;
    a.status = 'released';
    a.revision++;
  },

  /**
   * DEV stand-in for the planner's "Order part": one Task per part of the current
   * rocket design (skips parts that already have an open Task).
   */
  devAddSampleTasks(s, ctx) {
    const r = s.planner.rocket;
    for (const st of r.stages) {
      partTask(s, ctx, st.engine, st.engineCount, st.name);
      for (const t of st.tanks) partTask(s, ctx, t, 1, st.name);
    }
    for (const sc of r.spacecraft) {
      for (const st of sc.stages) {
        partTask(s, ctx, st.engine, st.engineCount, `${sc.name} ${st.name.toLowerCase()}`);
        for (const t of st.tanks) partTask(s, ctx, t, 1, `${sc.name} ${st.name.toLowerCase()}`);
      }
      for (const p of sc.equipment) partTask(s, ctx, p, 1, sc.name);
    }
  },
});

onTick('procurement', (s, ctx, _from, to) => {
  // Comms modifiers expire.
  if (s.market.modifiers.some((m) => m.untilDay <= to)) {
    s.market.modifiers = s.market.modifiers.filter((m) => m.untilDay > to);
  }
  // Deliveries.
  for (const k of s.market.contracts) {
    if (k.status === 'active' && k.expectedAt <= to) deliver(s, ctx, k);
  }
  // Calls reaching their closing day.
  for (const call of s.market.calls) {
    if (call.status === 'open' && call.closesAt <= to) closeWithOffers(s, ctx, call);
  }
  // Call / comms Offers past their validity.
  for (const o of s.market.offers) {
    if (o.status === 'available' && o.expiresAt !== undefined && o.expiresAt <= to) { o.status = 'withdrawn'; o.revision++; }
  }
  refreshLate(s, ctx);
});
