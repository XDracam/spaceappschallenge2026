import type { Science } from '../state/science';
import type { Discipline } from '../model/types';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';

const frontier = GRAPH.nodes
  .filter((n) => n.state === 'fr')
  .sort((a, b) => Object.keys(DISCIPLINES).indexOf(a.discipline) - Object.keys(DISCIPLINES).indexOf(b.discipline) || a.index - b.index);

export function matchingFields(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return GRAPH.nodes.filter((n) => n.state !== 'fog' && n.label.toLowerCase().includes(q)).map((n) => n.id);
}

export function LeftRail({ s }: { s: Science }) {
  const matches = matchingFields(s.search).length;
  return (
    <aside class="rail">
      <div class="stack-6">
        <label for="search" class="eyebrow">Find a field</label>
        <div class="search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a97ad" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="search" type="text" value={s.search} placeholder="radar, ice, methane…"
            onInput={(e: Event) => s.setSearch((e.target as HTMLInputElement).value)}
          />
        </div>
        <div class="note">{s.search.trim() ? `${matches} ${matches === 1 ? 'field matches' : 'fields match'}` : ''}</div>
      </div>

      <div class="stack-4">
        <div class="row baseline">
          <h2 class="eyebrow">Frontier fields</h2>
          <span class="grow" />
          <span class="mono">{frontier.length}</span>
        </div>
        <p class="hint">Where your group's knowledge ends. Jump to one, or combine it with a neighbour.</p>
        {frontier.map((n) => (
          <button key={n.id} class={'list-btn' + (n.id === s.selected ? ' on' : '')} onClick={() => s.pickNode(n.id)}>
            <span class="dot" style={{ background: DISCIPLINES[n.discipline].color }} />
            <span class="ellipsis grow left">{n.label}</span>
          </button>
        ))}
      </div>

      <div class="stack-4">
        <h2 class="eyebrow">Disciplines</h2>
        {(Object.keys(DISCIPLINES) as Discipline[]).map((d) => {
          const off = !!s.hidden[d];
          const count = GRAPH.nodes.filter((n) => n.discipline === d && n.state !== 'fog').length;
          return (
            <button key={d} class="list-btn" aria-pressed={!off} style={{ opacity: off ? 0.45 : 1 }} onClick={() => s.toggleDiscipline(d)}>
              <span class="dot big" style={{ background: DISCIPLINES[d].color }} />
              <span class="grow left">{DISCIPLINES[d].name}</span>
              <span class="mono muted small">{count}</span>
            </button>
          );
        })}
      </div>

      <div class="stack-8">
        <h2 class="eyebrow">Node states</h2>
        <div class="legend"><span class="swatch est" /><span><strong>Established</strong> <span class="muted">known</span></span></div>
        <div class="legend"><span class="swatch fr" /><span><strong>Frontier</strong> <span class="muted">open questions</span></span></div>
        <div class="legend"><span class="swatch hint" /><span><strong>Hinted</strong> <span class="muted">partly seen</span></span></div>
        <div class="legend"><span class="swatch fog" /><span><strong>Unknown</strong> <span class="muted">nobody looked</span></span></div>
      </div>
    </aside>
  );
}
