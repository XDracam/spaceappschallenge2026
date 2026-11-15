// Science station: engineering tech tree. Left: what the planner's design needs beyond research, and the lab.
// Middle: the tree. Right: details of the selected tech with Start button. Bottom: news.
import { useMemo, useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import { DAYS_PER_MONTH, budgetAvailableM } from '../../../core/state';
import { scienceActions } from '../logic';
import { BRANCH_COLOR, BRANCH_LABEL, TECH_BY_ID } from '../data/techs';
import { describeGrant, describeNeed, designNeeds, formatDate, formatValue, keyInfo, running, sci } from '../model/research';
import { LAYOUT, NODE_H, NODE_W, needsFor, researchEta, routesFor, startCheck, techMonths, treeViews, type TechView } from '../model/tree';
import type { TechStatus } from '../model/types';

const STATUS_TEXT: Record<TechStatus, string> = {
  researched: 'Researched', running: 'In progress', available: 'Ready to start', blocked: 'Blocked by Comms',
  covered: 'Not needed', locked: 'Needs earlier techs', fog: 'Unknown',
};

export function App() {
  const g = useGame((s) => s);
  const [sel, setSel] = useState<string | null>(null);
  const views = useMemo(() => treeViews(g), [g]);
  const needs = useMemo(() => designNeeds(g).sort((a, b) => (a.researchBy ?? 1e9) - (b.researchBy ?? 1e9)), [g]);
  const slice = sci(g);
  const runs = running(g.research);

  return (
    <div class="sc-app">
      <header class="sc-head">
        <h1>Science · Engineering tech tree</h1>
        <span>Teams {runs.length}/{slice.slots} · Budget available {budgetAvailableM(g.budget).toFixed(0)} M · {formatDate(g.clock.day)}</span>
      </header>
      <div class="sc-work">
        <aside class="sc-left">
          <h2>The mission needs</h2>
          {needs.length === 0 ? <p class="muted">Nothing. Every part in the Planner's design is within research.</p> : null}
          {needs.map((n) => {
            const now = n.value === undefined ? undefined : g.research.limits[n.key];
            const eta = researchEta(g.research.projects, n.key, n.value);
            const late = n.researchBy !== undefined && (eta ?? g.clock.day) > n.researchBy;
            const routes = routesFor(n.key, n.value);
            return (
              <div class="sc-card" key={n.key}>
                <strong>{describeNeed(n)}</strong>
                <span class="muted">In the Planner's design{now === undefined ? '' : ` · researched so far: ${formatValue(now, keyInfo(n.key).unit)}`}</span>
                {n.researchBy === undefined ? null
                  : <span class={late ? 'sc-warn' : 'muted'}>Finish by {formatDate(n.researchBy)}, or the part arrives after launch.</span>}
                {eta !== undefined ? <span class="sc-goal">In progress · ends {formatDate(eta)}</span> : (
                  <div class="sc-links">
                    <span class="muted">{routes.length > 1 ? 'Research one of:' : 'Research:'}</span>
                    {routes.map((t) => <button type="button" key={t.id} onClick={() => setSel(t.id)}>{t.name} · {t.costM} M · {techMonths(t)} mo</button>)}
                  </div>
                )}
              </div>
            );
          })}
          <h2>Lab</h2>
          {runs.length === 0 ? <p class="muted">No project running.</p> : null}
          {runs.map((p) => {
            const total = Math.max(1, p.endsAt - p.startedAt);
            const pct = Math.min(100, Math.max(0, ((g.clock.day - p.startedAt) / total) * 100));
            const paused = slice.info[p.id]?.paused;
            return (
              <div class="sc-card" key={p.id}>
                <button type="button" class="sc-link" onClick={() => p.techId && setSel(p.techId)}><strong>{p.title}</strong></button>
                <div class="sc-bar"><i style={{ width: `${pct}%` }} /></div>
                <span class="muted">{paused ? 'Paused by Comms · ' : ''}ends {formatDate(p.endsAt)} · {Math.round(p.successChance * 100)} % success</span>
                <button type="button" class="sc-btn small" onClick={() => scienceActions.cancelProject(p.id)}>Cancel (half refund of unspent)</button>
              </div>
            );
          })}
        </aside>
        <main class="sc-tree" onClick={() => setSel(null)}>
          <div class="sc-canvas" style={{ width: `${LAYOUT.width}px`, height: `${LAYOUT.height}px` }}>
            {LAYOUT.lanes.map((l) => (
              <div key={l.branch} class="sc-lane" style={{ top: `${l.y}px`, height: `${l.h}px`, '--c': BRANCH_COLOR[l.branch] }}>
                <span>{BRANCH_LABEL[l.branch]}</span>
              </div>
            ))}
            <svg class="sc-edges" width={LAYOUT.width} height={LAYOUT.height}>
              {Object.values(TECH_BY_ID).flatMap((t) => t.requires.map((r) => {
                const a = LAYOUT.pos[r], b = LAYOUT.pos[t.id];
                const vis = views[t.id].status !== 'fog' && views[r].status !== 'fog';
                if (!vis) return null;
                const x1 = a.x + NODE_W / 2, x2 = b.x - NODE_W / 2, mx = (x1 + x2) / 2;
                const done = views[r].status === 'researched';
                return <path key={`${r}>${t.id}`} d={`M${x1},${a.y} C${mx},${a.y} ${mx},${b.y} ${x2},${b.y}`} class={done ? 'on' : ''} />;
              }))}
            </svg>
            {Object.values(TECH_BY_ID).map((t) => {
              const v: TechView = views[t.id];
              const p = LAYOUT.pos[t.id];
              return (
                <button type="button" key={t.id} data-tech={t.id}
                  class={`sc-node ${v.status} ${sel === t.id ? 'sel' : ''} ${v.goal ? 'goal' : ''}`}
                  style={{ left: `${p.x - NODE_W / 2}px`, top: `${p.y - NODE_H / 2}px`, width: `${NODE_W}px`, height: `${NODE_H}px`, '--c': BRANCH_COLOR[t.branch] }}
                  onClick={(e) => { e.stopPropagation(); setSel(t.id); }}>
                  <b>{v.status === 'fog' ? '?' : t.name}</b>
                  <small>{v.goal ? '★ goal · ' : ''}{STATUS_TEXT[v.status]}</small>
                </button>
              );
            })}
          </div>
        </main>
        <aside class="sc-right"><Inspector id={sel} views={views} /></aside>
      </div>
      <footer class="sc-news">
        {g.events.news.filter((n) => n.from === 'science' || n.affects.includes('science')).slice(0, 3).map((n) => <span key={n.id}>• {n.text}</span>)}
      </footer>
    </div>
  );
}

function Inspector({ id, views }: { id: string | null; views: Record<string, TechView> }) {
  const g = useGame((s) => s);
  if (!id) return <p class="muted">Select a tech. Several routes can lead to the same result: compare their cost, time and risk.</p>;
  const t = TECH_BY_ID[id];
  const v = views[id];
  if (v.status === 'fog') return <><h2>Unknown technology</h2><p class="muted">Research nearby techs to learn what lies here.</p></>;
  const chk = startCheck(g, id);
  const reqs = needsFor(t, designNeeds(g));
  const months = techMonths(t);
  return (
    <>
      <h2>{t.name}</h2>
      <p class="muted">{BRANCH_LABEL[t.branch]} · {STATUS_TEXT[v.status]}</p>
      <p>{t.blurb}</p>
      {t.gives.length ? <><h3>Result</h3><ul>{t.gives.map((x, i) => <li key={i}>{describeGrant(x)}</li>)}</ul></> : <p class="muted">Opens further techs.</p>}
      {reqs.length ? <p class="sc-goal">★ The mission needs this: {reqs.map(describeNeed).join('; ')}</p> : null}
      <h3>Requires</h3>
      {t.requires.length === 0 ? <p class="muted">Nothing.</p> : (
        <ul>{t.requires.map((r) => <li key={r}>{views[r].status === 'researched' ? '✓' : '○'} {views[r].status === 'fog' ? '?' : TECH_BY_ID[r].name}</li>)}</ul>
      )}
      {v.blocked ? <p class="sc-warn">{v.blockedWhy}</p> : null}
      {!t.start && v.status !== 'researched' ? (
        <>
          <p>{t.costM} M · {months} {months === 1 ? 'month' : 'months'}{v.status === 'running' ? '' : `, done ${formatDate(g.clock.day + months * DAYS_PER_MONTH)}`} · {Math.round(t.chance * 100)} % success</p>
          <button type="button" class="sc-btn" disabled={!chk.ok}
            onClick={() => scienceActions.startTech(`sp-${Date.now().toString(36)}-${id}`, id)}>Start research</button>
          {!chk.ok ? <p class="muted small">{chk.reason}</p> : null}
        </>
      ) : null}
    </>
  );
}
