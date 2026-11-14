// Contracts: the inventory (active / delivered / cancelled), arrival vs launch, allocations.
import type { Contract } from '../../../core/model';
import { procurementActions } from '../logic';
import {
  criterionCoverage, fitFailures, fmtDate, fmtDuration, fmtM, fmtPct, fmtStats, openTasks, refundM, sameKind, taskCode,
  type PView,
} from '../rules';
import { setUi, useP, useUi } from './uiState';

function allocationsOf(v: PView, k: Contract) {
  return v.market.allocations.filter((a) => a.contractId === k.id);
}
function freeQty(v: PView, k: Contract): number {
  if (k.status === 'cancelled' || k.status === 'failed') return 0;
  return k.offerSnapshot.quantity - allocationsOf(v, k).filter((a) => a.status !== 'released').reduce((n, a) => n + a.quantity, 0);
}
function statusLabel(k: Contract, launch: number): { text: string; tone: string } {
  if (k.status === 'delivered') return { text: 'Delivered', tone: 'good' };
  if (k.status === 'cancelled') return { text: 'Cancelled', tone: 'muted' };
  if (k.status === 'failed') return { text: 'Failed', tone: 'bad' };
  return k.expectedAt > launch ? { text: 'Active · late', tone: 'warn' } : { text: 'Active', tone: '' };
}

