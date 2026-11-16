// procurement station game logic: reducers (defineActions('procurement', …)) and tick handlers (onTick).
// Imported eagerly by core/registerStations.ts — must not import UI code.
//
// Rules (authored placeholders, see procurement/README.md "Implementation"):
//  - signOffer: price (catalogue × comms price modifiers) is committed at signing if
//    the available Budget covers it; expectedAt = day + lead time + active
//    deliveryDelay modifiers. Catalogue Offers are reusable; Call/comms Offers are
//    single-use. Catalogue Resources beyond research cannot be signed (Call offers only).
//  - Delivery at expectedAt: committed → spent, allocations reserved → available.
//  - cancelContract: refund = price × (1 − cancellationPct) × time remaining / lead
//    time (rules.ts refundM). committed −= price, spent += price − refund.
//  - Calls close ~1 month after opening; authored templates (data/calls.ts) become
//    Offers built to the criterion's minimums; beyond research: 1.5–3× cost, less reliable.
import { defineActions, onTick, type ActionCtx } from '../../core/actions';
import { DAYS_PER_MONTH } from '../../core/state';
import { quoteSupport } from './support';
import { pushNews, setFlag } from '../../core/coreActions';
import type { Call, Contract, Criterion, StationId, Task, OrderDraft, DeliveryOptionId } from '../../core/model';
import type { GameState } from '../../core/state';
import type { Part } from '../planner/model/types';
import { beyondResearch } from '../planner/data/parts';
import { CALL_DURATION_DAYS, CALL_OFFER_VALID_DAYS } from './data/calls';
import { criterionCoverage, findOffer, fmtDate, fmtM, fmtPct, refundM, sameKind, taskCode, quoteOrder, quoteAmendment, quoteReplacement, afterCancel, type OrderQuote, previewCall, sameHardware, fitFailures, cancellationToken, deliveryOptions } from './rules';
import { contractTiming } from './timing';

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
  const lateNeed = (k: Contract) => contractTiming(s, k).needs.find(n => n.margin !== undefined && n.margin < 0);
  const late = s.market.contracts.filter(k => k.status === 'active' && lateNeed(k));
  if (s.events.flags.includes('contract.late') !== late.length > 0) setFlag(s, 'contract.late', late.length > 0);
  const warned = new Set(s.procurement.lateWarned ?? []);
  const next: string[] = [];
  for (const k of late) {
    next.push(k.id);
    if (!warned.has(k.id)) {
      const need = lateNeed(k)!;
      const description = need.source === 'requested' ? `the original order request on ${fmtDate(need.neededAt!)}` : need.source === 'research-bonus' ? `the research bonus deadline for ${need.label} on ${fmtDate(need.neededAt!)}` : `${need.label} needs it on ${fmtDate(need.neededAt!)}`;
      news(s, ctx, `Late delivery: ${k.offerSnapshot.resource.name} (${k.offerSnapshot.supplierName}) arrives ${fmtDate(k.expectedAt)}, after ${description}.`, need.source === 'task' ? ['planner', 'procurement'] : ['procurement']);
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
  const affects: StationId[] = ['procurement'];
  for (const a of s.market.allocations) {
    if (a.contractId !== k.id || a.status !== 'reserved') continue;
    a.status = 'available';
    a.revision++;
    const t = s.market.tasks.find((x) => x.id === a.taskId);
    if (t) { uses.push(`${taskCode(t)} ${t.title}`); if (!affects.includes('planner')) affects.push('planner'); }
    if (a.department) { uses.push(a.department); if (!affects.includes(a.department)) affects.push(a.department); }
  }
  const q = k.offerSnapshot.quantity;
  news(s, ctx, `Delivered: ${q > 1 ? `${q}× ` : ''}${k.offerSnapshot.resource.name} from ${k.offerSnapshot.supplierName}${uses.length ? ` for ${uses.join(', ')}` : ''}.`, affects);
}

/** A Call reaches its closing day: authored responses become Offers. */
function closeWithOffers(s: GameState, ctx: ActionCtx, call: Call): void {
  call.status = 'closed'; call.revision++;
  const { crit } = findCriterion(s, call.taskId, call.criterionId);
  const requirement = call.requirement ?? crit;
  if (!requirement) { news(s, ctx, 'Call closed without a valid requirement.', ['procurement']); return; }
  // Preview uses the closing-day market. Offset the window so expected dates describe signing now.
  const window = call.windowDays ?? 30;
  for (const result of previewCall(s, requirement, requirement.quantity, window)) {
    const offer = result.offer;
    offer.id = ctx.newId('offer'); offer.callId = call.id; offer.expiresAt = call.closesAt + CALL_OFFER_VALID_DAYS;
    s.market.offers.push(offer); call.offerIds.push(offer.id);
  }
  news(s, ctx, `Call answered for ${requirement.label}: ${call.offerIds.length} Offers.`, ['procurement']);
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

function reject(s: GameState, ctx: ActionCtx, reason: string): void {
  news(s, ctx, `Action not completed: ${reason}. Review the refreshed terms.`, ['procurement']);
}
/** Cancel an active contract: book the refund, release its allocations. No news (the caller says what happened). */
function cancel(s: GameState, ctx: ActionCtx, k: Contract): { refund: number; affected: StationId[]; projects: string[] } {
  const refund = refundM(k, Math.floor(ctx.day));
  const price = k.offerSnapshot.priceM;
  s.budget.committedM = money(s.budget.committedM - price);
  s.budget.spentM = money(s.budget.spentM + price - refund);
  k.status = 'cancelled';
  k.refundM = refund;
  k.revision++;
  const affected: StationId[] = ['procurement'];
  const projects: string[] = [];
  for (const a of s.market.allocations) {
    if (a.contractId === k.id && a.status !== 'released') {
      const station = a.department ?? (a.taskId ? 'planner' : undefined);
      if (station && !affected.includes(station)) affected.push(station);
      if (a.projectId) projects.push(s.research.projects.find(p => p.id === a.projectId)?.title ?? a.projectId);
      a.status = 'released'; a.revision++;
    }
  }
  setFlag(s, 'contract.cancelled', true);
  return { refund, affected, projects };
}

/** Can this quote be signed as it stands? '' = yes, else the reason. */
function orderBlock(s: GameState, q: OrderQuote, token: string): string {
  if (s.meta.phase !== 'planning' || !q.offer || q.unavailable || q.failures.length || q.token !== token) return q.unavailable || q.failures[0] || 'The quote changed';
  return '';
}

/**
 * Sign an order. `quiet` leaves the news line to the caller (a switch says both halves in one line). `checked` is a
 * quote the caller has already validated against exactly this state (the switch checks it before cancelling).
 */
function commitOrder(s: GameState, ctx: ActionCtx, draft: OrderDraft, token: string, quiet = false, checked?: OrderQuote): Contract | undefined {
  const q = checked ?? quoteOrder(s, draft);
  const block = checked ? '' : orderBlock(s, q, token);
  if (block) { reject(s, ctx, block); return undefined; }
  if (!q.offer) return undefined;
  const offer = q.offer;
  const id = ctx.newId('contract');
  s.market.contracts.push({ id, revision: 1, offerSnapshot: {...structuredClone(offer), deliveryOptions:structuredClone(deliveryOptions(offer)), quantity:q.quantity, priceM:q.totalM, status:'accepted'}, signedAt:ctx.day, expectedAt:q.expectedAt, baselineExpectedAt:q.expectedAt, ...(draft.destination.kind !== 'task' && draft.neededAt !== undefined ? {requestedNeededAt:draft.neededAt} : {}), amendmentCutoff:ctx.day + Math.max(1, (q.expectedAt - ctx.day) * 0.75), delivery:draft.delivery, initialDelivery:draft.delivery, amendments:[], status:'active' });
  s.budget.committedM = money(s.budget.committedM + q.totalM);
  if (offer.source !== 'catalogue') {
    const o = s.market.offers.find(x => x.id === offer.id)!;
    o.remainingQuantity = (o.remainingQuantity ?? o.quantity) - q.quantity;
    if (o.remainingQuantity === 0) o.status = 'accepted';
    o.revision++;
  }
  if (draft.destination.kind !== 'shared') {
    const d = draft.destination;
    s.market.allocations.push({id:ctx.newId('alloc'), revision:1, contractId:id, taskId:d.kind === 'task' ? d.taskId : '', criterionId:d.kind === 'task' ? d.criterionId : '', ...(d.kind === 'department' ? {department:d.department} : {}), quantity:q.quantity, status:'reserved'});
  }
  const affects: StationId[] = ['procurement'];
  if (draft.destination.kind === 'department') affects.push(draft.destination.department);
  if (draft.destination.kind === 'task') affects.push('planner');
  if (!quiet) news(s, ctx, `Contract signed: ${q.quantity}× ${offer.resource.name} from ${offer.supplierName}, ${fmtM(q.totalM)}, arriving ${fmtDate(q.expectedAt)}.`, affects);
  refreshLate(s, ctx);
  return s.market.contracts.find(k => k.id === id);
}

export const procurementActions = defineActions('procurement', {
  /**
   * Rent or buy a facility for Science (D-032). Cost is spent at once from the shared budget. A rental
   * covers `months` from the day the facility is ready (or from the end of the current rental, so renewals
   * join up); a purchase is kept for good. Closes Science's open request for it.
   */
  leaseFacility(s, ctx, facilityId: string, months: number | 'buy') {
    const quote = quoteSupport(s, { type: 'facility', facilityId, months });
    if (quote.blocked) { reject(s, ctx, quote.blocked); return; }
    const { name, costM, from, until } = quote;
    s.research.facilities ??= [];
    s.research.supplyRequests ??= [];
    s.budget.spentM = money(s.budget.spentM + costM);
    s.research.facilities.push({ id: ctx.newId('lease'), facilityId, from, ...(until !== undefined ? { until } : {}), costM });
    for (const q of s.research.supplyRequests) {
      if (q.status === 'open' && q.kind === 'facility' && q.facilityId === facilityId) { q.status = 'done'; q.doneAt = ctx.day; }
    }
    news(s, ctx, months === 'buy'
      ? `Procurement bought a ${name.toLowerCase()} for Science (${fmtM(costM)}), ready ${fmtDate(from)}.`
      : `Procurement rented a ${name.toLowerCase()} for Science for ${months} months (${fmtM(costM)}), ready ${fmtDate(from)}.`, ['science']);
  },

  /** Hire a research team for Science (D-032). Cost is spent at once. Closes the oldest open team request. */
  hireTeam(s, ctx, offerId: string) {
    const quote = quoteSupport(s, { type: 'team', offerId });
    if (quote.blocked) { reject(s, ctx, quote.blocked); return; }
    const { costM, from, until } = quote;
    s.research.teams ??= [];
    s.research.supplyRequests ??= [];
    s.budget.spentM = money(s.budget.spentM + costM);
    s.research.teams.push({ id: ctx.newId('team'), offerId, from, ...(until !== undefined ? { until } : {}), costM });
    const q = s.research.supplyRequests.find((x) => x.kind === 'team' && x.status === 'open');
    if (q) { q.status = 'done'; q.doneAt = ctx.day; }
    news(s, ctx, `Procurement hired a ${until !== undefined ? `${Math.round((until - from) / DAYS_PER_MONTH)}-month` : 'permanent'} research team for Science (${fmtM(costM)}), at work ${fmtDate(from)}.`, ['science']);
  },

  /**
   * Sign an Offer → Contract (+ Allocation to the Task criterion if given).
   * quantity: catalogue Offers only (default: the criterion's uncovered quantity, else 1).
   */
  signOffer(s, ctx, offerId: string, taskId?: string, criterionId?: string, quantity?: number) {
    const offer = findOffer(s, offerId); if (!offer) return;
    const {task, crit} = findCriterion(s, taskId, criterionId);
    const qty = quantity ?? (task && crit ? Math.max(1, criterionCoverage(s, task, crit).missing) : offer.source === 'catalogue' ? 1 : (offer.remainingQuantity ?? offer.quantity));
    const draft: OrderDraft = {offerId, quantity:qty, delivery:'standard', destination: task && crit ? {kind:'task',taskId:task.id,criterionId:crit.id} : {kind:'shared'}};
    commitOrder(s, ctx, draft, quoteOrder(s, draft).token);
  },
  signOrder(s, ctx, draft: OrderDraft, token: string) { commitOrder(s, ctx, draft, token); },
  amendDelivery(s, ctx, contractId: string, delivery: DeliveryOptionId, token: string) {
    const q = quoteAmendment(s, contractId, delivery);
    if (!q.contract || q.unavailable || q.token !== token) { reject(s, ctx, q.unavailable || 'The amendment quote changed'); return; }
    const k = q.contract; const from = k.expectedAt;
    k.amendments ??= []; k.amendments.push({at:ctx.day, from, to:q.expectedAt, feeM:q.feeM, delivery, eventDelayDays:q.eventDelayDays});
    k.expectedAt=q.expectedAt; k.delivery=delivery; k.revision++;
    s.budget.spentM=money(s.budget.spentM + q.feeM);
    const affects: StationId[] = ['procurement'];
    for (const a of s.market.allocations.filter(a => a.contractId === k.id && a.status !== 'released')) {
      const station = a.department ?? (a.taskId ? 'planner' : undefined);
      if (station && !affects.includes(station)) affects.push(station);
    }
    news(s,ctx,`Delivery amended: ${k.offerSnapshot.resource.name}, ${fmtDate(from)} → ${fmtDate(q.expectedAt)}, fee ${fmtM(q.feeM)}.`,affects);
    refreshLate(s,ctx);
  },
  /** Open a Call for a Task criterion; Offers arrive when the Call closes (~1 month). */
  openCall(s, ctx, taskId: string, criterionId: string) {
    if (s.meta.phase !== 'planning') return;
    const { task, crit } = findCriterion(s, taskId, criterionId);
    if (!task || !crit || task.status !== 'open') return;
    if (s.market.calls.some((k) => k.taskId === taskId && k.criterionId === crit.id && k.status === 'open')) return;
    const call: Call = {
      id: ctx.newId('call'), revision: 1, taskId, criterionId: crit.id,
      openedAt: ctx.day, closesAt: ctx.day + CALL_DURATION_DAYS, status: 'open', offerIds: [], requirement:structuredClone(crit), destination:{kind:'task',taskId,criterionId:crit.id}, neededAt:task.neededAt, windowDays:30, taskRevision:task.revision,
    };
    s.market.calls.push(call);
    news(s, ctx, `Call opened for ${taskCode(task)} ${crit.label}: supplier responses by ${fmtDate(call.closesAt)}.`, ['procurement', 'planner']);
  },

  /** Cancel an active Contract: refund by the time-remaining rule, release its allocations. */
  cancelContract(s, ctx, contractId: string, token: string) {
    const k = s.market.contracts.find((x) => x.id === contractId);
    if (!k || k.status !== 'active' || token !== cancellationToken(s,contractId)) { reject(s,ctx,'Cancellation terms changed'); return; }
    const { refund, affected, projects } = cancel(s, ctx, k);
    news(s, ctx, `Contract cancelled: ${k.offerSnapshot.resource.name} (${k.offerSnapshot.supplierName}). Refund ${fmtM(refund)}, fee ${fmtM(k.offerSnapshot.priceM - refund)}.${projects.length ? ` Equipment missing for ${projects.join(', ')}.` : ''}`, affected);
    refreshLate(s, ctx);
  },

  /**
   * Switch a need to another offer in one step: cancel the active contract that covers it (refund by the usual
   * rule) and sign the new order for the same need. Both are checked before anything changes.
   */
  replaceContract(s, ctx, contractId: string, draft: OrderDraft, token: string) {
    const q = quoteReplacement(s, contractId, draft);
    if (s.meta.phase !== 'planning' || !q.old || q.unavailable || q.token !== token) { reject(s, ctx, q.unavailable || 'The switch terms changed'); return; }
    const old = q.old;
    // All or nothing: the new order is checked on the state as it will be after the cancellation, before anything changes.
    const after = quoteOrder(afterCancel(s, old, Math.floor(ctx.day)), draft);
    const block = orderBlock(s, after, after.token);
    if (block) { reject(s, ctx, block); return; }
    cancel(s, ctx, old);
    const signed = commitOrder(s, ctx, draft, after.token, true, after);
    if (!signed) return;
    news(s, ctx, `Contract switched: ${old.offerSnapshot.resource.name} (${old.offerSnapshot.supplierName}, ${fmtPct(old.offerSnapshot.reliability)}) → ${signed.offerSnapshot.resource.name} (${signed.offerSnapshot.supplierName}, ${fmtPct(signed.offerSnapshot.reliability)}), arriving ${fmtDate(signed.expectedAt)}. ${fmtM(signed.offerSnapshot.priceM)}, cancellation fee ${fmtM(q.feeM)}.`, ['procurement', 'planner']);
  },

  /** Reserve free contracted quantity for a Task criterion. */
  allocate(s, ctx, contractId: string, taskId: string, criterionId: string, quantity?: number) {
    const k = s.market.contracts.find((x) => x.id === contractId);
    if (!k || (k.status !== 'active' && k.status !== 'delivered')) return;
    const { task, crit } = findCriterion(s, taskId, criterionId);
    if (!task || !crit || task.status !== 'open' || !sameKind(k.offerSnapshot.resource, crit)) return;
    if (fitFailures(k.offerSnapshot.resource,crit).length) { reject(s,ctx,'Supply does not meet the criterion'); return; }
    if (s.market.allocations.some(a => a.taskId === taskId && a.criterionId === criterionId && a.status !== 'released' && s.market.contracts.some(other => other.id === a.contractId && !sameHardware(other.offerSnapshot.resource, k.offerSnapshot.resource)))) { reject(s,ctx,'Hardware differs from existing allocation'); return; }
    const used = s.market.allocations.filter((a) => a.contractId === k.id && a.status !== 'released').reduce((n, a) => n + a.quantity, 0);
    const free = k.offerSnapshot.quantity - used;
    const missing = criterionCoverage(s, task, crit).missing;
    const qty = Math.min(free, missing, Math.max(1, Math.round(quantity ?? missing)));
    if (qty < 1) return;
    s.market.allocations.push({
      id: ctx.newId('alloc'), revision: 1, contractId, taskId, criterionId: crit.id, quantity: qty,
      status: k.status === 'delivered' ? 'available' : 'reserved',
    });
    refreshLate(s, ctx);
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
