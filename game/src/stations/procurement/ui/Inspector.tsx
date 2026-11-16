import { formatCalendarDate } from '../../../shared/format';
// Right column: the active decision — a selected Resource with its Offers and the
// fit check against a need, or the focused need with ranked suggestions.
import type { Contract, Criterion, DeliveryOptionId, Offer, OrderDraft, Task } from '../../../core/model';
import { contractReliability } from '../../../core/model';
import { RESOURCE_BY_ID, offersForResource } from '../data/catalogue';
import { SUPPLIER_BY_ID } from '../data/suppliers';
import { procurementActions } from '../logic';
import {
  DAYS_PER_MONTH, assessOffer, beyondKeys, bestDelivery, budgetAvailableM, callEstimate, criterionCoverage, deliveryOptions, dayToDate, describeBeyond, fitFailures, fmtDate, fmtM, fmtPct, fmtStatValue,
  isDraftTask, leadTimeDays, offersForCriterion, openTasks, partLabel, quoteAmendment, quoteOrder, quoteReplacement, rankAssessments, refundM, sameKind, statInfo, suggestion, orderedOption, stillToBuy, taskCode,
  type OfferAssessment, type PView,
} from '../rules';
import { statDefs } from '../../planner/data/parts';
import { researchEta } from '../../science/model/tree';
import { testCounts, testDays } from '../../science/model/tests';
import { Art } from './Art';
import { focusedNeed, summarize } from './Catalogue';
import { coverageText, criterionSummary } from './Needs';
import { parseTarget, setUi, submitAction, targetKey, useP, useUi } from './uiState';
import { ContractInspector } from './ContractsView';

/** Arrives early enough for Science to test the part before launch (a test halves its risk of failure). */
export function testable(v: PView, arrival: number): boolean {
  return testCounts(arrival + testDays(), v.planner.plan.launchDay);
}