export function ContractsView() {
  const v = useP();
  const sel = useUi((u) => u.contractId);
  const launch = v.planner.plan.launchDay;
  const list = [...v.market.contracts].reverse();
  const active = list.filter((k) => k.status === 'active');
  const late = active.filter((k) => k.expectedAt > launch);
  return (
    <main class="pr-panel pr-overlay" aria-label="Contracts">
      <div class="pr-overlay-head">
        <h2>Contracts & deliveries</h2>
        <span class="muted small">
          {active.length} active · {fmtM(v.budget.committedM)} committed · {list.filter((k) => k.status === 'delivered').length} delivered · {list.filter((k) => k.status === 'cancelled').length} cancelled
          {late.length ? <> · <span class="warn">{late.length} arriving after launch {fmtDate(launch)}</span></> : null}
        </span>
      </div>
      {list.length ? (
        <div class="pr-table-wrap">
          <table class="pr-table">
            <thead><tr><th>Contract</th><th>For</th><th>Qty</th><th>Status</th><th>Arrival</th><th>Value</th><th /></tr></thead>
            <tbody>
              {list.map((k) => {
                const st = statusLabel(k, launch);
                const allocs = allocationsOf(v, k);
                const live = allocs.filter((a) => a.status !== 'released');
                const arrival = k.deliveredAt ?? k.expectedAt;
                return (
                  <tr key={k.id} class={sel === k.id ? 'active-row' : ''} onClick={() => setUi({ contractId: k.id })}>
                    <td>
                      <button type="button" class="pr-text-btn strong" onClick={() => setUi({ contractId: k.id })}>{k.offerSnapshot.resource.name}</button>
                      <div class="muted small">{k.offerSnapshot.supplierName} · {k.id}</div>
                    </td>
                    <td class="small">
                      {live.map((a) => {
                        const t = v.market.tasks.find((x) => x.id === a.taskId);
                        return <div key={a.id}>{t ? `${taskCode(t)} ${t.title}` : a.taskId}{a.quantity > 1 ? ` ×${a.quantity}` : ''}</div>;
                      })}
                      {!live.length ? <span class="muted">{k.status === 'cancelled' ? 'Released' : 'Unallocated'}</span> : null}
                    </td>
                    <td class="num">{k.offerSnapshot.quantity}</td>
                    <td><span class={`pr-chip ${st.tone}`}>{st.text}</span></td>
                    <td class="num">
                      <span class={k.status === 'active' && k.expectedAt > launch ? 'warn' : ''}>{fmtDate(arrival)}</span>
                      {k.status === 'active' ? <div class="muted small">{k.expectedAt > launch ? `${fmtDuration(k.expectedAt - launch)} after launch` : `in ${fmtDuration(k.expectedAt - v.clock.day)}`}</div> : null}
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
        <div class="pr-empty"><h3>No Contracts yet</h3><p>Sign an Offer from the catalogue or a Call. The Contract list is the agency's inventory.</p></div>
      )}
    </main>
  );
}

export function ContractInspector() {
  const v = useP();
  const sel = useUi((u) => u.contractId);
  const k = v.market.contracts.find((x) => x.id === sel) ?? v.market.contracts[v.market.contracts.length - 1];
  if (!k) {
    return (
      <div class="pr-ctx-head"><span class="pr-eyebrow">Contracts</span><h2>Inventory</h2><p>Signed Contracts appear here with their delivery dates and allocations.</p></div>
    );
  }
  const o = k.offerSnapshot;
  const launch = v.planner.plan.launchDay;
  const allocs = allocationsOf(v, k);
  const free = freeQty(v, k);
  const targets = openTasks(v).flatMap((t) => t.criteria.filter((c) => sameKind(o.resource, c)).map((c) => ({ t, c })))
    .filter(({ t, c }) => criterionCoverage(v, t, c).missing > 0);
  const refund = refundM(k, v.clock.day);
  return (
    <>
      <div class="pr-ctx-head">
        <span class="pr-eyebrow">{k.id} · {statusLabel(k, launch).text}</span>
        <h2>{o.resource.name}</h2>
        <p>{o.supplierName} · {fmtStats(o.resource.partKind, o.resource.variant, o.resource.stats)} · {o.resource.massT} t</p>
      </div>
      <div class="pr-ctx-body">
        <dl class="pr-facts">
          <dt>Quantity</dt><dd>{o.quantity} · {free} unallocated</dd>
          <dt>Signed</dt><dd>{fmtDate(k.signedAt)}</dd>
          <dt>{k.status === 'delivered' ? 'Delivered' : k.status === 'cancelled' ? 'Was due' : 'Expected'}</dt>
          <dd class={k.status === 'active' && k.expectedAt > launch ? 'warn' : ''}>{fmtDate(k.deliveredAt ?? k.expectedAt)}{k.status === 'active' && k.expectedAt > launch ? ' — after launch' : ''}</dd>
          <dt>Value</dt><dd>{fmtM(o.priceM)}{k.status === 'cancelled' ? ` · refunded ${fmtM(k.refundM ?? 0)}` : ''}</dd>
          <dt>Reliability</dt><dd>{fmtPct(o.reliability)}</dd>
          <dt>Source</dt><dd>{o.source === 'catalogue' ? 'Catalogue' : o.source === 'call' ? 'Call (tender)' : 'Comms partner offer'}</dd>
        </dl>
        <h3>Allocations</h3>
        {allocs.map((a) => {
          const t = v.market.tasks.find((x) => x.id === a.taskId);
          const c = t?.criteria.find((x) => x.id === a.criterionId);
          const fails = c ? fitFailures(o.resource, c) : [];
          return (
            <div key={a.id} class="pr-alloc">
              <div>
                <strong>{t ? `${taskCode(t)} ${t.title}` : a.taskId}</strong> ×{a.quantity}
                <div class="muted small">{a.status === 'reserved' ? 'Reserved (promised)' : a.status === 'available' ? 'Available (delivered)' : 'Released'}{t && t.status !== 'open' ? ` · Task ${t.status}` : ''}</div>
                {fails.length && a.status !== 'released' ? <div class="bad small">Revised need: {fails.join(' · ')}</div> : null}
              </div>
              {a.status !== 'released' ? <button type="button" class="pr-btn small" onClick={() => procurementActions.release(a.id)}>Release</button> : null}
            </div>
          );
        })}
        {!allocs.length ? <p class="muted">Unallocated — spare supply.</p> : null}
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
          <p class="pr-note center muted">Supplier keeps {fmtM(o.priceM - refund)} if cancelled today.</p>
        </div>
      ) : null}
    </>
  );
}
