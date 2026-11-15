// Contracts: the inventory (active / delivered / cancelled), arrival vs launch, allocations.
import { useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import type { Contract } from '../../../core/model';
import { procurementActions } from '../logic';
import { RESOURCES } from '../data/catalogue';
import {
  criterionCoverage, fitFailures, fmtDate, fmtDuration, fmtM, fmtPct, fmtStats, openTasks, refundM, sameKind, taskCode, quoteAmendment, sameHardware, findOffer, quoteOrder,
  type PView,
} from '../rules';
import { setUi, targetKey, useP, useUi } from './uiState';
import { ContractTimeline, marginText } from './ContractTimeline';
import { contractTiming } from '../timing';

function allocationsOf(v: PView, k: Contract) {
  return v.market.allocations.filter((a) => a.contractId === k.id);
}
function freeQty(v: PView, k: Contract): number {
  if (k.status === 'cancelled' || k.status === 'failed') return 0;
  return k.offerSnapshot.quantity - allocationsOf(v, k).filter((a) => a.status !== 'released').reduce((n, a) => n + a.quantity, 0);
}
function statusLabel(k: Contract): { text: string; tone: string } {
  if (k.status === 'delivered') return { text: 'Delivered', tone: 'good' };
  if (k.status === 'cancelled') return { text: 'Cancelled', tone: 'muted' };
  if (k.status === 'failed') return { text: 'Failed', tone: 'bad' };
  return { text: 'Active', tone: '' };
}

export function ContractsView() {
  const v = useP();
  const sel = useUi((u) => u.contractId);
  const list = [...v.market.contracts].reverse();
  const active = list.filter((k) => k.status === 'active');
  const contractView = useUi(u => u.contractView);
  const lateCount = active.filter(k => contractTiming({ market: v.market, research: { projects: v.research.projects ?? [] } }, k).needs.some(n => n.margin !== undefined && n.margin < 0)).length;
  return (
    <main class="pr-panel pr-overlay" aria-label="Contracts">
      <div class="pr-overlay-head">
        <h2>Contracts & deliveries</h2>
        <span class="muted small">{contractView === 'timeline' ? `${active.length} incoming${lateCount ? ` · ${lateCount} late` : ''}` : `${active.length} active · ${fmtM(v.budget.committedM)} committed · ${list.filter(k => k.status === 'delivered').length} delivered · ${list.filter(k => k.status === 'cancelled').length} cancelled`}</span>
      </div>
      <div class="pr-contract-toggle" aria-label="Contracts view"><button type="button" class="pr-btn small" aria-pressed={contractView === 'timeline'} onClick={() => setUi({ contractView: 'timeline' })}>Timeline</button><button type="button" class="pr-btn small" aria-pressed={contractView === 'table'} onClick={() => setUi({ contractView: 'table' })}>Table</button></div>
      {contractView === 'timeline' ? <ContractTimeline /> : list.length ? (
        <div class="pr-table-wrap">
          <table class="pr-table">
            <thead><tr><th>Contract</th><th>For</th><th>Qty</th><th>Status</th><th>Arrival</th><th>Value</th><th /></tr></thead>
            <tbody>
              {list.map((k) => {
                const st = statusLabel(k);
                const allocs = allocationsOf(v, k);
                const live = allocs.filter((a) => a.status !== 'released');
                const arrival = k.deliveredAt ?? k.expectedAt;
                return (
                  <tr key={k.id} class={sel === k.id ? 'active-row' : ''} onClick={() => setUi({ contractId: k.id, amendmentPreview: null })}>
                    <td>
                      <button type="button" class="pr-text-btn strong" onClick={() => setUi({ contractId: k.id, amendmentPreview: null })}>{k.offerSnapshot.resource.name}</button>
                      <div class="muted small">{k.offerSnapshot.supplierName} · {k.id}</div>
                    </td>
                    <td class="small">
                      {live.map((a) => {
                        const t = v.market.tasks.find((x) => x.id === a.taskId);
                        return <div key={a.id}>{a.department ? `Department · ${a.department}` : t ? `${taskCode(t)} ${t.title}` : a.taskId}{a.quantity > 1 ? ` ×${a.quantity}` : ''}</div>;
                      })}
                      {!live.length ? <span class="muted">{k.status === 'cancelled' ? 'Released' : 'Unallocated'}</span> : null}
                    </td>
                    <td class="num">{k.offerSnapshot.quantity}</td>
                    <td><span class={`pr-chip ${st.tone}`}>{st.text}</span></td>
                    <td class="num">
                      <span>{fmtDate(arrival)}</span>
                      {k.status === 'active' ? <div class="muted small">{`in ${fmtDuration(k.expectedAt - v.clock.day)}`}</div> : null}
                    </td>
                    <td class="num">{fmtM(k.offerSnapshot.priceM)}{k.status === 'cancelled' ? <div class="muted small">refund {fmtM(k.refundM ?? 0)}</div> : null}</td>
                    <td>
                      {k.status === 'active' ? (
                        <button type="button" class="pr-btn small" onClick={(e) => { e.stopPropagation(); setUi({ dialog: { type: 'cancel', contractId: k.id } }); }}>
                          Cancel · refund {fmtM(refundM(k, v.clock.day))}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="pr-empty"><h3>No Contracts yet</h3><p>Sign an Offer to add a Contract.</p></div>
      )}
    </main>
  );
}

export function ContractInspector() {
  const projects = useGame(g => g.research.projects);
  const [department, setDepartment] = useState<'science' | 'planner' | 'comms' | 'procurement'>('science');
  const [quantity, setQuantity] = useState(1);
  const v = useP();
  const sel = useUi((u) => u.contractId);
  const preview = useUi(u => u.amendmentPreview);
  const contractView = useUi(u => u.contractView);
  const k = v.market.contracts.find((x) => x.id === sel) ?? v.market.contracts[v.market.contracts.length - 1];
  if (!k) {
    return (
      <div class="pr-ctx-head"><span class="pr-eyebrow">Contracts</span><h2>Inventory</h2><p>Select a Contract.</p></div>
    );
  }
  const o = k.offerSnapshot;
  const allocs = allocationsOf(v, k);
  const free = freeQty(v, k);
  const targets = openTasks(v).flatMap((t) => t.criteria.filter((c) => sameKind(o.resource, c)).map((c) => ({ t, c })))
    .filter(({ t, c }) => criterionCoverage(v, t, c).missing > 0);
  const refund = refundM(k, v.clock.day);
  const replacementResource = o.resourceId ?? RESOURCES.find(r => sameHardware(r, o.resource))?.id;
  const originalOffer = findOffer(v, o.id);
  const timing = contractTiming({ market: v.market, research: { projects } }, k);
  const cutoff = k.amendmentCutoff ?? k.baselineExpectedAt ?? k.expectedAt;
  return (
    <>
      <div class="pr-ctx-head">
        {contractView === 'timeline' ? <button type="button" class="pr-btn small pr-close-details" onClick={() => setUi({ contractId: null, amendmentPreview: null })}>Close details</button> : null}
        <span class="pr-eyebrow">{k.id} · {statusLabel(k).text}</span>
        <h2>{o.resource.name}</h2>
        <p>{o.supplierName} · {fmtStats(o.resource.partKind, o.resource.variant, o.resource.stats)} · {o.resource.massT} t</p>
      </div>
      <div class="pr-ctx-body">
        <dl class="pr-facts">
          <dt>Quantity</dt><dd>{o.quantity} · {free} unallocated</dd>
          <dt>Signed</dt><dd>{fmtDate(k.signedAt)}</dd>
          <dt>{k.status === 'delivered' ? 'Delivered' : k.status === 'cancelled' ? 'Was due' : 'Expected'}</dt>
          <dd>{fmtDate(k.deliveredAt ?? k.expectedAt)}</dd>
          {timing.sinceSigning ? <><dt>Since signing</dt><dd>{timing.sinceSigning > 0 ? '+' : ''}{Math.round(timing.sinceSigning * 10) / 10} days</dd></> : null}
          <dt>Value</dt><dd>{fmtM(o.priceM)}{k.status === 'cancelled' ? ` · refunded ${fmtM(k.refundM ?? 0)}` : ''}</dd>
          <dt>Reliability</dt><dd>{fmtPct(o.reliability)}</dd>
          <dt>Source</dt><dd>{o.source === 'catalogue' ? 'Catalogue' : o.source === 'call' ? 'Call (tender)' : 'Comms partner offer'}</dd>
        </dl>
        <h3>Assigned to</h3>
        {allocs.filter(a => a.status !== 'released').map((a) => {
          const t = v.market.tasks.find((x) => x.id === a.taskId);
          const c = t?.criteria.find((x) => x.id === a.criterionId);
          const fails = c ? fitFailures(o.resource, c) : [];
          const need = timing.needs.find(n => n.id === a.id);
          return (
            <div key={a.id} class="pr-alloc">
              <div>
                <strong>{a.department ? `Department · ${a.department}` : t ? `${taskCode(t)} ${t.title}` : a.taskId}</strong> ×{a.quantity}
                <div class="muted small">{a.projectId ? `Reserved for ${projects.find(p => p.id === a.projectId)?.title ?? 'research'}` : a.status === 'reserved' ? 'Incoming' : 'Ready'}{t && t.status !== 'open' ? ` · Task ${t.status}` : ''}</div>
                {need ? <div class="small muted">{need.source === 'research-bonus' ? 'Research bonus · ' : ''}{need.neededAt === undefined ? 'No need date' : `${need.source === 'requested' ? 'Order requested' : 'Needed'} ${fmtDate(need.neededAt)} · ${marginText(need.margin)}${need.source === 'requested' ? ' vs order request' : ''}`}</div> : null}
                {fails.length && a.status !== 'released' ? <div class="bad small">Revised need: {fails.join(' · ')}</div> : null}
              </div>
              {a.status !== 'released' && !a.projectId ? <button type="button" class="pr-btn small" onClick={() => procurementActions.release(a.id)}>Release</button> : null}
            </div>
          );
        })}
        {timing.needs.filter(n => n.id === `${k.id}-free`).map(n => <p class="muted small" key={n.id}>Unallocated supply ×{n.quantity} · {n.neededAt === undefined ? 'No need date' : `Order requested ${fmtDate(n.neededAt)} · ${marginText(n.margin)} vs order request`}</p>)}
        {k.status === 'active' ? <><h3>Change delivery</h3>
          {(['priority', 'standard', 'flexible'] as const).map(delivery => { const q = quoteAmendment(v, k.id, delivery); const chosen = preview?.contractId === k.id && preview.delivery === delivery; return <button key={delivery} type="button" class="pr-ctx-option" aria-pressed={chosen} disabled={!!q.unavailable} onClick={() => setUi({ amendmentPreview: chosen ? null : { contractId: k.id, delivery } })}>
            <strong>{delivery[0].toUpperCase() + delivery.slice(1)} · {q.unavailable ? 'Unavailable' : fmtDate(q.expectedAt)}</strong><span>{q.unavailable || (q.expectedAt === k.expectedAt ? 'Current arrival' : `Fee ${fmtM(q.feeM)}`)}</span></button>; })}
          {preview?.contractId === k.id ? (() => { const q = quoteAmendment(v, k.id, preview.delivery); return <div class="pr-amend-preview"><strong>Proposed: {fmtDate(k.expectedAt)} → {fmtDate(q.expectedAt)}</strong><p class="small">Fee {fmtM(q.feeM)}{q.unavailable ? ` · ${q.unavailable}` : ''}</p>{timing.needs.filter(n => n.neededAt !== undefined).map(n => <p class="small" key={n.id}>{n.label} ×{n.quantity} · {marginText(n.neededAt! - q.expectedAt)}{n.source === 'requested' ? ' vs order request' : ''}</p>)}<button type="button" class="pr-btn small" disabled={!!q.unavailable} onClick={() => setUi({ dialog: { type: 'amend', contractId: k.id, delivery: preview.delivery, token: q.token } })}>Review amendment</button></div>; })() : null}
          <p class="small muted">{v.clock.day >= cutoff ? 'Change cutoff passed' : `Cutoff: ${fmtDate(cutoff)} (during day)`}</p>
          {k.amendments?.length || allocs.some(a => a.status === 'released') ? (
          <details class="pr-history">
            <summary>Contract history</summary>
            {(k.amendments ?? []).map((a, i) => <p key={i} class="small muted">{fmtDate(a.at)} · {fmtDate(a.from)} → {fmtDate(a.to)} · {fmtM(a.feeM)}</p>)}
            {allocs.filter(a => a.status === 'released').map(a => <p key={a.id} class="small muted">Released {a.quantity} × {a.department ?? v.market.tasks.find(t => t.id === a.taskId)?.title ?? a.taskId}</p>)}
          </details>
        ) : null}
        </> : null}
        {!replacementResource && originalOffer?.status === 'available' && (originalOffer.remainingQuantity ?? originalOffer.quantity) > 0 ? <button type="button" class="pr-btn wide" onClick={() => { const a = allocs.find(x => x.status !== 'released') ?? allocs[0]; const destination = a?.department ? { kind: 'department' as const, department: a.department } : a?.taskId && a.criterionId ? { kind: 'task' as const, taskId: a.taskId, criterionId: a.criterionId } : { kind: 'shared' as const }; const draft = { offerId: originalOffer.id, quantity: Math.min(o.quantity, originalOffer.remainingQuantity ?? originalOffer.quantity), destination, delivery: 'standard' as const }; setUi({ dialog: { type: 'order', draft, token: quoteOrder(v, draft).token } }); }}>Order remaining Offer</button> : null}
        {!replacementResource ? <button type="button" class="pr-btn wide" onClick={() => { const a = allocs.find(x => x.status !== 'released') ?? allocs[0]; const destination = a?.department ? { kind: 'department' as const, department: a.department } : a?.taskId && a.criterionId ? { kind: 'task' as const, taskId: a.taskId, criterionId: a.criterionId } : { kind: 'shared' as const }; setUi({ view: 'calls', callResourceId: null, callTarget: '', callSnapshot: { criterion: { id: o.id, label: o.resource.name, partKind: o.resource.partKind, variant: o.resource.variant, minimums: o.resource.stats, quantity: o.quantity }, destination } }); }}>Source replacement · open Call</button> : null}
        {replacementResource ? <button type="button" class="pr-btn wide" onClick={() => { const a = allocs.find(x => x.status !== 'released') ?? allocs[0]; setUi({ view: 'catalogue', inspect: 'resource', resourceId: replacementResource, offerId: o.source === 'catalogue' ? o.id : null, target: a?.department ? `department:${a.department}` : a?.taskId && a.criterionId ? targetKey(a.taskId, a.criterionId) : 'none', qty: o.quantity, delivery: 'standard', neededAt: null }); }}>{k.status === 'cancelled' ? 'Find replacement' : 'Order again'}</button> : null}
        {free > 0 && (k.status === 'active' || k.status === 'delivered') ? <div class="pr-department-assign"><h3>Assign shared supply</h3><label class="pr-field"><span>Department</span><select value={department} onChange={e => setDepartment((e.target as HTMLSelectElement).value as typeof department)}><option value="science">Science</option><option value="planner">Planner</option><option value="comms">Comms</option><option value="procurement">Procurement</option></select></label><label class="pr-field"><span>Quantity</span><input type="number" min="1" max={free} value={quantity} onInput={e => setQuantity(Number((e.target as HTMLInputElement).value))} /></label><button type="button" class="pr-btn" disabled={!Number.isInteger(quantity) || quantity < 1 || quantity > free} onClick={() => { procurementActions.allocateDepartment(k.id, department, quantity); setUi({ status: 'Assignment submitted.' }); }}>Assign to department</button></div> : null}
        {free > 0 && targets.length ? (
          <>
            <h3>Allocate spare supply</h3>
            {targets.map(({ t, c }) => {
              const fails = fitFailures(o.resource, c);
              return (
                <button key={t.id + c.id} type="button" class="pr-ctx-option" onClick={() => procurementActions.allocate(k.id, t.id, c.id)}>
                  <strong>{taskCode(t)} · {t.title}</strong>
                  <span class={fails.length ? 'bad' : ''}>{fails.length ? `✗ ${fails.join(' · ')}` : 'Meets the criteria'}</span>
                </button>
              );
            })}
          </>
        ) : null}
      </div>
      {k.status === 'active' ? (
        <div class="pr-actions">
          <button type="button" class="pr-btn wide" onClick={() => setUi({ dialog: { type: 'cancel', contractId: k.id } })}>
            Cancel contract · refund {fmtM(refund)}
          </button>
        </div>
      ) : null}
    </>
  );
}
