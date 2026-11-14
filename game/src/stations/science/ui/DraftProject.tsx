import { useEffect, useState } from 'preact/hooks';
import type { FieldState } from '../model/types';
import type { MethodId, ScopeId } from '../slice';
import type { Science } from '../state/science';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';
import { recipeKey } from '../data/recipes';
import { useConfirmedGame, useGame } from '../../../core/store';
import { budgetAvailableM } from '../../../core/state';
import { scienceActions } from '../logic';
import {
  METHODS, SCOPES, TEST_UNIT_BONUS, describeEffect, formatDate, formatMonth, keyInfo, neededValue, planProject, requestsTouchedBy, sci, scienceSupplies,
} from '../model/research';
import { ODDS_COLOR } from './Bench';

const STATE_LABEL: Record<FieldState, string> = { est: 'Established', fr: 'Frontier', hint: 'Hinted', fog: 'Unknown' };

function newProjectId(): string {
  return `sci-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Draft a project from the bench: choose scope and method, see cost, duration and odds, start it. */
export function DraftProject({ s }: { s: Science }) {
  const [scope, setScope] = useState<ScopeId>('balanced');
  const [method, setMethod] = useState<MethodId>('new');
  const [supplyId, setSupplyId] = useState('');
  const [draftProjectId] = useState(newProjectId);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const confirmedProject = useConfirmedGame(g => submittedId ? g.research.projects.find(p => p.id === submittedId) : undefined);
  useEffect(() => { if (confirmedProject) s.projectStarted(confirmedProject.title); }, [confirmedProject]);
  const game = useGame((g) => g);
  const key = recipeKey(s.bench);
  const plan = planProject(game, key, scope, method);
  const recipe = plan.recipe;
  const available = budgetAvailableM(game.budget);
  const launchDay = game.planner.plan.launchDay;
  const day = game.clock.day;
  const endsAt = day + plan.days;
  const slots = sci(game).slots;
  const busy = game.research.projects.filter((p) => p.status === 'running').length;
  const answers = requestsTouchedBy(game, plan.keys);
  const tp = recipe?.testPart;
  const supplies = tp && method === 'new' ? scienceSupplies(game, tp) : [];
  const selectedSupply = supplies.find(x => x.allocation.id === supplyId && x.compatible && x.available);

  const staleSupply = !!supplyId && method === 'new' && !!tp && !selectedSupply;
  const start = () => {
    if (plan.blocked || staleSupply) return;
    setSubmittedId(draftProjectId);
    scienceActions.startProject(draftProjectId, key, scope, method, selectedSupply?.allocation.id);
  };

  return (
    <div class="sci-app draft">
      <header class="topbar">
        <div class="brand">
          <div class="wordmark">SCIENCE</div>
          <nav aria-label="Breadcrumb" class="row brand-sub">
            <button class="crumb" onClick={s.closeDraft}>Field map</button><span aria-hidden="true">›</span>
            <button class="crumb" onClick={s.closeDraft}>Combination bench</button><span aria-hidden="true">›</span>
            <span class="strong">New project</span>
          </nav>
        </div>
        <div class="tb-right small muted">
          <span>Today <strong class="num">{formatDate(day)}</strong></span>
          <span>Budget <strong class="num">{Math.round(available)} M</strong> available</span>
          <span>Teams <strong class="num">{busy}/{slots}</strong> busy</span>
        </div>
      </header>

      <div class="draft-body">
        <div class="draft-main">
          <section class="card glass">
            <div class="eyebrow">What you combined</div>
            <div class="row wrap big-gap">
              {s.bench.map((id, i) => {
                const n = GRAPH.byId[id];
                return (
                  <span key={id} class="row big-gap">
                    {i > 0 && <span class="op" aria-hidden="true">+</span>}
                    <span class="ingredient">
                      <span class="dot" style={{ background: DISCIPLINES[n.discipline].color }} />
                      <span class="medium">{n.label}</span>
                      <span class="small blue">{STATE_LABEL[n.state]}</span>
                    </span>
                  </span>
                );
              })}
              <span class="op" aria-hidden="true">=</span>
              <div class={'outcome' + (recipe ? '' : ' none')}>
                <div class={'eyebrow ' + (recipe ? 'green' : 'orange')}>{recipe ? (plan.pure ? 'Pure science idea' : 'Project idea') : 'Long shot'}</div>
                <h1 class="draft-title">{plan.title}</h1>
              </div>
            </div>
            <p class="soft pitch">{plan.pitch}</p>
          </section>

          <section class="card glass">
            <h2 class="step"><span class="num muted">1</span>How far do you reach?</h2>
            <p class="muted small">A narrow question is cheap and usually answered. A bold one can move the limits a long way, or end in "we found a rock".</p>
            <div class="choices">
              {SCOPES.map((o) => {
                const p = planProject(game, key, o.id, method);
                return (
                  <button key={o.id} class={'choice' + (scope === o.id ? ' on' : '')} aria-pressed={scope === o.id} onClick={() => setScope(o.id)}>
                    <strong>{o.title}</strong>
                    <span class="muted small">{o.text}</span>
                    <span class={'small num tone-' + o.tone}>~{p.months} mo · {p.costM} M · {Math.round(p.successChance * 100)}%</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section class="card glass">
            <h2 class="step"><span class="num muted">2</span>How do you get evidence?</h2>
            <div class="choices">
              {METHODS.map((o) => {
                const p = planProject(game, key, scope, o.id);
                return (
                  <button key={o.id} class={'choice' + (method === o.id ? ' on' : '')} aria-pressed={method === o.id} onClick={() => setMethod(o.id)}>
                    <strong>{o.title}</strong>
                    <span class="muted small">{o.text}</span>
                    <span class={'small num tone-' + o.tone}>~{p.months} mo · {p.costM} M · {Math.round(p.successChance * 100)}%</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section class="card glass">
            <div class="row baseline wrap">
              <h2 class="step"><span class="num muted">3</span>Who works on it?</h2>
              <span class="muted small">placeholder: the personnel model is still open (Q-019)</span>
            </div>
            <div class="choices">
              <div class="person on"><span class="avatar">A</span><span><strong>Your senior researcher</strong><br /><span class="muted small">leads one of {slots} research teams</span></span></div>
              <div class="person add"><span class="avatar dashed">+</span><span><strong class="soft">More teams later</strong><br /><span class="small">{Math.max(0, slots - busy)} free right now</span></span></div>
            </div>
          </section>
        </div>

        <aside class="draft-side">
          <div class="card glass">
            <h2 class="side-title">Estimate</h2>
            <div class="estimate">
              <span class="muted">Duration</span>
              <span class="num">~{plan.months} months</span>
              <span class="muted">Result</span>
              <span class={'num' + (endsAt > launchDay ? ' orange' : '')}>~{formatMonth(endsAt)}{endsAt > launchDay ? ' (after launch)' : ''}</span>
              <span class="muted">Cost (paid now)</span>
              <span class={'num' + (plan.costM > available ? ' err-text' : '')}>{plan.costM} M</span>
              <span class="muted">Chance of success</span>
              <span class="strong" style={{ color: ODDS_COLOR[plan.odds] }}>{plan.odds} · {Math.round(plan.successChance * 100)}%{selectedSupply?.contract.status === 'delivered' ? ` → ${Math.round(Math.min(0.97, plan.successChance + TEST_UNIT_BONUS) * 100)}% with unit` : selectedSupply ? ` · ${Math.round(Math.min(0.97, plan.successChance + TEST_UNIT_BONUS) * 100)}% if equipment arrives` : ''}</span>
            </div>
            <hr />
            <div class="stack-6">
              <div class="eyebrow">On success</div>
              {plan.effects.filter((e) => e.kind !== 'flag').map((e, i) => (
                <div key={i} class="soft">→ {describeEffect(e, game.research)}</div>
              ))}
              {plan.pure && <div class="soft">→ {recipe?.finding ? `A finding for the press: ${recipe.finding}` : 'Maybe an unexpected link, a story for Comms.'}</div>}
              {!plan.pure && plan.effects.every((e) => e.kind === 'flag') && <div class="muted small">Nothing to gain with these choices.</div>}
              <div class="muted small">On failure: money and time are gone, and the press may hear about it.</div>
            </div>
            {answers.length > 0 && (
              <>
                <hr />
                <div class="stack-6">
                  <div class="eyebrow">Answers a request from Mission Planning</div>
                  {answers.map((t) => {
                    const lines = t.beyondResearch.filter((k) => plan.keys.includes(k)).map((k) => {
                      const e = plan.effects.find((x) => (x.kind === 'researchLimit' || x.kind === 'unlock') && x.key === k);
                      const need = neededValue(t, k);
                      const meets = e?.kind === 'unlock' || (e?.kind === 'researchLimit' && need !== undefined && e.value >= need - 1e-9);
                      const ki = keyInfo(k);
                      return (
                        <div key={k} class={'small ' + (meets ? 'green' : 'amber')}>
                          {meets ? '✓' : '●'} {ki.label}{need !== undefined && !meets ? `: needs ${need} ${ki.unit}, this gets part of the way` : ''}
                        </div>
                      );
                    });
                    return <div key={t.id} class="stack-4"><div class="soft">"{t.title}"</div>{lines}</div>;
                  })}
                </div>
              </>
            )}
            <hr />
            <div class="stack-6">
              {tp && method === 'new' && (
                <div class="stack-6">
                  <label for="draft-equipment">{tp.label} (optional)</label>
                  <select id="draft-equipment" value={supplyId} onChange={e => setSupplyId((e.currentTarget as HTMLSelectElement).value)}>
                    <option value="">No test unit</option>
                    {supplies.map(({ allocation, contract, compatible, available }) => (
                      <option key={allocation.id} value={allocation.id} disabled={!compatible || !available}>
                        {contract.offerSnapshot.resource.name} · {contract.status === 'delivered' ? 'delivered' : `expected ${formatMonth(contract.expectedAt)}`} · {compatible ? available ? `${allocation.quantity} available` : 'reserved' : 'incompatible'}
                      </option>
                    ))}
                  </select>
                  {staleSupply && <span role="status" class="err-text small">Unit unavailable. Choose another or continue without equipment.</span>}
                  {!selectedSupply && <span class="small muted">+{Math.round(TEST_UNIT_BONUS * 100)} points with equipment · 97% cap</span>}
                </div>
              )}
              {scope === 'bold' && <div class="soft amber">→ Comms: a bold claim draws scrutiny</div>}
            </div>
          </div>
          {plan.blocked && <div class="callout warn">{plan.blocked}</div>}
          <div class="row">
            <button class="btn ghost grow tall" onClick={s.closeDraft}>Back to map</button>
            <button class="btn primary grow2 tall" disabled={!!plan.blocked || staleSupply} onClick={start}>Start project · {plan.costM} M</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
