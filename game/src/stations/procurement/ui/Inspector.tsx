// Right column: the active decision — a selected Resource with its Offers and the
// fit check against a need, or the focused need with ranked suggestions.
import type { Criterion, Offer, Task, Destination } from '../../../core/model';
import { RESOURCE_BY_ID, offersForResource } from '../data/catalogue';
import { SUPPLIER_BY_ID } from '../data/suppliers';
import {
  assessOffer, beyondKeys, budgetAvailableM, criterionCoverage, describeBeyond, fitFailures, fmtDate, fmtM, fmtPct, fmtStatValue,
  offersForCriterion, openTasks, partLabel, rankAssessments, sameKind, statInfo, suggestion, taskCode, quoteOrder,
  type OfferAssessment, type PView,
} from '../rules';
import { statDefs } from '../../planner/data/parts';
import { researchEta } from '../../science/model/tree';
import { testCounts, testDays } from '../../science/model/tests';
import { Art } from './Art';
import { focusedNeed, summarize, toggleCompare } from './Catalogue';
import { coverageText, criterionSummary } from './Needs';
import { parseTarget, setUi, targetKey, useP, useUi } from './uiState';
import { ContractInspector } from './ContractsView';
import { CallInspector } from './CallsView';

export function OfferRow({ a, selected, suggested, onClick, showName }: {
  a: OfferAssessment; selected?: boolean; suggested?: boolean; onClick: () => void; showName?: boolean;
}) {
  const v = useP();
  const sup = SUPPLIER_BY_ID[a.offer.supplierId];
  const tone = a.unavailable || !a.fits ? 'bad' : a.late || !a.affordable ? 'warn' : 'good';
  // Arrives early enough for Science to test the part before launch (a test halves its risk of failure).
  const testable = !a.unavailable && testCounts(a.expectedAt + testDays(), v.planner.plan.launchDay);
  return (
    <button type="button" class={`pr-offer ${tone}`} aria-pressed={!!selected} onClick={onClick}>
      <span class="pr-offer-head">
        <strong>{showName ? a.offer.resource.name : a.offer.supplierName}</strong>
        <span class="pr-offer-price num">{fmtM(a.totalPriceM)}</span>
      </span>
      <span class="pr-offer-meta">
        {showName ? a.offer.supplierName : sup?.trait ?? ''}
        {a.offer.source !== 'catalogue' ? <span class="pr-chip">{a.offer.source === 'call' ? 'Call' : 'Comms'}</span> : null}
        {suggested ? <span class="pr-chip good">Suggested</span> : null}
      </span>
      <span class="pr-offer-facts">
        <span class={a.late ? 'warn' : ''}>Arrives {fmtDate(a.expectedAt)}</span>
        <span>{fmtPct(a.offer.reliability)} reliable</span>
        {testable ? <span class="good" title="Arrives early enough for Science to test it before launch. A test halves its risk of failure.">time to test</span> : null}
        {a.quantity > 1 ? <span>{a.quantity} × {fmtM(a.unitPriceM)}</span> : null}
      </span>
      {a.unavailable ? <span class="pr-offer-why bad">{a.unavailable}</span>
        : a.failures.length ? <span class="pr-offer-why bad">{a.failures.join(' · ')}</span>
        : !a.affordable ? <span class="pr-offer-why warn">Over available budget</span> : null}
    </button>
  );
}

function StatTable({ res, crit }: { res: Offer['resource']; crit?: Criterion }) {
  const fit = crit && sameKind(res, crit);
  return (
    <table class="pr-stats">
      <tbody>
        {statDefs(res.partKind, res.variant).map((d) => {
          const val = res.stats[d.key] ?? 0;
          const min = fit ? crit!.minimums[d.key] : undefined;
          const ok = min === undefined || val >= min - 1e-9;
          return (
            <tr key={d.key}>
              <th>{statInfo(res.partKind, res.variant, d.key).label}</th>
              <td class="num">{fmtStatValue(res.partKind, res.variant, d.key, val)}</td>
              <td class={`num ${min === undefined ? 'muted' : ok ? 'good' : 'bad'}`}>
                {min === undefined ? '' : `${ok ? '✓' : '✗'} ≥ ${fmtStatValue(res.partKind, res.variant, d.key, min)}`}
              </td>
            </tr>
          );
        })}
        <tr><th>Mass</th><td class="num">{res.massT} t</td><td /></tr>
      </tbody>
    </table>
  );
}