export function OfferRow({ a, selected, suggested, onClick, showName }: {
  a: OfferAssessment; selected?: boolean; suggested?: boolean; onClick: () => void; showName?: boolean;
}) {
  const v = useP();
  const sup = SUPPLIER_BY_ID[a.offer.supplierId];
  // A catalogue offer waiting for Science's research: it cannot be signed yet, but its terms are real.
  const afterResearch = a.unavailable.startsWith('Sold once');
  const tone = afterResearch ? 'warn' : a.unavailable || !a.fits ? 'bad' : a.lateAtBest || !a.affordable ? 'warn' : 'good';
  // Date and price of the option the offer would be ordered with (the one preselected when it is picked).
  const opt = orderedOption(a);
  const arrival = opt.expectedAt;
  return (
    <button type="button" class={`pr-offer ${tone}`} aria-pressed={!!selected} onClick={onClick}>
      <span class="pr-offer-head">
        <strong>{showName ? a.offer.resource.name : a.offer.supplierName}</strong>
        <span class="pr-offer-price num">{fmtM(opt.totalPriceM)}</span>
      </span>
      <span class="pr-offer-meta">
        {showName ? a.offer.supplierName : sup?.trait ?? ''}
        {a.offer.source !== 'catalogue' ? <span class="pr-chip">{a.offer.source === 'call' ? 'Call offer' : 'Partner'}</span> : null}
        {suggested ? <span class="pr-chip good">Suggested</span> : null}
      </span>
      <span class="pr-offer-facts">
        {afterResearch
          ? <span>{Math.round(leadTimeDays(v, a.offer) / DAYS_PER_MONTH * 10) / 10} mo delivery after research</span>
          : a.rescue
          ? <span class="warn">Priority {formatCalendarDate(dayToDate(a.rescue.expectedAt), { year: false })} · standard late</span>
          : opt.delivery !== 'standard'
          ? <span class="warn">Priority {formatCalendarDate(dayToDate(opt.expectedAt), { year: false })} · late</span>
          : <span class={a.late ? 'warn' : ''}>Arrives {fmtDate(a.expectedAt)}{a.late ? ' · late' : ''}</span>}
        <span>{fmtPct(a.offer.reliability)} reliable</span>
        {!a.unavailable && !a.lateAtBest && testable(v, arrival) ? <span class="good" title="Arrives early enough for Science to test it before launch. A test halves its risk of failure.">time to test</span> : null}
      </span>
      {afterResearch ? null : a.unavailable ? <span class="pr-offer-why bad">{a.unavailable}</span>
        : a.failures.length ? <span class="pr-offer-why bad">{a.failures.join(' · ')}</span>
        : !a.affordable ? <span class="pr-offer-why warn">Over the free budget</span> : null}
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

/** The active contract that covers a need, if a switch is possible (one contract, still on its way). */
export function switchableContract(v: PView, task: Task, crit: Criterion): Contract | undefined {
  const cov = criterionCoverage(v, task, crit);
  if (cov.missing > 0 || cov.contracts.length !== 1) return undefined;
  const k = cov.contracts[0];
  return k.status === 'active' ? k : undefined;
}

/** Open the right confirmation for an offer and a need: a new order, or a switch from the contract that covers it. */
export function reviewOffer(v: PView, a: OfferAssessment, task: Task, crit: Criterion, delivery: DeliveryOptionId = bestDelivery(a)) {
  const draft: OrderDraft = { offerId: a.offer.id, quantity: a.quantity, destination: { kind: 'task', taskId: task.id, criterionId: crit.id }, delivery, neededAt: task.neededAt };
  const old = switchableContract(v, task, crit);
  if (old) setUi({ dialog: { type: 'replace', contractId: old.id, draft, token: quoteReplacement(v, old.id, draft).token } });
  else setUi({ dialog: { type: 'order', draft, token: quoteOrder(v, draft).token } });
}

/** The shared budget at the moment of signing: what stays free, and what is spare once every part is bought. */
export function BudgetAfter({ costM, task, crit }: { costM: number; task?: Task; crit?: Criterion }) {
  const v = useP();
  const free = budgetAvailableM(v.budget) - costM;
  const buy = stillToBuy(v);
  // This need's own share of "still to buy" is the order being signed now.
  const own = task && crit && criterionCoverage(v, task, crit).missing > 0 ? (() => { const s = suggestion(offersForCriterion(v, task, crit)); return s ? orderedOption(s).totalPriceM : 0; })() : 0;
  const spare = free - (buy.cost - own);
  return (
    <p class={`pr-note center ${free < 0 || spare < 0 ? 'warn' : 'muted'}`}>
      Shared budget after: {fmtM(free)} free{buy.count ? ` · ${spare < 0 ? `${fmtM(-spare)} short` : `≈ ${fmtM(spare)} spare`} once all parts are bought` : ''}
    </p>
  );
}

function ResourceInspector() {
  const v = useP();
  const u = useUi((x) => x);
  const r = RESOURCE_BY_ID[u.resourceId ?? ''];
  if (!r) return <div class="pr-empty"><h3>Choose a Resource or need</h3><p>Select a mission need to compare fitting Offers, or a catalogue Resource to inspect its terms.</p></div>;
  const sum = summarize(v, r);
  const candidates = openTasks(v).flatMap((t) => t.criteria.filter((c) => sameKind(r, c)).map((c) => ({ t, c })));
  // Need: explicit choice, else the focused need, else the first uncovered fitting need.
  const { task: fTask, crit: fCrit } = focusedNeed(v, u.focus);
  let target = parseTarget(u.target);
  if (target && !candidates.some((x) => x.t.id === target!.taskId && x.c.id === target!.criterionId)) target = null;
  if (!target) {
    const pick = (fTask && fCrit && !isDraftTask(fTask) && sameKind(r, fCrit) ? { t: fTask, c: fCrit } : undefined)
      ?? candidates.find((x) => !fitFailures(r, x.c).length && criterionCoverage(v, x.t, x.c).missing > 0)
      ?? candidates.find((x) => !fitFailures(r, x.c).length);
    if (pick) target = { taskId: pick.t.id, criterionId: pick.c.id };
  }
  const tc = target ? candidates.find((x) => x.t.id === target!.taskId && x.c.id === target!.criterionId) : undefined;
  const task = tc?.t;
  const crit = tc?.c;
  const draftFocus = !task && fTask && isDraftTask(fTask) && fCrit && sameKind(r, fCrit) ? fTask : undefined;
  const cov = task && crit ? criterionCoverage(v, task, crit) : undefined;
  const qty = Math.max(1, cov?.missing || crit?.quantity || draftFocus?.criteria[0].quantity || 1);
  const assessed = offersForResource(r.id).map((o) => assessOffer(v, o, task ?? draftFocus, crit ?? draftFocus?.criteria[0], qty)).sort(rankAssessments);
  const selected = assessed.find((a) => a.offer.id === u.offerId) ?? assessed[0];
  const suggested = suggestion(assessed);
  const options = deliveryOptions(selected.offer).filter((o) => o.id !== 'flexible');
  const delivery: DeliveryOptionId = u.delivery && options.some((o) => o.id === u.delivery) ? u.delivery : bestDelivery(selected);
  const old = task && crit ? switchableContract(v, task, crit) : undefined;
  const delivered = !!cov && cov.missing === 0 && !old;
  const draft: OrderDraft = { offerId: selected.offer.id, quantity: qty, destination: task && crit ? { kind: 'task', taskId: task.id, criterionId: crit.id } : { kind: 'shared' }, delivery, neededAt: task?.neededAt };
  const quote = quoteOrder(v, draft);
  const switchQ = old ? quoteReplacement(v, old.id, draft) : undefined;
  const sameAsOld = !!old && old.offerSnapshot.id === selected.offer.id;
  const block = !task ? (draftFocus ? 'The Planner has not ordered this Resource yet.' : 'No ordered mission need uses this Resource.')
    : delivered ? 'This need is covered.'
    : sameAsOld ? 'This is the contracted offer.'
    : switchQ ? switchQ.unavailable : quote.unavailable || quote.failures[0] || '';

  return (
    <>
      <div class="pr-ctx-head">
        <span class="pr-eyebrow">{partLabel(r.partKind, r.variant)}</span>
        <h2>{r.name}</h2>
        <p>{r.blurb}</p>
      </div>
      <div class="pr-ctx-body">
        <div class="pr-insp-art"><Art kind={r.partKind} variant={r.variant} label={`${r.name} illustration`} /></div>
        <StatTable res={r} crit={crit ?? draftFocus?.criteria[0]} />
        {sum.locked.length ? (
          <div class="pr-callout warn">
            <strong>Beyond current research.</strong> Suppliers sell it once Science has researched:
            <ul>{sum.locked.map((k) => <li key={k}>{describeBeyond(k, r.stats, v.research)}</li>)}</ul>
          </div>
        ) : null}
        <h3>Offers</h3>
        <div class="pr-offer-list">
          {assessed.map((a) => (
            <OfferRow key={a.offer.id} a={a} selected={a.offer.id === selected.offer.id} suggested={(draftFocus ? true : !!cov && cov.missing > 0) && suggested?.offer.id === a.offer.id && assessed.length > 1}
              onClick={() => setUi({ offerId: a.offer.id, delivery: null })} />
          ))}
        </div>
        <p class="pr-terms">Cancelling costs {Math.round(selected.offer.cancellationPct * 100)} % of the price at signing, rising to 100 % by delivery.</p>
      </div>
      <div class="pr-actions">
        {candidates.length > 1 ? (
          <label class="pr-field">
            <span>For</span>
            <select value={target ? targetKey(target.taskId, target.criterionId) : ''} onChange={(e) => setUi({ target: (e.target as HTMLSelectElement).value })}>
              {candidates.map(({ t, c }) => {
                const f = fitFailures(r, c);
                const cv = criterionCoverage(v, t, c);
                return <option key={t.id + c.id} value={targetKey(t.id, c.id)}>{taskCode(t)} · {t.title}{f.length ? ` — ✗ ${f[0]}` : cv.missing === 0 ? ' — covered' : ''}</option>;
              })}
            </select>
          </label>
        ) : task ? <p class="pr-note muted">For {taskCode(task)} · {task.title}</p> : null}
        {task && options.length > 1 ? (
          <div class="pr-schedules" aria-label="Delivery">
            {options.map((o) => {
              const q = quoteOrder(v, { ...draft, delivery: o.id });
              return (
                <button type="button" key={o.id} class={`pr-schedule${delivery === o.id ? ' selected' : ''}`} aria-pressed={delivery === o.id} onClick={() => setUi({ delivery: o.id })}>
                  <strong>{o.id === 'priority' ? 'Priority' : 'Standard'}</strong><strong class="num">{fmtM(q.totalM)}</strong>
                  <span class="pr-schedule-line">{formatCalendarDate(dayToDate(q.expectedAt), { year: false })} · <span class={q.late ? 'warn' : 'good'}>{q.late ? `${Math.round(q.expectedAt - task.neededAt)} d late` : testable(v, q.expectedAt) ? 'time to test' : 'on time'}</span></span>
                </button>
              );
            })}
          </div>
        ) : null}
        {!task ? null : old && !sameAsOld && !delivered ? (
          <button type="button" class="pr-btn primary wide" disabled={!!block} aria-describedby={block ? "pr-order-block" : undefined} onClick={() => reviewOffer(v, selected, task!, crit!, delivery)}>
            Review switch · {fmtM(switchQ!.order.totalM)}
          </button>
        ) : (
          <button type="button" class="pr-btn primary wide" disabled={!!block} aria-describedby={block ? "pr-order-block" : undefined} onClick={() => reviewOffer(v, selected, task!, crit!, delivery)}>
            Review order · {fmtM(quote.totalM)}
          </button>
        )}
        {block ? <p id="pr-order-block" class="pr-note center warn">{block}</p> : <BudgetAfter costM={switchQ ? switchQ.netM : quote.totalM} task={task} crit={crit} />}
      </div>
    </>
  );
}

/** A need still beyond research: wait for Science, or open a Call now. Both routes with their dates, prices and odds. */
function BuyOrDevelop({ task, crit }: { task: Task; crit: Criterion }) {
  const v = useP();
  const keys = beyondKeys(crit.partKind, crit.variant, crit.minimums, v.research);
  if (!keys.length) return null;
  const etas = keys.map((k) => { const stat = k.split('.')[2]; return researchEta(v.research.projects, k, stat ? crit.minimums[stat] : undefined); });
  const researched = etas.every((e) => e !== undefined) ? Math.max(...(etas as number[])) : undefined;
  // After research: the fastest fitting catalogue offer, ordered the day research ends.
  const catalogue = offersForCriterion(v, task, crit).filter((a) => a.fits && a.offer.source === 'catalogue');
  const fastest = catalogue.sort((a, b) => leadTimeDays(v, a.offer) - leadTimeDays(v, b.offer))[0];
  const afterResearch = researched !== undefined && fastest ? researched + leadTimeDays(v, fastest.offer) : undefined;
  const call = callEstimate(v, crit);
  const tender = [...call.offers].sort((a, b) => a.expectedAt - b.expectedAt)[0];
  const cov = criterionCoverage(v, task, crit);
  const draft = isDraftTask(task);
  return (
    <div class="pr-callout warn pr-route">
      <p><strong>Beyond research.</strong> Suppliers sell it once Science has researched {keys.map((k) => describeBeyond(k, crit.minimums, v.research)).join(', ')}.</p>
      <dl class="pr-facts">
        <dt>Wait for Science</dt>
        <dd>{researched === undefined ? 'Science has not started it' : `research ends ${fmtDate(researched)}`}{afterResearch !== undefined ? <> · arrives ≈ {fmtDate(afterResearch)}{afterResearch > task.neededAt ? <span class="bad"> · late</span> : null} · {fmtM(fastest!.totalPriceM)} · {fmtPct(fastest!.offer.reliability)}</> : null}</dd>
        {tender ? <><dt>Open a Call now</dt><dd>offers {fmtDate(call.closesAt)} · arrives ≈ {fmtDate(tender.expectedAt)}{tender.expectedAt > task.neededAt ? <span class="bad"> · late</span> : null} · ≈ {fmtM(tender.priceM)} · {fmtPct(tender.offer.reliability)}</dd></> : null}
      </dl>
      {tender && !draft ? (
        <button type="button" class="pr-btn small" disabled={!!cov.openCall} onClick={() => submitAction(() => procurementActions.openCall(task.id, crit.id))}>
          {cov.openCall ? `Call open — offers ${fmtDate(cov.openCall.closesAt)}` : 'Open a Call'}
        </button>
      ) : null}
    </div>
  );
}

/** A late contract on the need: the one recovery the contract itself offers, priority delivery. */
function SpeedUp({ k, task }: { k: Contract; task: Task }) {
  const v = useP();
  if (!deliveryOptions(k.offerSnapshot).some((o) => o.id === 'priority') || k.delivery === 'priority') return <p class="pr-note warn">This supplier cannot deliver faster. Switch to an offer that is on time, or ask the Planner to move the launch.</p>;
  const q = quoteAmendment(v, k.id, 'priority');
  if (q.unavailable) return <p class="pr-note warn">Priority delivery: {q.unavailable}. Switch to an offer that is on time, or ask the Planner to move the launch.</p>;
  const onTime = q.expectedAt <= task.neededAt;
  return (
    <>
      <button type="button" class="pr-btn primary wide" onClick={() => setUi({ dialog: { type: 'amend', contractId: k.id, delivery: 'priority', token: q.token } })}>
        Speed up · arrives {formatCalendarDate(dayToDate(q.expectedAt), { year: false })} · fee {fmtM(q.feeM)}
      </button>
      {!onTime ? <p class="pr-note warn center">Still {Math.round(q.expectedAt - task.neededAt)} d late with priority.</p> : null}
    </>
  );
}

function NeedInspector() {
  const v = useP();
  const focus = useUi((u) => u.focus);
  const { task, crit } = focusedNeed(v, focus);
  if (!task || !crit) return <ResourceInspector />;
  const draft = isDraftTask(task);
  const cov = criterionCoverage(v, task, crit);
  const st = coverageText(cov);
  const ranked = offersForCriterion(v, task, crit);
  const best = suggestion(ranked);
  const old = switchableContract(v, task, crit);
  // Offers that fit: signable ones, and catalogue ones still waiting for research (their price and supplier matter now).
  const shown = ranked.filter((a) => a.fits && (!a.unavailable || (!old && a.offer.source === 'catalogue')) && (!old || a.offer.id !== old.offerSnapshot.id)).slice(0, 6);
  const late = cov.late ? cov.contracts.find((k) => k.status === 'active' && k.expectedAt > task.neededAt) : undefined;
  const signable = (a: OfferAssessment) => !draft && a.fits && !a.unavailable;
  const pick = (a: OfferAssessment) => {
    if (a.offer.source === 'catalogue' && a.offer.resourceId) {
      setUi({ inspect: 'resource', resourceId: a.offer.resourceId, offerId: a.offer.id, delivery: null, target: draft ? '' : targetKey(task.id, crit.id) });
    } else if (signable(a)) reviewOffer(v, a, task, crit);
  };
  return (
    <>
      <div class="pr-ctx-head">
        <span class="pr-eyebrow">{draft ? 'Draft · not ordered yet' : `${taskCode(task)} · from the Planner`}</span>
        <h2>{task.title}</h2>
        <p>{criterionSummary(crit)} · needed {fmtDate(task.neededAt)}</p>
      </div>
      <div class="pr-ctx-body">
        {draft ? <p class="pr-cov">The Planner can still change it. You can sign once it is ordered.</p> : <p class={`pr-cov ${st.tone}`}>{st.text}</p>}
        {cov.mismatch.length ? <div class="pr-callout warn">The Planner revised the need after contracting. The contracted part no longer meets: {cov.mismatch.join(' · ')}. Switch to an offer that fits.</div> : null}
        {cov.contracts.map((k) => (
          <button key={k.id} type="button" class="pr-ctx-option" onClick={() => setUi({ view: 'contracts', contractId: k.id })}>
            <strong>{k.offerSnapshot.resource.name} · {k.offerSnapshot.supplierName}</strong>
            <span>{k.status === 'delivered' ? `delivered ${fmtDate(k.deliveredAt ?? k.expectedAt)}` : `arrives ${fmtDate(k.expectedAt)}`} · {fmtPct(contractReliability(k))} reliable{k.tested ? ' (tested)' : ''} · {fmtM(k.offerSnapshot.priceM)}</span>
          </button>
        ))}
        {cov.missing > 0 ? <BuyOrDevelop task={task} crit={crit} /> : null}
        {cov.status !== 'delivered' && (cov.missing > 0 || old) ? (
          <>
            <h3>{old ? 'Switch to another offer' : 'Offers for this need'}</h3>
            {old ? <p class="pr-note muted">A switch cancels the current contract: {fmtM(refundM(old, v.clock.day))} of its {fmtM(old.offerSnapshot.priceM)} come back today.</p> : null}
            <div class="pr-offer-list">
              {shown.map((a) => (
                <OfferRow key={a.offer.id} a={a} showName suggested={!old && best?.offer.id === a.offer.id} onClick={() => pick(a)} />
              ))}
              {!shown.length ? <p class="muted small">No other offer fits this need.</p> : null}
            </div>
          </>
        ) : null}
      </div>
      <div class="pr-actions">
        {late ? <SpeedUp k={late} task={task} /> : null}
        {!late && cov.missing > 0 && best ? (
          <button type="button" class="pr-btn primary wide" onClick={() => pick(best)}>
            {draft ? 'Look at the suggestion' : 'Review suggestion'} · {best.offer.resource.name} · {fmtM(orderedOption(best).totalPriceM)}
          </button>
        ) : null}
        {cov.missing > 0 && best ? <p class={`pr-note center ${best.lateAtBest ? 'warn' : 'muted'}`}>{best.lateAtBest
          ? `No offer arrives on time: suggested is the earliest arrival${best.affordable ? '' : ', over the free budget'}.`
          : `Suggested: on time${best.rescue ? ' only with priority delivery' : ''}, ${best.affordable ? 'within budget' : 'over the free budget'}, then the lightest fitting part from its most reliable supplier.`}</p> : null}
        {cov.missing > 0 && !best && !draft && !beyondKeys(crit.partKind, crit.variant, crit.minimums, v.research).length ? (
          <button type="button" class="pr-btn wide" disabled={!!cov.openCall} onClick={() => submitAction(() => procurementActions.openCall(task.id, crit.id))}>
            {cov.openCall ? `Call open — offers ${fmtDate(cov.openCall.closesAt)}` : `No catalogue part fits · open a Call (offers ${fmtDate(callEstimate(v, crit).closesAt)})`}
          </button>
        ) : null}
        {cov.missing === 0 && !late ? <BudgetAfter costM={0} /> : null}
      </div>
    </>
  );
}

export function Inspector() {
  const inspect = useUi((u) => u.inspect);
  const view = useUi((u) => u.view);
  return (
    <aside class="pr-panel pr-inspector" aria-label="Active decision">
      {view === 'contracts' ? <ContractInspector /> : inspect === 'need' ? <NeedInspector /> : <ResourceInspector />}
    </aside>
  );
}
