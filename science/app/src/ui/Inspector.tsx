import type { Science } from '../state/science';
import type { FieldState } from '../model/types';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';
import { FIELD_FACTS, HINTED_NOTE, OPEN_QUESTIONS, UNKNOWN_NOTE } from '../data/descriptions';
import { MAX_BENCH } from '../model/combine';

const STATE: Record<FieldState, { label: string; cls: string }> = {
  est: { label: 'Established', cls: 'est' },
  fr: { label: 'Frontier', cls: 'fr' },
  hint: { label: 'Hinted', cls: 'hint' },
  fog: { label: 'Unknown', cls: 'fog' },
};

export function Inspector({ s }: { s: Science }) {
  const n = GRAPH.byId[s.selected];
  const disc = DISCIPLINES[n.discipline];
  const fog = n.state === 'fog';
  const onBench = s.bench.includes(n.id);
  const full = s.bench.length >= MAX_BENCH && !onBench;
  const open = n.state === 'fr' ? OPEN_QUESTIONS[n.id] : n.state === 'hint' ? HINTED_NOTE : '';

  return (
    <aside class="inspector">
      <div class="stack-8">
        <div class="row wrap">
          <span class={'pill ' + STATE[n.state].cls}>{STATE[n.state].label}</span>
          <span class="pill" style={{ background: disc.color + '22', color: disc.color }}>{disc.name}</span>
        </div>
        <h1 class="field-title">{fog ? 'Unknown field' : n.label}</h1>
      </div>

      <div class="stack-6">
        <h2 class="eyebrow">About this field</h2>
        <p class="fact">{fog ? UNKNOWN_NOTE : FIELD_FACTS[n.id]}</p>
      </div>

      {open && (
        <div class="callout">
          <h2 class="eyebrow">{n.state === 'fr' ? 'Open question' : 'Still hidden'}</h2>
          <div class="soft">{open}</div>
        </div>
      )}

      <div class="stack-8">
        <h2 class="eyebrow">Connected to</h2>
        <div class="row wrap">
          {GRAPH.adjacency[n.id].slice(0, 10).map((id) => {
            const m = GRAPH.byId[id];
            return (
              <button key={id} class="neighbor" onClick={() => s.select(id)}>
                <span class="dot" style={{ background: DISCIPLINES[m.discipline].color }} />
                {m.state === 'fog' ? 'Unknown' : m.label}
              </button>
            );
          })}
        </div>
      </div>

      {!fog && (
        <button class={'bench-toggle' + (onBench ? ' remove' : '')} disabled={full} onClick={() => s.toggleBench(n.id)}>
          {onBench ? 'Remove from bench' : full ? 'Bench is full' : 'Add to bench'}
        </button>
      )}
    </aside>
  );
}
