// Side-by-side comparison of up to three Resources against the focused need.
import { RESOURCE_BY_ID, offersForResource } from '../data/catalogue';
import { budgetAvailableM, describeBeyond, fitFailures, fmtDate, fmtM, fmtStatValue, partLabel, sameKind, statInfo, taskCode } from '../rules';
import { statDefs } from '../../planner/data/parts';
import { Art } from './Art';
import { focusedNeed, summarize, toggleCompare } from './Catalogue';
import { setUi, useP, useUi } from './uiState';

export function CompareView() {
  const v = useP();
  const ids = useUi((u) => u.compare);
  const focus = useUi((u) => u.focus);
  const { task, crit } = focusedNeed(v, focus);
  const items = ids.map((id) => RESOURCE_BY_ID[id]).filter(Boolean).map((r) => summarize(v, r));
  const keys = [...new Set(items.flatMap((x) => statDefs(x.r.partKind, x.r.variant).map((d) => d.key)))];
  const available = budgetAvailableM(v.budget);
  return (
    <main class="pr-panel pr-overlay" aria-label="Compare Resources">
      <div class="pr-overlay-head">
        <h2>Compare Resources</h2>
        <button type="button" class="pr-btn small" onClick={() => setUi({ view: 'catalogue' })}>Back to catalogue</button>
      </div>
      <div class="pr-overlay-body">
        <p class="muted small">{task && crit ? `Checked against ${taskCode(task)} ${crit.label}, needed ${fmtDate(task.neededAt)}.` : 'Focus a need to check fit and delivery against it.'}</p>
        {items.length ? (
          <table class="pr-table pr-compare">
            <thead>
              <tr>
                <th />
                {items.map((x) => (
                  <th key={x.r.id}>
                    <div class="pr-compare-art"><Art kind={x.r.partKind} variant={x.r.variant} /></div>
                    <strong>{x.r.name}</strong>
                    <div class="muted small">{partLabel(x.r.partKind, x.r.variant)}</div>
                    <div class="pr-row">
                      <button type="button" class="pr-text-btn" onClick={() => setUi({ view: 'catalogue', inspect: 'resource', resourceId: x.r.id, offerId: null, qty: 0 })}>Inspect & sign</button>
                      <button type="button" class="pr-text-btn" onClick={() => toggleCompare(x.r.id)}>Remove</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k}>
                  <td class="muted">{statInfo(items[0].r.partKind, items[0].r.variant, k).label}</td>
                  {items.map((x) => (
                    <td key={x.r.id} class="num">{x.r.stats[k] !== undefined ? fmtStatValue(x.r.partKind, x.r.variant, k, x.r.stats[k]) : '—'}</td>
                  ))}
                </tr>
              ))}
              <tr><td class="muted">Mass</td>{items.map((x) => <td key={x.r.id} class="num">{x.r.massT} t</td>)}</tr>
              <tr><td class="muted">Price from</td>{items.map((x) => <td key={x.r.id} class="num">{x.locked.length ? 'Tender only' : fmtM(x.minPrice)}</td>)}</tr>
              <tr><td class="muted">Soonest delivery</td>{items.map((x) => <td key={x.r.id} class={`num ${task && x.soonest > task.neededAt ? 'warn' : ''}`}>{x.locked.length ? '—' : fmtDate(x.soonest)}</td>)}</tr>
              <tr><td class="muted">Reliability</td>{items.map((x) => <td key={x.r.id} class="num">{Math.round(x.relLo * 1000) / 10}–{Math.round(x.relHi * 1000) / 10} %</td>)}</tr>
              <tr><td class="muted">Suppliers</td>{items.map((x) => <td key={x.r.id} class="small">{offersForResource(x.r.id).map((o) => o.supplierName).join(', ')}</td>)}</tr>
              <tr><td class="muted">Research</td>{items.map((x) => <td key={x.r.id} class={`small ${x.locked.length ? 'warn' : 'good'}`}>{x.locked.length ? describeBeyond(x.locked[0], x.r.stats, v.research) : 'Within research'}</td>)}</tr>
              {crit ? (
                <tr><td class="muted">Fit {taskCode(task!)}</td>{items.map((x) => {
                  const f = sameKind(x.r, crit) ? fitFailures(x.r, crit) : [`Different part`];
                  return <td key={x.r.id} class={`small ${f.length ? 'bad' : 'good'}`}>{f.length ? f.join(' · ') : '✓ Meets all minimums'}</td>;
                })}</tr>
              ) : null}
              <tr><td class="muted">Available after (1 unit)</td>{items.map((x) => <td key={x.r.id} class={`num ${available - x.minPrice < 0 ? 'warn' : ''}`}>{x.locked.length ? '—' : fmtM(available - x.minPrice)}</td>)}</tr>
            </tbody>
          </table>
        ) : <div class="pr-empty"><p>Select Resources with the compare buttons on catalogue cards.</p></div>}
      </div>
    </main>
  );
}
