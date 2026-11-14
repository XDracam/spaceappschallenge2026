import type { Science } from '../state/science';
import { TaskPanel } from './TaskPanel';

export function LeftRail({ s }: { s: Science }) {
  return (
    <aside class="rail">
      <TaskPanel s={s} />

      <div class="stack-8">
        <h2 class="eyebrow">Node states</h2>
        <div class="legend"><span class="swatch est" /><span><strong>Established</strong> <span class="muted">known</span></span></div>
        <div class="legend"><span class="swatch fr" /><span><strong>Frontier</strong> <span class="muted">open questions</span></span></div>
        <div class="legend"><span class="swatch hint" /><span><strong>Hinted</strong> <span class="muted">partly seen</span></span></div>
        <div class="legend"><span class="swatch fog" /><span><strong>Unknown</strong> <span class="muted">nobody looked</span></span></div>
        <div class="legend"><span class="swatch task" /><span><strong>Related</strong> <span class="muted">to the open task</span></span></div>
      </div>
    </aside>
  );
}
