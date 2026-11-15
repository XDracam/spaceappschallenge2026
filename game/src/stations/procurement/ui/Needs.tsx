// Left column: shared needs (open Tasks from any role) with coverage per criterion.
import type { Criterion, Task } from '../../../core/model';
import { procurementActions } from '../logic';
import {
  beyondKeys, budgetAvailableM, criterionCoverage, deliveryShiftDays, fmtDate, fmtM, fmtStatValue, leadTimeDays, offersForCriterion, openTasks, suggestion, taskCode,
  type Coverage, type PView,
} from '../rules';
import { researchEta } from '../../science/model/tree';
import { useGame } from '../../../core/store';
import { partStatus } from '../../planner/derive';
import { allParts } from '../../planner/model/rocketUtils';
import { categoryOf, setUi, useP, useUi } from './uiState';

const ROLE: Record<string, string> = { planner: 'Planner', procurement: 'Procurement', science: 'Science', comms: 'Comms' };

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
  if (cov.openCall) return { text: `Call open — answers ${fmtDate(cov.openCall.closesAt)}`, tone: '' };
  return { text: 'Not covered', tone: '' };
}

function focusNeed(task: Task, c: Criterion) {
  setUi({
    focus: { taskId: task.id, criterionId: c.id }, inspect: 'need', view: 'catalogue',
    category: categoryOf(c.partKind), matchesOnly: false, query: '',
  });
}

/** Cheapest fitting signable cost of every uncovered criterion (budget pressure, D-011). */
function uncoveredCost(v: PView): { cost: number; unsolvable: number } {
  let cost = 0;
  let unsolvable = 0;
  for (const t of openTasks(v)) {
    for (const c of t.criteria) {
      const cov = criterionCoverage(v, t, c);
      if (cov.missing === 0) continue;
      const best = suggestion(offersForCriterion(v, t, c));
      if (best) cost += best.totalPriceM; else unsolvable++;
    }
  }
  return { cost, unsolvable };
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

export function Needs({ onClose }: { onClose?: () => void } = {}) {
  const v = useP();
  const focus = useUi((u) => u.focus);
  // Parts of the Planner's design that are not ordered yet: they become needs here when the Planner orders them.
  const drafts = useGame((s) => allParts(s.planner.rocket).filter((l) => partStatus(s, l.part.id) === 'draft').length);
  const tasks = openTasks(v);
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
  const uncovered = rows.filter((r) => r.cov.missing > 0).length;
  const issues = rows.filter((r) => r.cov.late || r.cov.mismatch.length).length;
  const { cost, unsolvable } = uncoveredCost(v);
  const available = budgetAvailableM(v.budget);
  return (
    <aside class="pr-panel pr-needs" aria-label="Shared needs">
      <div class="pr-section-head"><h2>Mission needs</h2><span class="pr-count">{rows.length}</span>{onClose ? <button type="button" class="pr-text-btn" aria-label="Close mission needs" onClick={onClose}>Close</button> : null}</div>
      <div class="pr-situation">
        {rows.length ? <div><strong>{uncovered}</strong> <span class="muted">not fully covered</span>{issues ? <> · <strong class="warn">{issues}</strong> <span class="muted">to review</span></> : null}</div> : null}
        {uncovered ? (
          <div class={cost > available ? 'warn' : 'muted'}>
            Cheapest fitting cover ≈ {fmtM(cost)}{unsolvable ? ` + ${unsolvable} without catalogue fit` : ''} · {fmtM(available)} available
          </div>
        ) : null}
      </div>
      <div class="pr-need-list">
        {rows.map(({ t, c, cov, orderBy }) => {
          const st = coverageText(cov);
          const pressed = focus?.taskId === t.id && focus.criterionId === c.id;
          return (
            <button key={`${t.id}:${c.id}`} type="button" class={`pr-need${st.tone === 'warn' ? ' review' : ''}`} aria-pressed={pressed} onClick={() => (pressed && !onClose ? setUi({ focus: null, inspect: 'resource' }) : focusNeed(t, c))}>
              <span class="pr-need-top">
                <span>{taskCode(t)}{t.revision > 1 ? ` · rev ${t.revision}` : ''}</span>
                <span>From {ROLE[t.authorRole] ?? t.authorRole}{t.priority === 'high' ? ' · high' : ''}</span>
              </span>
              <span class="pr-need-title">{t.title}</span>
              <span class="pr-need-crit">{c.label} · {criterionSummary(c)}</span>
              {cov.missing > 0 ? <ResearchChip v={v} c={c} /> : null}
              <span class="pr-need-status">
                <span class={st.tone}>{st.text}</span>
                {orderBy === undefined
                  ? <span class="muted">Needed {fmtDate(t.neededAt)}</span>
                  : <span class={orderBy < today ? 'bad' : orderBy - today < 30 ? 'warn' : 'muted'}>Order by {fmtDate(orderBy).slice(0, -5)}</span>}
              </span>
            </button>
          );
        })}
        {!rows.length ? (
          <div class="pr-empty">
            <p>{drafts ? `Waiting for the Planner's order: ${drafts} draft ${drafts === 1 ? 'part' : 'parts'}.` : 'No open mission needs.'}</p>
          </div>
        ) : null}
      </div>
      <div class="pr-stock-rail"><h3>Department supply</h3>
        {(['science', 'planner', 'comms', 'procurement'] as const).map(department => {
          const allocs = v.market.allocations.filter(a => a.department === department && a.status !== 'released');
          const ready = allocs.filter(a => a.status === 'available').reduce((n, a) => n + a.quantity, 0);
          const incoming = allocs.filter(a => a.status === 'reserved').reduce((n, a) => n + a.quantity, 0);
          const used = allocs.filter(a => a.projectId).reduce((n, a) => n + a.quantity, 0);
          if (!ready && !incoming) return null;
          return <div key={department} class="pr-stock-row"><strong>{department[0].toUpperCase() + department.slice(1)}</strong><span>{ready} ready · {incoming} incoming{used ? ` · ${used} in use` : ''}</span></div>;
        })}
        <p class="small muted">Shared supply: {v.market.contracts.filter(k => k.status === 'delivered').reduce((n, k) => n + Math.max(0, k.offerSnapshot.quantity - v.market.allocations.filter(a => a.contractId === k.id && a.status !== 'released').reduce((sum, a) => sum + a.quantity, 0)), 0)} ready</p>
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
