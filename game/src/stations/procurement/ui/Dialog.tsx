// Confirmation dialogs: sign an order, switch a need to another offer, speed up a delivery, cancel a contract.
// Facts are rechecked live against the current shared state while the dialog is open.
import { useEffect } from 'preact/hooks';
import { procurementActions } from '../logic';
import { contractReliability, type Contract, type OrderDraft, type Task } from '../../../core/model';
import {
  findOffer, fmtDate, fmtM, fmtPct, fmtStats, offersForCriterion, refundM, taskCode, quoteOrder, quoteAmendment, quoteReplacement, cancellationToken,
  type PView,
} from '../rules';
import { BudgetAfter, testable } from './Inspector';
import { setUi, useP, useUi } from './uiState';

export function Dialog() {
  const v = useP();
  const d = useUi((u) => u.dialog);
  useEffect(() => {
    if (!d) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setUi({ dialog: null }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d]);
  if (!d) return null;
  const close = () => setUi({ dialog: null, amendmentPreview: null });
  let body = null;

  if (d.type === 'order') body = <OrderReview draft={d.draft} token={d.token} close={close} />;
  else if (d.type === 'replace') body = <ReplaceReview contractId={d.contractId} draft={d.draft} token={d.token} close={close} />;
  else if (d.type === 'amend') {
    const q = quoteAmendment(v, d.contractId, d.delivery);
    const stale = q.token !== d.token;
    const k = q.contract;
    const task = k ? taskOf(v, k) : undefined;
    body = <><span class="pr-eyebrow">Speed up delivery</span><h2 id="pr-dialog-title">{k?.offerSnapshot.resource.name ?? 'Contract unavailable'}</h2>
      {k ? <dl class="pr-facts">
        <dt>Arrival</dt><dd>{fmtDate(k.expectedAt)} → <strong>{fmtDate(q.expectedAt)}</strong>{task ? <span class={q.expectedAt > task.neededAt ? 'warn' : 'good'}>{q.expectedAt > task.neededAt ? ' · still late' : testable(v, q.expectedAt) ? ' · on time · time to test' : ' · on time'}</span> : null}</dd>
        <dt>Fee, paid now</dt><dd>{fmtM(q.feeM)}</dd>
      </dl> : null}
      {k ? <BudgetAfter costM={q.feeM} /> : null}
      {stale ? <div class="pr-callout warn">The terms changed while the dialog was open. Review them again.</div> : null}{q.unavailable ? <div class="pr-callout bad">{q.unavailable}</div> : null}
      <div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Back</button>{stale ? <button type="button" class="pr-btn primary" onClick={() => setUi({ dialog: { ...d, token: q.token } })}>Use the new terms</button> : <button type="button" class="pr-btn primary" disabled={!!q.unavailable} onClick={() => { procurementActions.amendDelivery(d.contractId, d.delivery, d.token); setUi({ dialog: null, amendmentPreview: null, status: 'Delivery change submitted.' }); }}>Confirm · fee {fmtM(q.feeM)}</button>}</div></>;
  } else {
    const k = v.market.contracts.find((x) => x.id === d.contractId);
    if (!k || k.status !== 'active') {
      body = <><h2 id="pr-dialog-title">Contract is no longer active</h2><p class="muted">It was delivered or cancelled meanwhile.</p><div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Close</button></div></>;
    } else {
      const refund = refundM(k, v.clock.day);
      const task = taskOf(v, k);
      body = (
        <>
          <span class="pr-eyebrow">Cancel contract</span>
          <h2 id="pr-dialog-title">{k.offerSnapshot.resource.name}</h2>
          <p class="muted">{k.offerSnapshot.supplierName} · signed {fmtDate(k.signedAt)} · due {fmtDate(k.expectedAt)}</p>
          <dl class="pr-facts">
            <dt>Contract value</dt><dd>{fmtM(k.offerSnapshot.priceM)}</dd>
            <dt>Comes back</dt><dd class="good">{fmtM(refund)}</dd>
            <dt>Lost</dt><dd class="bad">{fmtM(k.offerSnapshot.priceM - refund)}</dd>
            <dt>Need</dt><dd>{task ? `${taskCode(task)} ${task.title} is uncovered again` : 'None'}</dd>
          </dl>
          {task ? <p class="pr-note muted">To replace the part in one step instead, pick another offer on the need: a switch.</p> : null}
          <div class="pr-row end">
            <button type="button" class="pr-btn" onClick={close} autoFocus>Keep contract</button>
            <button type="button" class="pr-btn danger" onClick={() => {
              procurementActions.cancelContract(k.id, cancellationToken(v, k.id));
              setUi({ dialog: null, contractId: null, status: 'Cancellation submitted.' });
            }}>Cancel contract · lose {fmtM(k.offerSnapshot.priceM - refund)}</button>
          </div>
        </>
      );
    }
  }

  return (
    <div class="pr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section class="pr-dialog" role="dialog" aria-modal="true" aria-labelledby="pr-dialog-title">{body}</section>
    </div>
  );
}

function taskOf(v: PView, k: Contract): Task | undefined {
  const a = v.market.allocations.find((x) => x.contractId === k.id && x.status !== 'released' && x.taskId);
  return a ? v.market.tasks.find((t) => t.id === a.taskId) : undefined;
}

function needOf(v: PView, draft: OrderDraft) {
  const dest = draft.destination;
  if (dest.kind !== 'task') return {};
  const task = v.market.tasks.find((t) => t.id === dest.taskId);
  return { task, crit: task?.criteria.find((c) => c.id === dest.criterionId) };
}

/**
 * The decision Procurement has, in one block: when it arrives (on time, time for a Science test), how reliable it is,
 * what it costs, and how that compares with the cheapest offer that is also on time.
 */
function Tradeoff({ draft, totalM, expectedAt }: { draft: OrderDraft; totalM: number; expectedAt: number }) {
  const v = useP();
  const offer = findOffer(v, draft.offerId);
  const { task, crit } = needOf(v, draft);
  if (!offer) return null;
  const others = task && crit ? offersForCriterion(v, task, crit).filter((a) => a.fits && !a.unavailable && !a.lateAtBest && a.offer.id !== offer.id) : [];
  const price = (a: (typeof others)[number]) => a.rescue?.totalPriceM ?? a.totalPriceM;
  // The supplier, and the part when it is another one; "with priority" when only priority delivery is on time.
  const name = (a: (typeof others)[number]) => `${a.offer.resource.name === offer.resource.name ? '' : `${a.offer.resource.name} from `}${a.offer.supplierName}${a.rescue ? ' with priority' : ''}`;
  const cheapest = [...others].sort((a, b) => price(a) - price(b))[0];
  const surer = [...others].sort((a, b) => b.offer.reliability - a.offer.reliability)[0];
  const late = task ? expectedAt > task.neededAt : false;
  return (
    <>
      <dl class="pr-facts">
        <dt>Arrives</dt>
        <dd>{fmtDate(expectedAt)} · {draft.delivery}{task ? <span class={late ? 'warn' : 'good'}>{late ? ` · ${Math.round(expectedAt - task.neededAt)} d after the launch` : testable(v, expectedAt) ? ' · on time, time for a Science test' : ' · on time, too late for a Science test'}</span> : null}</dd>
        <dt>Reliability</dt><dd>{fmtPct(offer.reliability)} · {offer.supplierName}</dd>
        <dt>Price</dt><dd class="strong">{fmtM(totalM)}</dd>
      </dl>
      {task && (cheapest && price(cheapest) < totalM - 0.05 || surer && surer.offer.reliability > offer.reliability) ? (
        <p class="pr-note muted">
          {cheapest && price(cheapest) < totalM - 0.05 ? <>Cheapest on time: {name(cheapest)}, {fmtM(price(cheapest))} at {fmtPct(cheapest.offer.reliability)}. </> : null}
          {surer && surer.offer.reliability > offer.reliability ? <>More reliable on time: {name(surer)}, {fmtPct(surer.offer.reliability)} for {fmtM(price(surer))}.</> : null}
        </p>
      ) : null}
    </>
  );
}

function OrderReview({ draft, token, close }: { draft: OrderDraft; token: string; close: () => void }) {
  const v = useP();
  const q = quoteOrder(v, draft);
  const offer = findOffer(v, draft.offerId);
  const stale = q.token !== token;
  const { task, crit } = needOf(v, draft);
  if (!offer) return <><h2 id="pr-dialog-title">Offer no longer available</h2><button type="button" class="pr-btn" onClick={close}>Close</button></>;
  return <>
    <span class="pr-eyebrow">{task ? `Order for ${taskCode(task)} · ${task.title}` : 'Order'}</span>
    <h2 id="pr-dialog-title">{q.quantity > 1 ? `${q.quantity} × ` : ''}{offer.resource.name}</h2>
    <p class="muted">{fmtStats(offer.resource.partKind, offer.resource.variant, offer.resource.stats)}{offer.source === 'comms' ? ' · partner offer from Comms' : offer.source === 'call' ? ' · tender' : ''}</p>
    <Tradeoff draft={draft} totalM={q.totalM} expectedAt={q.expectedAt} />
    <BudgetAfter costM={q.totalM} task={task} crit={crit} />
    {stale ? <div class="pr-callout warn" role="alert">The terms changed while the dialog was open. Review them again.</div> : null}
    {q.failures.length ? <div class="pr-callout bad">{q.failures.join(' · ')}</div> : null}{q.unavailable ? <div class="pr-callout bad">{q.unavailable}</div> : null}
    <div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Back</button>{stale ? <button type="button" class="pr-btn primary" onClick={() => setUi({ dialog: { type: 'order', draft, token: q.token } })}>Use the new terms</button> : <button type="button" class="pr-btn primary" disabled={!!q.unavailable || !!q.failures.length} onClick={() => { procurementActions.signOrder(draft, token); setUi({ dialog: null, status: 'Order submitted.' }); }}>Confirm order · {fmtM(q.totalM)}</button>}</div>
  </>;
}

function ReplaceReview({ contractId, draft, token, close }: { contractId: string; draft: OrderDraft; token: string; close: () => void }) {
  const v = useP();
  const q = quoteReplacement(v, contractId, draft);
  const offer = findOffer(v, draft.offerId);
  const stale = q.token !== token;
  const { task } = needOf(v, draft);
  const old = q.old;
  if (!offer || !old) return <><h2 id="pr-dialog-title">Switch no longer possible</h2><p class="muted">{q.unavailable}</p><button type="button" class="pr-btn" onClick={close}>Close</button></>;
  return <>
    <span class="pr-eyebrow">Switch {task ? `${taskCode(task)} · ${task.title}` : 'contract'}</span>
    <h2 id="pr-dialog-title">{offer.resource.name} · {offer.supplierName}</h2>
    <dl class="pr-facts">
      <dt>Now</dt><dd>{old.offerSnapshot.supplierName} · {fmtPct(contractReliability(old))} · arrives {fmtDate(old.expectedAt)}</dd>
      <dt>Lost on cancelling</dt><dd class="bad">{fmtM(q.feeM)} of {fmtM(old.offerSnapshot.priceM)}</dd>
    </dl>
    <Tradeoff draft={draft} totalM={q.order.totalM} expectedAt={q.order.expectedAt} />
    <BudgetAfter costM={q.netM} />
    {stale ? <div class="pr-callout warn" role="alert">The terms changed while the dialog was open. Review them again.</div> : null}
    {q.unavailable ? <div class="pr-callout bad">{q.unavailable}</div> : null}
    <div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Back</button>{stale ? <button type="button" class="pr-btn primary" onClick={() => setUi({ dialog: { type: 'replace', contractId, draft, token: q.token } })}>Use the new terms</button> : <button type="button" class="pr-btn primary" disabled={!!q.unavailable} onClick={() => { procurementActions.replaceContract(contractId, draft, token); setUi({ dialog: null, status: 'Switch submitted.' }); }}>Confirm switch · {fmtM(q.order.totalM)}</button>}</div>
  </>;
}
