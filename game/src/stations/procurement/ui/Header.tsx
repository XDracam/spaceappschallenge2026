// Top bar: brand, views, mission, calendar + launch countdown, Budget.
import { MISSION } from '../../../core/mission';
import { budgetAvailableM, fmtDate, fmtM } from '../rules';
import { useGame } from '../../../core/store';
import { setUi, useP, useUi, type View } from './uiState';
import { contractTiming } from '../timing';

/** The agency's one budget as the header always showed it; the cross-station split comes later (rules.ts spendByStation). */
function Budget() {
  const v = useP();
  const available = budgetAvailableM(v.budget);
  return (
    <div class={`pr-budget${available < 0 ? ' over' : ''}`} title="available = funding − spent − committed (all stations)">
      <div>
        <span class="pr-eyebrow">Available budget</span>
        <div class="pr-budget-number num">{fmtM(available)}</div>
      </div>
      <dl>
        <dt>Committed</dt><dd class="num">{fmtM(v.budget.committedM)}</dd>
        <dt>Spent</dt><dd class="num">{fmtM(v.budget.spentM)}</dd>
        <dt>Funding</dt><dd class="num">{fmtM(v.budget.fundingTotalM)}</dd>
      </dl>
    </div>
  );
}

export function Header() {
  const v = useP();
  const view = useUi((u) => u.view);
  const day = v.clock.day;
  const launch = v.planner.plan.launchDay;
  const toLaunch = Math.ceil(launch - day);
  const active = v.market.contracts.filter((c) => c.status === 'active').length;
  const timingState = { market: v.market, research: { projects: v.research.projects ?? [] } };
  const late = v.market.contracts.filter(c => c.status === 'active' && contractTiming(timingState, c).needs.some(n => n.margin !== undefined && n.margin < 0)).length;
  const asks = useGame((g) => (g.research.supplyRequests ?? []).filter((q) => q.status === 'open').length);
  const nav: { id: View; label: string; count?: string; warn?: boolean }[] = [
    { id: 'catalogue', label: 'Parts' },
    { id: 'research', label: 'Research needs', count: asks ? `${asks} ask${asks > 1 ? 's' : ''}` : '', warn: asks > 0 },
    { id: 'contracts', label: 'Contracts & schedule', count: late ? `${late} late` : active ? String(active) : '', warn: late > 0 },
  ];
  return (
    <header class="pr-top">
      <div class="pr-brand"><div class="pr-brand-mark" aria-hidden="true" /><h1>PROCUREMENT</h1></div>
      <nav class="pr-nav" aria-label="Procurement views">
        {nav.map((n) => (
          <button key={n.id} type="button" aria-pressed={view === n.id} onClick={() => setUi({ view: n.id })}>
            {n.label}{n.count ? <span class={`pr-nav-count${n.warn ? ' warn' : ''}`}>{n.count}</span> : null}
          </button>
        ))}
      </nav>
      <div class="pr-mission"><span class="pr-eyebrow">Mission</span><strong>{MISSION.name}</strong></div>
      <div class="pr-cal">
        <span class="pr-eyebrow">Today</span>
        <strong class="num">{fmtDate(day)}</strong>
      </div>
      <div class={`pr-cal${toLaunch < 30 ? ' warn' : ''}`}>
        <span class="pr-eyebrow">Launch {fmtDate(launch)}</span>
        <strong class="num">{toLaunch > 0 ? `T−${toLaunch} d` : 'Launch day'}</strong>
      </div>
      <Budget />
    </header>
  );
}
