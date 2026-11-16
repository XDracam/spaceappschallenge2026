// Contracts: every contract on its way or delivered, arrival against the need, and what can still be done about one.
import { useRef, useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import { contractReliability, type Contract } from '../../../core/model';
import { procurementActions } from '../logic';
import {
  criterionCoverage, deliveryOptions, fitFailures, fmtDate, fmtM, fmtPct, fmtStats, openTasks, refundM, sameKind, taskCode, quoteAmendment,
  type PView,
} from '../rules';
import { testDurationText } from '../../science/model/tests';
import { categoryOf, setUi, useP, useUi } from './uiState';
import { ContractTimeline, marginText } from './ContractTimeline';
import { contractTiming } from '../timing';
import { Needs } from './Needs';
import { testable } from './Inspector';

function allocationsOf(v: PView, k: Contract) {
  return v.market.allocations.filter((a) => a.contractId === k.id);
}
function freeQty(v: PView, k: Contract): number {
  if (k.status === 'cancelled' || k.status === 'failed') return 0;
  return k.offerSnapshot.quantity - allocationsOf(v, k).filter((a) => a.status !== 'released').reduce((n, a) => n + a.quantity, 0);
}
function statusLabel(k: Contract): string {
  return k.status === 'delivered' ? 'Delivered' : k.status === 'cancelled' ? 'Cancelled' : k.status === 'failed' ? 'Failed' : 'On its way';
}

export function ContractsView() {
  const v = useP();
  const [needsOpen, setNeedsOpen] = useState(false);
  const needsDisclosure = useRef<HTMLDetailsElement>(null);
  const live = v.market.contracts.filter((k) => k.status === 'active' || k.status === 'delivered');
  const active = live.filter((k) => k.status === 'active');
  const lateCount = active.filter(k => contractTiming({ market: v.market, research: { projects: v.research.projects ?? [] } }, k).needs.some(n => n.margin !== undefined && n.margin < 0)).length;
  const needCoverage = openTasks(v).flatMap(t => t.criteria.map(c => criterionCoverage(v, t, c)));
  const uncovered = needCoverage.filter(c => c.missing > 0).length;
  const issues = needCoverage.filter(c => c.late || c.mismatch.length > 0).length;
  const closeNeeds = () => {
    setNeedsOpen(false);
    needsDisclosure.current?.querySelector('summary')?.focus();
  };
  return (
    <main class="pr-panel pr-overlay" aria-label="Contracts">
      <div class="pr-overlay-head">
        <h2>Contracts & deliveries</h2>
        <div class="pr-contract-head-actions">
          <span class="muted small">{active.length} on their way{lateCount ? ` · ${lateCount} late` : ''} · {live.length - active.length} delivered · {fmtM(v.budget.committedM)} committed</span>
          <details ref={needsDisclosure} class="pr-contract-needs" open={needsOpen} onToggle={e => setNeedsOpen(e.currentTarget.open)} onKeyDown={e => {
            if (e.key === 'Escape' && needsOpen) { e.preventDefault(); e.stopPropagation(); closeNeeds(); }
          }}>
            <summary class={`pr-btn${uncovered || issues ? ' warn' : ''}`}>Mission needs{uncovered ? ` · ${uncovered} uncovered` : issues ? ` · ${issues} to review` : ''}</summary>
            {needsOpen ? <div class="pr-contract-needs-content"><Needs onClose={closeNeeds} /></div> : null}
          </details>
        </div>
      </div>
      <div class="pr-contract-panel" id="pr-contract-panel">
        <ContractTimeline />
      </div>
    </main>
  );
}

export function ContractInspector() {
  const projects = useGame(g => g.research.projects);
  const v = useP();
  const sel = useUi((u) => u.contractId);
  const preview = useUi(u => u.amendmentPreview);
  const k = v.market.contracts.find((x) => x.id === sel);
  if (!k) {
    return (
      <div class="pr-ctx-head"><span class="pr-eyebrow">Contracts</span><h2>Select a contract</h2><p>Its reliability, what it is for, and how to speed it up or replace it.</p></div>
    );
  }
  const o = k.offerSnapshot;
  const allocs = allocationsOf(v, k).filter(a => a.status !== 'released');
  const free = freeQty(v, k);
  const targets = openTasks(v).flatMap((t) => t.criteria.filter((c) => sameKind(o.resource, c)).map((c) => ({ t, c })))
    .filter(({ t, c }) => criterionCoverage(v, t, c).missing > 0);
  const refund = refundM(k, v.clock.day);
  const timing = contractTiming({ market: v.market, research: { projects } }, k);
  const taskAlloc = allocs.find(a => a.taskId && v.market.tasks.some(t => t.id === a.taskId && t.status === 'open'));
  const task = taskAlloc ? v.market.tasks.find(t => t.id === taskAlloc.taskId) : undefined;
  const need = task?.criteria.find(c => c.id === taskAlloc!.criterionId);
  // The one change a contract still allows: priority delivery, for a late part or to make time for a Science test.
  const canPriority = k.status === 'active' && k.delivery !== 'priority' && deliveryOptions(o).some(x => x.id === 'priority');
  const speed = canPriority ? quoteAmendment(v, k.id, 'priority') : undefined;
  const speedUseful = !!speed && !speed.unavailable && speed.expectedAt < k.expectedAt;
  const late = !!task && k.status === 'active' && k.expectedAt > task.neededAt;
  const arrival = k.deliveredAt ?? k.expectedAt;
  return (
    <>
      <div class="pr-ctx-head">
        <button type="button" class="pr-btn small pr-close-details" onClick={() => setUi({ contractId: null, amendmentPreview: null })}>Close details</button>
        <span class="pr-eyebrow">{statusLabel(k)}{task ? ` · ${taskCode(task)} ${task.title}` : ''}</span>
        <h2>{o.resource.name}</h2>
        <p>{o.supplierName} · {fmtStats(o.resource.partKind, o.resource.variant, o.resource.stats)} · {o.resource.massT} t</p>
      </div>
      <div class="pr-ctx-body">
        <dl class="pr-facts">
          {o.quantity > 1 ? <><dt>Quantity</dt><dd>{o.quantity}{free ? ` · ${free} unallocated` : ''}</dd></> : null}
          <dt>{k.status === 'delivered' ? 'Delivered' : k.status === 'cancelled' ? 'Was due' : 'Arrives'}</dt>
          <dd>{fmtDate(arrival)}{timing.needs[0]?.neededAt !== undefined && k.status !== 'cancelled' ? ` · ${marginText(timing.needs[0].margin)}` : ''}</dd>
          <dt>Reliability</dt><dd>{fmtPct(contractReliability(k))}{k.tested ? ` · tested by Science (was ${fmtPct(o.reliability)})` : k.status === 'delivered' ? ' · Science can test it' : k.status === 'active' ? testable(v, k.expectedAt) ? ' · arrives in time for a Science test' : ` · too late for a ${testDurationText()} Science test` : ''}</dd>
          <dt>Price</dt><dd>{fmtM(o.priceM)}{k.status === 'cancelled' ? ` · ${fmtM(k.refundM ?? 0)} came back` : ''}{(k.amendments ?? []).length ? ` · fees ${fmtM((k.amendments ?? []).reduce((n, a) => n + a.feeM, 0))}` : ''}</dd>
          <dt>Signed</dt><dd>{fmtDate(k.signedAt)} · {o.source === 'catalogue' ? 'catalogue' : o.source === 'call' ? 'Call offer' : 'partner offer from Comms'}</dd>
        </dl>
        {allocs.filter(a => !a.taskId || a.taskId !== taskAlloc?.taskId).map((a) => {
          const t = v.market.tasks.find((x) => x.id === a.taskId);
          const c = t?.criteria.find((x) => x.id === a.criterionId);
          const fails = c ? fitFailures(o.resource, c) : [];
          return <p key={a.id} class="small muted">Also for {a.department ? `${a.department} (${a.projectId ? projects.find(p => p.id === a.projectId)?.title ?? 'research' : 'supply'})` : t ? `${taskCode(t)} ${t.title}` : a.taskId} ×{a.quantity}{fails.length ? <span class="bad"> · revised need: {fails.join(' · ')}</span> : null}</p>;
        })}
        {speedUseful && speed ? (
          <>
            <h3>Speed up</h3>
            <button type="button" class="pr-ctx-option" aria-pressed={preview?.contractId === k.id} onClick={() => setUi({ amendmentPreview: { contractId: k.id, delivery: 'priority' }, dialog: { type: 'amend', contractId: k.id, delivery: 'priority', token: speed.token } })}>
              <strong>Priority · arrives {fmtDate(speed.expectedAt)} · fee {fmtM(speed.feeM)}</strong>
              <span>{task && speed.expectedAt > task.neededAt ? `still ${Math.round(speed.expectedAt - task.neededAt)} d late` : late ? 'on time again' : !testable(v, k.expectedAt) && testable(v, speed.expectedAt) ? 'arrives in time for a Science test' : `${Math.round(k.expectedAt - speed.expectedAt)} d earlier`}</span>
            </button>
          </>
        ) : null}
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
          {task && need ? <button type="button" class="pr-btn wide" onClick={() => setUi({ view: 'catalogue', focus: { taskId: task.id, criterionId: need.id }, inspect: 'need', category: categoryOf(need.partKind), contractId: null })}>
            Switch to another offer
          </button> : null}
          <button type="button" class="pr-text-btn" onClick={() => setUi({ dialog: { type: 'cancel', contractId: k.id } })}>
            Cancel contract · {fmtM(refund)} comes back
          </button>
        </div>
      ) : null}
    </>
  );
}
