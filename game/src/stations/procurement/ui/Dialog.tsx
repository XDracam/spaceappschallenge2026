// Confirmation dialogs: sign an Offer, cancel a Contract. Facts are rechecked live
// against the current shared state while the dialog is open.
import { useEffect, useState } from 'preact/hooks';
import { procurementActions } from '../logic';
import {
  budgetAvailableM, findOffer, fmtDate, fmtM, fmtPct, fmtStats, refundM, taskCode, quoteOrder, quoteAmendment, cancellationToken,
} from '../rules';
import type { OrderDraft } from '../../../core/model';
import { setUi, useP, useUi } from './uiState';

export function Dialog() {
  const v = useP();
  const d = useUi((u) => u.dialog);
  const [cancelToken, setCancelToken] = useState('');
  useEffect(() => { if (d?.type === 'cancel') setCancelToken(cancellationToken(v, d.contractId)); }, [d]);
  useEffect(() => {
    if (!d) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setUi({ dialog: null }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d]);
  if (!d) return null;
  const close = () => setUi({ dialog: null });
  let body = null;

  if (d.type === 'sign' || d.type === 'order') {
    const initial: OrderDraft = d.type === 'order' ? d.draft : {
      offerId: d.offerId, quantity: d.qty,
      destination: d.taskId && d.criterionId ? { kind: 'task', taskId: d.taskId, criterionId: d.criterionId } : { kind: 'shared' },
      delivery: 'standard', neededAt: d.taskId ? v.market.tasks.find(t => t.id === d.taskId)?.neededAt : undefined,
    };
    body = <OrderReview key={d.type + initial.offerId} initial={initial} initialToken={d.type === 'order' ? d.token : undefined} close={close} />;
  } else if (d.type === 'amend') {
    const q = quoteAmendment(v, d.contractId, d.delivery);
    const stale = q.token !== d.token;
    const k = q.contract;
    body = <><h2 id="pr-dialog-title">{k?.offerSnapshot.resource.name ?? 'Contract unavailable'}</h2>
      {k ? <dl class="pr-facts"><dt>Arrival</dt><dd>{fmtDate(k.expectedAt)} → {fmtDate(q.expectedAt)}</dd><dt>Fee paid now</dt><dd>{fmtM(q.feeM)}</dd><dt>Lifetime cost</dt><dd>{fmtM(k.offerSnapshot.priceM + (k.amendments ?? []).reduce((sum, a) => sum + a.feeM, 0) + q.feeM)}</dd><dt>Available after</dt><dd>{fmtM(budgetAvailableM(v.budget) - q.feeM)}</dd><dt>Affected use</dt><dd>{v.market.allocations.filter(a => a.contractId === k.id && a.status !== 'released').map(a => a.department ? `${a.department}${a.projectId ? ` · project ${a.projectId}` : ''}` : v.market.tasks.find(t => t.id === a.taskId)?.title ?? a.taskId).join(', ') || 'Shared supply'}</dd></dl> : null}
      {stale ? <div class="pr-callout warn">Terms changed. Refresh quote.</div> : null}{q.unavailable ? <div class="pr-callout bad">{q.unavailable}</div> : null}
      <div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Back</button>{stale ? <button type="button" class="pr-btn primary" onClick={() => setUi({ dialog: { ...d, token: q.token } })}>Refresh quote</button> : <button type="button" class="pr-btn primary" disabled={!!q.unavailable} onClick={() => { procurementActions.amendDelivery(d.contractId, d.delivery, d.token); setUi({ dialog: null, status: 'Amendment submitted.' }); }}>Confirm amendment · {fmtM(q.feeM)}</button>}</div></>;
  } else {
    const k = v.market.contracts.find((x) => x.id === d.contractId);
    if (!k || k.status !== 'active') {
      body = <><h2 id="pr-dialog-title">Contract is no longer active</h2><p class="muted">It was delivered or cancelled meanwhile.</p><div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Close</button></div></>;
    } else {
      const refund = refundM(k, v.clock.day);
      const allocs = v.market.allocations.filter((a) => a.contractId === k.id && a.status !== 'released');
      body = (
        <>
          <span class="pr-eyebrow">Cancel contract</span>
          <h2 id="pr-dialog-title">{k.offerSnapshot.resource.name}</h2>
          <p class="muted">{k.offerSnapshot.supplierName} · signed {fmtDate(k.signedAt)} · due {fmtDate(k.expectedAt)}</p>
          <dl class="pr-facts">
            <dt>Contract value</dt><dd>{fmtM(k.offerSnapshot.priceM)}</dd>
            <dt>Refund today</dt><dd class="good">{fmtM(refund)}</dd>
            <dt>Cancellation fee (spent)</dt><dd class="bad">{fmtM(k.offerSnapshot.priceM - refund)}</dd>
            <dt>Releases</dt><dd>{allocs.length ? allocs.map((a) => { const t = v.market.tasks.find((x) => x.id === a.taskId); return a.department ? a.department : t ? `${taskCode(t)} ${t.title}` : a.taskId; }).join(', ') : 'No allocations'}</dd>
          </dl>
          {cancelToken !== cancellationToken(v, k.id) ? <div class="pr-callout warn">Cancellation terms changed. Refresh and review the current refund.</div> : null}
          <div class="pr-row end">
            <button type="button" class="pr-btn" onClick={close} autoFocus>Keep contract</button>
            {cancelToken !== cancellationToken(v, k.id) ? <button type="button" class="pr-btn" onClick={() => setCancelToken(cancellationToken(v, k.id))}>Refresh quote</button> : <button type="button" class="pr-btn danger" onClick={() => {
              procurementActions.cancelContract(k.id, cancelToken);
              setUi({ dialog: null, status: 'Cancellation submitted.' });
            }}>Cancel contract · fee {fmtM(k.offerSnapshot.priceM - refund)}</button>}
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

function OrderReview({ initial, initialToken, close }: { initial: OrderDraft; initialToken?: string; close: () => void }) {
  const v = useP();
  const [draft, setDraft] = useState(initial);
  const [token, setToken] = useState(initialToken ?? quoteOrder(v, initial).token);
  const q = quoteOrder(v, draft);
  const offer = findOffer(v, draft.offerId);
  const stale = q.token !== token;
  const task = draft.destination.kind === 'task' ? v.market.tasks.find(t => t.id === (draft.destination as { taskId: string }).taskId) : undefined;
  const destination = draft.destination.kind === 'department' ? `Department · ${draft.destination.department}` : task ? `${taskCode(task)} ${task.title}` : 'Shared supply';
  if (!offer) return <><h2 id="pr-dialog-title">Offer no longer available</h2><button type="button" class="pr-btn" onClick={close}>Close</button></>;
  return <><h2 id="pr-dialog-title">{offer.resource.name}</h2>
    {stale ? <div class="pr-callout warn" role="alert">Terms changed. Refresh quote.</div> : null}
    <p class="muted">{offer.supplierName} · {fmtStats(offer.resource.partKind, offer.resource.variant, offer.resource.stats)} · {fmtPct(offer.reliability)} reliability</p>
    {offer.source !== 'catalogue' ? <label class="pr-field"><span>Quantity · {offer.remainingQuantity ?? offer.quantity} remaining{offer.wholeOfferOnly ? ' · whole Offer only' : ''}</span><input type="number" min="1" max={offer.remainingQuantity ?? offer.quantity} value={draft.quantity} onInput={e => { const next = { ...draft, quantity: Number((e.target as HTMLInputElement).value) }; setDraft(next); setToken(quoteOrder(v, next).token); }} /></label> : null}
    {offer.source !== 'catalogue' ? <><label class="pr-field"><span>Destination</span><select value={draft.destination.kind === 'department' ? `department:${draft.destination.department}` : draft.destination.kind === 'task' ? 'task' : 'shared'} onChange={e => { const value = (e.target as HTMLSelectElement).value; const destination = value === 'task' ? initial.destination : value.startsWith('department:') ? { kind: 'department' as const, department: value.slice(11) as 'science' | 'planner' | 'comms' | 'procurement' } : { kind: 'shared' as const }; const next = { ...draft, destination }; setDraft(next); setToken(quoteOrder(v, next).token); }}><option value="shared">Shared supply</option><option value="department:science">Science</option><option value="department:planner">Planner</option><option value="department:comms">Comms</option><option value="department:procurement">Procurement</option>{initial.destination.kind === 'task' ? <option value="task">Original Task</option> : null}</select></label>
      <label class="pr-field"><span>Delivery</span><select value={draft.delivery} onChange={e => { const next = { ...draft, delivery: (e.target as HTMLSelectElement).value as OrderDraft['delivery'] }; setDraft(next); setToken(quoteOrder(v, next).token); }}>{(['priority', 'standard', 'flexible'] as const).map(delivery => { const candidate = quoteOrder(v, { ...draft, delivery }); return <option key={delivery} value={delivery} disabled={!!candidate.unavailable}>{delivery} · {candidate.unavailable || `${fmtDate(candidate.expectedAt)} · ${fmtM(candidate.totalM)}`}</option>; })}</select></label></> : null}
    <dl class="pr-facts"><dt>Destination</dt><dd>{destination}</dd><dt>Quantity</dt><dd>{q.quantity}</dd><dt>Delivery</dt><dd>{draft.delivery} · {fmtDate(q.expectedAt)}{draft.neededAt !== undefined ? ` · needed ${fmtDate(draft.neededAt)}` : ''}</dd>{task ? <><dt>Current Task deadline</dt><dd class={q.expectedAt > task.neededAt ? 'warn' : ''}>{fmtDate(task.neededAt)}{q.expectedAt > task.neededAt ? ' · late' : ''}</dd></> : null}<dt>Commitment</dt><dd class="strong">{fmtM(q.totalM)}</dd><dt>Available afterwards</dt><dd>{fmtM(budgetAvailableM(v.budget) - q.totalM)}</dd><dt>Cancellation</dt><dd>{Math.round(offer.cancellationPct * 100)}% at signing, rising to 100% by delivery</dd></dl>
    {q.failures.length ? <div class="pr-callout bad">{q.failures.join(' · ')}</div> : null}{q.late ? <div class="pr-callout warn">Arrival is after the needed date.</div> : null}{q.unavailable ? <div class="pr-callout bad">{q.unavailable}</div> : null}<div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Back</button>{stale ? <button type="button" class="pr-btn primary" onClick={() => setToken(q.token)}>Refresh quote</button> : <button type="button" class="pr-btn primary" disabled={!!q.unavailable} onClick={() => { procurementActions.signOrder(draft, token); setUi({ dialog: null, status: 'Order submitted.' }); }}>Confirm order · {fmtM(q.totalM)}</button>}</div>
  </>;
}
