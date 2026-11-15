// Centre: catalogue browse — categories, search, Resource cards.
import type { Criterion, Task } from '../../../core/model';
import { RESOURCES, offersForResource, type CatalogueResource } from '../data/catalogue';
import {
  DRAFT_PREFIX, assessOffer, beyondKeys, criterionCoverage, describeBeyond, fitFailures, fmtMonth, fmtM, fmtStats, partLabel, sameKind, taskCode,
  unitPriceM, openTasks, type PView,
} from '../rules';
import { Art } from './Art';
import { CATEGORIES, setUi, useP, useUi } from './uiState';

export interface ResourceSummary {
  r: CatalogueResource;
  minPrice: number;
  soonest: number;
  relLo: number;
  relHi: number;
  locked: string[];
}

export function summarize(v: PView, r: CatalogueResource): ResourceSummary {
  const offers = offersForResource(r.id);
  return {
    r,
    minPrice: Math.min(...offers.map((o) => unitPriceM(v, o))),
    // Earliest over every offer and delivery option (priority included), as the inspector would quote it.
    soonest: Math.min(...offers.map((o) => assessOffer(v, o).fastestAt)),
    relLo: Math.min(...offers.map((o) => o.reliability)),
    relHi: Math.max(...offers.map((o) => o.reliability)),
    locked: beyondKeys(r.partKind, r.variant, r.stats, v.research),
  };
}

/**
 * The focused need: an open Task, or a draft part of the Planner's design (preview). A focused draft follows
 * its part into the real Task once the Planner orders it.
 */
export function focusedNeed(v: PView, focus: { taskId: string; criterionId: string } | null): { task?: Task; crit?: Criterion } {
  if (!focus) return {};
  let task = v.market.tasks.find((t) => t.id === focus.taskId && t.status === 'open');
  if (!task && focus.taskId.startsWith(DRAFT_PREFIX)) {
    const partId = focus.taskId.slice(DRAFT_PREFIX.length);
    task = v.market.tasks.find((t) => t.partId === partId && t.status === 'open') ?? v.drafts?.find((t) => t.id === focus.taskId);
    return { task, crit: task?.criteria[0] };
  }
  return { task, crit: task?.criteria.find((c) => c.id === focus.criterionId) };
}

