// Science station: engineering tech tree. Left: what the planner's design needs beyond research, the lab,
// and the tests of delivered parts.
// Middle: the tree. Right: details of the selected tech with Start button. Bottom: news.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useGame } from '../../../core/store';
import { requestConfirmation } from '../../../shared/confirmation';
import { composeTask } from '../../../shared/taskDraft';
import { DAYS_PER_MONTH, budgetAvailableM } from '../../../core/state';
import { scienceActions } from '../logic';
import { BRANCH_COLOR, BRANCH_LABEL, TECH_BY_ID } from '../data/techs';
import { cancellationRefund, describeGrant, describeNeed, designNeeds, formatDate, formatValue, keyInfo, running, sci } from '../model/research';
import { isCovered, neededAsPrerequisite, LAYOUT, NODE_H, NODE_W, needsFor, researchEta, routesFor, startCheck, techMonths, treeViews, type TechView } from '../model/tree';
import { partTests, testCheck, testCounts, testDays, testDurationText } from '../model/tests';
import type { TechStatus } from '../model/types';
import type { GameState } from '../../../core/state';

const STATUS_TEXT: Record<TechStatus, string> = {
  researched: 'Researched', running: 'In progress', available: 'Ready to start', blocked: 'Blocked by Comms',
  covered: 'Not needed', locked: 'Needs earlier techs', fog: 'Unknown',
};

/** Status words of a tile: a tech out of reach in this mission says so instead of "Blocked by Comms" / "Needs earlier techs". */
const statusText = (v: TechView): string => (v.unavailable ? 'Not in this mission' : STATUS_TEXT[v.status]);

