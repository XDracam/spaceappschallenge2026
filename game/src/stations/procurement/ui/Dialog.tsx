// Confirmation dialogs: sign an Offer, cancel a Contract. Facts are rechecked live
// against the current shared state while the dialog is open.
import { useEffect } from 'preact/hooks';
import { procurementActions } from '../logic';
import {
  assessOffer, budgetAvailableM, findOffer, fmtDate, fmtM, fmtPct, fmtStats, refundM, taskCode,
} from '../rules';
import { blockReason } from './Inspector';
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
  const close = () => setUi({ dialog: null });
  let body = null;

  if (d.type === 'sign') {
    const offer = findOffer(v, d.offerId);
    const task = d.taskId ? v.market.tasks.find((t) => t.id === d.taskId && t.status === 'open') : undefined;
    const crit = task?.criteria.find((c) => c.id === d.criterionId);
    if (!offer) {
      body = <><h2>Offer no longer available</h2><div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Close</button></div></>;
    } else {
      const a = assessOffer(v, offer, task, crit, offer.source === 'catalogue' ? d.qty : offer.quantity);
      const block = blockReason(v, a, task, crit);
      const available = budgetAvailableM(v.budget);
      body = (
        <>
          <span class="pr-eyebrow">Sign contract</span>
          <h2 id="pr-dialog-title">{offer.resource.name}</h2>
          <p class="muted">{offer.supplierName} · {fmtStats(offer.resource.partKind, offer.resource.variant, offer.resource.stats)} · {offer.resource.massT} t each</p>
          <dl class="pr-facts">
            <dt>Quantity</dt><dd>{a.quantity}{a.quantity > 1 ? ` × ${fmtM(a.unitPriceM)}` : ''}</dd>
            <dt>Price (committed now)</dt><dd class="strong">{fmtM(a.totalPriceM)}</dd>
            <dt>Budget after</dt><dd class={available - a.totalPriceM < 0 ? 'bad' : ''}>{fmtM(available - a.totalPriceM)} available</dd>
            <dt>Expected delivery</dt><dd class={a.late ? 'warn' : ''}>{fmtDate(a.expectedAt)}{task ? ` · needed ${fmtDate(task.neededAt)}` : ''}</dd>
            <dt>Reliability</dt><dd>{fmtPct(offer.reliability)}</dd>
            <dt>For</dt><dd>{task && crit ? `${taskCode(task)} ${task.title}` : 'Unallocated (spare)'}</dd>
            <dt>Cancellation</dt><dd>Supplier keeps {Math.round(offer.cancellationPct * 100)} % at signing, rising to 100 % at delivery</dd>
          </dl>
          {a.failures.length ? <div class="pr-callout bad">Does not meet the need: {a.failures.join(' · ')}. The planner will fly the contracted stats — discuss before signing.</div> : null}
          {a.late ? <div class="pr-callout warn">Arrives after {task ? 'the need date' : 'the planned launch'}. Late parts hold up the launch.</div> : null}
          {block ? <div class="pr-callout bad">{block}</div> : null}
          <div class="pr-row end">
            <button type="button" class="pr-btn" onClick={close}>Back</button>
            <button type="button" class="pr-btn primary" disabled={!!block} autoFocus onClick={() => {
              procurementActions.signOffer(offer.id, task?.id, crit?.id, a.quantity);
              setUi({ dialog: null, offerId: null, qty: 0, status: `Signed ${offer.resource.name} — ${fmtM(a.totalPriceM)}, arriving ${fmtDate(a.expectedAt)}.` });
            }}>
              {a.failures.length ? 'Sign anyway' : 'Sign contract'} · {fmtM(a.totalPriceM)}
            </button>
          </div>
        </>
      );
    }
  } else {
    const k = v.market.contracts.find((x) => x.id === d.contractId);
    if (!k || k.status !== 'active') {
      body = <><h2>Contract is no longer active</h2><p class="muted">It was delivered or cancelled meanwhile.</p><div class="pr-row end"><button type="button" class="pr-btn" onClick={close}>Close</button></div></>;
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
            <dt>Releases</dt><dd>{allocs.length ? allocs.map((a) => { const t = v.market.tasks.find((x) => x.id === a.taskId); return t ? `${taskCode(t)} ${t.title}` : a.taskId; }).join(', ') : 'No allocations'}</dd>
          </dl>
          <p class="muted small">Refund rule: price × (1 − {Math.round(k.offerSnapshot.cancellationPct * 100)} %) × time remaining until delivery. The released needs become uncovered again.</p>
          <div class="pr-row end">
            <button type="button" class="pr-btn" onClick={close} autoFocus>Keep contract</button>
            <button type="button" class="pr-btn danger" onClick={() => {
              procurementActions.cancelContract(k.id);
              setUi({ dialog: null, status: `Cancelled ${k.offerSnapshot.resource.name} — refund ${fmtM(refund)}.` });
            }}>Cancel contract · fee {fmtM(k.offerSnapshot.priceM - refund)}</button>
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
