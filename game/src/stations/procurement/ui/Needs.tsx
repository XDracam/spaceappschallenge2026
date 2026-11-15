// Left column: the mission's needs (open Tasks, and the Planner's draft parts before the order) with coverage.
import type { Criterion, Task } from '../../../core/model';
import { procurementActions } from '../logic';
import {
  beyondKeys, budgetAvailableM, criterionCoverage, deliveryShiftDays, fmtDate, fmtM, fmtStatValue, leadTimeDays, offersForCriterion, openTasks, taskCode,
  stillToBuy, type Coverage, type PView,
} from '../rules';
import { researchEta } from '../../science/model/tree';
import { categoryOf, setUi, useP, useUi } from './uiState';

export function criterionSummary(c: Criterion): string {
  const mins = Object.entries(c.minimums).map(([k, v]) => `≥ ${fmtStatValue(c.partKind, c.variant, k, v)}`).join(' · ');
  return `${c.quantity > 1 ? `${c.quantity}× ` : ''}${mins}`;
}

export function coverageText(cov: Coverage): { text: string; tone: '' | 'good' | 'warn' } {
  if (cov.mismatch.length) return { text: `Revised — contracted part fails: ${cov.mismatch[0]}`, tone: 'warn' };
  if (cov.late) return { text: `Late — arrives ${fmtDate(cov.expectedAt!)}`, tone: 'warn' };
  if (cov.status === 'delivered') return { text: 'Delivered', tone: 'good' };
  if (cov.status === 'contracted') return { text: `Contracted — arrives ${fmtDate(cov.expectedAt!)}`, tone: 'good' };
  if (cov.status === 'partial') return { text: `${cov.covered} of ${cov.needed} contracted`, tone: 'warn' };
  if (cov.openCall) return { text: `Call open — offers ${fmtDate(cov.openCall.closesAt)}`, tone: '' };
  return { text: 'Not covered', tone: '' };
}

function focusNeed(task: Task, c: Criterion) {
  setUi({
    focus: { taskId: task.id, criterionId: c.id }, inspect: 'need', view: 'catalogue',
    category: categoryOf(c.partKind), matchesOnly: false, query: '',
  });
}

/** Last day a standard order still arrives by the needed date, from the fastest fitting Offer that can be signed. */
function orderByDay(v: PView, t: Task, c: Criterion): number | undefined {
  // Catalogue parts that wait for research count too: the date tells Procurement and Science how long research may take.
  const leads = offersForCriterion(v, t, c).filter((a) => a.fits && (!a.unavailable || a.offer.source === 'catalogue')).map((a) => leadTimeDays(v, a.offer));
  return leads.length ? Math.floor(t.neededAt - Math.min(...leads) - deliveryShiftDays(v)) : undefined;
}

/** Marks a need the catalogue cannot sell before Science has researched it, with how far Science is. */
function ResearchChip({ v, c }: { v: PView; c: Criterion }) {
  const keys = beyondKeys(c.partKind, c.variant, c.minimums, v.research);
  if (!keys.length) return null;
  const etas = keys.map((k) => researchEta(v.research.projects, k, k.split('.')[2] ? c.minimums[k.split('.')[2]] : undefined));
  const waiting = etas.some((e) => e === undefined);
  return <span class="pr-chip warn">{waiting ? 'Beyond research · Science not started' : `Beyond research · Science until ${fmtDate(Math.max(...(etas as number[]))).slice(0, -5)}`}</span>;
}

/** A partner or tender offer waiting for this need: its terms are in the need's own offer list. */
function OfferChip({ v, t, c }: { v: PView; t: Task; c: Criterion }) {
  const extra = offersForCriterion(v, t, c).filter((a) => a.offer.source !== 'catalogue' && !a.unavailable && a.fits);
  if (!extra.length) return null;
  return <span class="pr-chip good">{extra.length === 1 ? `${extra[0].offer.source === 'comms' ? 'Partner' : 'Tender'} offer · ${fmtM(extra[0].totalPriceM)}` : `${extra.length} new offers`}</span>;
}

