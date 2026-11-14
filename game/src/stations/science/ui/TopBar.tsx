import { useGame } from '../../../core/store';
import { budgetAvailableM } from '../../../core/state';
import { formatDate } from '../model/research';
import { sci } from '../model/research';
import type { Science } from '../state/science';

/** Station header: role, agency calendar, budget, launch countdown, team load. No pause control. */
export function TopBar({ s }: { s: Science }) {
  const day = useGame((g) => Math.floor(g.clock.day));
  const flowing = useGame((g) => g.clock.running && g.meta.phase === 'planning');
  const phase = useGame((g) => g.meta.phase);
  const total = useGame((g) => g.budget.fundingTotalM);
  const available = useGame((g) => budgetAvailableM(g.budget));
  const launchDay = useGame((g) => g.planner.plan.launchDay);
  const slots = useGame((g) => sci(g).slots);
  const busy = useGame((g) => g.research.projects.filter((p) => p.status === 'running').length);
  const toLaunch = Math.ceil(launchDay - day);
  const open = s.requests.length;

  return (
    <header class="topbar">
      <div class="brand">
        <div class="wordmark">SCIENCE</div>
        <div class="brand-sub">Research lab · senior researcher</div>
      </div>
      <div class="tb-right">
        <div class="chip-box" title={flowing ? 'Agency calendar: time flows on its own' : 'Agency calendar stopped'}>
          <span class={'pulse' + (flowing ? '' : ' still')} />
          <div class="chip-stack">
            <span class="chip-label">Today</span>
            <span class="chip-value num">{formatDate(day)}</span>
            <span class="chip-sub">{phase === 'planning' ? '1 min = 1 month' : phase}</span>
          </div>
        </div>
        <div class={'chip-box' + (available < 0 ? ' err' : '')} title="Mission budget available (funding − spent − committed)">
          <div class="chip-stack">
            <span class="chip-label">Budget available</span>
            <span class="chip-value num">{Math.round(available)} <span class="muted">of {Math.round(total)} M</span></span>
            <span class="meter"><span style={{ width: `${Math.max(0, Math.min(100, (available / Math.max(1, total)) * 100))}%` }} /></span>
          </div>
        </div>
        <div class={'chip-box' + (phase !== 'planning' ? ' ok' : toLaunch < 60 ? ' warn' : '')} title="Planned launch day (set by Mission Planning)">
          <div class="chip-stack">
            <span class="chip-label">Launch</span>
            <span class="chip-value num">{phase === 'planning' ? `in ${toLaunch} d` : phase === 'lobby' ? '—' : 'Launched'}</span>
            <span class="chip-sub">{formatDate(launchDay)}</span>
          </div>
        </div>
        <div class="chip-box" title="Research teams: projects that can run at the same time">
          <div class="chip-stack">
            <span class="chip-label">Teams busy</span>
            <span class="chip-value num">{busy} <span class="muted">/ {slots}</span></span>
            <span class="chip-sub">{open} request{open === 1 ? '' : 's'} from Planning</span>
          </div>
        </div>
      </div>
    </header>
  );
}
