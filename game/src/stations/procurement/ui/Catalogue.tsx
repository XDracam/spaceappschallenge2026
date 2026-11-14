// Centre: catalogue browse — categories, search, sort, filters, Resource cards.
import type { Criterion, Task } from '../../../core/model';
import { RESOURCES, offersForResource, type CatalogueResource } from '../data/catalogue';
import {
  beyondKeys, criterionCoverage, describeBeyond, expectedArrival, fitFailures, fmtMonth, fmtM, fmtStats, partLabel, sameKind, taskCode,
  unitPriceM, openTasks, type PView,
} from '../rules';
import { Art } from './Art';
import { CATEGORIES, setUi, ui, useP, useUi } from './uiState';

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
    soonest: Math.min(...offers.map((o) => expectedArrival(v, o))),
    relLo: Math.min(...offers.map((o) => o.reliability)),
    relHi: Math.max(...offers.map((o) => o.reliability)),
    locked: beyondKeys(r.partKind, r.variant, r.stats, v.research),
  };
}

export function focusedNeed(v: PView, focus: { taskId: string; criterionId: string } | null): { task?: Task; crit?: Criterion } {
  if (!focus) return {};
  const task = v.market.tasks.find((t) => t.id === focus.taskId && t.status === 'open');
  return { task, crit: task?.criteria.find((c) => c.id === focus.criterionId) };
}

const CompareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16M6 9h3m-3 4h3m6-4h3m-3 4h3" /></svg>
);

export function toggleCompare(id: string) {
  const list = ui.get().compare;
  setUi({ compare: list.includes(id) ? list.filter((x) => x !== id) : [...list, id].slice(-3) });
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
  if (u.hideLocked) list = list.filter((x) => !x.locked.length);
  if (u.matchesOnly && crit) list = list.filter((x) => sameKind(x.r, crit) && !fitFailures(x.r, crit).length);
  if (u.sort === 'price') list = [...list].sort((a, b) => a.minPrice - b.minPrice);
  if (u.sort === 'arrival') list = [...list].sort((a, b) => a.soonest - b.soonest);
  if (u.sort === 'reliability') list = [...list].sort((a, b) => b.relHi - a.relHi);
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
              <span>{taskCode(task)} · {crit.label}</span>
              <button type="button" class="pr-toggle" aria-pressed={u.matchesOnly} onClick={() => setUi({ matchesOnly: !u.matchesOnly })}>Matches only</button>
              <button type="button" class="pr-text-btn" aria-label="Clear need focus" onClick={() => setUi({ focus: null, matchesOnly: false, inspect: 'resource' })}>×</button>
            </div>
          ) : <span class="muted small">{RESOURCES.length} Resources from {new Set(RESOURCES.flatMap((r) => r.supplierIds)).size} suppliers</span>}
        </div>
        <nav class="pr-cats" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" aria-pressed={u.category === c.id} onClick={() => setUi({ category: c.id })}>{c.label}</button>
          ))}
        </nav>
        <div class="pr-toolbar">
          <label class="pr-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
            <input type="search" placeholder="Search parts, suppliers…" value={u.query} aria-label="Search catalogue" onInput={(e) => setUi({ query: (e.target as HTMLInputElement).value })} />
          </label>
          <button type="button" class="pr-toggle" aria-pressed={u.hideLocked} onClick={() => setUi({ hideLocked: !u.hideLocked })} title="Hide Resources beyond current research (tender only)">Hide tender-only</button>
          <button type="button" class="pr-btn" disabled={u.compare.length < 2} onClick={() => setUi({ view: 'compare' })} title={u.compare.length < 2 ? 'Select 2–3 Resources with the compare buttons' : 'Compare selected Resources'}>
            Compare <span class="pr-nav-count">{u.compare.length}</span>
          </button>
          <select value={u.sort} aria-label="Sort catalogue" onChange={(e) => setUi({ sort: (e.target as HTMLSelectElement).value as typeof u.sort })}>
            <option value="featured">Catalogue order</option>
            <option value="price">Lowest price</option>
            <option value="arrival">Soonest delivery</option>
            <option value="reliability">Most reliable</option>
          </select>
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
            match = fails.length ? fails[0] : `Fits ${taskCode(task!)}${lateForNeed ? ' · late' : ''}`;
            warn = fails.length > 0 || !!lateForNeed;
          } else if (matching.length) {
            match = `Fits ${matching.map(taskCode).join(', ')}`;
          }
          if (x.locked.length && match.startsWith('Fits')) match += ' · via Call';
          const related = !!fails && !fails.length;
          return (
            <div class="pr-card-wrap" key={r.id}>
              <button
                type="button"
                class={`pr-card${related ? ' related' : ''}${x.locked.length ? ' locked' : ''}`}
                aria-pressed={u.resourceId === r.id && u.inspect === 'resource'}
                onClick={() => setUi({ resourceId: r.id, inspect: 'resource', offerId: null, qty: 0, target: '' })}
              >
                <span class="pr-card-art">
                  <Art kind={r.partKind} variant={r.variant} label={`${r.name} illustration`} />
                  <span class="pr-card-kind">{partLabel(r.partKind, r.variant)}</span>
                  {x.locked.length ? <span class="pr-card-lock" title={describeBeyond(x.locked[0], r.stats, v.research)}>Tender only</span> : null}
                </span>
                <span class="pr-card-body">
                  <h3>{r.name}</h3>
                  <span class="pr-card-stats">{fmtStats(r.partKind, r.variant, r.stats)} · {r.massT} t</span>
                  <span class={`pr-card-match${warn ? ' warn' : related || matching.length ? ' good' : ''}`}>{match}</span>
                  <span class="pr-card-bottom">
                    <span class="pr-card-price">{x.locked.length ? '—' : fmtM(x.minPrice)}<small>{x.locked.length ? ' via Call' : ' from'}</small></span>
                    <span class="pr-card-eta">{x.locked.length ? 'Beyond research' : `Delivery ${fmtMonth(x.soonest)}`}<br />{Math.round(x.relLo * 1000) / 10}–{Math.round(x.relHi * 1000) / 10} % reliable</span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                class="pr-card-compare"
                aria-pressed={u.compare.includes(r.id)}
                title={u.compare.includes(r.id) ? 'Remove from comparison' : 'Select for comparison'}
                aria-label={u.compare.includes(r.id) ? `Remove ${r.name} from comparison` : `Select ${r.name} for comparison`}
                onClick={() => toggleCompare(r.id)}
              >
                <CompareIcon />
              </button>
            </div>
          );
        })}
        {!list.length ? (
          <div class="pr-empty wide">
            <h3>No Resources in this view</h3>
            <p>Try another search or browse the full catalogue.</p>
            <button type="button" class="pr-btn" onClick={() => setUi({ query: '', category: 'all', matchesOnly: false, hideLocked: false })}>Reset search & filters</button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
