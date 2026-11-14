// Calls for Offers (tenders) and partner offers from comms.
import { useState } from 'preact/hooks';
import type { Call, Criterion, Destination } from '../../../core/model';
import { RESOURCE_BY_ID } from '../data/catalogue';
import { procurementActions } from '../logic';
import {
  assessOffer, criterionCoverage, fmtDate, fmtM, fmtPct, fmtStats, openTasks, previewCall, quoteOrder, rankAssessments, sameKind, taskCode,
  type PView,
} from '../rules';
import { blockReason } from './Inspector';
import { criterionSummary } from './Needs';
import { parseTarget, setUi, targetKey, useP, useUi } from './uiState';

function callLabel(k: Call): string {
  if (k.status === 'open') return 'Awaiting Offers';
  if (k.status === 'withdrawn') return 'Withdrawn';
  return `${k.offerIds.length} Offers received`;
}

function CallOffers({ v, call }: { v: PView; call: Call }) {
  const task = v.market.tasks.find((t) => t.id === call.taskId);
  const crit = task?.criteria.find((c) => c.id === call.criterionId);
  const offers = call.offerIds.map((id) => v.market.offers.find((o) => o.id === id)).filter((o) => !!o);
  if (!offers.length) return null;
  const assessed = offers.map((o) => assessOffer(v, o!, task?.status === 'open' ? task : undefined, crit)).sort(rankAssessments);
  return (
    <table class="pr-table compact">
      <thead><tr><th>Supplier</th><th>Built to</th><th>Price</th><th>Arrival</th><th>Rel.</th><th /></tr></thead>
      <tbody>
        {assessed.map((a) => {
          const block = a.offer.status === 'accepted' ? 'Signed' : a.unavailable;
          return (
            <tr key={a.offer.id}>
              <td><strong>{a.offer.supplierName}</strong><div class="muted small">{a.offer.resource.name}</div></td>
              <td class="small">
                {fmtStats(a.offer.resource.partKind, a.offer.resource.variant, a.offer.resource.stats)}
                {a.failures.length ? <div class="bad">{a.failures.join(' · ')}</div> : null}
              </td>
              <td class="num">{fmtM(a.totalPriceM)}</td>
              <td class={`num ${a.late ? 'warn' : ''}`}>{fmtDate(a.expectedAt)}</td>
              <td class="num">{fmtPct(a.offer.reliability)}</td>
              <td>
                {a.offer.status === 'accepted' ? <span class="pr-chip good">Signed</span> : (
                  <button type="button" class="pr-btn small" disabled={!!block} title={block || 'Review and sign'}
                    onClick={() => { const draft = { offerId: a.offer.id, quantity: Math.min(a.quantity, a.offer.remainingQuantity ?? a.offer.quantity), destination: call.destination ?? (task && crit ? { kind: 'task' as const, taskId: task.id, criterionId: crit.id } : { kind: 'shared' as const }), delivery: 'standard' as const, neededAt: call.neededAt ?? task?.neededAt }; setUi({ dialog: { type: 'order', draft, token: quoteOrder(v, draft).token } }); }}>
                    {block && a.offer.status !== 'available' ? (a.unavailable || block) : 'Review & sign'}
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function CallsView() {
  const v = useP();
  const u = useUi((x) => x);
  const [quantity, setQuantity] = useState(u.callSnapshot?.criterion.quantity ?? 1);
  const [department, setDepartment] = useState(u.callSnapshot?.destination.kind === 'department' ? u.callSnapshot.destination.department : u.callSnapshot?.destination.kind === 'shared' ? 'shared' : 'science');
  const [neededDay, setNeededDay] = useState(u.callSnapshot?.neededAt?.toString() ?? '');
  const tasks = openTasks(v);
  const targets = tasks.flatMap((t) => t.criteria.map((c) => ({ t, c, cov: criterionCoverage(v, t, c) })));
  const chosen = parseTarget(u.callTarget) ?? (targets.find((x) => x.cov.missing > 0) ? { taskId: targets.find((x) => x.cov.missing > 0)!.t.id, criterionId: targets.find((x) => x.cov.missing > 0)!.c.id } : null);
  const ch = chosen ? targets.find((x) => x.t.id === chosen.taskId && x.c.id === chosen.criterionId) : undefined;
  const resource = u.callResourceId ? RESOURCE_BY_ID[u.callResourceId] : undefined;
  const criterion: Criterion | undefined = resource ? { id: resource.id, label: resource.name, partKind: resource.partKind, variant: resource.variant, minimums: resource.stats, quantity } : u.callSnapshot?.criterion ?? ch?.c;
  const standalone = !!resource || !!u.callSnapshot;
  const destination: Destination = u.callSnapshot?.destination.kind === 'task' ? u.callSnapshot.destination : standalone ? department === 'shared' ? { kind: 'shared' } : { kind: 'department', department: department as 'science' | 'planner' | 'procurement' | 'comms' } : ch ? { kind: 'task', taskId: ch.t.id, criterionId: ch.c.id } : { kind: 'shared' };
  const neededAt = standalone ? (neededDay === '' ? undefined : Number(neededDay)) : ch?.t.neededAt;
  const calls = [...v.market.calls].reverse();
  const comms = v.market.offers.filter((o) => o.source === 'comms');
  return (
    <main class="pr-panel pr-overlay" aria-label="Calls">
      <div class="pr-overlay-head">
        <h2>Calls for Offers</h2>
      </div>
      <div class="pr-overlay-body">
        <div class="pr-new-call">
          {criterion ? <>
          <label class="pr-field"><span>For</span><select value={resource ? `resource:${resource.id}` : u.callSnapshot ? 'snapshot' : ch ? targetKey(ch.t.id, ch.c.id) : ''} onChange={e => { const value = (e.target as HTMLSelectElement).value; setUi({ callTarget: value, callResourceId: null, callSnapshot: null }); }}>
            {resource ? <option value={`resource:${resource.id}`}>Resource · {resource.name}</option> : null}{u.callSnapshot ? <option value="snapshot">Replacement · {u.callSnapshot.criterion.label}</option> : null}{!targets.length && !resource ? <option value="">Select a Resource in the catalogue</option> : null}
            {targets.map(({ t, c }) => <option key={t.id + c.id} value={targetKey(t.id, c.id)}>{taskCode(t)} · {t.title} · {criterionSummary(c)}</option>)}
          </select></label>
          {standalone && u.callSnapshot?.destination.kind !== 'task' ? <div class="pr-call-fields"><label class="pr-field"><span>Destination</span><select value={department} onChange={e => setDepartment((e.target as HTMLSelectElement).value)}><option value="science">Science</option><option value="planner">Planner</option><option value="comms">Comms</option><option value="procurement">Procurement</option><option value="shared">Shared supply</option></select></label><label class="pr-field"><span>Needed by (day)</span><input type="number" min="0" value={neededDay} onInput={e => setNeededDay((e.target as HTMLInputElement).value)} /></label></div> : null}
          <label class="pr-field"><span>Quantity</span><input type="number" min="1" step="1" value={quantity} onInput={e => setQuantity(Number((e.target as HTMLInputElement).value))} /></label>
          <p class="small muted">Estimates assume signing at closing.</p>
          {criterion ? <div class="pr-call-windows">{([7, 14, 30] as const).map(window => { const responses = previewCall(v, criterion, quantity, window); return <button type="button" key={window} class={`pr-schedule${u.callWindow === window ? ' selected' : ''}`} aria-pressed={u.callWindow === window} onClick={() => setUi({ callWindow: window })}>
            <strong>{window} days · closes {fmtDate(v.clock.day + window)}</strong><span>{responses.length} {responses.length === 1 ? 'supplier' : 'suppliers'}</span>
            {responses.length ? responses.map(r => <span key={r.supplierId}>{r.supplierName} · est. {fmtM(r.priceM)} · {fmtDate(r.expectedAt)}{neededAt !== undefined && r.expectedAt > neededAt ? ' · late' : ''}</span>) : null}
          </button>; })}</div> : null}
          <button type="button" class="pr-btn primary" disabled={!criterion || !Number.isInteger(quantity) || quantity < 1 || (!standalone && !!ch?.cov.openCall) || (!!criterion && !previewCall(v, criterion, quantity, u.callWindow).length)} onClick={() => { if (criterion) { procurementActions.openRequestCall(criterion, quantity, destination, neededAt ?? v.planner.plan.launchDay, u.callWindow, destination.kind === 'task' ? destination.taskId : undefined, destination.kind === 'task' ? destination.criterionId : undefined); setUi({ status: 'Call submitted.' }); } }}>Open Call · closes {fmtDate(v.clock.day + u.callWindow)}</button>
          </> : <button type="button" class="pr-btn" onClick={() => setUi({ view: 'catalogue' })}>Browse catalogue</button>}
        </div>
        {calls.map((k) => {
          const t = v.market.tasks.find((x) => x.id === k.taskId);
          const c = t?.criteria.find((x) => x.id === k.criterionId);
          return (
            <article key={k.id} class={`pr-call-card${u.callId === k.id ? ' active' : ''}`}>
              <span class="pr-eyebrow">{k.id} · {callLabel(k)}</span>
              <h3><button type="button" class="pr-text-btn" aria-pressed={u.callId === k.id} onClick={() => setUi({ callId: k.id })}>{t ? `${taskCode(t)} · ${t.title}` : k.requirement?.label ?? 'Resource Call'}</button></h3>
              <div class="pr-call-facts">
                <span>Requested: {k.requirement ? criterionSummary(k.requirement) : c ? criterionSummary(c) : ''}</span>{t && k.taskRevision && t.revision !== k.taskRevision ? <span class="warn">Task revised since Call · review current need</span> : null}
                <span>Opened {fmtDate(k.openedAt)}</span>
                <span>{k.status === 'open' ? 'Answers' : 'Closed'} {fmtDate(k.closesAt)}</span>
                {t && t.status !== 'open' ? <span class="warn">Task {t.status}</span> : null}
              </div>
              <CallOffers v={v} call={k} />
              {k.status === 'open' ? (
                <div class="pr-row"><button type="button" class="pr-text-btn" onClick={(e) => { e.stopPropagation(); procurementActions.closeCall(k.id); }}>Withdraw Call</button></div>
              ) : null}
            </article>
          );
        })}
        {!calls.length ? <div class="pr-empty"><p>No Calls yet.</p></div> : null}
        {comms.length ? (
          <>
            <h3 class="pr-sub">Partner offers from comms</h3>
            {comms.map((o) => {
              const match = tasks.flatMap((t) => t.criteria.filter((c) => sameKind(o.resource, c)).map((c) => ({ t, c })))[0];
              const a = assessOffer(v, o, match?.t, match?.c);
              const block = o.status === 'available' ? blockReason(v, a, match?.t, match?.c) : o.status;
              return (
                <article key={o.id} class="pr-call-card">
                  <span class="pr-eyebrow">Comms · {o.status}</span>
                  <h3>{o.resource.name} — {o.supplierName}</h3>
                  <div class="pr-call-facts">
                    <span>{fmtStats(o.resource.partKind, o.resource.variant, o.resource.stats)}</span>
                    <span>{fmtM(a.totalPriceM)}</span>
                    <span class={a.late ? 'warn' : ''}>Arrives {fmtDate(a.expectedAt)}</span>
                    <span>{fmtPct(o.reliability)}</span>
                    {match ? <span class={a.failures.length ? 'bad' : 'good'}>{a.failures.length ? a.failures.join(' · ') : `Fits ${taskCode(match.t)}`}</span> : <span class="muted">No matching need</span>}
                  </div>
                  {o.status === 'available' ? (
                    <div class="pr-row">
                      <button type="button" class="pr-btn small" disabled={!!block} title={block}
                        onClick={() => setUi({ dialog: { type: 'sign', offerId: o.id, taskId: match?.t.id, criterionId: match?.c.id, qty: o.quantity } })}>Review & sign</button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </>
        ) : null}
      </div>
    </main>
  );
}

export function CallInspector() {
  const v = useP();
  const sel = useUi((u) => u.callId);
  const k = v.market.calls.find((x) => x.id === sel) ?? v.market.calls[v.market.calls.length - 1];
  if (!k) {
    return (
      <div class="pr-ctx-head">
        <span class="pr-eyebrow">Calls</span>
        <h2>New Call</h2>
        <p>Choose a response deadline.</p>
      </div>
    );
  }
  const t = v.market.tasks.find((x) => x.id === k.taskId);
  const c = t?.criteria.find((x) => x.id === k.criterionId);
  const cov = t && c ? criterionCoverage(v, t, c) : undefined;
  return (
    <>
      <div class="pr-ctx-head">
        <span class="pr-eyebrow">{k.id} · {callLabel(k)}</span>
        <h2>{t?.title ?? k.requirement?.label ?? 'Resource Call'}</h2>
        <p>{c ? `${c.label} · ${criterionSummary(c)}` : ''}{t ? ` · needed ${fmtDate(t.neededAt)}` : ''}</p>
      </div>
      <div class="pr-ctx-body">
        <dl class="pr-facts">
          <dt>Opened</dt><dd>{fmtDate(k.openedAt)}</dd>
          <dt>{k.status === 'open' ? 'Answers' : 'Closed'}</dt><dd>{fmtDate(k.closesAt)}</dd>
          <dt>Offers</dt><dd>{k.offerIds.length}</dd>
          {cov ? <><dt>Need status</dt><dd>{cov.missing ? `${cov.missing} not covered` : 'Covered'}</dd></> : null}
        </dl>
        {k.status === 'closed' ? <p class="muted small">Offers expire {fmtDate(k.closesAt + 90)}</p> : null}
      </div>
      {k.status === 'open' ? (
        <div class="pr-actions">
          <button type="button" class="pr-btn wide" onClick={() => procurementActions.closeCall(k.id)}>Withdraw Call</button>
        </div>
      ) : null}
    </>
  );
}
