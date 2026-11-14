import { useState } from 'preact/hooks';
import type { CombineResult, FieldState } from '../model/types';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';

const STATE_LABEL: Record<FieldState, string> = { est: 'Established', fr: 'Frontier', hint: 'Hinted', fog: 'Unknown' };

interface Option { id: string; title: string; text: string; note: string; tone: 'green' | 'amber' | 'orange' | 'muted' }

// Placeholder rules: scope and method change the rough estimate. Real numbers belong to the project model, which is still open.
const SCOPES: (Option & { duration: string; cost: string; chance: string })[] = [
  { id: 'safe', title: 'Safe: rule out a source', text: 'A narrow question about what cannot explain the pattern.', note: '~4 months · almost certain to answer', tone: 'green', duration: '3–5 months', cost: '0.3–0.5 M', chance: 'High' },
  { id: 'balanced', title: 'Balanced: test the link', text: 'Test whether the combined fields really behave together.', note: '~8 months · medium odds', tone: 'amber', duration: '7–10 months', cost: '0.9–1.3 M', chance: 'Medium' },
  { id: 'bold', title: 'Bold: claim a result', text: 'Argue for the strongest reading of the pattern.', note: '~14 months · long shot, draws scrutiny', tone: 'orange', duration: '12–16 months', cost: '1.8–2.6 M', chance: 'Low' },
];
const METHODS: Option[] = [
  { id: 'archive', title: 'Re-use archives', text: 'Existing orbiter and rover data. Fast and cheap, but noisy.', note: 'No other station needed', tone: 'green' },
  { id: 'new', title: 'New measurements', text: 'Our own instrument. Clean data, but only after arrival.', note: 'Creates tasks for Planning and Procurement', tone: 'amber' },
  { id: 'model', title: 'Model only', text: 'Predict the pattern from physics. Tests ideas, not the world.', note: 'Needs compute time', tone: 'muted' },
];
const CHANCE_COLOR = { High: '#4cc38a', Medium: '#f2b84b', Low: '#ff8a5d' } as const;

function Choice({ o, on, onPick }: { o: Option; on: boolean; onPick: () => void }) {
  return (
    <button class={'choice' + (on ? ' on' : '')} aria-pressed={on} onClick={onPick}>
      <strong>{o.title}</strong>
      <span class="muted small">{o.text}</span>
      <span class={'small tone-' + o.tone}>{o.note}</span>
    </button>
  );
}

export function DraftProject({ result, bench, onBack }: { result: CombineResult; bench: string[]; onBack: () => void }) {
  const [scope, setScope] = useState('balanced');
  const [method, setMethod] = useState('new');
  const [started, setStarted] = useState(false);
  const recipe = result.kind === 'recipe' ? result.recipe : null;
  const title = recipe ? recipe.title : `Long shot: ${result.names}`;
  const pitch = recipe ? recipe.pitch : 'Nobody has seen these fields together. A cheap first look might find a link, or nothing.';
  const sc = SCOPES.find((x) => x.id === scope)!;
  const needs = method === 'new' && recipe ? recipe.needs : method === 'archive' ? 'Archive access only' : method === 'model' ? 'Compute time (none from other stations)' : 'Instrument or sampling time (Procurement, Planning)';

  return (
    <div class="app draft">
      <header class="topbar">
        <span class="badge">SCIENCE</span>
        <nav aria-label="Breadcrumb" class="row muted">
          <button class="crumb" onClick={onBack}>Field map</button><span aria-hidden="true">›</span>
          <button class="crumb" onClick={onBack}>Combination bench</button><span aria-hidden="true">›</span>
          <span class="strong">New project</span>
        </nav>
        <div class="grow" />
        <span class="muted small">Draft stays on your station until you start it</span>
      </header>

      <div class="draft-body">
        <div class="draft-main">
          <section class="card">
            <div class="eyebrow">What you combined</div>
            <div class="row wrap big-gap">
              {bench.map((id, i) => {
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
                <div class={'eyebrow ' + (recipe ? 'green' : 'orange')}>{recipe ? 'Project idea' : 'Long shot'}</div>
                <h1 class="draft-title">{title}</h1>
              </div>
            </div>
            <p class="soft pitch">{pitch}</p>
          </section>

          <section class="card">
            <h2 class="step"><span class="mono muted">1</span>How far do you reach?</h2>
            <p class="muted small">A narrow question is cheap and usually answered. A bold one can change the map, or end in "we found a rock".</p>
            <div class="choices">{SCOPES.map((o) => <Choice key={o.id} o={o} on={scope === o.id} onPick={() => setScope(o.id)} />)}</div>
          </section>

          <section class="card">
            <h2 class="step"><span class="mono muted">2</span>How do you get evidence?</h2>
            <div class="choices">{METHODS.map((o) => <Choice key={o.id} o={o} on={method === o.id} onPick={() => setMethod(o.id)} />)}</div>
          </section>

          <section class="card">
            <div class="row baseline wrap">
              <h2 class="step"><span class="mono muted">3</span>Who works on it?</h2>
              <span class="muted small">placeholder: the personnel model is still open</span>
            </div>
            <div class="choices">
              <div class="person on"><span class="avatar">A</span><span><strong>[Researcher A]</strong><br /><span class="muted small">Senior researcher</span></span></div>
              <div class="person add"><span class="avatar dashed">+</span><span><strong class="soft">Add a second researcher</strong><br /><span class="small">shorter, costs more</span></span></div>
            </div>
          </section>
        </div>

        <aside class="draft-side">
          <div class="card">
            <h2 class="side-title">Rough estimate</h2>
            <p class="muted small">Ranges, never exact: research is uncertain. All numbers are placeholders.</p>
            <div class="estimate">
              <span class="muted">Duration</span><span class="mono">{sc.duration}</span>
              <span class="muted">Cost</span><span class="mono">{sc.cost}</span>
              <span class="muted">Chance of a clear result</span><span class="strong" style={{ color: CHANCE_COLOR[sc.chance as keyof typeof CHANCE_COLOR] }}>{sc.chance}</span>
            </div>
            <hr />
            <div class="stack-6">
              <div class="eyebrow">Needs from other stations</div>
              <div class="soft">→ {needs}</div>
              {scope === 'bold' && <div class="soft amber">→ Comms: a bold claim will draw scrutiny</div>}
            </div>
          </div>
          {started && <div class="callout">Project started (not connected to the other stations yet). Nothing is saved.</div>}
          <div class="row">
            <button class="ghost grow" onClick={onBack}>Back to map</button>
            <button class="primary grow2" disabled={started} onClick={() => setStarted(true)}>{started ? 'Started' : 'Start project'}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
