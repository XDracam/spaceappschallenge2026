// Calls for Offers (tenders) and partner offers from comms.
import type { Call } from '../../../core/model';
import { CALL_DURATION_DAYS } from '../data/calls';
import { procurementActions } from '../logic';
import {
  assessOffer, beyondKeys, criterionCoverage, fmtDate, fmtM, fmtPct, fmtStats, openTasks, rankAssessments, sameKind, taskCode,
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
          const block = a.offer.status === 'accepted' ? 'Signed' : blockReason(v, a, task?.status === 'open' ? task : undefined, crit);
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
                    onClick={() => setUi({ dialog: { type: 'sign', offerId: a.offer.id, taskId: task?.status === 'open' ? task.id : undefined, criterionId: crit?.id, qty: a.quantity } })}>
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
  const tasks = openTasks(v);
  const targets = tasks.flatMap((t) => t.criteria.map((c) => ({ t, c, cov: criterionCoverage(v, t, c) })));
  const chosen = parseTarget(u.callTarget) ?? (targets.find((x) => x.cov.missing > 0) ? { taskId: targets.find((x) => x.cov.missing > 0)!.t.id, criterionId: targets.find((x) => x.cov.missing > 0)!.c.id } : null);
  const ch = chosen ? targets.find((x) => x.t.id === chosen.taskId && x.c.id === chosen.criterionId) : undefined;
  const calls = [...v.market.calls].reverse();
  const comms = v.market.offers.filter((o) => o.source === 'comms');
  return (
    <main class="pr-panel pr-overlay" aria-label="Calls">
      <div class="pr-overlay-head">
        <h2>Calls for Offers</h2>
        <span class="muted small">Invite tenders built to a need's minimums — the route for parts beyond current research.</span>
      </div>
      <div class="pr-overlay-body">
        <div class="pr-new-call">
          <label class="pr-field">
            <span>Need</span>
            <select value={ch ? targetKey(ch.t.id, ch.c.id) : ''} onChange={(e) => setUi({ callTarget: (e.target as HTMLSelectElement).value })}>
              {!targets.length ? <option value="">No open needs</option> : null}
              {targets.map(({ t, c, cov }) => (
                <option key={t.id + c.id} value={targetKey(t.id, c.id)}>{taskCode(t)} · {t.title} · {criterionSummary(c)}{cov.missing === 0 ? ' (covered)' : ''}</option>
              ))}
            </select>
          </label>
          {ch ? (
            <p class="small muted">
              {beyondKeys(ch.c.partKind, ch.c.variant, ch.c.minimums, v.research).length
                ? 'Beyond current research: expect experimental builds at 1.5–3× the estimate with lower reliability.'
                : 'Within research: custom builds near catalogue prices, sometimes with margin.'}
              {' '}Answers {fmtDate(v.clock.day + CALL_DURATION_DAYS)}.
            </p>
          ) : null}
          <button type="button" class="pr-btn primary" disabled={!ch || !!ch.cov.openCall}
            onClick={() => { if (ch) { procurementActions.openCall(ch.t.id, ch.c.id); setUi({ status: `Call opened for ${taskCode(ch.t)}.` }); } }}>
            {ch?.cov.openCall ? 'A Call is already open for this need' : 'Open Call · answers in ~1 month'}
          </button>
        </div>
        {calls.map((k) => {
          const t = v.market.tasks.find((x) => x.id === k.taskId);
          const c = t?.criteria.find((x) => x.id === k.criterionId);
          return (
            <article key={k.id} class={`pr-call-card${u.callId === k.id ? ' active' : ''}`} onClick={() => setUi({ callId: k.id })}>
              <span class="pr-eyebrow">{k.id} · {callLabel(k)}</span>
              <h3>{t ? `${taskCode(t)} · ${t.title}` : k.taskId}</h3>
              <div class="pr-call-facts">
                <span>{c ? criterionSummary(c) : ''}</span>
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
        <h2>Tenders</h2>
        <p>Open a Call for a need when the catalogue has no fitting, affordable or timely Offer — or when the need is beyond current research. Suppliers answer after about a month; their Offers stay valid for three months.</p>
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
        <h2>{t?.title ?? k.taskId}</h2>
        <p>{c ? `${c.label} · ${criterionSummary(c)}` : ''}{t ? ` · needed ${fmtDate(t.neededAt)}` : ''}</p>
      </div>
      <div class="pr-ctx-body">
        <dl class="pr-facts">
          <dt>Opened</dt><dd>{fmtDate(k.openedAt)}</dd>
          <dt>{k.status === 'open' ? 'Answers' : 'Closed'}</dt><dd>{fmtDate(k.closesAt)}</dd>
          <dt>Offers</dt><dd>{k.offerIds.length}</dd>
          {cov ? <><dt>Need status</dt><dd>{cov.missing ? `${cov.missing} not covered` : 'Covered'}</dd></> : null}
        </dl>
        <p class="muted small">Call Offers are single-use and expire 90 days after the Call closes. Prices already include the comms price modifiers at closing.</p>
      </div>
      {k.status === 'open' ? (
        <div class="pr-actions">
          <button type="button" class="pr-btn wide" onClick={() => procurementActions.closeCall(k.id)}>Withdraw Call</button>
        </div>
      ) : null}
    </>
  );
}