function openSign(a: OfferAssessment, task?: Task, crit?: Criterion) {
  setUi({ dialog: { type: 'sign', offerId: a.offer.id, taskId: task?.id, criterionId: crit?.id, qty: a.quantity } });
}

/** Why the Sign button is disabled ('' = can sign). */
export function blockReason(v: PView, a: OfferAssessment, task?: Task, crit?: Criterion): string {
  if (a.unavailable) return a.unavailable;
  if (!a.affordable) return `Exceeds available budget by ${fmtM(a.totalPriceM - budgetAvailableM(v.budget))}. Choose a cheaper Offer or discuss funding.`;
  if (task && crit && criterionCoverage(v, task, crit).missing === 0) return 'Already covered. Choose “Unallocated” to buy a spare, or cancel the existing Contract first.';
  return '';
}

function ResourceInspector() {
  const v = useP();
  const u = useUi((x) => x);
  const r = RESOURCE_BY_ID[u.resourceId ?? ''] ?? RESOURCE_BY_ID['e-ker-2000'];
  const sum = summarize(v, r);
  const tasks = openTasks(v);
  const candidates = tasks.flatMap((t) => t.criteria.filter((c) => sameKind(r, c)).map((c) => ({ t, c })));
  // Allocation target: explicit choice, else the focused need, else the first uncovered fitting need.
  const { task: fTask, crit: fCrit } = focusedNeed(v, u.focus);
  let target = u.target === 'none' || u.target.startsWith('department:') ? null : parseTarget(u.target);
  if (target && !candidates.some((x) => x.t.id === target!.taskId && x.c.id === target!.criterionId)) target = null;
  if (!target && u.target !== 'none' && !u.target.startsWith('department:')) {
    const pick = (fTask && fCrit && sameKind(r, fCrit) ? { t: fTask, c: fCrit } : undefined)
      ?? candidates.find((x) => !fitFailures(r, x.c).length && criterionCoverage(v, x.t, x.c).missing > 0);
    if (pick) target = { taskId: pick.t.id, criterionId: pick.c.id };
  }
  const tc = target ? candidates.find((x) => x.t.id === target!.taskId && x.c.id === target!.criterionId) : undefined;
  const task = tc?.t;
  const crit = tc?.c;
  const cov = task && crit ? criterionCoverage(v, task, crit) : undefined;
  const qty = u.qty > 0 ? u.qty : Math.max(1, cov?.missing ?? 1);
  const assessed = offersForResource(r.id).map((o) => assessOffer(v, o, task, crit, qty)).sort(rankAssessments);
  const selected = assessed.find((a) => a.offer.id === u.offerId) ?? assessed[0];
  const suggested = suggestion(assessed);
  const destination: Destination = target ? { kind: 'task', ...target } : u.target.startsWith('department:') ? { kind: 'department', department: u.target.slice(11) as 'science' | 'planner' | 'comms' | 'procurement' } : { kind: 'shared' };
  const draft = { offerId: selected.offer.id, quantity: qty, destination, delivery: u.delivery, neededAt: u.neededAt ?? task?.neededAt };
  const quote = quoteOrder(v, draft);
  const block = quote.unavailable || (quote.totalM > budgetAvailableM(v.budget) ? 'Exceeds available budget.' : '');
  const available = budgetAvailableM(v.budget);

  return (
    <>
      <div class="pr-ctx-head">
        <span class="pr-eyebrow">{partLabel(r.partKind, r.variant)}</span>
        <h2>{r.name}</h2>
        <p>{r.blurb}</p>
      </div>
      <div class="pr-ctx-body">
        <div class="pr-insp-art"><Art kind={r.partKind} variant={r.variant} label={`${r.name} illustration`} /></div>
        <StatTable res={r} crit={crit} />
        {sum.locked.length ? (
          <div class="pr-callout warn">
            <strong>Beyond current research — tender only.</strong>
            <ul>{sum.locked.map((k) => <li key={k}>{describeBeyond(k, r.stats, v.research)}</li>)}</ul>
            Domestic suppliers can sell it once science raises the limit. Until then, open a Call for the need: tender Offers cost 1.5–3× and are less reliable.
            {task && crit ? (
              <div class="pr-row"><button type="button" class="pr-btn" disabled={!!cov?.openCall} onClick={() => setUi({ view: 'calls', callTarget: targetKey(task.id, crit.id), callResourceId: null, callSnapshot: null })}>
                {cov?.openCall ? `Call open — answers ${fmtDate(cov.openCall.closesAt)}` : `Open Call for ${taskCode(task)}`}
              </button></div>
            ) : null}
          </div>
        ) : null}
        <h3>Offers</h3>
        <div class="pr-offer-list">
          {assessed.map((a) => (
            <OfferRow key={a.offer.id} a={a} selected={a.offer.id === selected.offer.id} suggested={suggested?.offer.id === a.offer.id && assessed.length > 1}
              onClick={() => setUi({ offerId: a.offer.id })} />
          ))}
        </div>
        {selected ? (
          <p class="pr-terms">
            Cancellation starts at {Math.round(selected.offer.cancellationPct * 100)}% and rises to 100% by delivery.
          </p>
        ) : null}
      </div>
      <div class="pr-actions">
        <label class="pr-field">
          <span>For</span>
          <select value={target ? targetKey(target.taskId, target.criterionId) : u.target.startsWith('department:') ? u.target : 'none'} onChange={(e) => setUi({ target: (e.target as HTMLSelectElement).value, qty: 0 })}>
            <option value="none">Shared supply</option>
            <option value="department:science">Department · Science</option>
            <option value="department:planner">Department · Planner</option>
            <option value="department:comms">Department · Comms</option>
            <option value="department:procurement">Department · Procurement</option>
            {candidates.map(({ t, c }) => {
              const f = fitFailures(r, c);
              const cv = criterionCoverage(v, t, c);
              return (
                <option key={t.id + c.id} value={targetKey(t.id, c.id)}>
                  {taskCode(t)} · {t.title}{f.length ? ` — ✗ ${f[0]}` : cv.missing === 0 ? ' — covered' : ''}
                </option>
              );
            })}
          </select>
        </label>
        <label class="pr-field"><span>Needed by (day)</span>
          <input type="number" min="0" value={u.neededAt ?? task?.neededAt ?? ''} onInput={(e) => { const value = (e.target as HTMLInputElement).value; setUi({ neededAt: value === '' ? null : Number(value) }); }} />
        </label>
        <div class="pr-buy-row">
          <div class="pr-stepper" aria-label="Quantity">
            <button type="button" aria-label="Reduce quantity" disabled={qty <= 1} onClick={() => setUi({ qty: qty - 1 })}>−</button>
            <output>{qty}</output>
            <button type="button" aria-label="Increase quantity" disabled={qty >= 100} onClick={() => setUi({ qty: qty + 1 })}>+</button>
          </div><span class="muted small">units</span>
        </div>
        <div class="pr-schedules" aria-label="Delivery option">
          {(['priority', 'standard', 'flexible'] as const).map((delivery) => {
            const q = quoteOrder(v, { ...draft, delivery });
            const standard = quoteOrder(v, { ...draft, delivery: 'standard' });
            const diff = q.totalM - standard.totalM;
            return <button type="button" key={delivery} class={`pr-schedule${u.delivery === delivery ? ' selected' : ''}`} aria-pressed={u.delivery === delivery} disabled={!!q.unavailable} onClick={() => setUi({ delivery })}>
              <strong>{delivery[0].toUpperCase() + delivery.slice(1)}</strong><strong>{q.unavailable ? 'Unavailable' : fmtM(q.totalM)}</strong>
              <span>{q.unavailable ? '' : `Arrives ${fmtDate(q.expectedAt)}`}</span><span>{q.unavailable ? '' : delivery === 'standard' ? '' : standard.unavailable ? 'No Standard quote' : `${diff >= 0 ? '+' : '−'}${fmtM(Math.abs(diff))}`}</span>
              {!q.unavailable && draft.neededAt !== undefined ? <span class={q.late ? 'warn' : 'good'}>{Math.abs(q.expectedAt - draft.neededAt)} days {q.late ? 'late' : 'early'}</span> : null}
            </button>;
          })}
        </div>
        {quote.failures.length ? <p class="pr-note bad">{quote.failures.join(' · ')}</p> : null}
        <button type="button" class="pr-btn primary wide" disabled={!!block} onClick={() => setUi({ dialog: { type: 'order', draft, token: quote.token } })}>
          Review order · {fmtM(quote.totalM)}
        </button>
        <p class={`pr-note center ${block ? 'warn' : 'muted'}`}>{block || `${fmtM(available - quote.totalM)} remains for other needs`}</p>
        <button type="button" class="pr-text-btn" onClick={() => setUi({ view: 'calls', callResourceId: r.id, callSnapshot: null, callTarget: '' })}>Open Call</button>
        <div class="pr-row">
          <button type="button" class="pr-btn small" aria-pressed={u.compare.includes(r.id)} onClick={() => toggleCompare(r.id)}>{u.compare.includes(r.id) ? 'In comparison' : 'Add to compare'}</button>
          {task && crit ? <button type="button" class="pr-text-btn" onClick={() => setUi({ focus: { taskId: task.id, criterionId: crit.id }, inspect: 'need' })}>Need overview</button> : null}
        </div>
      </div>
    </>
  );
}