export function Needs({ onClose }: { onClose?: () => void } = {}) {
  const v = useP();
  const focus = useUi((u) => u.focus);
  const tasks = openTasks(v);
  const drafts = v.drafts ?? [];
  const today = Math.floor(v.clock.day);
  const all = tasks.flatMap((t) => t.criteria.map((c) => {
    const cov = criterionCoverage(v, t, c);
    return { t, c, cov, orderBy: cov.missing > 0 ? orderByDay(v, t, c) : undefined };
  }));
  // Still to order on top, the one that must be ordered first leading; covered needs keep their order below.
  const rows = [
    ...all.filter((r) => r.cov.missing > 0).sort((a, b) => (a.orderBy ?? 1e9) - (b.orderBy ?? 1e9)),
    ...all.filter((r) => r.cov.missing === 0),
  ];
  const draftRows = drafts.map((t) => ({ t, c: t.criteria[0], orderBy: orderByDay(v, t, t.criteria[0]) })).sort((a, b) => (a.orderBy ?? 1e9) - (b.orderBy ?? 1e9));
  const uncovered = rows.filter((r) => r.cov.missing > 0).length;
  const issues = rows.filter((r) => r.cov.late || r.cov.mismatch.length).length;
  const buy = stillToBuy(v);
  const spare = budgetAvailableM(v.budget) - buy.cost;
  const isFocused = (t: Task, c: Criterion) => focus?.taskId === t.id && focus.criterionId === c.id;
  const click = (t: Task, c: Criterion) => (isFocused(t, c) && !onClose ? setUi({ focus: null, inspect: 'resource' }) : focusNeed(t, c));
  const orderByText = (orderBy: number | undefined, t: Task) => orderBy === undefined
    ? <span class="muted">Needed {fmtDate(t.neededAt)}</span>
    : <span class={orderBy < today ? 'bad' : orderBy - today < 30 ? 'warn' : 'muted'}>Order by {fmtDate(orderBy).slice(0, -5)}</span>;
  return (
    <aside class="pr-panel pr-needs" aria-label="Mission needs">
      <div class="pr-section-head"><h2>Mission needs</h2><span class="pr-count">{rows.length || (drafts.length ? `${drafts.length} drafts` : '')}</span>{onClose ? <button type="button" class="pr-text-btn" aria-label="Close mission needs" onClick={onClose}>Close</button> : null}</div>
      <div class="pr-situation">
        <details class="pr-role-guide">
          <summary>Your procurement loop</summary>
          <p>Study draft offers while the Planner prepares part requests. Once published, source each need: balance the shared budget, delivery dates and time for Science testing. Source Science supplies too, so research can progress.</p>
        </details>
        {rows.length ? <div><strong>{uncovered}</strong> <span class="muted">to buy</span>{issues ? <> · <strong class="warn">{issues}</strong> <span class="muted">to review</span></> : null}</div> : null}
        {buy.count ? (
          <div class={spare < 0 ? 'warn' : 'muted'} title="The suggested offer for every need not yet contracted, drafts included, against the free shared budget.">
            Still to buy ≈ {fmtM(buy.cost)}{buy.unsolvable ? ` + ${buy.unsolvable} without a catalogue part` : ''} · {spare < 0 ? `${fmtM(-spare)} short` : `${fmtM(spare)} spare`}
          </div>
        ) : null}
      </div>
      <div class="pr-need-list">
        {rows.map(({ t, c, cov, orderBy }) => {
          const st = coverageText(cov);
          return (
            <button key={`${t.id}:${c.id}`} type="button" class={`pr-need${st.tone === 'warn' ? ' review' : ''}`} aria-pressed={isFocused(t, c)} onClick={() => click(t, c)}>
              <span class="pr-need-top"><span>{taskCode(t)}{t.revision > 1 ? ` · rev ${t.revision}` : ''}</span>{t.priority === 'high' ? <span>high priority</span> : null}</span>
              <span class="pr-need-title">{t.title}</span>
              <span class="pr-need-crit">{criterionSummary(c)}</span>
              {cov.missing > 0 ? <ResearchChip v={v} c={c} /> : null}
              <OfferChip v={v} t={t} c={c} />
              <span class="pr-need-status">
                <span class={st.tone}>{st.text}</span>
                {cov.missing > 0 ? orderByText(orderBy, t) : null}
              </span>
            </button>
          );
        })}
        {draftRows.length ? (
          <>
            <p class="pr-need-group">{rows.length ? 'Not ordered yet by the Planner' : `The Planner's design · ${draftRows.length} parts, not ordered yet. Study the offers now; you can sign once they are ordered.`}</p>
            {draftRows.map(({ t, c, orderBy }) => (
              <button key={t.id} type="button" class="pr-need draft" aria-pressed={isFocused(t, c)} onClick={() => click(t, c)}>
                <span class="pr-need-top"><span>Draft</span></span>
                <span class="pr-need-title">{t.title}</span>
                <span class="pr-need-crit">{criterionSummary(c)}</span>
                <ResearchChip v={v} c={c} />
                <span class="pr-need-status">{orderByText(orderBy, t)}</span>
              </button>
            ))}
          </>
        ) : null}
        {!rows.length && !draftRows.length ? <div class="pr-empty"><p>No open mission needs.</p></div> : null}
      </div>
      {import.meta.env.DEV ? (
        <div class="pr-dev">
          <button type="button" class="pr-btn small" onClick={() => procurementActions.devAddSampleTasks()} title="Dev stand-in for the planner: one Task per part of the current rocket">
            Dev · add Tasks from rocket
          </button>
        </div>
      ) : null}
    </aside>
  );
}