export function App() {
  const g = useGame((s) => s);
  const [sel, setSel] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const views = useMemo(() => treeViews(g), [g]);
  const needs = useMemo(() => designNeeds(g).sort((a, b) => (a.researchBy ?? 1e9) - (b.researchBy ?? 1e9)), [g]);
  const slice = sci(g);
  const runs = running(g.research);

  useEffect(() => {
    const navigate = (event: Event) => {
      const link = (event as CustomEvent<{ kind: string; techId?: string; partId?: string; projectId?: string }>).detail;
      const project = link.projectId && g.research.projects.find(p => p.id === link.projectId);
      const techId = link.techId ?? (project && project.techId);
      if (techId && TECH_BY_ID[techId]) setSel(techId);
      // The board closes and restores its trigger focus synchronously; focus the destination afterwards.
      requestAnimationFrame(() => {
        const container = root.current;
        if (!container) return;
        const find = (attribute: string, value?: string) => value
          ? Array.from(container.querySelectorAll<HTMLElement>(`[${attribute}]`)).find(el => el.getAttribute(attribute) === value)
          : undefined;
        const target = find('data-project', link.projectId)
          ?? find('data-test', link.partId || (project && project.partId) || undefined)
          ?? find('data-tech', techId || undefined)
          ?? (link.kind === 'scienceLab' ? container.querySelector<HTMLElement>('[data-science-lab]') : null)
          ?? container.querySelector<HTMLElement>('[data-science-home]');
        target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        target?.focus({ preventScroll: true });
      });
    };
    window.addEventListener('coordination-science', navigate);
    return () => window.removeEventListener('coordination-science', navigate);
  }, [g.research.projects]);

  return (
    <div class="sc-app" ref={root}>
      <header class="sc-head">
        <h1>Science · Engineering tech tree</h1>
        <span>Teams {runs.length}/{slice.slots} · Budget available {budgetAvailableM(g.budget).toFixed(0)} M · {formatDate(g.clock.day)}</span>
      </header>
      <div class="sc-work">
        <aside class="sc-left">
          <p class="muted">Research the design’s needs, then tell Procurement what is ready. Test delivered parts before launch; ask the Planner for more time after a failure.</p>
          <h2 data-science-home tabIndex={-1}>The mission needs</h2>
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
          <h2 data-science-lab tabIndex={-1}>Lab</h2>
          {runs.length === 0 ? <p class="muted">No project running.</p> : null}
          {runs.map((p) => {
            const total = Math.max(1, p.endsAt - p.startedAt);
            const pct = Math.min(100, Math.max(0, ((g.clock.day - p.startedAt) / total) * 100));
            const paused = slice.info[p.id]?.paused;
            return (
              <div class="sc-card" key={p.id} data-project={p.id} data-test={p.partId} tabIndex={-1}>
                <button type="button" class="sc-link" onClick={() => p.techId && setSel(p.techId)}><strong>{p.title}</strong></button>
                <div class="sc-bar"><i style={{ width: `${pct}%` }} /></div>
                {p.partId
                  ? <span class={testCounts(p.endsAt, g.planner.plan.launchDay) ? 'muted' : 'sc-warn'}>ends {formatDate(p.endsAt)}{testCounts(p.endsAt, g.planner.plan.launchDay) ? '' : ': not before the launch, it will not count'}</span>
                  : <span class="muted">{paused ? 'Paused by Comms · ' : ''}ends {formatDate(p.endsAt)} · {Math.round(p.successChance * 100)} % success</span>}
                <button type="button" class="sc-btn small" onClick={async () => {
                  const accepted = await requestConfirmation(`Cancel “${p.title}”? Current refund: ${cancellationRefund(p, g.clock.day).toFixed(1)} M of ${p.costM} M invested. Only half the unspent share returns; the refund decreases while the calendar runs. Cancellation provides no research or test result.`, 'Cancel project');
                  if (accepted) scienceActions.cancelProject(p.id);
                }}>Cancel project…</button>
              </div>
            );
          })}
          <PartTests g={g} />
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
                  class={`sc-node ${v.unavailable ? 'covered' : v.status} ${sel === t.id ? 'sel' : ''} ${v.goal ? 'goal' : ''}`}
                  style={{ left: `${p.x - NODE_W / 2}px`, top: `${p.y - NODE_H / 2}px`, width: `${NODE_W}px`, height: `${NODE_H}px`, '--c': BRANCH_COLOR[t.branch] }}
                  onClick={(e) => { e.stopPropagation(); setSel(t.id); }}>
                  <b>{v.status === 'fog' ? '?' : t.name}</b>
                  <small>{v.goal ? '★ goal · ' : ''}{!v.unavailable && v.status === 'available' && isCovered(t, g.research) && neededAsPrerequisite(g, t.id) ? 'Ready · prerequisite' : statusText(v)}</small>
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

const pct = (v: number) => `${Math.round(v * 1000) / 10}\u00a0%`;

/**
 * Tests of the design's parts: a free team can test a delivered part and halve its risk of failure.
 * Weakest part first; parts still on their way show when they arrive and whether a test still fits before launch.
 */
function PartTests({ g }: { g: GameState }) {
  const tests = useMemo(() => partTests(g), [g.planner, g.market, g.research.projects]);
  if (g.meta.phase !== 'planning') return null;
  const launch = g.planner.plan.launchDay;
  const days = testDays();
  const byRisk = (a: { reliability: number }, b: { reliability: number }) => a.reliability - b.reliability;
  const ready = tests.filter((t) => t.state === 'ready').sort(byRisk);
  const arriving = tests.filter((t) => t.state === 'arriving').sort((a, b) => (a.arrivesAt ?? 0) - (b.arrivesAt ?? 0));
  const open = tests.filter((t) => t.state === 'open');
  const tested = tests.filter((t) => t.state === 'tested');
  const tooLate = !testCounts(g.clock.day + days, launch);
  return (
    <>
      <h2>Part tests</h2>
      <p class="muted">A team tests a delivered part for {testDurationText()} and halves its risk of failure. A test counts if it ends before the launch on {formatDate(launch)}.</p>
      {ready.map((t) => {
        const chk = testCheck(g, t.partId);
        return (
          <div class="sc-card" key={t.partId} data-test={t.partId} tabIndex={-1}>
            <strong>{t.name}</strong>
            <span class="muted">{t.product} · {pct(t.reliability)} reliable</span>
            <button type="button" class="sc-btn sc-test" disabled={!chk.ok}
              onClick={() => scienceActions.startTest(`st-${Date.now().toString(36)}-${t.partId}`, t.partId)}>
              Test · {t.costM} M · {testDurationText()} → {pct(t.after)}
            </button>
            {!chk.ok ? <span class="muted small">{chk.reason}</span>
              : tooLate ? <><span class="sc-warn">Would not end before the launch. Ask the Planner to move it.</span>
                <button type="button" class="sc-btn small" onClick={() => composeTask({ purpose: 'timing', parentNeedId: g.market.tasks.find(need => need.partId === t.partId && need.status === 'open')?.id, neededAt: g.clock.day + days, requestKey: `science:timing:${t.partId}`, title: `Launch timing for ${t.name} test`, description: `Science can test ${t.name} in ${testDurationText()}, ending ${formatDate(g.clock.day + days)}. The current launch is ${formatDate(launch)}; the test must finish before launch to count. Please review the launch date.`, assignee: 'planner' })}>Create launch timing task</button></> : null}
          </div>
        );
      })}
      {arriving.length ? (
        <div class="sc-card">
          <strong>On their way</strong>
          {arriving.map((t) => {
            const late = !testCounts((t.arrivesAt ?? 0) + days, launch);
            return (
              <span class={`sc-row ${late ? 'sc-warn' : 'muted'}`} key={t.partId} data-test={t.partId} tabIndex={-1}>
                <span>{t.name} · {pct(t.reliability)}</span>
                <span>{formatDate(t.arrivesAt ?? 0).slice(0, -5)}</span>
              </span>
            );
          })}
          {arriving.some((t) => !testCounts((t.arrivesAt ?? 0) + days, launch))
            ? <span class="muted"><span class="sc-warn">Red: too late to test before the launch.</span> Procurement can speed up a delivery, the Planner can move the launch.</span> : null}
        </div>
      ) : null}
      {open.length ? <p class="muted">Not under contract: {open.map((t, i) => <span key={t.partId} data-test={t.partId} tabIndex={-1}>{i ? ', ' : ''}{t.name}</span>)}.</p> : null}
      {tested.length ? <p class="muted">Tested: {tested.map((t, i) => <span key={t.partId} data-test={t.partId} tabIndex={-1}>{i ? ', ' : ''}{t.name} {pct(t.reliability)}</span>)}.</p> : null}
    </>
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
      <p class="muted">{BRANCH_LABEL[t.branch]} · {statusText(v)}</p>
      <p>{t.blurb}</p>
      {t.gives.length ? <><h3>Result</h3><ul>{t.gives.map((x, i) => <li key={i}>{describeGrant(x)}</li>)}</ul></> : <p class="muted">Opens further techs.</p>}
      {reqs.length ? <p class="sc-goal">★ The mission needs this: {reqs.map(describeNeed).join('; ')}</p> : null}
      {!v.unavailable && isCovered(t, g.research) && neededAsPrerequisite(g, t.id) && v.status !== 'researched'
        ? <p class="muted">Its results are already within research. Research it to satisfy later technology prerequisites; it will not raise these limits again.</p> : null}
      {reqs.some(n => n.researchBy !== undefined && g.clock.day + months * DAYS_PER_MONTH > n.researchBy)
        ? <p class="sc-warn">This route finishes after the current order-by date. Ask the Planner to move launch, or choose a faster research route.</p> : null}
      <h3>Requires</h3>
      {t.requires.length === 0 ? <p class="muted">Nothing.</p> : (
        <ul>{t.requires.map((r) => <li key={r}>{views[r].status === 'researched' ? '✓' : '○'} {views[r].status === 'fog' ? '?' : TECH_BY_ID[r].name}</li>)}</ul>
      )}
      {v.blocked ? <p class={v.unavailable ? 'muted' : 'sc-warn'}>{v.blockedWhy}</p> : null}
      {v.unavailable && !v.blocked ? <p class="muted">It builds on a tech no one can approve in this mission.</p> : null}
      {!t.start && v.status !== 'researched' && !v.unavailable ? (
        <>
          <p>{t.costM} M · {months} {months === 1 ? 'month' : 'months'}{v.status === 'running' ? '' : `, done ${formatDate(g.clock.day + months * DAYS_PER_MONTH)}`} · {Math.round(t.chance * 100)} % success</p>
          <button type="button" class="sc-btn" disabled={!chk.ok}
            onClick={() => scienceActions.startTech(`sp-${Date.now().toString(36)}-${id}`, id)}>Start research</button>
          {!chk.ok ? <p class="muted small">{chk.reason}</p> : null}
          {t.costM > budgetAvailableM(g.budget) && g.meta.phase === 'planning' ? <button type="button" class="sc-btn small" onClick={() => composeTask({ purpose: 'funding', requestKey: `science:funding:${t.id}`, title: `Funding for ${t.name}`, description: `Science proposes ${t.name}, costing ${t.costM} M with ${budgetAvailableM(g.budget).toFixed(2)} M currently available. The shortfall is ${(t.costM - budgetAvailableM(g.budget)).toFixed(2)} M. Research takes ${months} months with ${Math.round(t.chance * 100)}% success. Please review funding options.`, assignee: 'comms' })}>Create funding task</button> : null}
        </>
      ) : null}
    </>
  );
}