function NeedInspector() {
  const v = useP();
  const focus = useUi((u) => u.focus);
  const { task, crit } = focusedNeed(v, focus);
  if (!task || !crit) return <ResourceInspector />;
  const cov = criterionCoverage(v, task, crit);
  const st = coverageText(cov);
  const ranked = offersForCriterion(v, task, crit);
  const best = suggestion(ranked);
  const shown = ranked.filter((a) => !a.unavailable).slice(0, 7);
  const tenderOnly = ranked.filter((a) => a.unavailable && a.offer.source === 'catalogue' && !a.failures.length).length;
  const calls = v.market.calls.filter((k) => k.taskId === task.id && k.criterionId === crit.id);
  const pick = (a: OfferAssessment) => {
    if (a.offer.source === 'catalogue' && a.offer.resourceId) {
      setUi({ inspect: 'resource', resourceId: a.offer.resourceId, offerId: a.offer.id, target: targetKey(task.id, crit.id), qty: 0 });
    } else openSign(a, task, crit);
  };
  return (
    <>
      <div class="pr-ctx-head">
        <span class="pr-eyebrow">{taskCode(task)} · from {task.authorRole} · rev {task.revision}</span>
        <h2>{task.title}</h2>
        <p>{crit.label} · {criterionSummary(crit)} · needed {fmtDate(task.neededAt)}</p>
      </div>
      <div class="pr-ctx-body">
        <p class={`pr-cov ${st.tone}`}>{st.text}</p>
        {cov.mismatch.length ? <div class="pr-callout warn">The Task was revised after contracting. Contracted supply no longer meets: {cov.mismatch.join(' · ')}. Discuss with the planner, or cancel and replace.</div> : null}
        {cov.contracts.length ? (
          <>
            <h3>Contracted supply</h3>
            {cov.contracts.map((k) => (
              <button key={k.id} type="button" class="pr-ctx-option" onClick={() => setUi({ view: 'contracts', contractId: k.id })}>
                <strong>{k.offerSnapshot.resource.name}</strong>
                <span>{k.offerSnapshot.supplierName} · {k.status === 'delivered' ? `delivered ${fmtDate(k.deliveredAt ?? k.expectedAt)}` : `arrives ${fmtDate(k.expectedAt)}`} · {fmtM(k.offerSnapshot.priceM)}</span>
              </button>
            ))}
          </>
        ) : null}
        {cov.missing > 0 ? <BeyondResearch crit={crit} /> : null}
        <h3>Offers for this need</h3>
        <div class="pr-offer-list">
          {shown.map((a) => (
            <OfferRow key={a.offer.id} a={a} showName suggested={best?.offer.id === a.offer.id} onClick={() => pick(a)} />
          ))}
          {!shown.length ? <p class="muted">No signable Offer of this part type.{tenderOnly ? ` ${tenderOnly} catalogue Offers are beyond research.` : ''}</p> : null}
        </div>
        <h3>Calls</h3>
        {calls.map((k) => (
          <button key={k.id} type="button" class="pr-ctx-option" onClick={() => setUi({ view: 'calls', callId: k.id })}>
            <strong>{k.status === 'open' ? 'Awaiting Offers' : k.status === 'closed' ? `${k.offerIds.length} Offers received` : 'Withdrawn'}</strong>
            <span>Opened {fmtDate(k.openedAt)} · {k.status === 'open' ? 'answers' : 'closed'} {fmtDate(k.closesAt)}</span>
          </button>
        ))}
        {!calls.length ? <p class="muted small">A Call invites tenders built to these minimums. Answers arrive after about a month; beyond research they cost 1.5–3× and are less reliable.</p> : null}
      </div>
      <div class="pr-actions">
        {best ? (
          <button type="button" class="pr-btn primary wide" onClick={() => pick(best)}>
            Review suggestion · {best.offer.resource.name} · {fmtM(best.totalPriceM)}
          </button>
        ) : null}
        <button type="button" class="pr-btn wide" disabled={!!cov.openCall} onClick={() => setUi({ view: 'calls', callTarget: targetKey(task.id, crit.id), callResourceId: null, callSnapshot: null })}>
          {cov.openCall ? `Call open — answers ${fmtDate(cov.openCall.closesAt)}` : 'Open a Call for tenders'}
        </button>
        <p class="pr-note center muted">{fmtM(budgetAvailableM(v.budget))} available · suggestions rank fit, delivery, budget, lightest part, then reliability.</p>
      </div>
    </>
  );
}

