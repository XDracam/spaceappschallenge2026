import type { Science } from '../state/science';
import type { Discipline } from '../model/types';
import { GRAPH } from '../model/graph';
import { DISCIPLINES } from '../data/fields';

/** Discipline list on top of the map. Shown in Overview only; a click hides or shows a discipline's fields. */
export function DisciplineOverview({ s }: { s: Science }) {
  return (
    <div class="disc-overlay" role="group" aria-label="Disciplines">
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
  );
}