export function Catalogue() {
  const v = useP();
  const u = useUi((x) => x);
  const { task, crit } = focusedNeed(v, u.focus);
  const kinds = CATEGORIES.find((c) => c.id === u.category)?.kinds ?? [];
  const q = u.query.trim().toLowerCase();
  const tasks = openTasks(v);

  let list = RESOURCES.filter((r) => !kinds.length || kinds.includes(r.partKind))
    .filter((r) => !q || `${r.name} ${r.blurb} ${partLabel(r.partKind, r.variant)} ${r.supplierIds.join(' ')}`.toLowerCase().includes(q))
    .map((r) => summarize(v, r));
  if (u.matchesOnly && crit) list = list.filter((x) => sameKind(x.r, crit) && !fitFailures(x.r, crit).length);
  if (crit && !u.matchesOnly) {
    // Fitting Resources first, then same kind, then the rest (discovery stays broad).
    const rank = (x: ResourceSummary) => (sameKind(x.r, crit) ? (fitFailures(x.r, crit).length ? 1 : 0) : 2);
    list = [...list].sort((a, b) => rank(a) - rank(b));
  }

  return (
    <main class="pr-panel pr-catalogue" aria-label="Resource catalogue">
      <div class="pr-cat-head">
        <div class="pr-cat-title">
          <h2>Catalogue</h2>
          {task && crit ? (
            <div class="pr-active-filter">
              <span>{task.id.startsWith(DRAFT_PREFIX) ? 'Draft' : taskCode(task)} · {crit.label}</span>
              <button type="button" class="pr-toggle" aria-pressed={u.matchesOnly} onClick={() => setUi({ matchesOnly: !u.matchesOnly })}>Matches only</button>
              <button type="button" class="pr-text-btn" aria-label="Clear need focus" onClick={() => setUi({ focus: null, matchesOnly: false, inspect: 'resource' })}>×</button>
            </div>
          ) : <span class="muted small">{RESOURCES.length} Resources from {new Set(RESOURCES.flatMap((r) => r.supplierIds)).size} suppliers</span>}
        </div>
        <div class="pr-cat-bar">
          <nav class="pr-cats" aria-label="Categories">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" aria-pressed={u.category === c.id} onClick={() => setUi({ category: c.id })}>{c.label}</button>
            ))}
          </nav>
          <label class="pr-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
            <input type="search" placeholder="Search parts, suppliers…" value={u.query} aria-label="Search catalogue" onInput={(e) => setUi({ query: (e.target as HTMLInputElement).value })} />
          </label>
        </div>
      </div>
      <div class="pr-grid">
        {list.map((x) => {
          const r = x.r;
          const fails = crit && sameKind(r, crit) ? fitFailures(r, crit) : null;
          const lateForNeed = task && fails && !fails.length && x.soonest > task.neededAt;
          const matching = tasks.filter((t) => t.criteria.some((c) => sameKind(r, c) && !fitFailures(r, c).length && criterionCoverage(v, t, c).missing > 0));
          let match = '';
          let warn = false;
          if (fails) {
            match = fails.length ? fails[0] : `Fits ${task!.id.startsWith(DRAFT_PREFIX) ? 'the draft' : taskCode(task!)}${lateForNeed ? ' · late' : ''}`;
            warn = fails.length > 0 || !!lateForNeed;
          } else if (matching.length) {
            match = `Fits ${matching.map(taskCode).join(', ')}`;
          }
          if (x.locked.length && match.startsWith('Fits')) match += ' · after research';
          const related = !!fails && !fails.length;
          return (
            <button
              key={r.id}
              type="button"
              class={`pr-card${related ? ' related' : ''}${x.locked.length ? ' locked' : ''}`}
              aria-pressed={u.resourceId === r.id && u.inspect === 'resource'}
              onClick={() => setUi({ resourceId: r.id, inspect: 'resource', offerId: null, delivery: null, target: '' })}
            >
              <span class="pr-card-art">
                <Art kind={r.partKind} variant={r.variant} label={`${r.name} illustration`} />
                <span class="pr-card-kind">{partLabel(r.partKind, r.variant)}</span>
                {x.locked.length ? <span class="pr-card-lock" title={describeBeyond(x.locked[0], r.stats, v.research)}>Beyond research</span> : null}
              </span>
              <span class="pr-card-body">
                <h3>{r.name}</h3>
                <span class="pr-card-stats">{fmtStats(r.partKind, r.variant, r.stats)} · {r.massT} t</span>
                <span class={`pr-card-match${warn ? ' warn' : related || matching.length ? ' good' : ''}`}>{match}</span>
                <span class="pr-card-bottom">
                  {/* Each figure is the best of the Resource's offers, labelled so: they may come from different suppliers. */}
                  <span class="pr-card-price">{x.locked.length ? '—' : fmtM(x.minPrice)}<small>{x.locked.length ? '' : ' from'}</small></span>
                  <span class="pr-card-eta">{x.locked.length ? 'Science must research it' : `Earliest ${fmtMonth(x.soonest)}`}<br />{Math.round(x.relLo * 1000) / 10}–{Math.round(x.relHi * 1000) / 10} % reliable</span>
                </span>
              </span>
            </button>
          );
        })}
        {!list.length ? (
          <div class="pr-empty wide">
            <h3>No Resources in this view</h3>
            <p>Try another search or browse the full catalogue.</p>
            <button type="button" class="pr-btn" onClick={() => setUi({ query: '', category: 'all', matchesOnly: false })}>Reset search & filters</button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