/** A need beyond research: what Science has to research first, and how far Science is with it. */
function BeyondResearch({ crit }: { crit: Criterion }) {
  const v = useP();
  const keys = beyondKeys(crit.partKind, crit.variant, crit.minimums, v.research);
  if (!keys.length) return null;
  return (
    <div class="pr-callout warn">
      <p><strong>Beyond research.</strong> The catalogue sells it once Science has researched:</p>
      <ul>
        {keys.map((k) => {
          const stat = k.split('.')[2];
          const eta = researchEta(v.research.projects, k, stat ? crit.minimums[stat] : undefined);
          return <li key={k}>{describeBeyond(k, crit.minimums, v.research)} — {eta === undefined ? 'Science has not started it' : `Science is on it until ${fmtDate(eta)}`}</li>;
        })}
      </ul>
      <p>Or buy it now through a Call.</p>
    </div>
  );
}

export function Inspector() {
  const inspect = useUi((u) => u.inspect);
  const view = useUi((u) => u.view);
  return (
    <aside class="pr-panel pr-inspector" aria-label="Active decision">
      {view === 'contracts' ? <ContractInspector /> : view === 'calls' ? <CallInspector /> : inspect === 'need' ? <NeedInspector /> : <ResourceInspector />}
    </aside>
  );
}
